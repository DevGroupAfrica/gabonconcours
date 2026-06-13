// =================================================================
// FICHIER : routes/concours.js (Routes Express)
// =================================================================
const express = require('express');
const router = express.Router();
const Concours = require('../models/Concours');
const {authenticateAdmin} = require("./adminAuth");

// GET /api/concours - Récupérer tous les concours (pour l'API publique)
router.get('/', async (req, res) => {
    try {
        const { etablissement_id } = req.query;
        
        // Si un etablissement_id est fourni, filtrer par établissement
        if (etablissement_id) {
            const connection = require('../config/database').getConnection();
            const [concours] = await connection.execute(
                `SELECT 
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
                GROUP BY c.id, c.libcnc, c.fracnc, c.sescnc, c.debcnc, c.fincnc, e.nomets, c.is_gorri 
                ORDER BY c.libcnc ASC`,
                [etablissement_id]
            );
            return res.json({
                success: true,
                data: concours
            });
        }
        
        // Sinon, retourner tous les concours actifs
        const concours = await Concours.findAll();
        res.json({
            success: true,
            data: concours
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des concours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/concours/:id - Récupérer un concours par ID
router.get('/:id', async (req, res) => {
    try {
        const concours = await Concours.findById(req.params.id);
        if (!concours) {
            return res.status(404).json({
                success: false,
                message: 'Concours non trouvé'
            });
        }
        res.json({
            success: true,
            data: concours
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du concours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/concours/:id/filieres - Récupérer les filières d'un concours
router.get('/:id/filieres', async (req, res) => {
    try {
        const connection = require('../config/database').getConnection();
        const [rows] = await connection.execute(
            `SELECT cf.*, f.nomfil, f.description 
       FROM concours_filieres cf
       LEFT JOIN filieres f ON cf.filiere_id = f.id
       WHERE cf.concours_id = ?
       ORDER BY f.nomfil ASC`,
            [req.params.id]
        );
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des filières du concours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// POST /api/concours - Créer un nouveau concours
router.post('/', async (req, res) => {
    try {
        // Le modèle Concours gère déjà la logique pour fracnc
        const concours = await Concours.create(req.body);
        res.status(201).json({
            success: true,
            data: concours,
            message: 'Concours créé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la création du concours:', error);
        // Le statut 400 est souvent plus approprié si l'erreur vient d'une donnée invalide de l'utilisateur
        res.status(400).json({
            success: false,
            message: 'Erreur lors de la création du concours',
            errors: [error.message]
        });
    }
});


router.get('/etablissement/:etablissementId', authenticateAdmin, async (req, res) => {
    try {
        const {etablissementId} = req.params;
        console.log('Récupération concours pour établissement:', etablissementId);
        const connection = require('../config/database').getConnection();

        // Ajout de la colonne c.is_gorri pour la cohérence
        const [concours] = await connection.execute(
            `SELECT 
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
      GROUP BY c.id, c.libcnc, c.fracnc, c.sescnc, c.debcnc, c.fincnc, e.nomets, c.is_gorri 
      ORDER BY c.libcnc ASC`,
            [etablissementId]
        );

        res.json({success: true, data: concours});
    } catch (error) {
        console.error('Erreur récupération concours établissement:', error);
        res.status(500).json({success: false, message: 'Erreur serveur'});
    }
});


// DELETE /api/concours/:id - Supprimer un concours
router.delete('/:id', async (req, res) => {
    try {
        // Modification pour utiliser la méthode delete du modèle qui ne dépend pas d'un findById
        const result = await Concours.delete(req.params.id);

        if (!result.success) {
            // Si le delete renvoie une indication de non-trouvé (selon l'implémentation)
            return res.status(404).json({
                success: false,
                message: 'Concours non trouvé'
            });
        }

        res.json({
            success: true,
            message: 'Concours supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du concours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// POST /api/concours/:id/check-eligibility - Vérifier l'éligibilité d'un candidat
router.post('/:id/check-eligibility', async (req, res) => {
    try {
        const concoursId = req.params.id;
        const { age, serie_bac, nationalite } = req.body;
        
        const concours = await Concours.findById(concoursId);
        if (!concours) {
            return res.status(404).json({ 
                success: false,
                error: 'Concours non trouvé' 
            });
        }
        
        const errors = [];
        const warnings = [];
        
        // Vérifier l'âge
        if (concours.agecnc && age > concours.agecnc) {
            errors.push(`Âge maximum dépassé (${concours.agecnc} ans maximum requis, vous avez ${age} ans)`);
        }
        
        // Vérifier la série du bac pour les concours de première année
        if (concours.type_concours === 'premiere_annee' && concours.series_bac_acceptees) {
            const seriesAcceptees = concours.series_bac_acceptees;
            if (seriesAcceptees.length > 0 && serie_bac && !seriesAcceptees.includes(serie_bac)) {
                errors.push(`Série du bac non acceptée. Séries acceptées: ${seriesAcceptees.join(', ')}`);
            }
        }
        
        // Ajouter les conditions d'éligibilité obligatoires comme avertissements
        if (concours.conditions_eligibilite && Array.isArray(concours.conditions_eligibilite)) {
            concours.conditions_eligibilite.forEach(condition => {
                if (condition.obligatoire) {
                    warnings.push(condition.condition);
                }
            });
        }
        
        res.json({
            success: true,
            eligible: errors.length === 0,
            errors,
            warnings,
            concours: {
                libcnc: concours.libcnc,
                agecnc: concours.agecnc,
                type_concours: concours.type_concours,
                series_bac_acceptees: concours.series_bac_acceptees,
                conditions_eligibilite: concours.conditions_eligibilite
            }
        });
    } catch (error) {
        console.error('Erreur vérification éligibilité:', error);
        res.status(500).json({ 
            success: false,
            error: 'Erreur serveur',
            message: error.message 
        });
    }
});

module.exports = router;