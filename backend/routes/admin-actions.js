const express = require('express');
const router = express.Router();
const AdminAction = require('../models/AdminAction');

// Récupérer toutes les actions avec filtres
router.get('/', async (req, res) => {
    try {
        const filters = {
            admin_id: req.query.admin_id,
            action_type: req.query.action_type,
            candidat_nupcan: req.query.candidat_nupcan,
            date_debut: req.query.date_debut,
            date_fin: req.query.date_fin,
            etablissement_id: req.query.etablissement_id,
            limit: req.query.limit || 100
        };
        
        const actions = await AdminAction.findAll(filters);
        
        res.json({
            success: true,
            data: actions,
            count: actions.length
        });
    } catch (error) {
        console.error('Erreur récupération actions:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Récupérer les statistiques des actions
router.get('/stats', async (req, res) => {
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
            message: error.message
        });
    }
});

// Récupérer l'activité récente
router.get('/recent', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const actions = await AdminAction.getRecentActivity(limit);
        
        res.json({
            success: true,
            data: actions
        });
    } catch (error) {
        console.error('Erreur récupération activité récente:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Récupérer les actions d'un admin spécifique
router.get('/admin/:adminId', async (req, res) => {
    try {
        const actions = await AdminAction.findByAdmin(req.params.adminId);
        
        res.json({
            success: true,
            data: actions
        });
    } catch (error) {
        console.error('Erreur récupération actions admin:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Récupérer les actions pour un candidat
router.get('/candidat/:nupcan', async (req, res) => {
    try {
        const actions = await AdminAction.findByCandidat(req.params.nupcan);
        
        res.json({
            success: true,
            data: actions
        });
    } catch (error) {
        console.error('Erreur récupération actions candidat:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Créer une action manuellement (si nécessaire)
router.post('/', async (req, res) => {
    try {
        const action = await AdminAction.create(req.body);
        
        res.json({
            success: true,
            message: 'Action créée avec succès',
            data: action
        });
    } catch (error) {
        console.error('Erreur création action:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
