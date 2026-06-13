const express = require('express');
const router = express.Router();
const AdminAction = require('../models/AdminAction');
const { getConnection } = require('../config/database');

/**
 * Récupérer toutes les actions des admins avec filtres
 * GET /api/super-admin/actions?etablissement_id=...&admin_id=...&action_type=...&date_debut=...&date_fin=...
 */
router.get('/actions', async (req, res) => {
    try {
        const filters = {
            etablissement_id: req.query.etablissement_id,
            admin_id: req.query.admin_id,
            action_type: req.query.action_type,
            candidat_nupcan: req.query.candidat_nupcan,
            date_debut: req.query.date_debut,
            date_fin: req.query.date_fin,
            limit: req.query.limit || 100
        };

        const actions = await AdminAction.findAll(filters);

        res.json({
            success: true,
            data: actions,
            total: actions.length
        });
    } catch (error) {
        console.error('Erreur récupération actions:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des actions',
            error: error.message
        });
    }
});

/**
 * Récupérer les statistiques des actions
 * GET /api/super-admin/actions/stats
 */
router.get('/actions/stats', async (req, res) => {
    try {
        const filters = {
            admin_id: req.query.admin_id,
            date_debut: req.query.date_debut,
            date_fin: req.query.date_fin
        };

        const stats = await AdminAction.getStats(filters);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Erreur récupération stats:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
});

/**
 * Récupérer l'activité récente
 * GET /api/super-admin/actions/recent
 */
router.get('/actions/recent', async (req, res) => {
    try {
        const limit = req.query.limit || 50;
        const actions = await AdminAction.getRecentActivity(limit);

        res.json({
            success: true,
            data: actions
        });
    } catch (error) {
        console.error('Erreur récupération activité récente:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de l\'activité récente'
        });
    }
});

/**
 * Récupérer les actions d'un admin spécifique
 * GET /api/super-admin/actions/admin/:adminId
 */
router.get('/actions/admin/:adminId', async (req, res) => {
    try {
        const { adminId } = req.params;
        const limit = req.query.limit || 100;

        const actions = await AdminAction.findByAdmin(adminId, limit);

        res.json({
            success: true,
            data: actions,
            admin_id: adminId
        });
    } catch (error) {
        console.error('Erreur récupération actions admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des actions'
        });
    }
});

/**
 * Récupérer les actions concernant un candidat
 * GET /api/super-admin/actions/candidat/:nupcan
 */
router.get('/actions/candidat/:nupcan', async (req, res) => {
    try {
        const { nupcan } = req.params;

        const actions = await AdminAction.findByCandidat(nupcan);

        res.json({
            success: true,
            data: actions,
            nupcan: nupcan
        });
    } catch (error) {
        console.error('Erreur récupération actions candidat:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des actions'
        });
    }
});

/**
 * Récupérer un résumé des actions par type
 * GET /api/super-admin/actions/summary
 */
router.get('/actions/summary', async (req, res) => {
    try {
        const connection = getConnection();

        const [summary] = await connection.execute(`
            SELECT 
                action_type,
                COUNT(*) as count,
                COUNT(DISTINCT admin_id) as admins_count,
                COUNT(DISTINCT candidat_nupcan) as candidats_count,
                DATE(created_at) as date
            FROM admin_actions
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY action_type, DATE(created_at)
            ORDER BY created_at DESC, action_type
        `);

        res.json({
            success: true,
            data: summary
        });
    } catch (error) {
        console.error('Erreur récupération résumé:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du résumé'
        });
    }
});

/**
 * Récupérer les admins les plus actifs
 * GET /api/super-admin/actions/top-admins
 */
router.get('/actions/top-admins', async (req, res) => {
    try {
        const connection = getConnection();
        const limit = req.query.limit || 10;

        const [topAdmins] = await connection.execute(`
            SELECT 
                a.id,
                a.nom,
                a.prenom,
                a.email,
                a.role,
                COUNT(aa.id) as total_actions,
                COUNT(DISTINCT aa.candidat_nupcan) as candidats_traites,
                MAX(aa.created_at) as derniere_action
            FROM administrateurs a
            LEFT JOIN admin_actions aa ON a.id = aa.admin_id
            GROUP BY a.id, a.nom, a.prenom, a.email, a.role
            ORDER BY total_actions DESC
            LIMIT ?
        `, [parseInt(limit)]);

        res.json({
            success: true,
            data: topAdmins
        });
    } catch (error) {
        console.error('Erreur récupération top admins:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des admins les plus actifs'
        });
    }
});

/**
 * Exporter les actions en CSV
 * GET /api/super-admin/actions/export
 */
router.get('/actions/export', async (req, res) => {
    try {
        const filters = {
            etablissement_id: req.query.etablissement_id,
            admin_id: req.query.admin_id,
            action_type: req.query.action_type,
            date_debut: req.query.date_debut,
            date_fin: req.query.date_fin
        };

        const actions = await AdminAction.findAll(filters);

        // Créer le CSV
        const csvLines = [
            'ID,Admin,Action,Entité,Candidat,Description,Date'
        ];

        actions.forEach(action => {
            const line = [
                action.id,
                `${action.admin_prenom || ''} ${action.admin_nom || ''}`.trim(),
                action.action_type,
                action.entity_type || '',
                action.candidat_nupcan || '',
                `"${action.description.replace(/"/g, '""')}"`,
                action.created_at
            ].join(',');
            csvLines.push(line);
        });

        const csv = csvLines.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=actions_admin.csv');
        res.send(csv);

    } catch (error) {
        console.error('Erreur export actions:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'export des actions'
        });
    }
});

module.exports = router;
