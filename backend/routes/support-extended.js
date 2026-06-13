const express = require('express');
const router = express.Router();
const SupportRequest = require('../models/SupportRequest');
const { sendEmail } = require('../services/emailService');

/**
 * Créer une nouvelle demande de support
 * POST /api/support/requests
 */
router.post('/requests', async (req, res) => {
    try {
        const requestData = req.body;

        const request = await SupportRequest.create(requestData);

        // Envoyer un email de confirmation au demandeur
        try {
            await sendEmail(
                requestData.email,
                'Demande de support reçue - GABConcours',
                `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Demande de support enregistrée</h2>
                    <p>Bonjour ${requestData.name},</p>
                    <p>Votre demande de support a été enregistrée avec succès.</p>
                    <p><strong>Numéro de ticket:</strong> #${request.id}</p>
                    <p><strong>Sujet:</strong> ${requestData.sujet}</p>
                    <p>Nous vous répondrons dans les plus brefs délais.</p>
                    <p>Cordialement,<br/>L'équipe GABConcours</p>
                </div>
                `
            );
        } catch (emailError) {
            console.error('Erreur envoi email confirmation:', emailError);
        }

        // Notifier les admins
        try {
            await sendEmail(
                process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
                `Nouvelle demande support #${request.id}`,
                `
                <div style="font-family: Arial, sans-serif;">
                    <h2>Nouvelle demande de support</h2>
                    <p><strong>De:</strong> ${requestData.nom} (${requestData.email})</p>
                    <p><strong>Sujet:</strong> ${requestData.sujet}</p>
                    <p><strong>Message:</strong></p>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
                        ${requestData.message}
                    </div>
                </div>
                `
            );
        } catch (emailError) {
            console.error('Erreur notification admin:', emailError);
        }

        res.json({
            success: true,
            message: 'Demande de support créée avec succès',
            data: request
        });
    } catch (error) {
        console.error('Erreur création demande:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la création de la demande'
        });
    }
});

/**
 * Récupérer toutes les demandes avec filtres
 * GET /api/support/requests
 */
router.get('/requests', async (req, res) => {
    try {
        const filters = {
            statut: req.query.statut,
            priorite: req.query.priorite,
            assigned_to: req.query.assigned_to
        };

        const requests = await SupportRequest.findAll(filters);

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Erreur récupération demandes:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des demandes'
        });
    }
});

/**
 * Récupérer une demande par ID
 * GET /api/support/requests/:id
 */
router.get('/requests/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const request = await SupportRequest.findById(id);

        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Demande non trouvée'
            });
        }

        // Récupérer les réponses
        const responses = await SupportRequest.getResponses(id);

        res.json({
            success: true,
            data: {
                ...request,
                responses
            }
        });
    } catch (error) {
        console.error('Erreur récupération demande:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération de la demande'
        });
    }
});

/**
 * Mettre à jour le statut d'une demande
 * PUT /api/support/requests/:id/status
 */
router.put('/requests/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { statut, priorite, assigned_to } = req.body;

        const updated = await SupportRequest.update(id, {
            statut,
            priorite,
            assigned_to
        });

        res.json({
            success: true,
            message: 'Demande mise à jour avec succès',
            data: updated
        });
    } catch (error) {
        console.error('Erreur mise à jour:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la demande'
        });
    }
});

/**
 * Ajouter une réponse à une demande
 * POST /api/support/requests/:id/responses
 */
router.post('/requests/:id/responses', async (req, res) => {
    try {
        const { id } = req.params;
        const { admin_id, message, is_internal_note } = req.body;

        const response = await SupportRequest.addResponse({
            support_request_id: id,
            admin_id,
            message,
            is_internal_note: is_internal_note || false
        });

        // Mettre à jour le statut de la demande
        await SupportRequest.update(id, { statut: 'en_cours' });

        // Envoyer un email au demandeur si ce n'est pas une note interne
        if (!is_internal_note) {
            const request = await SupportRequest.findById(id);
            if (request) {
                try {
                    await sendEmail(
                        request.email,
                        `Réponse à votre demande #${id}`,
                        `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2>Nouvelle réponse à votre demande</h2>
                            <p>Bonjour ${request.nom},</p>
                            <p><strong>Concernant:</strong> ${request.sujet}</p>
                            <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                                <p><strong>Réponse:</strong></p>
                                <p>${message}</p>
                            </div>
                            <p>Cordialement,<br/>L'équipe GABConcours</p>
                        </div>
                        `
                    );
                } catch (emailError) {
                    console.error('Erreur envoi email:', emailError);
                }
            }
        }

        res.json({
            success: true,
            message: 'Réponse ajoutée avec succès',
            data: response
        });
    } catch (error) {
        console.error('Erreur ajout réponse:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de l\'ajout de la réponse'
        });
    }
});

/**
 * Récupérer les statistiques des demandes
 * GET /api/support/stats
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = await SupportRequest.getStats();

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Erreur récupération stats:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des statistiques'
        });
    }
});

/**
 * Récupérer les demandes d'un utilisateur
 * GET /api/support/user/:userId
 */
router.get('/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const requests = await SupportRequest.findByUser(userId);

        res.json({
            success: true,
            data: requests
        });
    } catch (error) {
        console.error('Erreur récupération demandes user:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des demandes'
        });
    }
});

module.exports = router;
