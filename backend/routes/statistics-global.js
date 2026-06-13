const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// Statistiques globales avec filtres avancés
router.get('/global', async (req, res) => {
    try {
        const connection = getConnection();
        const { 
            etablissement_id, 
            filiere_id, 
            concours_id,
            periode = 'month' 
        } = req.query;

        // Construire la clause WHERE
        let whereClause = '1=1';
        const params = [];

        if (etablissement_id) {
            whereClause += ' AND c.etablissement_id = ?';
            params.push(etablissement_id);
        }
        if (filiere_id) {
            whereClause += ' AND p.filiere_id = ?';
            params.push(filiere_id);
        }
        if (concours_id) {
            whereClause += ' AND p.concours_id = ?';
            params.push(concours_id);
        }

        // Déterminer la clause de date selon la période
        let dateClause = '';
        switch(periode) {
            case 'day':
                dateClause = "DATE(cand.created_at) = CURDATE()";
                break;
            case 'week':
                dateClause = "YEARWEEK(cand.created_at) = YEARWEEK(NOW())";
                break;
            case 'month':
                dateClause = "MONTH(cand.created_at) = MONTH(NOW()) AND YEAR(cand.created_at) = YEAR(NOW())";
                break;
            case 'year':
                dateClause = "YEAR(cand.created_at) = YEAR(NOW())";
                break;
            default:
                dateClause = '1=1';
        }

        // Total candidats
        const [totalCandidats] = await connection.execute(
            `SELECT COUNT(DISTINCT cand.nupcan) as total
             FROM candidats cand
             JOIN participations p ON cand.nupcan = p.nupcan
             JOIN concours c ON p.concours_id = c.id
             WHERE ${whereClause} AND ${dateClause}`,
            params
        );

        // Total établissements
        const [totalEtablissements] = await connection.execute(
            'SELECT COUNT(*) as total FROM etablissements WHERE statut = "actif"'
        );

        // Concours actifs
        const [concoursActifs] = await connection.execute(
            `SELECT COUNT(*) as total FROM concours 
             WHERE statut = 'actif' AND date_fin >= CURDATE() 
             ${etablissement_id ? 'AND etablissement_id = ?' : ''}`,
            etablissement_id ? [etablissement_id] : []
        );

        // Taux de réussite
        const [reussite] = await connection.execute(
            `SELECT 
                COUNT(CASE WHEN p.statut = 'admis' THEN 1 END) as admis,
                COUNT(*) as total
             FROM participations p
             JOIN candidats cand ON p.nupcan = cand.nupcan
             JOIN concours c ON p.concours_id = c.id
             WHERE ${whereClause} AND ${dateClause}`,
            params
        );

        const tauxReussite = reussite[0].total > 0 
            ? Math.round((reussite[0].admis / reussite[0].total) * 100)
            : 0;

        // Évolution des inscriptions (30 derniers jours)
        const [evolutionInscriptions] = await connection.execute(
            `SELECT DATE(cand.created_at) as date, COUNT(DISTINCT cand.nupcan) as inscriptions
             FROM candidats cand
             JOIN participations p ON cand.nupcan = p.nupcan
             JOIN concours c ON p.concours_id = c.id
             WHERE ${whereClause} AND cand.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
             GROUP BY DATE(cand.created_at)
             ORDER BY date`,
            params
        );

        // Répartition par établissement
        const [repartitionEtablissements] = await connection.execute(
            `SELECT 
                e.nom,
                COUNT(DISTINCT cand.nupcan) as candidats
             FROM etablissements e
             LEFT JOIN concours c ON e.id = c.etablissement_id
             LEFT JOIN participations p ON c.id = p.concours_id
             LEFT JOIN candidats cand ON p.nupcan = cand.nupcan
             WHERE ${dateClause}
             ${etablissement_id ? 'AND e.id = ?' : ''}
             GROUP BY e.id, e.nom
             ORDER BY candidats DESC`,
            etablissement_id ? [etablissement_id] : []
        );

        // Statut des candidatures
        const [statutCandidatures] = await connection.execute(
            `SELECT 
                CASE 
                    WHEN p.statut IS NULL THEN 'En attente'
                    WHEN p.statut = 'admis' THEN 'Admis'
                    WHEN p.statut = 'refuse' THEN 'Refusé'
                    ELSE 'Autre'
                END as name,
                COUNT(*) as value
             FROM participations p
             JOIN candidats cand ON p.nupcan = cand.nupcan
             JOIN concours c ON p.concours_id = c.id
             WHERE ${whereClause} AND ${dateClause}
             GROUP BY name`,
            params
        );

        // Répartition par filière
        const [repartitionFilieres] = await connection.execute(
            `SELECT 
                f.nom,
                COUNT(DISTINCT p.nupcan) as candidats
             FROM filieres f
             LEFT JOIN participations p ON f.id = p.filiere_id
             LEFT JOIN candidats cand ON p.nupcan = cand.nupcan
             LEFT JOIN concours c ON p.concours_id = c.id
             WHERE ${whereClause} AND ${dateClause}
             GROUP BY f.id, f.nom
             ORDER BY candidats DESC
             LIMIT 10`,
            params
        );

        res.json({
            success: true,
            data: {
                total_candidats: totalCandidats[0].total,
                total_etablissements: totalEtablissements[0].total,
                concours_actifs: concoursActifs[0].total,
                taux_reussite: tauxReussite,
                evolution_inscriptions: evolutionInscriptions,
                repartition_etablissements: repartitionEtablissements,
                statut_candidatures: statutCandidatures,
                repartition_filieres: repartitionFilieres
            }
        });

    } catch (error) {
        console.error('Erreur récupération statistiques globales:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            error: error.message
        });
    }
});

module.exports = router;
