const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getConnection } = require('../config/database');
const { sendEmail } = require('../services/emailService');

// Récupérer tous les sous-admins d'un établissement
router.get('/etablissement/:etablissement_id', async (req, res) => {
    try {
        const { etablissement_id } = req.params;
        const connection = getConnection();

        const [sousAdmins] = await connection.execute(
            `SELECT sa.*, e.nom_etablissement
             FROM sous_admins sa
             LEFT JOIN etablissements e ON sa.etablissement_id = e.id
             WHERE sa.etablissement_id = ?
             ORDER BY sa.created_at DESC`,
            [etablissement_id]
        );

        res.json({ success: true, data: sousAdmins });
    } catch (error) {
        console.error('Erreur récupération sous-admins:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Créer un nouveau sous-admin
router.post('/', async (req, res) => {
    try {
        const { nom, prenom, email, role, etablissement_id, concours_ids, created_by } = req.body;

        if (!nom || !prenom || !email || !role || !etablissement_id || !created_by) {
            return res.status(400).json({
                success: false,
                message: 'Tous les champs requis doivent être fournis'
            });
        }

        const connection = getConnection();

        // Vérifier si l'email existe déjà
        const [existing] = await connection.execute(
            'SELECT id FROM sous_admins WHERE email = ?',
            [email]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cet email est déjà utilisé'
            });
        }

        // Générer un mot de passe aléatoire
        const password = Math.random().toString(36).slice(-10) + Math.random().toString(36).toUpperCase().slice(-2) + '!';
        const hashedPassword = await bcrypt.hash(password, 10);

        // Créer le sous-admin
        const [result] = await connection.execute(
            `INSERT INTO sous_admins
             (nom, prenom, email, password, role, etablissement_id, concours_ids, created_by, actif, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, NOW())`,
            [
                nom,
                prenom,
                email,
                hashedPassword,
                role,
                etablissement_id,
                concours_ids ? JSON.stringify(concours_ids) : null,
                created_by
            ]
        );

        // Envoyer l'email avec le mot de passe
        try {
            await sendEmail(
                email,
                'Bienvenue - Accès Sous-Admin GABConcours',
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <div style="background: linear-gradient(135deg, #4f46e5, #7c3aed); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">Bienvenue sur GABConcours</h1>
                    </div>
                    <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
                        <h2>Bonjour ${prenom} ${nom},</h2>
                        <p>Vous avez été ajouté(e) en tant que <strong>sous-administrateur</strong> sur la plateforme GABConcours.</p>

                        <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #4f46e5;">
                            <h3 style="margin: 0 0 10px 0; color: #4f46e5;">Vos identifiants de connexion</h3>
                            <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
                            <p style="margin: 5px 0;"><strong>Mot de passe temporaire:</strong> <code style="background: #f1f5f9; padding: 5px 10px; border-radius: 4px;">${password}</code></p>
                            <p style="margin: 5px 0;"><strong>Rôle:</strong> ${role}</p>
                        </div>

                        <p><strong>⚠️ IMPORTANT:</strong></p>
                        <ul>
                            <li>Changez votre mot de passe lors de votre première connexion</li>
                            <li>Ne partagez jamais vos identifiants</li>
                            <li>Conservez ce mot de passe en lieu sûr</li>
                        </ul>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.APP_URL || 'http://localhost:8001'}/admin/login"
                               style="background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                Se connecter maintenant
                            </a>
                        </div>

                        <p>Cordialement,<br><strong>L'équipe GABConcours</strong></p>
                    </div>
                </div>
                `
            );
        } catch (emailError) {
            console.error('Erreur envoi email:', emailError);
            // Non bloquant, le compte est créé quand même
        }

        res.json({
            success: true,
            message: 'Sous-admin créé avec succès. Un email a été envoyé avec les identifiants.',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Erreur création sous-admin:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Modifier un sous-admin
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, email, role, concours_ids, actif } = req.body;

        const connection = getConnection();

        // Vérifier si le sous-admin existe
        const [existing] = await connection.execute(
            'SELECT * FROM sous_admins WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sous-admin non trouvé'
            });
        }

        // Vérifier si l'email est déjà utilisé par un autre sous-admin
        if (email) {
            const [emailCheck] = await connection.execute(
                'SELECT id FROM sous_admins WHERE email = ? AND id != ?',
                [email, id]
            );

            if (emailCheck.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Cet email est déjà utilisé'
                });
            }
        }

        // Construire la requête de mise à jour
        const updates = [];
        const params = [];

        if (nom) {
            updates.push('nom = ?');
            params.push(nom);
        }
        if (prenom) {
            updates.push('prenom = ?');
            params.push(prenom);
        }
        if (email) {
            updates.push('email = ?');
            params.push(email);
        }
        if (role) {
            updates.push('role = ?');
            params.push(role);
        }
        if (concours_ids !== undefined) {
            updates.push('concours_ids = ?');
            params.push(concours_ids ? JSON.stringify(concours_ids) : null);
        }
        if (actif !== undefined) {
            updates.push('actif = ?');
            params.push(actif ? 1 : 0);
        }

        updates.push('updated_at = NOW()');
        params.push(id);

        await connection.execute(
            `UPDATE sous_admins SET ${updates.join(', ')} WHERE id = ?`,
            params
        );

        res.json({
            success: true,
            message: 'Sous-admin modifié avec succès'
        });
    } catch (error) {
        console.error('Erreur modification sous-admin:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Désactiver/Réactiver un sous-admin
router.patch('/:id/toggle-actif', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = getConnection();

        const [sousAdmin] = await connection.execute(
            'SELECT actif FROM sous_admins WHERE id = ?',
            [id]
        );

        if (sousAdmin.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sous-admin non trouvé'
            });
        }

        const newStatus = sousAdmin[0].actif ? 0 : 1;

        await connection.execute(
            'UPDATE sous_admins SET actif = ?, updated_at = NOW() WHERE id = ?',
            [newStatus, id]
        );

        res.json({
            success: true,
            message: `Sous-admin ${newStatus ? 'activé' : 'désactivé'} avec succès`
        });
    } catch (error) {
        console.error('Erreur toggle actif:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Supprimer un sous-admin
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = getConnection();

        const [result] = await connection.execute(
            'DELETE FROM sous_admins WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sous-admin non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Sous-admin supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression sous-admin:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Réinitialiser le mot de passe
router.post('/:id/reset-password', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = getConnection();

        const [sousAdmin] = await connection.execute(
            'SELECT * FROM sous_admins WHERE id = ?',
            [id]
        );

        if (sousAdmin.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sous-admin non trouvé'
            });
        }

        // Générer un nouveau mot de passe
        const newPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).toUpperCase().slice(-2) + '!';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await connection.execute(
            'UPDATE sous_admins SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, id]
        );

        // Envoyer l'email avec le nouveau mot de passe
        try {
            await sendEmail(
                sousAdmin[0].email,
                'Réinitialisation de mot de passe - GABConcours',
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Réinitialisation de mot de passe</h2>
                    <p>Bonjour ${sousAdmin[0].prenom} ${sousAdmin[0].nom},</p>
                    <p>Votre mot de passe a été réinitialisé.</p>
                    <div style="background: #f1f5f9; padding: 15px; margin: 20px 0; border-radius: 8px;">
                        <p><strong>Nouveau mot de passe:</strong></p>
                        <code style="background: white; padding: 10px; border-radius: 4px; display: block; text-align: center; font-size: 18px;">${newPassword}</code>
                    </div>
                    <p><strong>Changez ce mot de passe dès votre prochaine connexion.</strong></p>
                </div>
                `
            );
        } catch (emailError) {
            console.error('Erreur envoi email:', emailError);
        }

        res.json({
            success: true,
            message: 'Mot de passe réinitialisé. Un email a été envoyé au sous-admin.'
        });
    } catch (error) {
        console.error('Erreur réinitialisation mot de passe:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
