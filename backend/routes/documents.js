    const express = require('express');
    const router = express.Router();
    const multer = require('multer');
    const fs = require('fs');
    const path = require('path');
    const { getConnection } = require('../config/database');
    const Document = require('../models/Document');

    // 📂 Dossier de stockage
    const uploadDir = path.join(__dirname, '../uploads/documents');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

    // ⚙️ Config multer
    const storage = multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, `doc-${uniqueSuffix}${path.extname(file.originalname)}`);
        },
    });
    const upload = multer({ storage });

    /* =====================================================
    🔹 ROUTES DOCUMENTS CRUD DE BASE
    ===================================================== */

    // ➕ Ajouter un document
    router.post('/', upload.single('file'), async (req, res) => {
        try {
            const { nomdoc, type } = req.body;
            const file = req.file;
            if (!file) return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });

            const documentData = {
                nomdoc: nomdoc || file.originalname,
                type: type || file.mimetype.includes('pdf') ? 'pdf' : 'image',
                nom_fichier: file.filename,
                statut: 'en_attente'
            };

            const newDoc = await Document.create(documentData);
            res.json({ success: true, message: 'Document créé', data: newDoc });
        } catch (error) {
            console.error('Erreur création document:', error);
            res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
    });

    // 📄 Récupérer tous les documents
    router.get('/', async (req, res) => {
        try {
            const documents = await Document.findAll();
            res.json({ success: true, data: documents });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
    });

    // 📄 Récupérer un document par ID
    router.get('/:id', async (req, res) => {
        try {
            const doc = await Document.findById(req.params.id);
            if (!doc) return res.status(404).json({ success: false, message: 'Document introuvable' });
            res.json({ success: true, data: doc });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
    });

    /* =====================================================
    ✏️ MODIFICATION ET STATUT
    ===================================================== */

    // 🔄 Modifier les infos d’un document
    router.put('/:id', async (req, res) => {
        try {
            const { nomdoc, type, statut, commentaire } = req.body;
            const doc = await Document.findById(req.params.id);
            if (!doc) return res.status(404).json({ success: false, message: 'Document introuvable' });

            const updated = await Document.updateStatus(req.params.id, statut || doc.statut, commentaire);
            res.json({ success: true, message: 'Document mis à jour', data: updated });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erreur mise à jour' });
        }
    });

    // 🟢 Modifier uniquement le statut (admin)
    router.put('/:id/statut', async (req, res) => {
        try {
            const { statut, commentaire } = req.body;
            if (!['en_attente', 'valide', 'rejete'].includes(statut)) {
                return res.status(400).json({ success: false, message: 'Statut invalide' });
            }

            const updated = await Document.updateStatus(req.params.id, statut, commentaire);
            
            // 🔔 Vérifier et mettre à jour le statut de participation si nécessaire
            if (statut === 'valide' && updated.candidat_id) {
                const connection = require('../config/database').getConnection();
                const [candidat] = await connection.execute(
                    'SELECT concours_id FROM candidats WHERE id = ?',
                    [updated.candidat_id]
                );
                
                if (candidat.length > 0) {
                    const ParticipationService = require('../services/participationService');
                    await ParticipationService.checkAndUpdateParticipationStatus(
                        updated.candidat_id,
                        candidat[0].concours_id
                    );
                }
            }
            
            res.json({ success: true, message: 'Statut modifié', data: updated });
        } catch (error) {
            console.error('Erreur update statut:', error);
            res.status(500).json({ success: false, message: 'Erreur serveur' });
        }
    });

    /* =====================================================
    🧾 REMPLACEMENT DE DOCUMENT
    ===================================================== */

    // 🔁 Remplacer un document non validé
router.put('/:id/replace', upload.single('file'), async (req, res) => {
    const fs = require('fs');
    const path = require('path');

    try {
        const { id } = req.params;
        const file = req.file;
        let { nomdoc, type } = req.body;

        if (!file) {
            return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
        }

        const connection = require('../config/database').getConnection();
        const [rows] = await connection.execute('SELECT * FROM documents WHERE id = ?', [id]);
        if (rows.length === 0) {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(404).json({ success: false, message: 'Document introuvable' });
        }

        const doc = rows[0];
        if (!['rejete', 'en_attente'].includes(doc.statut)) {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: 'Un document validé ne peut plus être remplacé.'
            });
        }

        // Suppression de l'ancien fichier
        const oldPath = path.join('uploads/documents', doc.nom_fichier || '');
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

        const newFileName = file.filename;
        const newFilePath = path.join('uploads/documents', newFileName);

        // 🔹 Calcul automatique du type selon l'extension si non fourni
        if (!type) {
            const ext = path.extname(file.originalname).toLowerCase();
            if (ext === '.pdf') type = 'pdf';
            else if (['.jpg', '.jpeg', '.png'].includes(ext)) type = 'image';
            else type = 'AUTRE';
        }

        // 🔹 Mise à jour de la table documents
        await connection.execute(
            `
            UPDATE documents
            SET nomdoc = ?, nom_fichier = ?, type = ?, chemin_fichier = ?, statut = 'en_attente', updated_at = NOW()
            WHERE id = ?
            `,
            [nomdoc || doc.nomdoc, newFileName, type, newFilePath, id]
        );

        // 🔹 Mise à jour du dossier associé (docdsr)
        await connection.execute(
            `
            UPDATE dossiers
            SET docdsr = ?
            WHERE document_id = ?
            `,
            [newFilePath, id]
        );

        res.json({
            success: true,
            message: 'Document et dossier mis à jour avec succès',
            data: {
                id,
                nomdoc: nomdoc || doc.nomdoc,
                nom_fichier: newFileName,
                type: type,
                docdsr: newFilePath,
                statut: 'en_attente'
            }
        });

    } catch (error) {
        console.error('Erreur remplacement document:', error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ success: false, message: 'Erreur serveur', errors: [error.message] });
    }
});




    /* =====================================================
    📥 TÉLÉCHARGEMENT DE DOCUMENT
    ===================================================== */

    router.get('/:id/download', async (req, res) => {
        try {
            const doc = await Document.findById(req.params.id);
            if (!doc) {
                console.log(`Document ${req.params.id} introuvable en DB`);
                return res.status(404).json({ success: false, message: 'Document introuvable' });
            }

            const filePath = path.join(uploadDir, doc.nom_fichier);
            console.log(`Tentative de téléchargement: ${filePath}`);
            
            if (!fs.existsSync(filePath)) {
                console.error(`Fichier physique non trouvé: ${filePath}`);
                return res.status(404).json({ success: false, message: 'Fichier non trouvé' });
            }

            // Définir le type MIME approprié
            const ext = path.extname(doc.nom_fichier).toLowerCase();
            let contentType = 'application/octet-stream';
            if (ext === '.pdf') contentType = 'application/pdf';
            else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
            else if (ext === '.png') contentType = 'image/png';

            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Disposition', `inline; filename="${doc.nomdoc || doc.nom_fichier}"`);
            
            const fileStream = fs.createReadStream(filePath);
            fileStream.on('error', (err) => {
                console.error('Erreur lecture fichier:', err);
                res.status(500).json({ success: false, message: 'Erreur lecture fichier' });
            });
            fileStream.pipe(res);
        } catch (error) {
            console.error('Erreur téléchargement document:', error);
            res.status(500).json({ success: false, message: 'Erreur lors du téléchargement' });
        }
    });

    /* =====================================================
    ❌ SUPPRESSION
    ===================================================== */

    router.delete('/:id', async (req, res) => {
        try {
            const doc = await Document.findById(req.params.id);
            if (!doc) return res.status(404).json({ success: false, message: 'Document introuvable' });

            const filePath = path.join(uploadDir, doc.nom_fichier);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

            await Document.deleteById(req.params.id);
            res.json({ success: true, message: 'Document supprimé' });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Erreur suppression' });
        }
    });

    module.exports = router;
