const express = require('express');
const router = express.Router();
const SupportRequest = require('../models/SupportRequest');
const { sendEmail } = require('../services/emailService');

// Créer une demande de support

router.post('/requests', async (req, res) => {
    try {
        const { name, email, message, createdAt } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const request = await SupportRequest.create({ name, email, message,createdAt });

        res.status(201).json({ 
            success: true,
            message: 'Support request submitted successfully',
            data: request
        });
    } catch (error) {
        console.error('Error creating support request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


// Récupérer toutes les demandes (super admin)
router.get('/', async (req, res) => {
    try {
        const requests = await SupportRequest.findAll();
        res.json({ success: true, data: requests }); // toujours renvoyer data
    } catch (error) {
        console.error('Erreur GET /support:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de la requête', errors: [error.message] });
    }
});

// Récupérer une demande spécifique
router.get('/requests/:id', async (req, res) => {
    try {
        const request = await SupportRequest.findById(req.params.id);
        
        if (!request) {
            return res.status(404).json({
                success: false,
                message: 'Demande non trouvée'
            });
        }
        
        const responses = await SupportRequest.getResponses(req.params.id);
        
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
            message: error.message
        });
    }
});

// Mettre à jour une demande
router.put('/requests/:id', async (req, res) => {
    try {
        const { statut, priorite, assigned_to } = req.body;
        
        const request = await SupportRequest.update(req.params.id, {
            statut,
            priorite,
            assigned_to
        });
        
        res.json({
            success: true,
            message: 'Demande mise à jour avec succès',
            data: request
        });
    } catch (error) {
        console.error('Erreur mise à jour demande:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Répondre à une demande
router.post('/requests/:id/responses', async (req, res) => {
    try {
        const { admin_id, message, is_internal_note } = req.body;

        if (!admin_id || !message) {
            return res.status(400).json({ success: false, message: 'admin_id et message requis' });
        }

        const request = await SupportRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ success: false, message: 'Demande non trouvée' });

        const response = await SupportRequest.addResponse({
            support_request_id: req.params.id,
            admin_id,
            message,
            is_internal_note: is_internal_note || false
        });

        // Si ce n'est pas une note interne, envoyer email au client
        if (!is_internal_note) {
            try {
                await sendEmail(
                    request.email,
                    `Réponse à votre demande #${request.id}`,
                    `
                    <h2>Nouvelle réponse à votre demande</h2>
                    <p>Bonjour ${request.name},</p>
                    <p>Vous avez reçu une réponse concernant votre demande: ${request.message}</p>
                   
                    <p><strong>Réponse:</strong></p>
                    ${message}
                    <p>Numéro de référence: #${request.id}</p>
                    <p>Cordialement,<br>L'équipe GabConcours</p>
                    `
                );
            } catch (emailError) {
                console.error('Erreur envoi email:', emailError);
            }
        }

        // Mettre à jour le statut
        await SupportRequest.update(req.params.id, { statut: 'traite' });

        res.json({ success: true, message: 'Réponse ajoutée avec succès', data: response });
    } catch (error) {
        console.error('Erreur ajout réponse:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});


// Récupérer les réponses d'une demande
router.get('/requests/:id/responses', async (req, res) => {
    try {
        const responses = await SupportRequest.getResponses(req.params.id);
        
        res.json({
            success: true,
            data: responses
        });
    } catch (error) {
        console.error('Erreur récupération réponses:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;

