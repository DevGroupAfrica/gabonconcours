const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require("crypto");

// ✅ Liste des sous-admins d'un établissement
router.get('/etablissement/:etablissement_id', async (req, res) => {
    try {
        const { etablissement_id } = req.params;
        const connection = getConnection();

        const [subAdmins] = await connection.execute(
            `SELECT id, nom, prenom, email, role, admin_role, created_at 
             FROM administrateurs
             WHERE etablissement_id = ? 
             AND role = 'sub_admin'
             ORDER BY created_at DESC`,
            [etablissement_id]
        );

        res.json({ success: true, data: subAdmins });
    } catch (error) {
        console.error('Erreur récupération sous-admins:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Création d'un sous-admin avec envoi email
router.post('/create', async (req, res) => {
    const connection = getConnection();
    try {
        const { nom, prenom, email, etablissement_id, admin_role, created_by } = req.body;

        if (!nom || !prenom || !email || !etablissement_id || !admin_role) {
            return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
        }

        // Vérifier si l'email existe déjà
        const [existingAdmin] = await connection.execute(
            'SELECT id FROM administrateurs WHERE email = ?',
            [email]
        );

        if (existingAdmin.length > 0) {
            return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
        }

        // Vérifier la limite de 3 sous-admins par établissement
        const [subAdminsCount] = await connection.execute(
            'SELECT COUNT(*) as count FROM administrateurs WHERE etablissement_id = ? AND role = "sub_admin"',
            [etablissement_id]
        );

        if (subAdminsCount[0].count >= 3) {
            return res.status(400).json({ 
                success: false, 
                message: 'Limite de 3 sous-admins atteinte pour cet établissement' 
            });
        }

        // Générer un mot de passe temporaire
        const tempPassword = crypto.randomBytes(8).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 12);

        const [result] = await connection.execute(
            `INSERT INTO administrateurs 
       (nom, prenom, email, password, role, admin_role, etablissement_id, created_by, created_at)
       VALUES (?, ?, ?, ?, 'sub_admin', ?, ?, ?, NOW())`,
            [nom, prenom, email, hashedPassword, admin_role, etablissement_id, created_by]
        );

        // Récupérer l'établissement
        const [etablissement] = await connection.execute(
            'SELECT nomets FROM etablissements WHERE id = ?',
            [etablissement_id]
        );

        // Envoyer l'email avec les identifiants
        try {
            const emailService = require('../services/emailService');
            await emailService.sendSubAdminCredentials({
                to: email,
                nom,
                prenom,
                tempPassword,
                etablissement: etablissement[0]?.nomets,
                role: admin_role
            });
            console.log('📧 Email envoyé avec succès à:', email);
        } catch (emailError) {
            console.error('Erreur envoi email (non bloquant):', emailError);
            // Ne pas bloquer la création si l'email échoue
        }

        res.json({ 
            success: true, 
            message: 'Sous-admin créé avec succès',
            data: {
                id: result.insertId,
                email,
                // En développement uniquement
                tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined
            }
        });

    } catch (error) {
        console.error('Erreur création sous-admin:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Mise à jour du rôle d'un sous-admin
router.put('/:id', async (req, res) => {
    const connection = getConnection();
    try {
        const { id } = req.params;
        const { admin_role } = req.body;

        if (!admin_role) {
            return res.status(400).json({ success: false, message: 'Le rôle est requis' });
        }

        await connection.execute(
            'UPDATE administrateurs SET admin_role = ?, updated_at = NOW() WHERE id = ? AND role = "sub_admin"',
            [admin_role, id]
        );

        res.json({ success: true, message: 'Rôle mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur mise à jour sous-admin:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Suppression d'un sous-admin
router.delete('/:id', async (req, res) => {
    const connection = getConnection();

    try {
        const { id } = req.params;

        await connection.execute('DELETE FROM administrateurs WHERE id = ? AND role = "sub_admin"', [id]);

        res.json({ success: true, message: 'Sous-admin supprimé avec succès' });
    } catch (error) {
        console.error('Erreur suppression sous-admin:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
