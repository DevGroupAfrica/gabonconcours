const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const { sendEmail } = require('../mailer');

// POST /api/messaging/candidat - Envoyer un message du candidat à l'admin
router.post('/candidat', async (req, res) => {
    try {
        const { candidat_nupcan, sujet, message } = req.body;

        if (!candidat_nupcan || !sujet || !message) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs sont requis'
            });
        }

        const connection = getConnection();

        // Récupérer les infos du candidat
        const [candidats] = await connection.execute(
            'SELECT * FROM candidats WHERE nupcan = ?',
            [candidat_nupcan]
        );

        if (candidats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Candidat non trouvé'
            });
        }

        const candidat = candidats[0];

        // Insérer le message
        await connection.execute(`
            INSERT INTO messages (candidat_nupcan, sujet, message, expediteur, statut, created_at, updated_at)
            VALUES (?, ?, ?, 'candidat', 'non_lu', NOW(), NOW())
        `, [candidat_nupcan, sujet, message]);

        // Envoyer email à l'admin (si configuré)
        try {
            const adminEmail = process.env.ADMIN_EMAIL || 'admin@gabconcours.ga';
            await sendEmail(
                adminEmail,
                `Nouveau message - ${candidat.prncan} ${candidat.nomcan}`,
                `
                <h2>Nouveau message d'un candidat</h2>
                <p><strong>De:</strong> ${candidat.prncan} ${candidat.nomcan} (${candidat_nupcan})</p>
                <p><strong>Email:</strong> ${candidat.maican}</p>
                <p><strong>Sujet:</strong> ${sujet}</p>
                <p><strong>Message:</strong></p>
                <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:15px 0;">
                    ${message}
                </div>
                <p>Répondez depuis votre interface administrateur.</p>
                `
            );
        } catch (emailError) {
            console.error('Erreur envoi email admin:', emailError);
        }

        res.json({
            success: true,
            message: 'Message envoyé avec succès'
        });
    } catch (error) {
        console.error('Erreur envoi message candidat:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi du message',
            error: error.message
        });
    }
});

// POST /api/messaging/admin - Répondre à un message (admin vers candidat)
router.post('/admin', async (req, res) => {
    try {
        const { candidat_nupcan, admin_id, sujet, message } = req.body;

        if (!candidat_nupcan || !message) {
            return res.status(400).json({
                success: false,
                message: 'NUPCAN et message requis'
            });
        }

        const connection = getConnection();

        // Récupérer les infos du candidat
        const [candidats] = await connection.execute(
            'SELECT * FROM candidats WHERE nupcan = ?',
            [candidat_nupcan]
        );

        if (candidats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Candidat non trouvé'
            });
        }

        const candidat = candidats[0];

        // Insérer la réponse
        const [result] = await connection.execute(`
            INSERT INTO messages (candidat_nupcan, admin_id, sujet, message, expediteur, statut, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'admin', 'non_lu', NOW(), NOW())
        `, [candidat_nupcan, admin_id || null, sujet || 'Réponse de l\'administration', message]);

        await connection.execute(`
            INSERT INTO notifications (candidat_nupcan, type, titre, message, statut, priority, created_at, updated_at)
            VALUES (?, 'message', 'Nouvelle réponse', ?, 'non_lu', 'high', NOW(), NOW())
        `, [candidat_nupcan, `L'administration a répondu à votre message: ${sujet || 'Votre demande'}`]);

        if (admin_id) {
            await connection.execute(`
                INSERT INTO admin_actions
                    (admin_id, action_type, entity_type, entity_id, candidat_nupcan, description, details, ip_address, created_at)
                VALUES (?, 'reponse_message', 'message', ?, ?, ?, ?, ?, NOW())
            `, [
                admin_id,
                result.insertId,
                candidat_nupcan,
                `Réponse au message: ${sujet || 'Réponse de l’administration'}`,
                JSON.stringify({route: '/api/messaging/admin'}),
                req.ip || null
            ]);
        }

        // Envoyer email au candidat
        try {
            await sendEmail(
                candidat.maican,
                `Réponse à votre message - GABConcours`,
                `
                <h2>Réponse de l'administration</h2>
                <p>Bonjour <strong>${candidat.prncan} ${candidat.nomcan}</strong>,</p>
                <p>Vous avez reçu une réponse à votre message :</p>
                <div style="background:#f3f4f6;padding:15px;border-radius:8px;margin:15px 0;">
                    ${message}
                </div>
                <p><a href="${process.env.APP_URL || 'http://localhost:8001'}/dashboard/${candidat_nupcan}">Accéder à votre espace candidat</a></p>
                <p>Cordialement,<br/>L'équipe GABConcours</p>
                `
            );
        } catch (emailError) {
            console.error('Erreur envoi email candidat:', emailError);
        }

        res.json({
            success: true,
            message: 'Réponse envoyée avec succès'
        });
    } catch (error) {
        console.error('Erreur envoi réponse admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'envoi de la réponse',
            error: error.message
        });
    }
});

// GET /api/messaging/candidat/:nupcan - Récupérer tous les messages d'un candidat
router.get('/candidat/:nupcan', async (req, res) => {
    try {
        const { nupcan } = req.params;
        const connection = getConnection();

        const [messages] = await connection.execute(`
            SELECT m.*, a.nom as admin_nom, a.prenom as admin_prenom
            FROM messages m
            LEFT JOIN administrateurs a ON m.admin_id = a.id
            WHERE m.candidat_nupcan = ?
            ORDER BY m.created_at DESC
        `, [nupcan]);

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Erreur récupération messages:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des messages',
            error: error.message
        });
    }
});

// PUT /api/messaging/:id/read - Marquer un message comme lu
router.put('/:id/read', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = getConnection();

        await connection.execute(
            'UPDATE messages SET statut = "lu", updated_at = NOW() WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Message marqué comme lu'
        });
    } catch (error) {
        console.error('Erreur mise à jour message:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour',
            error: error.message
        });
    }
});

// GET /api/messaging/admin/all - Récupérer tous les messages pour l'admin
router.get('/admin/all', async (req, res) => {
    try {
        const connection = getConnection();

        const [messages] = await connection.execute(`
            SELECT
                m.*,
                c.nomcan, c.prncan, c.maican,
                a.nom as admin_nom, a.prenom as admin_prenom
            FROM messages m
            LEFT JOIN candidats c ON m.candidat_nupcan = c.nupcan
            LEFT JOIN administrateurs a ON m.admin_id = a.id
            ORDER BY m.created_at DESC
        `);

        res.json({
            success: true,
            data: messages
        });
    } catch (error) {
        console.error('Erreur récupération messages admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des messages',
            error: error.message
        });
    }
});

module.exports = router;
