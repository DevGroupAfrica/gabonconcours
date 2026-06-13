const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const {getConnection} = require('../config/database');
const fileValidation = require('../middleware/fileValidation');

// Configuration multer pour le remplacement de documents
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = path.join(__dirname, '../uploads/documents');
        try {
            await fs.mkdir(uploadDir, {recursive: true});
            cb(null, uploadDir);
        } catch (error) {
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `document-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({
    storage: storage,
    limits: {fileSize: 2 * 1024 * 1024}, // 2MB
    fileFilter: fileValidation.validateFile
});

// PUT /api/documents/:id/replace - Remplacer un document rejeté
router.put('/:id/replace', upload.single('file'), async (req, res) => {
    try {
        const {id} = req.params;
        const connection = getConnection();

        // Vérifier que le document existe et est rejeté
        const [document] = await connection.execute(
            'SELECT * FROM dossiers WHERE id = ?',
            [id]
        );

        if (document.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé'
            });
        }

        if (document[0].statut !== 'rejete') {
            return res.status(400).json({
                success: false,
                message: 'Seuls les documents rejetés peuvent être remplacés'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Aucun fichier fourni'
            });
        }

        // Supprimer l'ancien fichier si existe
        if (document[0].fichier_path) {
            try {
                const oldPath = path.join(__dirname, '..', document[0].fichier_path);
                await fs.unlink(oldPath);
            } catch (error) {
                console.error('Erreur suppression ancien fichier:', error);
            }
        }

        // Mettre à jour le document
        const relativePath = `uploads/documents/${req.file.filename}`;
        await connection.execute(
            `UPDATE dossiers 
             SET fichier_path = ?, nom_fichier = ?, statut = 'en_attente', 
                 commentaire_admin = NULL, updated_at = NOW()
             WHERE id = ?`,
            [relativePath, req.file.originalname, id]
        );

        // Envoyer une notification email
        try {
            const [candidat] = await connection.execute(
                'SELECT * FROM candidats WHERE nupcan = ?',
                [document[0].nipcan]
            );

            if (candidat.length > 0) {
                const emailService = require('../services/emailService');
                const [docType] = await connection.execute(
                    'SELECT nomdoc FROM documents WHERE id = ?',
                    [document[0].document_id]
                );

                await emailService.sendDocumentReplacement(candidat[0], docType[0].nomdoc);
            }
        } catch (emailError) {
            console.error('Erreur envoi email:', emailError);
        }

        res.json({
            success: true,
            message: 'Document remplacé avec succès'
        });
    } catch (error) {
        console.error('Erreur remplacement document:', error);
        res.status(500).json({success: false, message: 'Erreur serveur'});
    }
});

// DELETE /api/documents/:id - Supprimer un document non validé
router.delete('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const connection = getConnection();

        // Vérifier que le document existe et n'est pas validé
        const [document] = await connection.execute(
            'SELECT * FROM dossiers WHERE id = ?',
            [id]
        );

        if (document.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé'
            });
        }

        if (document[0].statut === 'valide') {
            return res.status(400).json({
                success: false,
                message: 'Les documents validés ne peuvent pas être supprimés'
            });
        }

        // Supprimer le fichier physique
        if (document[0].fichier_path) {
            try {
                const filePath = path.join(__dirname, '..', document[0].fichier_path);
                await fs.unlink(filePath);
            } catch (error) {
                console.error('Erreur suppression fichier:', error);
            }
        }

        // Supprimer de la base de données
        await connection.execute('DELETE FROM dossiers WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Document supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression document:', error);
        res.status(500).json({success: false, message: 'Erreur serveur'});
    }
});

// GET /api/documents/:id/download - Télécharger un document
router.get('/:id/download', async (req, res) => {
    try {
        const {id} = req.params;
        const connection = getConnection();

        const [document] = await connection.execute(
            'SELECT * FROM dossiers WHERE id = ?',
            [id]
        );

        if (document.length === 0 || !document[0].fichier_path) {
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé'
            });
        }

        const filePath = path.join(__dirname, '..', document[0].fichier_path);
        
        // Vérifier que le fichier existe
        try {
            await fs.access(filePath);
        } catch (error) {
            return res.status(404).json({
                success: false,
                message: 'Fichier non trouvé sur le serveur'
            });
        }

        res.download(filePath, document[0].nom_fichier);
    } catch (error) {
        console.error('Erreur téléchargement document:', error);
        res.status(500).json({success: false, message: 'Erreur serveur'});
    }
});

module.exports = router;
