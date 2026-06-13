const express = require('express');
const router = express.Router();
const Participation = require('../models/Participation');

// GET /api/participations/:id - Récupérer une participation par ID
router.get('/:id', async (req, res) => {
    try {
        const participation = await Participation.findById(req.params.id);
        if (!participation) {
            return res.status(404).json({
                success: false,
                message: 'Participation non trouvée'
            });
        }
        res.json({data: participation});
    } catch (error) {
        console.error('Erreur lors de la récupération de la participation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/participations/numero/:numero - Récupérer une participation par numéro
router.get('/nupcan/:nupcan', async (req, res) => {
    try {
        const participation = await Participation.findByNupcan(req.params.nupcan);
        if (!participation) {
            return res.status(404).json({
                success: false,
                message: 'Participation non trouvée avec ce numéro'
            });
        }
        res.json({data: participation});
    } catch (error) {
        console.error('Erreur lors de la recherche par numéro:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// POST /api/participations - Créer une nouvelle participation
router.post('/', async (req, res) => {
    try {
        const participation = await Participation.create(req.body);
        res.status(201).json({
            success: true,
            data: participation,
            message: 'Participation créée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la création de la participation:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

module.exports = router;
