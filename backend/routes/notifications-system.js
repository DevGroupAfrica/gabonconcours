const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// Créer une notification
async function createNotification(data) {
    try {
        const connection = getConnection();
        const { admin_id, titre, message, type, link } = data;

        await connection.execute(
            `INSERT INTO notifications (admin_id, titre, message, type, link, lu, created_at)
             VALUES (?, ?, ?, ?, ?, 0, NOW())`,
            [admin_id, titre, message, type || 'info', link || null]
        );

        console.log('✅ Notification créée:', titre);
    } catch (error) {
        console.error('❌ Erreur création notification:', error);
    }
}

// Récupérer les notifications non lues
router.get('/unread', async (req, res) => {
    try {
        const connection = getConnection();
        const { admin_id } = req.query;

        let query = `
            SELECT * FROM notifications 
            WHERE lu = 0
        `;
        const params = [];

        if (admin_id) {
            query += ' AND admin_id = ?';
            params.push(admin_id);
        }

        query += ' ORDER BY created_at DESC LIMIT 10';

        const [notifications] = await connection.execute(query, params);

        res.json({
            success: true,
            data: notifications
        });
    } catch (error) {
        console.error('Erreur récupération notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// Marquer une notification comme lue
router.put('/:id/read', async (req, res) => {
    try {
        const connection = getConnection();
        const { id } = req.params;

        await connection.execute(
            'UPDATE notifications SET lu = 1, lu_at = NOW() WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Notification marquée comme lue'
        });
    } catch (error) {
        console.error('Erreur marquage notification:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// Marquer toutes les notifications comme lues
router.put('/read-all', async (req, res) => {
    try {
        const connection = getConnection();
        const { admin_id } = req.body;

        let query = 'UPDATE notifications SET lu = 1, lu_at = NOW() WHERE lu = 0';
        const params = [];

        if (admin_id) {
            query += ' AND admin_id = ?';
            params.push(admin_id);
        }

        await connection.execute(query, params);

        res.json({
            success: true,
            message: 'Toutes les notifications ont été marquées comme lues'
        });
    } catch (error) {
        console.error('Erreur marquage toutes notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// Fonction pour notifier les admins d'une nouvelle candidature
async function notifyNewCandidature(etablissement_id, concours_nom, candidat_nom) {
    try {
        const connection = getConnection();

        // Récupérer tous les admins de l'établissement
        const [admins] = await connection.execute(
            'SELECT id FROM administrateurs WHERE etablissement_id = ? AND statut = "actif"',
            [etablissement_id]
        );

        // Créer une notification pour chaque admin
        for (const admin of admins) {
            await createNotification({
                admin_id: admin.id,
                titre: 'Nouvelle candidature',
                message: `${candidat_nom} s'est inscrit au concours ${concours_nom}`,
                type: 'new_candidature',
                link: '/admin/candidats'
            });
        }
    } catch (error) {
        console.error('Erreur notification nouvelle candidature:', error);
    }
}

// Fonction pour notifier les admins d'un nouveau document
async function notifyNewDocument(etablissement_id, candidat_nom, document_nom) {
    try {
        const connection = getConnection();

        const [admins] = await connection.execute(
            'SELECT id FROM administrateurs WHERE etablissement_id = ? AND statut = "actif"',
            [etablissement_id]
        );

        for (const admin of admins) {
            await createNotification({
                admin_id: admin.id,
                titre: 'Nouveau document',
                message: `${candidat_nom} a téléversé le document: ${document_nom}`,
                type: 'new_document',
                link: '/admin/dossiers'
            });
        }
    } catch (error) {
        console.error('Erreur notification nouveau document:', error);
    }
}

module.exports = {
    router,
    createNotification,
    notifyNewCandidature,
    notifyNewDocument
};
