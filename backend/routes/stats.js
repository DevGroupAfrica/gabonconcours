const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// Statistiques globales
router.get('/global', async (req, res) => {
    try {
        const connection = getConnection();
        
        // Total candidatures
        const [totalCandidats] = await connection.execute(
            'SELECT COUNT(*) as total FROM candidats'
        );
        
        // Total paiements
        const [paiements] = await connection.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN statut = 'valide' THEN montant ELSE 0 END) as montant_total,
                SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as valides,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente
            FROM paiements
        `);
        
        // Total documents
        const [documents] = await connection.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as valides,
                SUM(CASE WHEN statut = 'rejete' THEN 1 ELSE 0 END) as rejetes,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente
            FROM documents
        `);
        
        // Candidatures par concours
        const [parConcours] = await connection.execute(`
            SELECT 
                con.libcnc,
                con.id,
                COUNT(c.id) as nombre_candidats
            FROM concours con
            LEFT JOIN candidats c ON con.id = c.concours_id
            GROUP BY con.id, con.libcnc
            ORDER BY nombre_candidats DESC
        `);
        
        // Candidatures par filière
        const [parFiliere] = await connection.execute(`
            SELECT 
                f.nomfil,
                f.id,
                COUNT(c.id) as nombre_candidats
            FROM filieres f
            LEFT JOIN candidats c ON f.id = c.filiere_id
            GROUP BY f.id, f.nomfil
            ORDER BY nombre_candidats DESC
        `);
        
        // Candidatures par établissement
        const [parEtablissement] = await connection.execute(`
            SELECT 
                e.nomets,
                e.id,
                COUNT(DISTINCT c.id) as nombre_candidats
            FROM etablissements e
            LEFT JOIN concours con ON e.id = con.etablissement_id
            LEFT JOIN candidats c ON con.id = c.concours_id
            GROUP BY e.id, e.nomets
            ORDER BY nombre_candidats DESC
        `);
        
        // Évolution des candidatures (30 derniers jours)
        const [evolution] = await connection.execute(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as nombre
            FROM candidats
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `);
        
        res.json({
            success: true,
            data: {
                totaux: {
                    candidats: totalCandidats[0].total,
                    paiements: paiements[0].total,
                    paiements_valides: paiements[0].valides,
                    paiements_en_attente: paiements[0].en_attente,
                    montant_total: parseFloat(paiements[0].montant_total || 0),
                    documents: documents[0].total,
                    documents_valides: documents[0].valides,
                    documents_rejetes: documents[0].rejetes,
                    documents_en_attente: documents[0].en_attente
                },
                repartition: {
                    par_concours: parConcours,
                    par_filiere: parFiliere,
                    par_etablissement: parEtablissement
                },
                evolution: evolution
            }
        });
    } catch (error) {
        console.error('Erreur stats globales:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Statistiques par concours
router.get('/concours/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = getConnection();
        
        const [candidats] = await connection.execute(
            'SELECT COUNT(*) as total FROM candidats WHERE concours_id = ?',
            [id]
        );
        
        const [documents] = await connection.execute(`
            SELECT 
                COUNT(d.id) as total,
                SUM(CASE WHEN d.statut = 'valide' THEN 1 ELSE 0 END) as valides,
                SUM(CASE WHEN d.statut = 'rejete' THEN 1 ELSE 0 END) as rejetes
            FROM documents d
            JOIN dossiers dos ON d.id = dos.document_id
            JOIN candidats c ON dos.candidat_id = c.id
            WHERE c.concours_id = ?
        `, [id]);
        
        const [paiements] = await connection.execute(`
            SELECT 
                COUNT(p.id) as total,
                SUM(CASE WHEN p.statut = 'valide' THEN 1 ELSE 0 END) as valides,
                SUM(CASE WHEN p.statut = 'valide' THEN p.montant ELSE 0 END) as montant_total
            FROM paiements p
            JOIN candidats c ON p.nupcan = c.nupcan
            WHERE c.concours_id = ?
        `, [id]);
        
        res.json({
            success: true,
            data: {
                candidats: candidats[0].total,
                documents: documents[0],
                paiements: {
                    ...paiements[0],
                    montant_total: parseFloat(paiements[0].montant_total || 0)
                }
            }
        });
    } catch (error) {
        console.error('Erreur stats concours:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Statistiques par établissement
router.get('/etablissement/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = getConnection();
        
        const [stats] = await connection.execute(`
            SELECT 
                COUNT(DISTINCT c.id) as total_candidats,
                COUNT(DISTINCT con.id) as total_concours,
                SUM(CASE WHEN p.statut = 'valide' THEN 1 ELSE 0 END) as paiements_valides,
                SUM(CASE WHEN p.statut = 'valide' THEN p.montant ELSE 0 END) as montant_total
            FROM etablissements e
            LEFT JOIN concours con ON e.id = con.etablissement_id
            LEFT JOIN candidats c ON con.id = c.concours_id
            LEFT JOIN paiements p ON c.nupcan = p.nupcan
            WHERE e.id = ?
            GROUP BY e.id
        `, [id]);
        
        const [concours] = await connection.execute(`
            SELECT 
                con.libcnc,
                con.id,
                COUNT(c.id) as nombre_candidats
            FROM concours con
            LEFT JOIN candidats c ON con.id = c.concours_id
            WHERE con.etablissement_id = ?
            GROUP BY con.id, con.libcnc
        `, [id]);
        
        res.json({
            success: true,
            data: {
                ...stats[0],
                montant_total: parseFloat(stats[0]?.montant_total || 0),
                concours
            }
        });
    } catch (error) {
        console.error('Erreur stats établissement:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
