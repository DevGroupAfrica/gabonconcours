const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// GET candidatures d'un concours avec filtres
router.get('/concours/:concoursId/candidatures', authenticateAdmin, async (req, res) => {
    const connection = getConnection();
    
    try {
        const { concoursId } = req.params;
        const { filiere, statut } = req.query;
        
        let query = `
            SELECT 
                c.id,
                c.nom,
                c.prenom,
                c.email,
                c.telephone,
                c.statut,
                c.created_at,
                f.nomfil as filiere_nom,
                COUNT(DISTINCT d.id) as documents_total,
                COUNT(DISTINCT CASE WHEN d.statut = 'valide' THEN d.id END) as documents_valides,
                p.statut as paiement_statut
            FROM candidats c
            LEFT JOIN filieres f ON c.filiere_id = f.id
            LEFT JOIN documents d ON d.candidat_id = c.id
            LEFT JOIN paiements p ON p.candidat_id = c.id
            WHERE c.concours_id = ?
        `;
        
        const params = [concoursId];
        
        if (filiere && filiere !== 'all') {
            query += ' AND f.nomfil = ?';
            params.push(filiere);
        }
        
        if (statut && statut !== 'all') {
            query += ' AND c.statut = ?';
            params.push(statut);
        }
        
        query += ' GROUP BY c.id, c.nom, c.prenom, c.email, c.telephone, c.statut, c.created_at, f.nomfil, p.statut';
        query += ' ORDER BY c.created_at DESC';
        
        const [candidatures] = await connection.execute(query, params);
        
        res.json({
            success: true,
            data: candidatures
        });
        
    } catch (error) {
        console.error('Erreur récupération candidatures concours:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
