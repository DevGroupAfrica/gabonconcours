const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const emailService = require('../services/emailService');
const {authenticateAdmin, requireSuperAdmin} = require('./adminAuth');

// Appliquer l'authentification à toutes les routes
router.use(authenticateAdmin);

// GET /api/admin/management/admins - Liste des admins
router.get('/admins', async (req, res) => {
    try {
        console.log('Récupération des admins - User:', req.admin);
        const {role, etablissement_id} = req.query;
        const filters = {};

        // Si c'est un admin d'établissement, il ne peut voir que son établissement
        if (req.admin.role === 'admin_etablissement') {
            filters.etablissement_id = req.admin.etablissement_id;
        } else {
            // Super admin peut filtrer par établissement si spécifié
            if (etablissement_id) filters.etablissement_id = etablissement_id;
        }

        if (role) filters.role = role;

        const admins = await Admin.findAll(filters);

        console.log(`${admins.length} admins trouvés`);
        res.json({
            success: true,
            data: admins
        });
    } catch (error) {
        console.error('Erreur récupération admins:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// POST /api/admin/management/admins - Créer un admin (super admin uniquement)
router.post('/admins', requireSuperAdmin, async (req, res) => {
    try {
        console.log('Création admin - Données reçues:', req.body);
        const {nom, prenom, email, etablissement_id} = req.body;

        if (!nom || !prenom || !email || !etablissement_id) {
            return res.status(400).json({
                success: false,
                message: 'Nom, prénom, email et établissement requis'
            });
        }

        // Vérifier si l'email existe déjà
        const existingAdmin = await Admin.findByEmail(email);
        if (existingAdmin) {
            return res.status(400).json({
                success: false,
                message: 'Un admin avec cet email existe déjà'
            });
        }

        console.log('Création nouvel admin...');
        const newAdmin = await Admin.create({
            nom: nom.trim(),
            prenom: prenom.trim(),
            email: email.trim().toLowerCase(),
            etablissement_id: parseInt(etablissement_id),
            role: 'admin_etablissement'
        }, req.admin.adminId);


        // Récupérer les informations complètes pour l'email
        const adminWithDetails = await Admin.findById(newAdmin.id);
        console.log('Admin créé avec succès:', newAdmin.id);

        // Envoyer l'email avec les identifiants
        try {
            await emailService.sendAdminCredentials({
                ...adminWithDetails,
                temp_password: newAdmin.temp_password
            });
            console.log(`Email envoyé avec succès à ${email}`);
        } catch (emailError) {
            console.error('Erreur envoi email:', emailError);
            // On continue même si l'email échoue
        }

        const {password: _passwordHash, ...safeAdmin} = newAdmin;
        res.status(201).json({
            success: true,
            data: {
                ...safeAdmin,
                temp_password: newAdmin.temp_password
            },
            message: 'Admin créé avec succès. Le mot de passe temporaire ne sera affiché qu’une seule fois.'
        });
    } catch (error) {
        console.error('Erreur création admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la création'
        });
    }
});

// PUT /api/admin/management/admins/:id - Modifier un admin
router.put('/admins/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const {nom, prenom, email, statut, etablissement_id} = req.body;

        console.log(`Modification admin ${id} - Données:`, req.body);

        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin non trouvé'
            });
        }

        // Vérifications de sécurité
        if (admin.role === 'super_admin' && req.admin.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Impossible de modifier le super-admin'
            });
        }

        // Admin d'établissement ne peut modifier que son propre profil
        if (req.admin.role === 'admin_etablissement' && req.admin.adminId !== parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        const updatedAdmin = await Admin.update(id, {
            nom: nom?.trim(),
            prenom: prenom?.trim(),
            email: email?.trim().toLowerCase(),
            statut,
            etablissement_id: req.admin.role === 'super_admin' ? etablissement_id : admin.etablissement_id
        });

        console.log('Admin modifié avec succès');
        res.json({
            success: true,
            data: updatedAdmin,
            message: 'Admin modifié avec succès'
        });
    } catch (error) {
        console.error('Erreur modification admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// PUT /api/admin/management/admins/:id/password - Changer le mot de passe
router.put('/admins/:id/password', async (req, res) => {
    try {
        const {id} = req.params;
        const {current_password, new_password} = req.body;

        // Vérifier que c'est le même admin ou un super admin
        if (req.admin.role !== 'super_admin' && req.admin.adminId !== parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin non trouvé'
            });
        }

        // Si ce n'est pas un super admin qui change le mot de passe, vérifier l'ancien
        if (req.admin.role !== 'super_admin') {
            const bcrypt = require('bcrypt');
            const isValid = await bcrypt.compare(current_password, admin.password);
            if (!isValid) {
                return res.status(400).json({
                    success: false,
                    message: 'Mot de passe actuel incorrect'
                });
            }
        }

        await Admin.updatePassword(id, new_password);

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

// DELETE /api/admin/management/admins/:id - Supprimer un admin (super admin uniquement)
router.delete('/admins/:id', requireSuperAdmin, async (req, res) => {
    try {
        const {id} = req.params;

        console.log(`Suppression admin ${id}`);

        const admin = await Admin.findById(id);
        if (!admin) {
            return res.status(404).json({
                success: false,
                message: 'Admin non trouvé'
            });
        }

        if (admin.role === 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Impossible de supprimer le super-admin'
            });
        }

        const deleted = await Admin.delete(id);
        if (!deleted) {
            return res.status(400).json({
                success: false,
                message: 'Impossible de supprimer cet admin'
            });
        }

        console.log('Admin supprimé avec succès');
        res.json({
            success: true,
            message: 'Admin supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

module.exports = router;
