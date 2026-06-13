const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const {authenticateAdmin} = require('../middleware/auth');
const emailService = require('../services/emailService');

// Middleware pour vérifier le rôle super-admin
const requireSuperAdmin = (req, res, next) => {
    if (req.admin.role !== 'super_admin') {
        return res.status(403).json({success: false, message: 'Accès réservé au super-admin'});
    }
    next();
};

// POST /api/admin/auth/login - Connexion administrateur
router.post('/login', async (req, res) => {
    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email et mot de passe requis'
            });
        }

        const admin = await Admin.verifyPassword(email, password);
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: 'Identifiants invalides'
            });
        }

        const token = jwt.sign(
            {
                adminId: admin.id,
                id: admin.id,
                role: admin.role,
                etablissement_id: admin.etablissement_id,
                nom: admin.nom,
                prenom: admin.prenom,
                email: admin.email,
                admin_role: admin.admin_role
            },
            process.env.JWT_SECRET || 'your_jwt_secret_key_here',
            {expiresIn: '24h'}
        );

        res.json({
            success: true,
            data: {
                admin: {
                    id: admin.id,
                    nom: admin.nom,
                    prenom: admin.prenom,
                    email: admin.email,
                    role: admin.role,
                    admin_role: admin.admin_role,
                    etablissement_id: admin.etablissement_id,
                    etablissement_nom: admin.etablissement_nom
                },
                token
            }
        });
    } catch (error) {
        console.error('Erreur login admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// POST /api/admin/auth/change-password - Changer mot de passe
router.post('/change-password', authenticateAdmin, async (req, res) => {
    try {
        const {current_password, new_password} = req.body;

        // Récupérer l'admin complet
        const admin = await Admin.findById(req.admin.adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin non trouvé'
            });
        }

        // Vérifier l'ancien mot de passe
        const isValid = await Admin.verifyPassword(admin.email, current_password);
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Mot de passe actuel incorrect'
            });
        }

        await Admin.updatePassword(req.admin.adminId, new_password);

        res.json({
            success: true,
            message: 'Mot de passe modifié avec succès'
        });
    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// POST /api/admin/auth/forgot-password - Envoyer un lien de réinitialisation
router.post('/forgot-password', async (req, res) => {
    try {
        const email = String(req.body.email || '').trim().toLowerCase();
        if (!email) {
            return res.status(400).json({success: false, message: 'Adresse email requise'});
        }

        const admin = await Admin.findByEmail(email);
        if (admin) {
            const token = await Admin.createPasswordResetToken(email);
            const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8001'}/admin/reset-password/${token}`;
            await emailService.sendEmail(
                email,
                'Réinitialisation de votre mot de passe GABConcours',
                `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto">
                    <h2 style="color:#1746A2">Réinitialiser votre mot de passe</h2>
                    <p>Bonjour ${admin.prenom || ''},</p>
                    <p>Utilisez le lien ci-dessous pour définir un nouveau mot de passe. Ce lien expire dans une heure.</p>
                    <p><a href="${resetUrl}" style="display:inline-block;background:#2A6DF3;color:#fff;padding:12px 18px;text-decoration:none">Choisir un nouveau mot de passe</a></p>
                    <p>Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.</p>
                </div>`
            );
        }

        res.json({
            success: true,
            message: 'Si un compte correspond à cette adresse, un lien de réinitialisation a été envoyé.'
        });
    } catch (error) {
        console.error('Erreur mot de passe oublié:', error);
        res.status(500).json({success: false, message: 'Impossible d’envoyer le lien de réinitialisation'});
    }
});

// POST /api/admin/auth/reset-password - Définir le nouveau mot de passe
router.post('/reset-password', async (req, res) => {
    try {
        const {token, new_password} = req.body;
        if (!token || !new_password || new_password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Le nouveau mot de passe doit contenir au moins 8 caractères'
            });
        }
        await Admin.resetPassword(token, new_password);
        res.json({success: true, message: 'Mot de passe réinitialisé avec succès'});
    } catch (error) {
        res.status(400).json({success: false, message: error.message || 'Lien invalide ou expiré'});
    }
});

// GET /api/admin/auth/me - Profil admin actuel
router.get('/me', authenticateAdmin, async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.adminId);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin non trouvé'
            });
        }

        res.json({
            success: true,
            data: {
                id: admin.id,
                nom: admin.nom,
                prenom: admin.prenom,
                email: admin.email,
                role: admin.role,
                etablissement_id: admin.etablissement_id,
                etablissement_nom: admin.etablissement_nom
            }
        });
    } catch (error) {
        console.error('Erreur récupération profil admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

module.exports = {router, authenticateAdmin, requireSuperAdmin};
