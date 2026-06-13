const express = require('express');
const router = express.Router();
const ConcoursFiliere = require('../models/ConcoursFiliere');
const { getConnection } = require('../config/database');

/**
 * Récupérer toutes les filières d'un concours
 * GET /api/concours-filieres/concours/:concoursId
 */
router.get('/concours/:concoursId', async (req, res) => {
    try {
        const { concoursId } = req.params;
        const filieres = await ConcoursFiliere.findByConcoursId(concoursId);

        res.json({
            success: true,
            data: filieres,
            concours_id: concoursId
        });
    } catch (error) {
        console.error('Erreur récupération filières:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des filières'
        });
    }
});

/**
 * Récupérer tous les concours d'une filière
 * GET /api/concours-filieres/filiere/:filiereId
 */
router.get('/filiere/:filiereId', async (req, res) => {
    try {
        const { filiereId } = req.params;
        const concours = await ConcoursFiliere.findByFiliereId(filiereId);

        res.json({
            success: true,
            data: concours,
            filiere_id: filiereId
        });
    } catch (error) {
        console.error('Erreur récupération concours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des concours'
        });
    }
});

/**
 * Créer une liaison concours-filière
 * POST /api/concours-filieres
 */
router.post('/', async (req, res) => {
    try {
        const { concours_id, filiere_id, places_disponibles } = req.body;

        if (!concours_id || !filiere_id) {
            return res.status(400).json({
                success: false,
                message: 'concours_id et filiere_id requis'
            });
        }

        const result = await ConcoursFiliere.create({
            concours_id,
            filiere_id,
            places_disponibles: places_disponibles || 0
        });

        res.json({
            success: true,
            message: 'Liaison créée avec succès',
            data: result
        });
    } catch (error) {
        console.error('Erreur création liaison:', error);
        res.status(error.message.includes('existe déjà') ? 409 : 500).json({
            success: false,
            message: error.message || 'Erreur lors de la création de la liaison'
        });
    }
});

/**
 * Mettre à jour une liaison
 * PUT /api/concours-filieres/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { places_disponibles } = req.body;

        const result = await ConcoursFiliere.update(id, { places_disponibles });

        res.json({
            success: true,
            message: 'Liaison mise à jour avec succès',
            data: result
        });
    } catch (error) {
        console.error('Erreur mise à jour liaison:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la liaison'
        });
    }
});

/**
 * Supprimer une liaison
 * DELETE /api/concours-filieres/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await ConcoursFiliere.delete(id);

        res.json({
            success: true,
            message: 'Liaison supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression liaison:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression de la liaison'
        });
    }
});

/**
 * Récupérer les statistiques d'une liaison
 * GET /api/concours-filieres/stats/:concoursId/:filiereId
 */
router.get('/stats/:concoursId/:filiereId', async (req, res) => {
    try {
        const { concoursId, filiereId } = req.params;
        const stats = await ConcoursFiliere.getStats(concoursId, filiereId);

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
 * Assigner plusieurs filières à un concours en une seule fois
 * POST /api/concours-filieres/bulk
 */
router.post('/bulk', async (req, res) => {
    try {
        const { concours_id, filieres } = req.body;

        if (!concours_id || !Array.isArray(filieres) || filieres.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'concours_id et filieres (array) requis'
            });
        }

        const results = [];
        const errors = [];

        for (const filiere of filieres) {
            try {
                const result = await ConcoursFiliere.create({
                    concours_id,
                    filiere_id: filiere.filiere_id,
                    places_disponibles: filiere.places_disponibles || 0
                });
                results.push(result);
            } catch (error) {
                errors.push({
                    filiere_id: filiere.filiere_id,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: `${results.length} liaison(s) créée(s)`,
            data: {
                created: results,
                errors: errors
            }
        });
    } catch (error) {
        console.error('Erreur création bulk:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création des liaisons'
        });
    }
});

module.exports = router;
