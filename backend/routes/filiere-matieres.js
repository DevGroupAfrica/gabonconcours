const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// GET /api/filiere-matieres/filiere/:filiereId - Récupérer les matières d'une filière
router.get('/filiere/:filiereId', async (req, res) => {
    try {
        const { filiereId } = req.params;
        const connection = getConnection();
        
        const [rows] = await connection.execute(`
            SELECT fm.*, m.nom_matiere, m.description
            FROM filiere_matieres fm
            LEFT JOIN matieres m ON fm.matiere_id = m.id
            WHERE fm.filiere_id = ?
            ORDER BY m.nom_matiere
        `, [filiereId]);
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Erreur récupération matières de la filière:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des matières',
            error: error.message
        });
    }
});

// POST /api/filiere-matieres/filiere/:filiereId/bulk - Ajouter plusieurs matières à une filière
router.post('/filiere/:filiereId/bulk', async (req, res) => {
    try {
        const { filiereId } = req.params;
        const { matieres } = req.body;
        
        if (!Array.isArray(matieres) || matieres.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Liste de matières invalide'
            });
        }
        
        const connection = getConnection();
        
        // Supprimer les anciennes associations
        await connection.execute(
            'DELETE FROM filiere_matieres WHERE filiere_id = ?',
            [filiereId]
        );
        
        // Ajouter les nouvelles associations
        for (const matiere of matieres) {
            await connection.execute(`
                INSERT INTO filiere_matieres (filiere_id, matiere_id, coefficient, obligatoire, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
            `, [
                filiereId, 
                matiere.matiere_id, 
                matiere.coefficient || 1.0, 
                matiere.obligatoire ? 1 : 0
            ]);
        }
        
        res.json({
            success: true,
            message: `${matieres.length} matière(s) associée(s) à la filière`
        });
    } catch (error) {
        console.error('Erreur ajout matières à la filière:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout des matières',
            error: error.message
        });
    }
});

// DELETE /api/filiere-matieres/:id - Supprimer une association filière-matière
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = getConnection();
        
        await connection.execute(
            'DELETE FROM filiere_matieres WHERE id = ?',
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
