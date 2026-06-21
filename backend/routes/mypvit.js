const express = require('express');
const router = express.Router();
const Paiement = require('../models/Paiement');
const mypvitService = require('../services/mypvitService');
const {finalizeValidatedPayment} = require('../services/paymentFinalizationService');

router.get('/secret-reception', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({success: true, service: 'MyPVit secret reception', method: 'POST'});
});

router.post('/secret-reception', (req, res) => {
    if (!mypvitService.receiveSecret(req.body)) {
        return res.status(400).json({success: false, message: 'Clé MyPVit manquante'});
    }

    return res.json({success: true});
});

router.post('/renew-secret', async (req, res) => {
    try {
        await mypvitService.renewSecret();
        return res.json({
            success: true,
            message: 'Clé secrète MyPVit reçue et mise en cache'
        });
    } catch (error) {
        console.error('Erreur renouvellement secret MyPVit:', error.response?.data || error.message);
        return res.status(error.response?.status || error.statusCode || 500).json({
            success: false,
            message: error.response?.data?.message || error.message
        });
    }
});

router.get('/callback', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({success: true, service: 'MyPVit callback', method: 'POST'});
});

router.post('/callback', async (req, res) => {
    try {
        const reference = req.body?.merchantReferenceId
            || req.body?.merchant_reference_id
            || req.body?.reference;
        const transactionId = req.body?.transactionId
            || req.body?.transaction_id
            || req.body?.reference_id;
        const status = req.body?.status;

        if (!reference || !transactionId || !status) {
            return res.status(400).json({
                success: false,
                message: 'Identifiants ou statut MyPVit manquants'
            });
        }

        const paiement = await Paiement.findByReference(reference);
        if (!paiement) {
            return res.status(404).json({success: false, message: 'Paiement introuvable'});
        }

        const nextStatus = mypvitService.mapStatus(status);
        if (nextStatus !== 'en_attente') {
            const update = await Paiement.updatePendingStatus(paiement.id, nextStatus);
            if (update.changed && nextStatus === 'valide') {
                setImmediate(() => {
                    finalizeValidatedPayment(update.paiement).catch((error) => {
                        console.error('Erreur finalisation asynchrone MyPVit:', error);
                    });
                });
            }
        }

        return res.json({
            responseCode: Number(req.body?.code || 200),
            transactionId
        });
    } catch (error) {
        console.error('Erreur callback MyPVit:', error);
        return res.status(500).json({success: false, message: 'Erreur traitement callback'});
    }
});

router.get('/status/:reference', async (req, res) => {
    try {
        const result = await mypvitService.verifyPayment(req.params.reference);
        return res.json({success: true, data: result});
    } catch (error) {
        console.error('Erreur vérification MyPVit:', error.response?.data || error.message);
        return res.status(error.response?.status || error.statusCode || 500).json({
            success: false,
            message: error.response?.data?.message || error.message
        });
    }
});

module.exports = router;
