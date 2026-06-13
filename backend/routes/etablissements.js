const express = require('express');
const router = express.Router();
const Etablissement = require('../models/Etablissement');

// GET /api/etablissements - Récupérer tous les établissements
router.get('/', async (req, res) => {
    try {
        const etablissements = await Etablissement.findAll();
        res.json({data: etablissements});
    } catch (error) {
        console.error('Erreur lors de la récupération des établissements:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/etablissements/:id - Récupérer un établissement par ID
router.get('/:id', async (req, res) => {
    try {
        const etablissement = await Etablissement.findById(req.params.id);
        if (!etablissement) {
            return res.status(404).json({
                success: false,
                message: 'Établissement non trouvé'
            });
        }
        res.json({data: etablissement});
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'établissement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// POST /api/etablissements - Créer un nouvel établissement
router.post('/', async (req, res) => {
    try {
        const etablissement = await Etablissement.create(req.body);
        res.status(201).json({
            success: true,
            data: etablissement,
            message: 'Établissement créé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la création de l\'établissement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// PUT /api/etablissements/:id - Mettre à jour un établissement
router.put('/:id', async (req, res) => {
    try {
        const etablissement = await Etablissement.update(req.params.id, req.body);
        if (!etablissement) {
            return res.status(404).json({
                success: false,
                message: 'Établissement non trouvé'
            });
        }
        res.json({
            success: true,
            data: etablissement,
            message: 'Établissement mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'établissement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// DELETE /api/etablissements/:id - Supprimer un établissement
router.delete('/:id', async (req, res) => {
    try {
        const deleted = await Etablissement.delete(req.params.id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Établissement non trouvé'
            });
        }
        res.json({
            success: true,
            message: 'Établissement supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'établissement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

module.exports = router;
