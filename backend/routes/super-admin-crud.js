const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const Concours = require('../models/Concours');
const Etablissement = require('../models/Etablissement');
const Filiere = require('../models/Filiere');
const Matiere = require('../models/Matiere');
const { authenticateAdmin } = require('../middleware/auth');

// ==================== CONCOURS CRUD ====================

// GET tous les concours
router.get('/concours', authenticateAdmin, async (req, res) => {
    try {
        const concours = await Concours.findAll();
        res.json({ success: true, data: concours });
    } catch (error) {
        console.error('Erreur récupération concours:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST créer un concours
router.post('/concours', authenticateAdmin, async (req, res) => {
    try {
        const concours = await Concours.create(req.body);
        res.status(201).json({ success: true, data: concours, message: 'Concours créé avec succès' });
    } catch (error) {
        console.error('Erreur création concours:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT mettre à jour un concours
router.put('/concours/:id', authenticateAdmin, async (req, res) => {
    try {
        const concours = await Concours.update(req.params.id, req.body);
        res.json({ success: true, data: concours, message: 'Concours mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur mise à jour concours:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE supprimer un concours
router.delete('/concours/:id', authenticateAdmin, async (req, res) => {
    try {
        await Concours.delete(req.params.id);
        res.json({ success: true, message: 'Concours supprimé avec succès' });
    } catch (error) {
        console.error('Erreur suppression concours:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== ÉTABLISSEMENTS CRUD ====================

// GET tous les établissements
router.get('/etablissements', authenticateAdmin, async (req, res) => {
    try {
        const etablissements = await Etablissement.findAll();
        res.json({ success: true, data: etablissements });
    } catch (error) {
        console.error('Erreur récupération établissements:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST créer un établissement
router.post('/etablissements', authenticateAdmin, async (req, res) => {
    try {
        const etablissement = await Etablissement.create(req.body);
        res.status(201).json({ success: true, data: etablissement, message: 'Établissement créé avec succès' });
    } catch (error) {
        console.error('Erreur création établissement:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT mettre à jour un établissement
router.put('/etablissements/:id', authenticateAdmin, async (req, res) => {
    try {
        const etablissement = await Etablissement.update(req.params.id, req.body);
        res.json({ success: true, data: etablissement, message: 'Établissement mis à jour avec succès' });
    } catch (error) {
        console.error('Erreur mise à jour établissement:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE supprimer un établissement
router.delete('/etablissements/:id', authenticateAdmin, async (req, res) => {
    try {
        await Etablissement.delete(req.params.id);
        res.json({ success: true, message: 'Établissement supprimé avec succès' });
    } catch (error) {
        console.error('Erreur suppression établissement:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== FILIÈRES CRUD ====================

// GET toutes les filières
router.get('/filieres', authenticateAdmin, async (req, res) => {
    try {
        const filieres = await Filiere.findAll();
        res.json({ success: true, data: filieres });
    } catch (error) {
        console.error('Erreur récupération filières:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST créer une filière
router.post('/filieres', authenticateAdmin, async (req, res) => {
    try {
        const filiere = await Filiere.create(req.body);
        res.status(201).json({ success: true, data: filiere, message: 'Filière créée avec succès' });
    } catch (error) {
        console.error('Erreur création filière:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT mettre à jour une filière
router.put('/filieres/:id', authenticateAdmin, async (req, res) => {
    try {
        const filiere = await Filiere.update(req.params.id, req.body);
        res.json({ success: true, data: filiere, message: 'Filière mise à jour avec succès' });
    } catch (error) {
        console.error('Erreur mise à jour filière:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE supprimer une filière
router.delete('/filieres/:id', authenticateAdmin, async (req, res) => {
    try {
        await Filiere.delete(req.params.id);
        res.json({ success: true, message: 'Filière supprimée avec succès' });
    } catch (error) {
        console.error('Erreur suppression filière:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ==================== MATIÈRES CRUD ====================

// GET toutes les matières
router.get('/matieres', authenticateAdmin, async (req, res) => {
    try {
        const matieres = await Matiere.findAll();
        res.json({ success: true, data: matieres });
    } catch (error) {
        console.error('Erreur récupération matières:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST créer une matière
router.post('/matieres', authenticateAdmin, async (req, res) => {
    try {
        const matiere = await Matiere.create(req.body);
        res.status(201).json({ success: true, data: matiere, message: 'Matière créée avec succès' });
    } catch (error) {
        console.error('Erreur création matière:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT mettre à jour une matière
router.put('/matieres/:id', authenticateAdmin, async (req, res) => {
    try {
        const matiere = await Matiere.update(req.params.id, req.body);
        res.json({ success: true, data: matiere, message: 'Matière mise à jour avec succès' });
    } catch (error) {
        console.error('Erreur mise à jour matière:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE supprimer une matière
router.delete('/matieres/:id', authenticateAdmin, async (req, res) => {
    try {
        await Matiere.delete(req.params.id);
        res.json({ success: true, message: 'Matière supprimée avec succès' });
    } catch (error) {
        console.error('Erreur suppression matière:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
