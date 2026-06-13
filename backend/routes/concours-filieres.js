const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// GET /api/concours-filieres/concours/:concoursId - Récupérer les filières d'un concours
router.get('/concours/:concoursId', async (req, res) => {
    try {
        const { concoursId } = req.params;
        const connection = getConnection();
        
        const [rows] = await connection.execute(`
            SELECT cf.*, f.nomfil, n.nomniv as niveau_nomniv
            FROM concours_filieres cf
            LEFT JOIN filieres f ON cf.filiere_id = f.id
            LEFT JOIN niveaux n ON f.niveau_id = n.id
            WHERE cf.concours_id = ?
            ORDER BY f.nomfil
        `, [concoursId]);
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Erreur récupération filières du concours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des filières',
            error: error.message
        });
    }
});

// POST /api/concours-filieres/concours/:concoursId/bulk - Ajouter plusieurs filières à un concours
router.post('/concours/:concoursId/bulk', async (req, res) => {
    try {
        const { concoursId } = req.params;
        const { filieres } = req.body;
        
        if (!Array.isArray(filieres) || filieres.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Liste de filières invalide'
            });
        }
        
        const connection = getConnection();
        
        // Supprimer les anciennes associations
        await connection.execute(
            'DELETE FROM concours_filieres WHERE concours_id = ?',
            [concoursId]
        );
        
        // Ajouter les nouvelles associations
        for (const filiere of filieres) {
            await connection.execute(`
                INSERT INTO concours_filieres (concours_id, filiere_id, places_disponibles, created_at, updated_at)
                VALUES (?, ?, ?, NOW(), NOW())
            `, [concoursId, filiere.filiere_id, filiere.places_disponibles || 0]);
        }
        
        res.json({
            success: true,
            message: `${filieres.length} filière(s) associée(s) au concours`
        });
    } catch (error) {
        console.error('Erreur ajout filières au concours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout des filières',
            error: error.message
        });
    }
});

// DELETE /api/concours-filieres/:id - Supprimer une association concours-filière
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = getConnection();
        
        await connection.execute(
            'DELETE FROM concours_filieres WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Association supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression association:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression',
            error: error.message
        });
    }
});

module.exports = router;
