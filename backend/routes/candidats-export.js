const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Export candidatures avec filtres
router.get('/export', authenticateAdmin, async (req, res) => {
    try {
        const { etablissement_id, concours_id, filiere_id } = req.query;
        const connection = getConnection();

        let query = `
            SELECT 
                c.*,
                con.libcnc,
                f.nomfil,
                e.nomets,
                p.statut as paiement_statut,
                COUNT(DISTINCT d.id) as documents_count,
                SUM(CASE WHEN d.statut = 'valide' THEN 1 ELSE 0 END) as documents_valides,
                AVG(n.note) as moyenne
            FROM candidats c
            LEFT JOIN concours con ON c.concours_id = con.id
            LEFT JOIN filieres f ON c.filiere_id = f.id
            LEFT JOIN etablissements e ON con.etablissement_id = e.id
            LEFT JOIN paiements p ON c.nupcan = p.nipcan
            LEFT JOIN dossiers dos ON c.nupcan = dos.nupcan
            LEFT JOIN documents d ON dos.document_id = d.id
            LEFT JOIN notes n ON c.id = n.candidat_id
            WHERE 1=1
        `;

        const params = [];

        if (etablissement_id) {
            query += ' AND con.etablissement_id = ?';
            params.push(etablissement_id);
        }

        if (concours_id) {
            query += ' AND c.concours_id = ?';
            params.push(concours_id);
        }

        if (filiere_id) {
            query += ' AND c.filiere_id = ?';
            params.push(filiere_id);
        }

        query += ' GROUP BY c.id ORDER BY c.created_at DESC';

        const [candidatures] = await connection.execute(query, params);

        res.json({
            success: true,
            data: candidatures
        });
    } catch (error) {
        console.error('Erreur export candidatures:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;