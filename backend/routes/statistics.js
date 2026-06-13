const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// ===============================
// 📊 ROUTE: /api/statistics (default route)
// ===============================
router.get('/', async (req, res) => {
    try {
        const connection = getConnection();

        // Total candidatures
        const [totalCandidats] = await connection.execute(`
            SELECT COUNT(*) AS total FROM candidats
        `);

        // Total concours
        const [totalConcours] = await connection.execute(`
            SELECT COUNT(*) AS total FROM concours
        `);

        // Total établissements
        const [totalEtablissements] = await connection.execute(`
            SELECT COUNT(*) AS total FROM etablissements
        `);

        // Paiements (global + somme)
        const [paiements] = await connection.execute(`
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN statut = 'valide' THEN montant ELSE 0 END) AS montant_total,
                SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) AS valides,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) AS en_attente
            FROM paiements
        `);

        // Documents
        const [documents] = await connection.execute(`
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) AS valides,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) AS en_attente,
                SUM(CASE WHEN statut = 'rejete' THEN 1 ELSE 0 END) AS rejetes
            FROM documents
        `);

        // Candidats statistiques
        const [candidatsStats] = await connection.execute(`
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) AS en_attente,
                SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) AS valides
            FROM candidats
        `);

        res.json({
            success: true,
            data: {
                totalCandidats: totalCandidats[0].total,
                totalConcours: totalConcours[0].total,
                totalEtablissements: totalEtablissements[0].total,
                paiements: {
                    total: paiements[0].total,
                    montant_total: paiements[0].montant_total || 0,
                    valides: paiements[0].valides || 0,
                    en_attente: paiements[0].en_attente || 0
                },
                documents: {
                    total: documents[0].total,
                    valides: documents[0].valides || 0,
                    en_attente: documents[0].en_attente || 0,
                    rejetes: documents[0].rejetes || 0
                },
                candidats: {
                    total: candidatsStats[0].total,
                    en_attente: candidatsStats[0].en_attente || 0,
                    valides: candidatsStats[0].valides || 0
                }
            }
        });
    } catch (error) {
        console.error('Erreur récupération statistiques:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors du chargement des statistiques',
            errors: [error.message]
        });
    }
});

// ===============================
// 📊 ROUTE: /api/statistics/global
// ===============================
router.get('/global', async (req, res) => {
    try {
        const connection = getConnection();

        // Total candidatures
        const [totalCandidats] = await connection.execute(`
            SELECT COUNT(*) AS total FROM candidats
        `);

        // Total concours
        const [totalConcours] = await connection.execute(`
            SELECT COUNT(*) AS total FROM concours
        `);

        // Total établissements
        const [totalEtablissements] = await connection.execute(`
            SELECT COUNT(*) AS total FROM etablissements
        `);

        // Paiements (global + somme)
        const [paiements] = await connection.execute(`
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN statut = 'valide' THEN montant ELSE 0 END) AS montant_total,
                SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) AS valides,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) AS en_attente
            FROM paiements
        `);

        // Documents
        const [documents] = await connection.execute(`
            SELECT COUNT(*) AS total FROM documents
        `);

        res.json({
            success: true,
            data: {
                totalCandidats: totalCandidats[0].total,
                totalConcours: totalConcours[0].total,
                totalEtablissements: totalEtablissements[0].total,
                totalPaiements: paiements[0].total,
                montantTotal: paiements[0].montant_total || 0,
                paiementsValides: paiements[0].valides || 0,
                paiementsEnAttente: paiements[0].en_attente || 0,
                totalDocuments: documents[0].total
            }
        });
    } catch (error) {
        console.error('Erreur récupération statistiques globales:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors du chargement des statistiques globales',
            errors: [error.message]
        });
    }
});

// ===============================
// 📊 ROUTE: /api/statistics/documents
// ===============================
router.get('/documents', async (req, res) => {
    try {
        const connection = getConnection();
        const [result] = await connection.execute(`
            SELECT 
                SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) AS valides,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) AS en_attente,
                SUM(CASE WHEN statut = 'rejete' THEN 1 ELSE 0 END) AS rejetes
            FROM documents
        `);

        res.json({ success: true, data: result[0] });
    } catch (error) {
        console.error('Erreur récupération statistiques documents:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors du chargement des statistiques des documents',
            errors: [error.message]
        });
    }
});

// ===============================
// 📈 ROUTE: /api/statistics/candidats
// ===============================
router.get('/candidats', async (req, res) => {
    try {
        const connection = getConnection();
        const [rows] = await connection.execute(`
            SELECT 
                DATE_FORMAT(created_at, '%Y-%m') AS mois,
                COUNT(*) AS count
            FROM candidats
            GROUP BY DATE_FORMAT(created_at, '%Y-%m')
            ORDER BY mois ASC
        `);

        res.json({ success: true, data: { parMois: rows } });
    } catch (error) {
        console.error('Erreur récupération statistiques candidats:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors du chargement des statistiques candidats',
            errors: [error.message]
        });
    }
});

module.exports = router;
