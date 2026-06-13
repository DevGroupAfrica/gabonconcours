const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { getConnection } = require('../config/database');

// GET /api/admin-management/admins - Liste des administrateurs
router.get('/admins', async (req, res) => {
    try {
        const { etablissement_id } = req.query;
        const connection = getConnection();
        
        let query = `
            SELECT 
                a.id, a.nom, a.prenom, a.email, a.telephone,
                a.created_at, a.updated_at,
                GROUP_CONCAT(DISTINCT ur.role) as roles,
                e.nomets as etablissement
            FROM administrateurs a
            LEFT JOIN user_roles ur ON a.id = ur.user_id
            LEFT JOIN etablissements e ON ur.etablissement_id = e.id
        `;
        
        const params = [];
        if (etablissement_id) {
            query += ' WHERE ur.etablissement_id = ? OR ur.role = "super_admin"';
            params.push(etablissement_id);
        }
        
        query += ' GROUP BY a.id ORDER BY a.nom';
        
        const [admins] = await connection.execute(query, params);
        
        res.json({ success: true, data: admins });
    } catch (error) {
        console.error('Erreur récupération admins:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/admin-management/admins - Créer un administrateur
router.post('/admins', async (req, res) => {
    try {
        const { 
            nom, prenom, email, telephone, password, 
            roles, etablissement_id, concours_id,
            created_by 
        } = req.body;
        
        if (!nom || !prenom || !email || !password || !roles || !Array.isArray(roles)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Données requises manquantes' 
            });
        }
        
        const connection = getConnection();
        
        // Vérifier que l'email n'existe pas
        const [existing] = await connection.execute(
            'SELECT id FROM administrateurs WHERE email = ?',
            [email]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Un administrateur avec cet email existe déjà' 
            });
        }
        
        // Hasher le mot de passe
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Créer l'administrateur
        const [result] = await connection.execute(
            `INSERT INTO administrateurs (nom, prenom, email, telephone, password, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [nom, prenom, email, telephone, hashedPassword]
        );
        
        const adminId = result.insertId;
        
        // Assigner les rôles
        for (const role of roles) {
            await connection.execute(
                `INSERT INTO user_roles (user_id, role, etablissement_id, concours_id, created_at)
                 VALUES (?, ?, ?, ?, NOW())`,
                [adminId, role, etablissement_id || null, concours_id || null]
            );
        }
        
        // Logger l'action
        if (created_by) {
            await connection.execute(
                `INSERT INTO admin_logs (admin_id, action, table_name, record_id, details, created_at)
                 VALUES (?, 'CREATE_ADMIN', 'administrateurs', ?, ?, NOW())`,
                [created_by, adminId, `Création de l'administrateur ${nom} ${prenom}`]
            );
        }
        
        res.json({ 
            success: true, 
            message: 'Administrateur créé avec succès',
            data: { id: adminId }
        });
    } catch (error) {
        console.error('Erreur création admin:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT /api/admin-management/admins/:id/password - Changer le mot de passe
router.put('/admins/:id/password', async (req, res) => {
    try {
        const { id } = req.params;
        const { old_password, new_password, updated_by } = req.body;
        
        if (!new_password || new_password.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Le mot de passe doit contenir au moins 6 caractères' 
            });
        }
        
        const connection = getConnection();
        
        // Récupérer l'admin
        const [admins] = await connection.execute(
            'SELECT id, password FROM administrateurs WHERE id = ?',
            [id]
        );
        
        if (admins.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Administrateur non trouvé' 
            });
        }
        
        // Vérifier l'ancien mot de passe si fourni
        if (old_password) {
            const isValid = await bcrypt.compare(old_password, admins[0].password);
            if (!isValid) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Ancien mot de passe incorrect' 
                });
            }
        }
        
        // Hasher le nouveau mot de passe
        const hashedPassword = await bcrypt.hash(new_password, 10);
        
        // Mettre à jour
        await connection.execute(
            'UPDATE administrateurs SET password = ?, updated_at = NOW() WHERE id = ?',
            [hashedPassword, id]
        );
        
        res.json({ 
            success: true, 
            message: 'Mot de passe mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur changement mot de passe:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
