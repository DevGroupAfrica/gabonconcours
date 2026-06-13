const express = require('express');
const router = express.Router();
const Province = require('../models/Province');

// GET /api/provinces - Récupérer toutes les provinces
router.get('/', async (req, res) => {
    try {
        const provinces = await Province.findAll();
        res.json({data: provinces});
    } catch (error) {
        console.error('Erreur lors de la récupération des provinces:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/provinces/:id - Récupérer une province par ID
router.get('/:id', async (req, res) => {
    try {
        const province = await Province.findById(req.params.id);
        if (!province) {
            return res.status(404).json({
                success: false,
                message: 'Province non trouvée'
            });
        }
        res.json({data: province});
    } catch (error) {
        console.error('Erreur lors de la récupération de la province:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

module.exports = router;
