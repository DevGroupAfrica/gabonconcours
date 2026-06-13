const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// Récupérer tous les administrateurs avec filtres
router.get('/', async (req, res) => {
    try {
        const connection = getConnection();
        const { etablissement_id, role } = req.query;

        let query = `
            SELECT 
                a.id,
                a.nom,
                a.prenom,
                a.email,
                a.role,
                a.admin_role,
                a.etablissement_id,
                e.nomets as etablissement_nom,
                a.created_at,
                a.updated_at
            FROM administrateurs a
            LEFT JOIN etablissements e ON a.etablissement_id = e.id
            WHERE 1=1
        `;
        
        const params = [];

        if (etablissement_id) {
            query += ' AND a.etablissement_id = ?';
            params.push(etablissement_id);
        }

        if (role) {
            query += ' AND a.role = ?';
            params.push(role);
        }

        query += ' ORDER BY a.created_at DESC';

        const [admins] = await connection.execute(query, params);

        res.json({ success: true, data: admins });
    } catch (error) {
        console.error('Erreur récupération administrateurs:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Récupérer un administrateur par ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = getConnection();

        const [admins] = await connection.execute(
            `SELECT 
                a.id,
                a.nom,
                a.prenom,
                a.email,
                a.role,
                a.admin_role,
                a.etablissement_id,
                e.nomets as etablissement_nom,
                a.created_at,
                a.updated_at
            FROM administrateurs a
            LEFT JOIN etablissements e ON a.etablissement_id = e.id
            WHERE a.id = ?`,
            [id]
        );

        if (admins.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Administrateur non trouvé'
            });
        }

        res.json({ success: true, data: admins[0] });
    } catch (error) {
        console.error('Erreur récupération administrateur:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Statistiques des administrateurs
router.get('/stats/overview', async (req, res) => {
    try {
        const connection = getConnection();
        const { etablissement_id } = req.query;

        let whereClause = '1=1';
        const params = [];

        if (etablissement_id) {
            whereClause += ' AND etablissement_id = ?';
            params.push(etablissement_id);
        }

        const [stats] = await connection.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN role = 'super_admin' THEN 1 ELSE 0 END) as super_admins,
                SUM(CASE WHEN role = 'admin_etablissement' THEN 1 ELSE 0 END) as admins_etablissement,
                SUM(CASE WHEN role = 'sub_admin' THEN 1 ELSE 0 END) as sub_admins,
                SUM(CASE WHEN admin_role = 'notes' THEN 1 ELSE 0 END) as admins_notes,
                SUM(CASE WHEN admin_role = 'documents' THEN 1 ELSE 0 END) as admins_documents
            FROM administrateurs
            WHERE ${whereClause}`,
            params
        );

        res.json({ success: true, data: stats[0] });
    } catch (error) {
        console.error('Erreur stats administrateurs:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
