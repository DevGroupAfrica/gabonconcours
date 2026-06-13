const express = require('express');
const router = express.Router();
const Candidat = require('../models/Candidat');
const { getConnection } = require('../config/database');

// POST /api/candidats/nipcan/verify - Vérifier si un NIPCAN existe
router.post('/nipcan/verify', async (req, res) => {
    try {
        const { nipcan } = req.body;
        
        if (!nipcan || !nipcan.trim()) {
            return res.status(400).json({
                success: false,
                message: 'NIPCAN requis'
            });
        }

        console.log('🔐 Vérification NIPCAN:', nipcan);

        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT id, nipcan, nomcan, prncan FROM candidats WHERE nipcan = ? LIMIT 1',
            [nipcan.trim()]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'NIPCAN invalide. Aucun candidat trouvé avec cet identifiant.'
            });
        }

        const candidat = rows[0];
        console.log('✅ NIPCAN valide pour:', candidat.nomcan, candidat.prncan);

        res.json({
            success: true,
            data: {
                nipcan: candidat.nipcan,
                nom: candidat.nomcan,
                prenom: candidat.prncan
            },
            message: 'NIPCAN valide'
        });

    } catch (error) {
        console.error('❌ Erreur vérification NIPCAN:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/candidats/nupcan/:nupcan/nipcan - Obtenir le NIPCAN depuis un NUPCAN
router.get('/nupcan/:nupcan/nipcan', async (req, res) => {
    try {
        const { nupcan } = req.params;
        console.log('🔍 Recherche NIPCAN pour NUPCAN:', nupcan);

        const connection = getConnection();

        const [rows] = await connection.execute(
            `SELECT nipcan FROM candidats WHERE nupcan = ? LIMIT 1`,
            [nupcan]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Candidat non trouvé pour ce NUPCAN'
            });
        }

        const nipcan = rows[0].nipcan;

        if (!nipcan) {
            return res.status(404).json({
                success: false,
                message: 'Ce candidat n\'a pas de NIPCAN. Veuillez exécuter le script de mise à jour.'
            });
        }

        res.json({
            success: true,
            data: { nipcan, nupcan },
            message: 'NIPCAN trouvé'
        });

    } catch (error) {
        console.error('❌ Erreur recherche NIPCAN:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/candidats/nipcan/:nipcan/dashboard - Dashboard principal du candidat
router.get('/nipcan/:nipcan/dashboard', async (req, res) => {
    try {
        const { nipcan } = req.params;
        console.log('📊 Récupération dashboard pour NIPCAN:', nipcan);

        const connection = getConnection();

        // 1. Récupérer les informations du candidat
        const [candidatRows] = await connection.execute(
            `SELECT id, nipcan, nomcan, prncan, maican, telcan, phtcan 
             FROM candidats 
             WHERE nipcan = ? 
             LIMIT 1`,
            [nipcan]
        );

        if (candidatRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Candidat non trouvé'
            });
        }

        const candidat = candidatRows[0];

        // 2. Récupérer toutes les candidatures du candidat
        const [candidaturesRows] = await connection.execute(
            `SELECT 
                c.id,
                c.nupcan,
                c.nipcan,
                c.created_at,
                c.etape,
                con.id as concours_id,
                con.libcnc,
                con.fracnc,
                con.datdeb,
                con.datfin,
                e.nomets as etablissement,
                f.id as filiere_id,
                f.nomfil
             FROM candidats c
             LEFT JOIN concours con ON c.concours_id = con.id
             LEFT JOIN etablissements e ON con.etablissement_id = e.id
             LEFT JOIN filieres f ON c.filiere_id = f.id
             WHERE c.nipcan = ?
             ORDER BY c.created_at DESC`,
            [nipcan]
        );

        // 3. Pour chaque candidature, récupérer les détails
        const candidatures = await Promise.all(candidaturesRows.map(async (cand) => {
            // Documents - Chercher par NUPCAN dans la table dossiers
            const [docsRows] = await connection.execute(
                `SELECT COUNT(*) as total, 
                        SUM(CASE WHEN d.statut = 'valide' THEN 1 ELSE 0 END) as valides
                 FROM dossiers dos
                 LEFT JOIN documents d ON dos.document_id = d.id
                 WHERE dos.nupcan = ?`,
                [cand.nupcan]  // Utiliser le NUPCAN de cette candidature spécifique
            );

            const documents = docsRows[0];

            // Paiement - Chercher par NUPCAN
            const [paiementRows] = await connection.execute(
                `SELECT statut FROM paiements WHERE nupcan = ? LIMIT 1`,
                [cand.nupcan]
            );

            const paiement = paiementRows[0] || null;

            // Notes/Résultats
            const [notesRows] = await connection.execute(
                `SELECT COUNT(*) as total FROM notes WHERE nupcan = ?`,
                [cand.nupcan]
            );

            const hasNotes = notesRows[0].total > 0;

            // Calculer la progression
            const etapes = {
                inscription: true, // Toujours vrai si la candidature existe
                documents: documents.total > 0 && documents.valides === documents.total,
                paiement: paiement && paiement.statut === 'valide',
                resultats: hasNotes
            };

            const etapesCompletes = Object.values(etapes).filter(Boolean).length;
            const progression = Math.round((etapesCompletes / 4) * 100);

            // Déterminer le statut
            let statut = 'en_cours';
            if (etapes.inscription && etapes.documents && etapes.paiement && etapes.resultats) {
                statut = 'complete';
            }

            return {
                nupcan: cand.nupcan,
                concours: {
                    id: cand.concours_id,
                    libcnc: cand.libcnc,
                    etablissement: cand.etablissement,
                    date_debut: cand.datdeb,
                    date_fin: cand.datfin
                },
                filiere: {
                    id: cand.filiere_id,
                    nomfil: cand.nomfil
                },
                statut,
                progression,
                etapes,
                documents_count: documents.total || 0,
                documents_valides: documents.valides || 0,
                paiement_statut: paiement ? paiement.statut : null,
                created_at: cand.created_at
            };
        }));

        // 4. Récupérer les notifications
        const [notificationsRows] = await connection.execute(
            `SELECT id, type, titre, message, statut, priority, created_at
             FROM notifications
             WHERE candidat_nupcan IN (SELECT nupcan FROM candidats WHERE nipcan = ?)
             AND statut = 'non_lu'
             ORDER BY created_at DESC
             LIMIT 10`,
            [nipcan]
        );

        // 5. Récupérer les activités récentes
        const [activitesRows] = await connection.execute(
            `SELECT 
                'document' as type,
                CONCAT('Document ', d.nomdoc, ' - ', d.statut) as titre,
                CONCAT('Candidature ', dos.nupcan) as description,
                d.updated_at as created_at
             FROM documents d
             JOIN dossiers dos ON d.id = dos.document_id
             WHERE dos.nupcan IN (SELECT nupcan FROM candidats WHERE nipcan = ?)
             UNION ALL
             SELECT 
                'paiement' as type,
                CONCAT('Paiement - ', p.statut) as titre,
                CONCAT('Montant: ', p.montant, ' FCFA') as description,
                p.created_at
             FROM paiements p
             WHERE p.nipcan = ? OR p.nupcan IN (SELECT nupcan FROM candidats WHERE nipcan = ?)
             ORDER BY created_at DESC
             LIMIT 10`,
            [nipcan, nipcan, nipcan]
        );

        // 6. Construire la réponse
        const dashboardData = {
            candidat: {
                nipcan: candidat.nipcan,
                nom: candidat.nomcan,
                prenom: candidat.prncan,
                email: candidat.maican,
                telephone: candidat.telcan,
                photo: candidat.phtcan
            },
            candidatures,
            statistiques: {
                total: candidatures.length,
                en_cours: candidatures.filter(c => c.statut === 'en_cours').length,
                completes: candidatures.filter(c => c.statut === 'complete').length
            },
            notifications: notificationsRows,
            activites_recentes: activitesRows
        };

        console.log('✅ Dashboard récupéré:', candidatures.length, 'candidature(s)');

        res.json({
            success: true,
            data: dashboardData,
            message: candidatures.length > 0 
                ? 'Dashboard récupéré avec succès' 
                : 'Aucune candidature trouvée. Créez votre première candidature pour commencer.'
        });

    } catch (error) {
        console.error('❌ Erreur récupération dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/candidats/nipcan/:nipcan/candidatures - Liste des candidatures
router.get('/nipcan/:nipcan/candidatures', async (req, res) => {
    try {
        const { nipcan } = req.params;
        console.log('📋 Récupération candidatures pour NIPCAN:', nipcan);

        const connection = getConnection();

        const [rows] = await connection.execute(
            `SELECT 
                c.id,
                c.nupcan,
                c.nipcan,
                c.created_at,
                con.libcnc,
                f.nomfil,
                e.nomets
             FROM candidats c
             LEFT JOIN concours con ON c.concours_id = con.id
             LEFT JOIN filieres f ON c.filiere_id = f.id
             LEFT JOIN etablissements e ON con.etablissement_id = e.id
             WHERE c.nipcan = ?
             ORDER BY c.created_at DESC`,
            [nipcan]
        );

        res.json({
            success: true,
            data: rows,
            message: 'Candidatures récupérées avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur récupération candidatures:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

module.exports = router;
