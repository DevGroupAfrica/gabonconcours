const express = require('express');
const router = express.Router();
const {getConnection} = require('../config/database');
const {authenticateAdmin} = require('./adminAuth');

// GET /api/admin/etablissement/:etablissementId/concours - Récupérer les concours d'un établissement
router.get('/etablissement/:etablissementId/concours', async (req, res) => {
    try {
        const {etablissementId} = req.params;
        console.log('Récupération concours pour établissement:', etablissementId);

        const connection = getConnection();

        const [concours] = await connection.execute(`
      SELECT 
        c.*,
        e.nomets as etablissement_nomets,
        COUNT(DISTINCT cand.id) as candidats_count,
        COUNT(DISTINCT CASE WHEN cand.statut = 'en_attente' THEN cand.id END) as en_attente_count,
        COUNT(DISTINCT CASE WHEN cand.statut = 'valide' THEN cand.id END) as valides_count,
        COUNT(DISTINCT CASE WHEN cand.statut = 'rejete' THEN cand.id END) as rejetes_count
      FROM concours c
      LEFT JOIN etablissements e ON c.etablissement_id = e.id
      LEFT JOIN candidats cand ON cand.concours_id = c.id
      WHERE c.etablissement_id = ?
      GROUP BY c.id, c.libcnc, c.fracnc, c.sescnc, c.debcnc, c.fincnc, e.nomets
      ORDER BY c.libcnc ASC
    `, [etablissementId]);

        res.json({
            success: true,
            data: concours,
            message: 'Concours récupérés avec succès'
        });

    } catch (error) {
        console.error('Erreur récupération concours établissement:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/admin/concours/:concoursId/candidats - Récupérer les candidats d'un concours
router.get('/concours/:concoursId/candidats', authenticateAdmin, async (req, res) => {
    try {
        const {concoursId} = req.params;
        console.log('Récupération candidats pour concours:', concoursId);

        const connection = getConnection();

        const [candidats] = await connection.execute(`
      SELECT 
        c.*,
        con.libcnc,
        con.sescnc,
        con.fracnc,
        f.nomfil,
        p.statut as paiement_statut,
        p.montant as paiement_montant,
        p.methode as paiement_methode,
        p.reference_paiement,
        COUNT(DISTINCT d.id) as documents_count,
        COUNT(DISTINCT CASE WHEN d.statut = 'valide' THEN d.id END) as documents_valides,
        COUNT(DISTINCT CASE WHEN d.statut = 'en_attente' THEN d.id END) as documents_en_attente
      FROM candidats c
      LEFT JOIN concours con ON c.concours_id = con.id
      LEFT JOIN filieres f ON c.filiere_id = f.id
      LEFT JOIN paiements p ON c.id = p.candidat_id
      LEFT JOIN dossiers dos ON dos.candidat_id = c.id
      LEFT JOIN documents d ON dos.document_id = d.id
      WHERE c.concours_id = ?
      GROUP BY c.id, c.nupcan, c.nomcan, c.prncan, c.maican, c.telcan, c.dtncan, c.statut, 
               con.libcnc, con.sescnc, con.fracnc, f.nomfil, p.statut, p.montant, p.methode, p.reference_paiement
      ORDER BY c.created_at DESC
    `, [concoursId]);

        console.log('Candidats récupérés:', candidats.length); // Log ajouté

        res.json({
            success: true,
            data: candidats,
            message: 'Candidats récupérés avec succès'
        });

    } catch (error) {
        console.error('Erreur récupération candidats concours:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/admin/etablissement/:etablissementId/candidats - Récupérer tous les candidats d'un établissement
router.get('/etablissement/:etablissementId/candidats', authenticateAdmin, async (req, res) => {
    try {
        const {etablissementId} = req.params;
        console.log('Récupération candidats pour établissement:', etablissementId);

        const connection = getConnection();

        const [candidats] = await connection.execute(`
      SELECT 
        c.*,
        con.libcnc,
        f.nomfil,
        e.nomets as etablissement_nom
      FROM candidats c
      LEFT JOIN concours con ON c.concours_id = con.id
      LEFT JOIN filieres f ON c.filiere_id = f.id
      LEFT JOIN etablissements e ON con.etablissement_id = e.id
      WHERE con.etablissement_id = ?
      ORDER BY c.created_at DESC
    `, [etablissementId]);

        console.log('Candidats récupérés:', candidats.length);

        res.json({
            success: true,
            data: candidats,
            message: 'Candidats récupérés avec succès'
        });

    } catch (error) {
        console.error('Erreur récupération candidats établissement:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

module.exports = router;