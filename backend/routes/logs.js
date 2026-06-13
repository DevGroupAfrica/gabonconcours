const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// Récupérer tous les logs avec filtres
router.get('/', async (req, res) => {
    try {
        const connection = getConnection();
        const { 
            user_type, 
            user_id, 
            action, 
            etablissement_id,
            date_debut, 
            date_fin,
            limit = 100 
        } = req.query;

        let query = `
            SELECT l.*, 
                   a.nom as admin_nom, a.prenom as admin_prenom, a.email as admin_email,
                   c.nomcan, c.prncan, c.maican,
                   e.nom_etablissement
            FROM logs l
            LEFT JOIN administrateurs a ON l.user_type = 'admin' AND l.user_id = a.id
            LEFT JOIN candidats c ON l.user_type = 'candidat' AND l.user_id = c.id
            LEFT JOIN etablissements e ON l.etablissement_id = e.id
            WHERE 1=1
        `;
        
        const params = [];

        if (user_type) {
            query += ' AND l.user_type = ?';
            params.push(user_type);
        }

        if (user_id) {
            query += ' AND l.user_id = ?';
            params.push(user_id);
        }

        if (action) {
            query += ' AND l.action LIKE ?';
            params.push(`%${action}%`);
        }

        if (etablissement_id) {
            query += ' AND l.etablissement_id = ?';
            params.push(etablissement_id);
        }

        if (date_debut) {
            query += ' AND l.created_at >= ?';
            params.push(date_debut);
        }

        if (date_fin) {
            query += ' AND l.created_at <= ?';
            params.push(date_fin);
        }

        query += ' ORDER BY l.created_at DESC LIMIT ?';
        params.push(parseInt(limit));

        const [logs] = await connection.execute(query, params);

        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('Erreur récupération logs:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Créer un nouveau log
router.post('/', async (req, res) => {
    try {
        const { user_type, user_id, action, details, etablissement_id, ip_address } = req.body;

        if (!user_type || !user_id || !action) {
            return res.status(400).json({
                success: false,
                message: 'user_type, user_id et action sont requis'
            });
        }

        const connection = getConnection();

        const [result] = await connection.execute(
            `INSERT INTO logs (user_type, user_id, action, details, etablissement_id, ip_address, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [user_type, user_id, action, details || null, etablissement_id || null, ip_address || null]
        );

        res.json({
            success: true,
            message: 'Log créé avec succès',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Erreur création log:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Statistiques des logs
router.get('/stats', async (req, res) => {
    try {
        const connection = getConnection();
        const { etablissement_id, date_debut, date_fin } = req.query;

        let query = `
            SELECT 
                user_type,
                COUNT(*) as total,
                DATE(created_at) as date
            FROM logs
            WHERE 1=1
        `;
        
        const params = [];

        if (etablissement_id) {
            query += ' AND etablissement_id = ?';
            params.push(etablissement_id);
        }

        if (date_debut) {
            query += ' AND created_at >= ?';
            params.push(date_debut);
        }

        if (date_fin) {
            query += ' AND created_at <= ?';
            params.push(date_fin);
        }

        query += ' GROUP BY user_type, DATE(created_at) ORDER BY date DESC';

        const [stats] = await connection.execute(query, params);

        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Erreur stats logs:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Actions les plus fréquentes
router.get('/actions-frequentes', async (req, res) => {
    try {
        const connection = getConnection();
        const { etablissement_id, limit = 10 } = req.query;

        let query = `
            SELECT action, COUNT(*) as count
            FROM logs
            WHERE 1=1
        `;
        
        const params = [];

        if (etablissement_id) {
            query += ' AND etablissement_id = ?';
            params.push(etablissement_id);
        }

        query += ' GROUP BY action ORDER BY count DESC LIMIT ?';
        params.push(parseInt(limit));

        const [actions] = await connection.execute(query, params);

        res.json({ success: true, data: actions });
    } catch (error) {
        console.error('Erreur actions fréquentes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
