const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Récupérer toutes les matières
router.get('/', async (req, res) => {
    try {
        const connection = getConnection();
        
        const [matieres] = await connection.execute(
            'SELECT * FROM matieres ORDER BY nom_matiere'
        );
        
        res.json({
            success: true,
            data: matieres
        });
    } catch (error) {
        console.error('Erreur récupération matières:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Créer une matière
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { nom_matiere, coefficient, duree, description } = req.body;
        
        if (!nom_matiere) {
            return res.status(400).json({
                success: false,
                message: 'Nom de la matière requis'
            });
        }
        
        const connection = getConnection();
        
        const [result] = await connection.execute(
            `INSERT INTO matieres (nom_matiere, coefficient, duree, description)
             VALUES (?, ?, ?, ?)`,
            [nom_matiere, coefficient || 1, duree || 2, description || '']
        );
        
        res.json({
            success: true,
            message: 'Matière créée avec succès',
            data: {
                id: result.insertId,
                nom_matiere,
                coefficient: coefficient || 1,
                duree: duree || 2,
                description: description || ''
            }
        });
    } catch (error) {
        console.error('Erreur création matière:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Mettre à jour une matière
router.put('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { nom_matiere, coefficient, duree, description } = req.body;
        
        const connection = getConnection();
        
        await connection.execute(
            `UPDATE matieres 
             SET nom_matiere = ?, coefficient = ?, duree = ?, description = ?
             WHERE id = ?`,
            [nom_matiere, coefficient, duree, description, id]
        );
        
        res.json({
            success: true,
            message: 'Matière mise à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur mise à jour matière:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Supprimer une matière
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const connection = getConnection();
        
        await connection.execute('DELETE FROM matieres WHERE id = ?', [id]);
        
        res.json({
            success: true,
            message: 'Matière supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression matière:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
