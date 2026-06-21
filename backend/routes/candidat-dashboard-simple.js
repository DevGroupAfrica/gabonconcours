const express = require('express');
const router = express.Router();
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

// GET /api/candidats/nipcan/:nipcan/dashboard - Dashboard principal (VERSION SIMPLIFIÉE)
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
                message: 'Candidat non trouvé avec ce NIPCAN'
            });
        }

        const candidat = candidatRows[0];

        // 2. Récupérer toutes les candidatures du candidat (par NIPCAN)
        const [candidaturesRows] = await connection.execute(
            `SELECT 
                c.id,
                c.nupcan,
                c.nipcan,
                c.created_at,
                con.id as concours_id,
                con.libcnc,
                con.fracnc,
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

        console.log(`✅ Trouvé ${candidaturesRows.length} candidature(s) pour NIPCAN ${nipcan}`);

        // 3. Pour chaque candidature, récupérer les détails
        const candidatures = await Promise.all(candidaturesRows.map(async (cand) => {
            try {
                // Documents - Compter par NUPCAN (la table dossiers utilise maintenant la colonne nupcan)
                let documents = { total: 0, valides: 0 };
                try {
                    const [docsRows] = await connection.execute(
                        `SELECT COUNT(*) as total, 
                                SUM(CASE WHEN d.statut = 'valide' THEN 1 ELSE 0 END) as valides
                         FROM dossiers dos
                         LEFT JOIN documents d ON dos.document_id = d.id
                         WHERE dos.nupcan = ?`,
                        [cand.nupcan]
                    );
                    documents = docsRows[0] || { total: 0, valides: 0 };
                    console.log(`  📄 Documents pour NUPCAN ${cand.nupcan}:`, documents.total, 'total,', documents.valides, 'valides');
                } catch (docError) {
                    console.error('Erreur récupération documents:', docError.message);
                }

                // Paiement - Chercher par NUPCAN (la table paiements utilise nupcan)
                let paiement = null;
                try {
                    const [paiementRows] = await connection.execute(
                        `SELECT statut FROM paiements WHERE nupcan = ? ORDER BY updated_at DESC, id DESC LIMIT 1`,
                        [cand.nupcan]
                    );
                    paiement = paiementRows[0] || null;
                } catch (payError) {
                    console.error('Erreur récupération paiement:', payError.message);
                }

                // Notes - Chercher par candidat_id
                let hasNotes = false;
                try {
                    const [notesRows] = await connection.execute(
                        `SELECT COUNT(*) as total FROM notes WHERE candidat_id = ?`,
                        [cand.id]
                    );
                    hasNotes = notesRows[0].total > 0;
                } catch (notesError) {
                    console.error('Erreur récupération notes:', notesError.message);
                }

            const documentsTotal = Number(documents.total) || 0;
            const documentsValides = Number(documents.valides) || 0;

            // La publication des résultats est une phase ultérieure et ne doit pas
            // empêcher un dossier entièrement déposé et payé d'atteindre 100 %.
            const paiementRequis = Number(cand.fracnc || 0) > 0;
            const etapes = {
                inscription: true, // Toujours vrai si la candidature existe
                documents: documentsTotal > 0 && documentsValides === documentsTotal,
                paiement: !paiementRequis || Boolean(paiement && paiement.statut === 'valide'),
                resultats: hasNotes
            };

            const dossierSteps = [etapes.inscription, etapes.documents, etapes.paiement];
            const etapesCompletes = dossierSteps.filter(Boolean).length;
            const progression = Math.round((etapesCompletes / dossierSteps.length) * 100);

            // Déterminer le statut
            let statut = 'en_cours';
            if (progression === 100) {
                statut = 'complete';
            }

            return {
                nupcan: cand.nupcan,
                concours: {
                    id: cand.concours_id,
                    libcnc: cand.libcnc || 'Concours',
                    etablissement: cand.etablissement || 'Établissement',
                    date_debut: null,
                    date_fin: null
                },
                filiere: {
                    id: cand.filiere_id,
                    nomfil: cand.nomfil || 'Filière'
                },
                statut,
                progression,
                etapes,
                documents_count: documentsTotal,
                documents_valides: documentsValides,
                paiement_statut: paiement ? paiement.statut : null,
                created_at: cand.created_at
            };
            } catch (candError) {
                console.error(`Erreur traitement candidature ${cand.nupcan}:`, candError.message);
                // Retourner une candidature minimale en cas d'erreur
                return {
                    nupcan: cand.nupcan,
                    concours: {
                        id: cand.concours_id,
                        libcnc: cand.libcnc || 'Concours',
                        etablissement: cand.etablissement || 'Établissement',
                        date_debut: null,
                        date_fin: null
                    },
                    filiere: {
                        id: cand.filiere_id,
                        nomfil: cand.nomfil || 'Filière'
                    },
                    statut: 'en_cours',
                    progression: 25,
                    etapes: { inscription: true, documents: false, paiement: false, resultats: false },
                    documents_count: 0,
                    documents_valides: 0,
                    paiement_statut: null,
                    created_at: cand.created_at
                };
            }
        }));

        // 4. Récupérer les notifications (simplifié)
        const [notificationsRows] = await connection.execute(
            `SELECT id, type, titre, message, statut, priority, created_at
             FROM notifications
             WHERE candidat_nupcan IN (SELECT nupcan FROM candidats WHERE nipcan = ?)
             AND statut = 'non_lu'
             ORDER BY created_at DESC
             LIMIT 10`,
            [nipcan]
        );

        // 5. Activités récentes (simplifié - seulement documents et paiements)
        const activites_recentes = [];

        // 6. Calculer les statistiques
        const statistiques = {
            total: candidatures.length,
            en_cours: candidatures.filter(c => c.statut === 'en_cours').length,
            completes: candidatures.filter(c => c.statut === 'complete').length
        };

        // 7. Construire la réponse
        const dashboardData = {
            candidat: {
                id: candidat.id,
                nipcan: candidat.nipcan,
                nomcan: candidat.nomcan,
                prncan: candidat.prncan,
                maican: candidat.maican,
                telcan: candidat.telcan,
                phtcan: candidat.phtcan
            },
            candidatures,
            statistiques,
            notifications: notificationsRows,
            activites_recentes
        };

        console.log('✅ Dashboard récupéré:', candidatures.length, 'candidature(s)');

        res.json({
            success: true,
            data: dashboardData,
            message: 'Dashboard récupéré avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur récupération dashboard:', error);
        console.error('Stack:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/candidats/nupcan/:nupcan/documents - Récupérer les documents d'une candidature
router.get('/nupcan/:nupcan/documents', async (req, res) => {
    try {
        const { nupcan } = req.params;
        console.log('📄 Récupération documents pour NUPCAN:', nupcan);

        const connection = getConnection();

        const [documents] = await connection.execute(`
            SELECT 
                d.id,
                d.nomdoc,
                d.type,
                d.statut,
                d.nom_fichier as fichier,
                d.created_at,
                d.updated_at,
                dos.nupcan
            FROM documents d
            INNER JOIN dossiers dos ON d.id = dos.document_id
            WHERE dos.nupcan = ?
            ORDER BY d.created_at DESC
        `, [nupcan]);

        console.log(`✅ Trouvé ${documents.length} document(s) pour NUPCAN ${nupcan}`);

        res.json({
            success: true,
            data: documents,
            message: `${documents.length} document(s) trouvé(s)`
        });

    } catch (error) {
        console.error('❌ Erreur récupération documents:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des documents',
            errors: [error.message]
        });
    }
});

module.exports = router;
