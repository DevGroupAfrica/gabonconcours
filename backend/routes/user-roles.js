const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// GET /api/user-roles/:userId - Obtenir les rôles d'un utilisateur
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const connection = getConnection();
        
        const [roles] = await connection.execute(
            'SELECT role FROM user_roles WHERE user_id = ?',
            [userId]
        );
        
        res.json({ 
            success: true, 
            data: roles.map(r => r.role) 
        });
    } catch (error) {
        console.error('Erreur récupération rôles:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/user-roles - Assigner un rôle à un utilisateur
router.post('/', async (req, res) => {
    try {
        const { user_id, role } = req.body;
        
        if (!user_id || !role) {
            return res.status(400).json({ 
                success: false, 
                message: 'user_id et role requis' 
            });
        }
        
        // Valider le rôle
        const validRoles = ['admin', 'moderator', 'user', 'super_admin', 'admin_etablissement'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Rôle invalide' 
            });
        }
        
        const connection = getConnection();
        
        // Vérifier si le rôle existe déjà
        const [existing] = await connection.execute(
            'SELECT * FROM user_roles WHERE user_id = ? AND role = ?',
            [user_id, role]
        );
        
        if (existing.length > 0) {
            return res.json({ 
                success: true, 
                message: 'Rôle déjà assigné' 
            });
        }
        
        await connection.execute(
            'INSERT INTO user_roles (user_id, role, created_at) VALUES (?, ?, NOW())',
            [user_id, role]
        );
        
        res.json({ 
            success: true, 
            message: 'Rôle assigné avec succès' 
        });
    } catch (error) {
        console.error('Erreur assignation rôle:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE /api/user-roles/:userId/:role - Retirer un rôle
router.delete('/:userId/:role', async (req, res) => {
    try {
        const { userId, role } = req.params;
        const connection = getConnection();
        
        await connection.execute(
            'DELETE FROM user_roles WHERE user_id = ? AND role = ?',
            [userId, role]
        );
        
        res.json({ 
            success: true, 
            message: 'Rôle retiré avec succès' 
        });
    } catch (error) {
        console.error('Erreur retrait rôle:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
