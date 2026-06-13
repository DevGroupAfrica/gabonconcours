const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const nodemailer = require('nodemailer');

// Configuration SMTP
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD
    }
});

/* =====================================================
   📨 ENVOI DE MESSAGE (CANDIDAT)
===================================================== */
router.post('/candidat/send', async (req, res) => {
    const connection = getConnection();

    try {
        const { nupcan, sujet, message } = req.body;

        if (!nupcan || !sujet || !message) {
            return res.status(400).json({
                success: false,
                message: 'NUPCAN, sujet et message requis'
            });
        }

        // Récupérer les infos du candidat et son concours
        const [candidats] = await connection.execute(`
            SELECT c.*, con.libcnc, con.etablissement_id, e.nometab
            FROM candidats c
            LEFT JOIN concours con ON c.concours_id = con.id
            LEFT JOIN etablissements e ON con.etablissement_id = e.id
            WHERE c.nupcan = ?
        `, [nupcan]);

        if (candidats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Candidat non trouvé'
            });
        }

        const candidat = candidats[0];

        // Insérer le message
        const [result] = await connection.execute(`
            INSERT INTO messages
            (candidat_nupcan, sujet, message, expediteur, statut, created_at, updated_at)
            VALUES (?, ?, ?, 'candidat', 'non_lu', NOW(), NOW())
        `, [nupcan, sujet, message]);

        const messageId = result.insertId;

        // Créer une notification pour l'admin de l'établissement
        if (candidat.etablissement_id) {
            const [admins] = await connection.execute(`
                SELECT id, email, nom, prenom
                FROM administrateurs
                WHERE etablissement_id = ? AND role = 'admin_etablissement'
                LIMIT 1
            `, [candidat.etablissement_id]);

            if (admins.length > 0) {
                const admin = admins[0];

                // Envoyer email à l'admin
                try {
                    await transporter.sendMail({
                        from: process.env.SMTP_USER || 'noreply@gabconcours.ga',
                        to: admin.email,
                        subject: `Nouveau message de ${candidat.prncan} ${candidat.nomcan}`,
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: linear-gradient(135deg, #667eea, #764ba2); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                                    <h1 style="color: white; margin: 0;">📩 Nouveau Message</h1>
                                </div>
                                <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
                                    <h3>Message de candidat</h3>
                                    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                        <p><strong>Candidat:</strong> ${candidat.prncan} ${candidat.nomcan}</p>
                                        <p><strong>NUPCAN:</strong> ${nupcan}</p>
                                        <p><strong>Email:</strong> ${candidat.maican}</p>
                                        <p><strong>Concours:</strong> ${candidat.libcnc || 'N/A'}</p>
                                    </div>
                                    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                                        <p><strong>Sujet:</strong> ${sujet}</p>
                                        <p style="margin-top: 15px;"><strong>Message:</strong></p>
                                        <p style="white-space: pre-wrap;">${message}</p>
                                    </div>
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.APP_URL || 'http://localhost:8001'}/admin/messagerie"
                                           style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                            📧 Répondre au message
                                        </a>
                                    </div>
                                </div>
                            </div>
                        `
                    });

                    console.log('✅ Email envoyé à l\'admin:', admin.email);
                } catch (emailError) {
                    console.error('❌ Erreur envoi email admin:', emailError);
                }

                // Créer notification système pour l'admin
                try {
                    await connection.execute(`
                        INSERT INTO notifications_system (user_type, user_id, type, titre, message, priority, created_at)
                        VALUES ('admin', ?, 'nouveau_message', 'Nouveau message', ?, 'high', NOW())
                    `, [admin.id, `Nouveau message de ${candidat.prncan} ${candidat.nomcan} (${nupcan})`]);
                } catch (notifError) {
                    console.error('Erreur création notification:', notifError);
                }
            }
        }

        res.json({
            success: true,
            message: 'Message envoyé avec succès',
            data: {
                id: messageId,
                nupcan,
                sujet,
                created_at: new Date()
            }
        });

    } catch (error) {
        console.error('Erreur envoi message candidat:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de l\'envoi du message'
        });
    }
});

/* =====================================================
   📬 RÉPONDRE À UN MESSAGE (ADMIN)
===================================================== */
router.post('/admin/reply', async (req, res) => {
    const connection = getConnection();

    try {
        const { nupcan, sujet, message, admin_id, message_id } = req.body;

        if (!nupcan || !message || !admin_id) {
            return res.status(400).json({
                success: false,
                message: 'NUPCAN, message et admin_id requis'
            });
        }

        // Vérifier que l'admin existe
        const [admins] = await connection.execute(
            'SELECT * FROM administrateurs WHERE id = ?',
            [admin_id]
        );

        if (admins.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Administrateur non trouvé'
            });
        }

        const admin = admins[0];

        // Récupérer les infos du candidat
        const [candidats] = await connection.execute(
            'SELECT * FROM candidats WHERE nupcan = ?',
            [nupcan]
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
            INSERT INTO messages
            (candidat_nupcan, admin_id, sujet, message, expediteur, statut, parent_message_id, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'admin', 'non_lu', ?, NOW(), NOW())
        `, [nupcan, admin_id, sujet || 'Réponse à votre message', message, message_id || null]);

        const replyId = result.insertId;

        // Marquer le message original comme lu
        if (message_id) {
            await connection.execute(
                'UPDATE messages SET statut = "lu", updated_at = NOW() WHERE id = ?',
                [message_id]
            );
        }

        // Envoyer email au candidat
        try {
            await transporter.sendMail({
                from: process.env.SMTP_USER || 'noreply@gabconcours.ga',
                to: candidat.maican,
                subject: `Réponse à votre message - ${sujet || 'GabConcours'}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                            <h1 style="color: white; margin: 0;">✉️ Réponse de l'Administration</h1>
                        </div>
                        <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
                            <p>Bonjour <strong>${candidat.prncan} ${candidat.nomcan}</strong>,</p>
                            <p>Vous avez reçu une réponse de l'administration concernant votre message.</p>
                            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p><strong>Sujet:</strong> ${sujet || 'Réponse à votre message'}</p>
                                <p><strong>De:</strong> ${admin.prenom} ${admin.nom}</p>
                            </div>
                            <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                                <p><strong>Message:</strong></p>
                                <p style="white-space: pre-wrap; margin-top: 10px;">${message}</p>
                            </div>
                            <div style="text-align: center; margin: 30px 0;">
                                <a href="${process.env.APP_URL || 'http://localhost:8001'}/candidat/dashboard/${nupcan}"
                                   style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                    📱 Voir dans mon dashboard
                                </a>
                            </div>
                            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
                                Vous pouvez également répondre directement depuis votre espace candidat.
                            </p>
                            <p>Cordialement,<br><strong>L'équipe GabConcours</strong></p>
                        </div>
                    </div>
                `
            });

            console.log('✅ Email envoyé au candidat:', candidat.maican);
        } catch (emailError) {
            console.error('❌ Erreur envoi email candidat:', emailError);
        }

        // Créer une notification pour le candidat
        try {
            await connection.execute(`
                INSERT INTO notifications (candidat_nupcan, type, titre, message, statut, priority, created_at, updated_at)
                VALUES (?, 'message', 'Nouvelle réponse', ?, 'non_lu', 'high', NOW(), NOW())
            `, [nupcan, `L'administration a répondu à votre message: ${sujet || 'Votre demande'}`]);
        } catch (notifError) {
            console.error('Erreur création notification:', notifError);
        }

        try {
            await connection.execute(`
                INSERT INTO admin_actions
                    (admin_id, action_type, entity_type, entity_id, candidat_nupcan, description, details, ip_address, created_at)
                VALUES (?, 'reponse_message', 'message', ?, ?, ?, ?, ?, NOW())
            `, [
                admin_id,
                replyId,
                nupcan,
                `Réponse au message: ${sujet || 'Réponse à votre message'}`,
                JSON.stringify({message_id: message_id || null, route: '/api/messaging-realtime/admin/reply'}),
                req.ip || null
            ]);
        } catch (auditError) {
            console.error('Erreur journalisation réponse admin:', auditError);
        }

        res.json({
            success: true,
            message: 'Réponse envoyée avec succès',
            data: {
                id: replyId,
                nupcan,
                admin_id,
                created_at: new Date()
            }
        });

    } catch (error) {
        console.error('Erreur réponse admin:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur lors de l\'envoi de la réponse'
        });
    }
});

/* =====================================================
   📖 RÉCUPÉRER L'HISTORIQUE D'UNE CONVERSATION
===================================================== */
router.get('/conversation/:nupcan', async (req, res) => {
    const connection = getConnection();

    try {
        const { nupcan } = req.params;

        const [messages] = await connection.execute(`
            SELECT
                m.*,
                c.nomcan, c.prncan, c.maican,
                a.nom as admin_nom, a.prenom as admin_prenom, a.email as admin_email
            FROM messages m
            LEFT JOIN candidats c ON m.candidat_nupcan = c.nupcan
            LEFT JOIN administrateurs a ON m.admin_id = a.id
            WHERE m.candidat_nupcan = ?
            ORDER BY m.created_at ASC
        `, [nupcan]);

        res.json({
            success: true,
            data: messages,
            total: messages.length
        });

    } catch (error) {
        console.error('Erreur récupération conversation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la conversation'
        });
    }
});

/* =====================================================
   📋 LISTE DES CONVERSATIONS (ADMIN)
===================================================== */
router.get('/admin/conversations', async (req, res) => {
    const connection = getConnection();

    try {
        const { etablissement_id, statut, search } = req.query;

        let query = `
            SELECT
                c.nupcan,
                c.nomcan,
                c.prncan,
                c.maican,
                con.libcnc,
                COUNT(m.id) as total_messages,
                SUM(CASE WHEN m.statut = 'non_lu' AND m.expediteur = 'candidat' THEN 1 ELSE 0 END) as messages_non_lus,
                MAX(m.created_at) as dernier_message_date,
                (SELECT message FROM messages WHERE candidat_nupcan = c.nupcan ORDER BY created_at DESC LIMIT 1) as dernier_message
            FROM candidats c
            LEFT JOIN concours con ON c.concours_id = con.id
            LEFT JOIN messages m ON m.candidat_nupcan = c.nupcan
            WHERE 1=1
        `;

        const params = [];

        if (etablissement_id) {
            query += ' AND con.etablissement_id = ?';
            params.push(etablissement_id);
        }

        if (search) {
            query += ' AND (c.nomcan LIKE ? OR c.prncan LIKE ? OR c.nupcan LIKE ?)';
            const searchParam = `%${search}%`;
            params.push(searchParam, searchParam, searchParam);
        }

        query += `
            GROUP BY c.nupcan, c.nomcan, c.prncan, c.maican, con.libcnc
            HAVING total_messages > 0
        `;

        if (statut === 'non_lu') {
            query += ' AND messages_non_lus > 0';
        }

        query += ' ORDER BY dernier_message_date DESC';

        const [conversations] = await connection.execute(query, params);

        res.json({
            success: true,
            data: conversations,
            total: conversations.length
        });

    } catch (error) {
        console.error('Erreur récupération conversations admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des conversations'
        });
    }
});

/* =====================================================
   ✅ MARQUER COMME LU
===================================================== */
router.put('/:id/read', async (req, res) => {
    const connection = getConnection();

    try {
        const { id } = req.params;

        await connection.execute(
            'UPDATE messages SET statut = "lu", updated_at = NOW() WHERE id = ?',
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
            message: 'Erreur lors du marquage'
        });
    }
});

/* =====================================================
   🗑️ SUPPRIMER UN MESSAGE
===================================================== */
router.delete('/:id', async (req, res) => {
    const connection = getConnection();

    try {
        const { id } = req.params;

        await connection.execute('DELETE FROM messages WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Message supprimé'
        });

    } catch (error) {
        console.error('Erreur suppression message:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression'
        });
    }
});

/* =====================================================
   📊 STATISTIQUES
===================================================== */
router.get('/stats', async (req, res) => {
    const connection = getConnection();

    try {
        const { etablissement_id } = req.query;

        let query = `
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN statut = 'non_lu' THEN 1 ELSE 0 END) as non_lus,
                SUM(CASE WHEN expediteur = 'candidat' THEN 1 ELSE 0 END) as de_candidats,
                SUM(CASE WHEN expediteur = 'admin' THEN 1 ELSE 0 END) as de_admins,
                COUNT(DISTINCT candidat_nupcan) as total_conversations
            FROM messages m
        `;

        const params = [];

        if (etablissement_id) {
            query += `
                LEFT JOIN candidats c ON m.candidat_nupcan = c.nupcan
                LEFT JOIN concours con ON c.concours_id = con.id
                WHERE con.etablissement_id = ?
            `;
            params.push(etablissement_id);
        }

        const [stats] = await connection.execute(query, params);

        res.json({
            success: true,
            data: stats[0]
        });

    } catch (error) {
        console.error('Erreur stats messages:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
});

module.exports = router;
