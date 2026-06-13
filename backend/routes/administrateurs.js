const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const bcrypt = require('bcrypt');
const { authenticateAdmin } = require('../middleware/auth');

// Mettre à jour le profil admin
router.put('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom, prenom, email } = req.body;
        const connection = getConnection();

        // Vérifier que l'admin modifie son propre profil
        if (req.admin.id !== parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé'
            });
        }

        // Vérifier si l'email existe déjà (sauf pour le même admin)
        const [existing] = await connection.execute(
            'SELECT id FROM administrateurs WHERE email = ? AND id != ?',
            [email, id]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cet email est déjà utilisé'
            });
        }

        // Mettre à jour
        await connection.execute(
            'UPDATE administrateurs SET nom = ?, prenom = ?, email = ?, updated_at = NOW() WHERE id = ?',
            [nom, prenom, email, id]
        );

        res.json({
            success: true,
            message: 'Profil mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur mise à jour profil:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Changer le mot de passe
router.put('/:id/password', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { currentPassword, newPassword } = req.body;
        const connection = getConnection();

        // Vérifier que l'admin modifie son propre mot de passe
        if (req.admin.id !== parseInt(id)) {
            return res.status(403).json({
                success: false,
                message: 'Non autorisé'
            });
        }

        // Récupérer le mot de passe actuel
        const [admins] = await connection.execute(
            'SELECT password FROM administrateurs WHERE id = ?',
            [id]
        );

        if (admins.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Administrateur non trouvé'
            });
        }

        // Vérifier le mot de passe actuel
        const isValid = await bcrypt.compare(currentPassword, admins[0].password);
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Mot de passe actuel incorrect'
            });
        }

        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Mettre à jour
        await connection.execute(
            'UPDATE administrateurs SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, id]
        );

        res.json({
            success: true,
            message: 'Mot de passe changé avec succès'
        });
    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;