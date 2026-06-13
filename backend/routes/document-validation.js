const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const emailService = require('./emailService'); // Importation du service d'email

// PUT /api/document-validation/:id - Valider/Rejeter un document
// ...existing code...
router.put('/:id', async (req, res) => {
    try {
        let { id } = req.params;
        const { statut, commentaire, admin_id } = req.body;
        console.log('[document-validation] incoming id:', id, 'statut:', statut);

        // validation simple du statut (ajuster selon vos valeurs réelles)
        const allowed = ['valide', 'rejete', 'en_attente', 'validated', 'rejected', 'pending'];
        if (!statut || !allowed.includes(statut)) {
            return res.status(400).json({ success: false, message: 'Statut invalide' });
        }

        const connection = require('../config/database').getConnection ? require('../config/database').getConnection() : null;
        if (!connection) {
            // si votre project exporte différemment, adaptez l'appel au getConnection()
            console.warn('[document-validation] warning: connection helper not found, adaptez cette ligne si besoin');
        }

        // 1) Cherche par documents.id
        let [rows] = await connection.execute?.(
            `SELECT d.*, dos.id AS dossier_id, dos.document_id AS dossier_document_id
             FROM documents d
             LEFT JOIN dossiers dos ON d.id = dos.document_id
             WHERE d.id = ?`, [id]
        ) || [ [] ];

        // 2) Si pas trouvé, tenter d'interpréter l'id en tant que dossiers.id et résoudre document.id
        if (!rows || rows.length === 0) {
            const [dossierRows] = await connection.execute?.(
                `SELECT d.*, dos.id AS dossier_id
                 FROM dossiers dos
                 JOIN documents d ON d.id = dos.document_id
                 WHERE dos.id = ?`, [id]
            ) || [ [] ];

            if (!dossierRows || dossierRows.length === 0) {
                return res.status(404).json({ success: false, message: 'Document non trouvé (ni document.id ni dossier.id)' });
            }

            // remplacer id par le vrai documents.id pour la mise à jour
            id = dossierRows[0].id;
            rows = dossierRows;
            console.log('[document-validation] resolved id from dossier.id -> document.id =', id);
        }

        const document = rows[0];
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document introuvable après résolution' });
        }

        // Mettre à jour le statut sur documents.id
        await connection.execute?.(
            `UPDATE documents SET statut = ?, commentaire_validation = ?, validated_at = NOW(), updated_at = NOW() WHERE id = ?`,
            [statut, commentaire || null, id]
        );

        // Optionnel : créer log / notification / enregistrement admin (adapter selon votre logique existante)
        // Exemple minimal de réponse :
        return res.json({ success: true, message: 'Statut mis à jour', document_id: id, statut });

    } catch (err) {
        console.error('[document-validation] erreur:', err);
        return res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
    }
});
// ...existing code...

// GET /api/document-validation/stats - Statistiques de validation
router.get('/stats', async (req, res) => {
    try {
        const connection = require('../config/database').getConnection();

        const [stats] = await connection.execute(`
      SELECT 
        statut,
        COUNT(*) as count
      FROM documents 
      GROUP BY statut
    `);

        const [totalStats] = await connection.execute(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN statut = 'valide' THEN 1 END) as valide,
        COUNT(CASE WHEN statut = 'rejete' THEN 1 END) as rejete,
        COUNT(CASE WHEN statut = 'en_attente' THEN 1 END) as en_attente
      FROM documents
    `);

        res.json({
            success: true,
            data: {
                stats: stats,
                totals: totalStats[0]
            }
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

module.exports = router;
