const express = require('express');
const router = express.Router();
const Filiere = require('../models/Filiere');

// GET /api/filieres - Récupérer toutes les filières
router.get('/', async (req, res) => {
    try {
        const filieres = await Filiere.findAll();
        res.json({data: filieres});
    } catch (error) {
        console.error('Erreur lors de la récupération des filières:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/filieres/:id - Récupérer une filière par ID
router.get('/:id', async (req, res) => {
    try {
        const filiere = await Filiere.findById(req.params.id);
        if (!filiere) {
            return res.status(404).json({
                success: false,
                message: 'Filière non trouvée'
            });
        }
        res.json({data: filiere});
    } catch (error) {
        console.error('Erreur lors de la récupération de la filière:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/filieres/:id/matieres - Récupérer une filière avec ses matières
router.get('/:id/matieres', async (req, res) => {
    try {
        const filiere = await Filiere.findWithMatieres(req.params.id);
        if (!filiere) {
            return res.status(404).json({
                success: false,
                message: 'Filière non trouvée'
            });
        }
        res.json({data: filiere});
    } catch (error) {
        console.error('Erreur lors de la récupération de la filière avec matières:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// POST /api/filieres - Créer une nouvelle filière
router.post('/', async (req, res) => {
    try {
        const filiere = await Filiere.create(req.body);
        res.status(201).json({
            success: true,
            data: filiere,
            message: 'Filière créée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la création de la filière:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// PUT /api/filieres/:id - Mettre à jour une filière
router.put('/:id', async (req, res) => {
    try {
        const filiere = await Filiere.update(req.params.id, req.body);
        res.json({
            success: true,
            data: filiere,
            message: 'Filière mise à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la filière:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// DELETE /api/filieres/:id - Supprimer une filière
router.delete('/:id', async (req, res) => {
    try {
        const filiere = await Filiere.findById(req.params.id);
        if (!filiere) {
            return res.status(404).json({
                success: false,
                message: 'Filière non trouvée'
            });
        }

        await Filiere.delete(req.params.id);
        res.json({
            success: true,
            message: 'Filière supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de la filière:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

module.exports = router;
