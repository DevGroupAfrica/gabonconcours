const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getConnection } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

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

// Route pour remplacer un document
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
            // Supprimer le fichier uploadé
            fs.unlinkSync(file.path);
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé'
            });
        }

        const document = documents[0];

        // Vérifier que le document peut être remplacé (rejeté ou en_attente)
        if (document.statut !== 'rejete' && document.statut !== 'en_attente') {
            fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: 'Seuls les documents rejetés ou en attente peuvent être remplacés'
            });
        }

        // Supprimer l'ancien fichier s'il existe
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
        
        // Nettoyer le fichier uploadé en cas d'erreur
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors du remplacement du document'
        });
    }
});

module.exports = router;
