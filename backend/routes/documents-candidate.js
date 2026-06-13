const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getConnection } = require('../config/database');
const Document = require('../models/Document');
const { sendEmail } = require('../services/emailService');

// Configuration du stockage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/documents');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10 MB max
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|jpg|jpeg|png/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Seuls les fichiers PDF, JPG, JPEG et PNG sont acceptés'));
        }
    }
});

// ✅ Remplacer un document non validé (CANDIDAT uniquement)
router.put('/:id/replace', upload.single('file'), async (req, res) => {
    try {
        const connection = getConnection();
        const { id } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier fourni'
            });
        }

        // Récupérer le document actuel
        const [documents] = await connection.execute(
            'SELECT * FROM documents WHERE id = ?',
            [id]
        );

        if (documents.length === 0) {
            fs.unlinkSync(file.path);
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé'
            });
        }

        const document = documents[0];

        // Verrouiller uniquement les documents déjà validés
        if (!['rejete', 'en_attente'].includes(document.statut)) {
            fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: 'Un document validé ne peut plus être remplacé'
            });
        }

        // Supprimer l'ancien fichier
        if (document.nom_fichier) {
            const oldFilePath = path.join(__dirname, '../uploads/documents', document.nom_fichier);
            if (fs.existsSync(oldFilePath)) {
                try {
                    fs.unlinkSync(oldFilePath);
                } catch (err) {
                    console.error('Erreur suppression ancien fichier:', err);
                }
            }
        }

        // Mettre à jour le document
        await connection.execute(
            `UPDATE documents 
             SET nom_fichier = ?, 
                 statut = 'en_attente', 
                 commentaire_validation = 'Document remplacé - en attente de validation',
                 updated_at = NOW()
             WHERE id = ?`,
            [file.filename, id]
        );

        console.log(`✅ Document ${id} remplacé avec succès: ${file.filename}`);

        res.json({
            success: true,
            message: 'Document remplacé avec succès',
            data: {
                id: parseInt(id),
                nom_fichier: file.filename,
                statut: 'en_attente'
            }
        });

    } catch (error) {
        console.error('Erreur remplacement document:', error);
        
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors du remplacement du document'
        });
    }
});

// ✅ Ajouter un nouveau document (max 3 supplémentaires)
router.post('/add', upload.single('file'), async (req, res) => {
    const connection = getConnection();
    const file = req.file;
    const { nupcan, nomdoc, type } = req.body;

    try {
        // 🔸 Validation des champs requis
        if (!file || !nupcan || !nomdoc) {
            if (file && fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: 'Fichier, NUPCAN et nom du document sont requis',
            });
        }

        // 🔹 Vérifier si le candidat existe
        const [candidats] = await connection.execute(
            'SELECT * FROM candidats WHERE nupcan = ?',
            [nupcan]
        );

        if (candidats.length === 0) {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(404).json({
                success: false,
                message: 'Candidat introuvable pour ce NUPCAN',
            });
        }

        const candidat = candidats[0];

        // 🔹 Vérifier le nombre de documents existants (max 6)
        const canAdd = await Document.canAddDocument(nupcan);
        if (!canAdd) {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: 'Nombre maximum de documents atteint (6)',
            });
        }

        // 🔹 Déterminer le type du fichier si non fourni
        let fileType = type;
        if (!fileType) {
            const ext = path.extname(file.originalname).toLowerCase();
            if (ext === '.pdf') fileType = 'pdf';
            else if (['.jpg', '.jpeg', '.png'].includes(ext)) fileType = 'image';
            else fileType = 'autre';
        }

        // 🔹 Créer l’entrée dans la table documents
        const doc = await Document.create({
            nomdoc,
            type: fileType,
            nom_fichier: file.filename,
            chemin_fichier: path.join('uploads/documents', file.filename),
            statut: 'en_attente',
        });

        // 🔹 Créer une entrée dans la table dossiers
        await connection.execute(
            `INSERT INTO dossiers (candidat_id, concours_id, document_id, nupcan, docdsr, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
                candidat.id,
                candidat.concours_id,
                doc.id,
                nupcan,
                path.join('uploads/documents', file.filename),
            ]
        );

        res.json({
            success: true,
            message: 'Document ajouté et dossier mis à jour avec succès',
            data: {
                ...doc,
                nupcan,
                docdsr: path.join('uploads/documents', file.filename),
            },
        });
    } catch (error) {
        console.error('Erreur ajout document:', error);

        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

        res.status(500).json({
            success: false,
            message: 'Erreur lors de l’ajout du document',
            error: error.message,
        });
    }
});

// ✅ Vérifier si le candidat peut ajouter un document
router.get('/can-add/:nipcan', async (req, res) => {
    try {
        const { nipcan } = req.params;
        const canAdd = await Document.canAddDocument(nipcan);
        const total = await Document.countByNupcan(nipcan);

        res.json({
            success: true,
            data: {
                canAdd,
                total,
                max: 6
            }
        });
    } catch (error) {
        console.error('Erreur vérification:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
