const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

// POST /api/sessions - Créer une nouvelle session
router.post('/', async (req, res) => {
    try {
        const {nupcan} = req.body;

        if (!nupcan) {
            return res.status(400).json({
                success: false,
                message: 'NUPCAN requis'
            });
        }

        console.log('Création de session pour NUPCAN:', nupcan);

        const session = await Session.create(nupcan);

        console.log('Session créée:', session);

        res.status(201).json({
            success: true,
            data: session,
            message: 'Session créée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la création de session:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/sessions/nupcan/:nupcan - Récupérer session par NUPCAN
router.get('/nupcan/:nupcan', async (req, res) => {
    try {
        const {nupcan} = req.params;

        const session = await Session.findByNupcan(decodeURIComponent(nupcan));

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session non trouvée'
            });
        }

        res.json({
            success: true,
            data: session,
            message: 'Session trouvée'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération de session:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/sessions/validate/:token - Valider un token de session
router.get('/validate/:token', async (req, res) => {
    try {
        const {token} = req.params;

        const session = await Session.findByToken(token);

        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Session invalide ou expirée'
            });
        }

        res.json({
            success: true,
            data: session,
            message: 'Session valide'
        });
    } catch (error) {
        console.error('Erreur lors de la validation de session:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// DELETE /api/sessions/:token - Supprimer une session
router.delete('/:token', async (req, res) => {
    try {
        const {token} = req.params;

        const deleted = await Session.deleteByToken(token);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Session non trouvée'
            });
        }

        res.json({
            success: true,
            message: 'Session supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression de session:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

module.exports = router;
