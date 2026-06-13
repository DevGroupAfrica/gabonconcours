const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// Récupérer tous les logs d'actions admin
router.get('/', async (req, res) => {
    try {
        const connection = getConnection();
        const { admin_id, action_type, start_date, end_date } = req.query;

        let query = `
            SELECT 
                al.*,
                a.nom as admin_nom,
                a.prenom as admin_prenom,
                a.email as admin_email,
                a.role as admin_role
            FROM admin_logs al
            LEFT JOIN administrateurs a ON al.admin_id = a.id
            WHERE 1=1
        `;
        const params = [];

        if (admin_id) {
            query += ' AND al.admin_id = ?';
            params.push(admin_id);
        }

        if (action_type) {
            query += ' AND al.action = ?';
            params.push(action_type);
        }

        if (start_date) {
            query += ' AND DATE(al.created_at) >= ?';
            params.push(start_date);
        }

        if (end_date) {
            query += ' AND DATE(al.created_at) <= ?';
            params.push(end_date);
        }

        query += ' ORDER BY al.created_at DESC LIMIT 1000';

        const [logs] = await connection.execute(query, params);

        res.json({
            success: true,
            data: logs
        });
    } catch (error) {
        console.error('Erreur récupération logs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des logs'
        });
    }
});

// Statistiques des actions admin
router.get('/stats', async (req, res) => {
    try {
        const connection = getConnection();

        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total_actions,
                COUNT(DISTINCT admin_id) as admins_actifs,
                COUNT(CASE WHEN action = 'validation_document' THEN 1 END) as validations,
                COUNT(CASE WHEN action = 'rejet_document' THEN 1 END) as rejets,
                COUNT(CASE WHEN action = 'envoi_message' THEN 1 END) as messages_envoyes,
                COUNT(CASE WHEN action = 'attribution_note' THEN 1 END) as notes_attribuees,
                COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as actions_aujourd_hui
            FROM admin_logs
        `);

        res.json({
            success: true,
            data: stats[0]
        });
    } catch (error) {
        console.error('Erreur stats logs:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors du calcul des statistiques'
        });
    }
});

// Créer un nouveau log
router.post('/', async (req, res) => {
    try {
        const connection = getConnection();
        const {
            admin_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values,
            ip_address,
            user_agent
        } = req.body;

        const [result] = await connection.execute(
            `INSERT INTO admin_logs 
            (admin_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                admin_id,
                action,
                table_name || null,
                record_id || null,
                JSON.stringify(old_values || {}),
                JSON.stringify(new_values || {}),
                ip_address || null,
                user_agent || null
            ]
        );

        res.json({
            success: true,
            message: 'Log créé avec succès',
            data: {
                id: result.insertId
            }
        });
    } catch (error) {
        console.error('Erreur création log:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création du log'
        });
    }
});

module.exports = router;
