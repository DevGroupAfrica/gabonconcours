const express = require('express');
const router = express.Router();
const FiliereMatiere = require('../models/FiliereMatiere');

/**
 * Récupérer toutes les matières d'une filière
 * GET /api/filiere-matieres/filiere/:filiereId
 */
router.get('/filiere/:filiereId', async (req, res) => {
    try {
        const { filiereId } = req.params;
        const matieres = await FiliereMatiere.findByFiliereId(filiereId);

        res.json({
            success: true,
            data: matieres,
            filiere_id: filiereId
        });
    } catch (error) {
        console.error('Erreur récupération matières:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des matières'
        });
    }
});

/**
 * Récupérer toutes les filières utilisant une matière
 * GET /api/filiere-matieres/matiere/:matiereId
 */
router.get('/matiere/:matiereId', async (req, res) => {
    try {
        const { matiereId } = req.params;
        const filieres = await FiliereMatiere.findByMatiereId(matiereId);

        res.json({
            success: true,
            data: filieres,
            matiere_id: matiereId
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
 * Créer une liaison filière-matière
 * POST /api/filiere-matieres
 */
router.post('/', async (req, res) => {
    try {
        const { filiere_id, matiere_id, coefficient, obligatoire } = req.body;

        if (!filiere_id || !matiere_id) {
            return res.status(400).json({
                success: false,
                message: 'filiere_id et matiere_id requis'
            });
        }

        const result = await FiliereMatiere.create({
            filiere_id,
            matiere_id,
            coefficient: coefficient || 1.0,
            obligatoire: obligatoire !== undefined ? obligatoire : 1
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
 * PUT /api/filiere-matieres/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { coefficient, obligatoire } = req.body;

        const result = await FiliereMatiere.update(id, {
            coefficient,
            obligatoire
        });

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
 * DELETE /api/filiere-matieres/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await FiliereMatiere.delete(id);

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
 * Récupérer le total des coefficients d'une filière
 * GET /api/filiere-matieres/coefficients/:filiereId
 */
router.get('/coefficients/:filiereId', async (req, res) => {
    try {
        const { filiereId } = req.params;
        const stats = await FiliereMatiere.getTotalCoefficients(filiereId);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Erreur récupération coefficients:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des coefficients'
        });
    }
});

/**
 * Assigner plusieurs matières à une filière
 * POST /api/filiere-matieres/bulk
 */
router.post('/bulk', async (req, res) => {
    try {
        const { filiere_id, matieres } = req.body;

        if (!filiere_id || !Array.isArray(matieres) || matieres.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'filiere_id et matieres (array) requis'
            });
        }

        const result = await FiliereMatiere.assignMultiple(filiere_id, matieres);

        res.json({
            success: true,
            message: 'Matières assignées avec succès',
            data: result
        });
    } catch (error) {
        console.error('Erreur assignation bulk:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'assignation des matières'
        });
    }
});

module.exports = router;
