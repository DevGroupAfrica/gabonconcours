const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const nodemailer = require('nodemailer');

// Configuration de l'envoi d'emails
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Envoyer un message (Candidat vers Admin)
router.post('/candidat/send', async (req, res) => {
    try {
        const connection = getConnection();
        const { nupcan, sujet, message, admin_id } = req.body;

        // Récupérer les infos du candidat
        const [candidat] = await connection.execute(
            'SELECT nomcan, prncan, maican FROM candidats WHERE nupcan = ?',
            [nupcan]
        );

        if (candidat.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Candidat non trouvé'
            });
        }

        // Insérer le message
        const [result] = await connection.execute(
            `INSERT INTO messages 
             (candidat_nupcan, admin_id, sujet, message, expediteur, statut, created_at)
             VALUES (?, ?, ?, ?, 'candidat', 'non_lu', NOW())`,
            [nupcan, admin_id || null, sujet, message]
        );

        res.json({
            success: true,
            message: 'Message envoyé avec succès',
            data: { id: result.insertId }
        });

    } catch (error) {
        console.error('Erreur envoi message candidat:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// Répondre à un message (Admin vers Candidat)
router.post('/admin/reply', async (req, res) => {
    try {
        const connection = getConnection();
        const { message_id, nupcan, admin_id, sujet, message } = req.body;

        // Récupérer les infos du candidat et de l'admin
        const [candidat] = await connection.execute(
            'SELECT nomcan, prncan, maican FROM candidats WHERE nupcan = ?',
            [nupcan]
        );

        const [admin] = await connection.execute(
            'SELECT nom, prenom, email FROM administrateurs WHERE id = ?',
            [admin_id]
        );

        if (candidat.length === 0 || admin.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Candidat ou admin non trouvé'
            });
        }

        // Insérer la réponse
        const [result] = await connection.execute(
            `INSERT INTO messages 
             (candidat_nupcan, admin_id, sujet, message, expediteur, statut, created_at, parent_message_id)
             VALUES (?, ?, ?, ?, 'admin', 'non_lu', NOW(), ?)`,
            [nupcan, admin_id, sujet, message, message_id || null]
        );

        // Marquer le message original comme lu si c'est une réponse
        if (message_id) {
            await connection.execute(
                'UPDATE messages SET statut = "lu" WHERE id = ?',
                [message_id]
            );
        }

        await connection.execute(`
            INSERT INTO notifications (candidat_nupcan, type, titre, message, statut, priority, created_at, updated_at)
            VALUES (?, 'message', 'Nouvelle réponse', ?, 'non_lu', 'high', NOW(), NOW())
        `, [nupcan, `L'administration a répondu à votre message: ${sujet || 'Votre demande'}`]);

        await connection.execute(`
            INSERT INTO admin_actions
                (admin_id, action_type, entity_type, entity_id, candidat_nupcan, description, details, ip_address, created_at)
            VALUES (?, 'reponse_message', 'message', ?, ?, ?, ?, ?, NOW())
        `, [
            admin_id,
            result.insertId,
            nupcan,
            `Réponse au message: ${sujet || 'Réponse à votre message'}`,
            JSON.stringify({message_id: message_id || null, route: '/api/messaging/admin/reply'}),
            req.ip || null
        ]);

        // Envoyer un email au candidat
        try {
            const emailContent = {
                from: process.env.EMAIL_FROM || 'noreply@gabconcours.ga',
                to: candidat[0].maican,
                subject: `Réponse à votre message: ${sujet}`,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Réponse de l'Administration</h2>
                        <p>Bonjour ${candidat[0].nomcan} ${candidat[0].prncan},</p>
                        <p>L'administration a répondu à votre message concernant: <strong>${sujet}</strong></p>
                        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <p><strong>Message:</strong></p>
                            <p>${message}</p>
                        </div>
                        <p>Vous pouvez consulter ce message dans votre tableau de bord.</p>
                        <p>Cordialement,<br/>L'équipe GabConcours</p>
                    </div>
                `
            };

            await transporter.sendMail(emailContent);
            console.log('✅ Email envoyé au candidat:', candidat[0].maican);
        } catch (emailError) {
            console.error('❌ Erreur envoi email:', emailError);
            // Ne pas bloquer la réponse si l'email échoue
        }

        res.json({
            success: true,
            message: 'Réponse envoyée avec succès',
            data: { id: result.insertId }
        });

    } catch (error) {
        console.error('Erreur réponse admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// Récupérer les messages d'une conversation
router.get('/conversation/:nupcan', async (req, res) => {
    try {
        const connection = getConnection();
        const { nupcan } = req.params;

        const [messages] = await connection.execute(
            `SELECT 
                m.*,
                c.nomcan, c.prncan, c.maican,
                a.nom as admin_nom, a.prenom as admin_prenom
             FROM messages m
             LEFT JOIN candidats c ON m.candidat_nupcan = c.nupcan
             LEFT JOIN administrateurs a ON m.admin_id = a.id
             WHERE m.candidat_nupcan = ?
             ORDER BY m.created_at ASC`,
            [nupcan]
        );

        res.json({
            success: true,
            data: messages
        });

    } catch (error) {
        console.error('Erreur récupération conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// Marquer un message comme lu
router.put('/:id/read', async (req, res) => {
    try {
        const connection = getConnection();
        const { id } = req.params;

        await connection.execute(
            'UPDATE messages SET statut = "lu" WHERE id = ?',
            [id]
        );

        res.json({
            success: true,
            message: 'Message marqué comme lu'
        });

    } catch (error) {
        console.error('Erreur marquage message:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

module.exports = router;
