const crypto = require('crypto');
const express = require('express');
const router = express.Router();
const Paiement = require('../models/Paiement');
const Candidat = require('../models/Candidat');
const Concours = require('../models/Concours');
const cinetpayService = require('../services/cinetpayService');
const singpayService = require('../services/singpayService');
const mypvitService = require('../services/mypvitService');
const {finalizeValidatedPayment} = require('../services/paymentFinalizationService');

const SINGPAY_METHODS = new Set(['moov', 'airtel_money']);
const MYPVIT_METHODS = new Set(['mypvit_moov', 'mypvit_airtel_money']);

const createMerchantReference = (nupcan) => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const suffix = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `GC${timestamp}${suffix}`.slice(0, 15);
};

const loadPaymentContext = async (paiementData) => {
    const requestedNupcan = paiementData.nupcan || paiementData.nipcan;
    let candidat = null;

    if (requestedNupcan) {
        candidat = await Candidat.findByNupcan(requestedNupcan);
    }

    if (!candidat && paiementData.candidat_id) {
        candidat = await Candidat.findById(paiementData.candidat_id);
    }

    if (!candidat) {
        const error = new Error('Candidat introuvable pour ce NUPCAN');
        error.statusCode = 404;
        throw error;
    }

    const concoursId = candidat.concours_id || paiementData.concours_id;
    const concours = concoursId ? await Concours.findById(concoursId) : null;

    if (!concours) {
        const error = new Error('Concours introuvable pour cette candidature');
        error.statusCode = 404;
        throw error;
    }

    return {candidat, concours};
};

const syncSingPayPayment = async (paiement) => {
    if (!paiement || paiement.statut !== 'en_attente' || !SINGPAY_METHODS.has(paiement.methode)) {
        return paiement;
    }

    const transaction = await singpayService.findTransactionByReference(paiement.reference_paiement);
    const nextStatus = singpayService.mapTransactionStatus(transaction);

    if (nextStatus === 'en_attente') return paiement;

    const update = await Paiement.updatePendingStatus(paiement.id, nextStatus);
    if (update.changed && nextStatus === 'valide') {
        await finalizeValidatedPayment(update.paiement);
        return Paiement.findById(paiement.id);
    }

    return update.paiement;
};

const syncMyPVitPayment = async (paiement) => {
    if (!paiement || paiement.statut !== 'en_attente' || !MYPVIT_METHODS.has(paiement.methode)) {
        return paiement;
    }

    const transaction = await mypvitService.verifyPayment(paiement.reference_paiement);
    const nextStatus = mypvitService.mapStatus(transaction?.status);
    if (nextStatus === 'en_attente') return paiement;

    const update = await Paiement.updatePendingStatus(paiement.id, nextStatus);
    if (update.changed && nextStatus === 'valide') {
        await finalizeValidatedPayment(update.paiement);
        return Paiement.findById(paiement.id);
    }

    return update.paiement;
};

// GET /api/paiements/nupcan/:nupcan
router.get('/nupcan/:nupcan', async (req, res) => {
    try {
        const decodedNupcan = decodeURIComponent(req.params.nupcan);
        let paiement = await Paiement.findByNupcan(decodedNupcan);

        if (paiement?.statut === 'en_attente' && SINGPAY_METHODS.has(paiement.methode)) {
            try {
                paiement = await syncSingPayPayment(paiement);
            } catch (error) {
                console.warn('Vérification SingPay temporairement indisponible:', error.message);
            }
        }
        if (paiement?.statut === 'en_attente' && MYPVIT_METHODS.has(paiement.methode)) {
            try {
                paiement = await syncMyPVitPayment(paiement);
            } catch (error) {
                console.warn('Vérification MyPVit temporairement indisponible:', error.message);
            }
        }

        res.json({
            success: true,
            data: paiement,
            message: 'Paiement récupéré avec succès'
        });
    } catch (error) {
        console.error('Erreur récupération paiement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/paiements/singpay/callback
// Diagnostic navigateur/monitoring. SingPay envoie les notifications en POST.
router.get('/singpay/callback', (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.json({
        success: true,
        service: 'SingPay callback',
        status: 'ready',
        method: 'POST'
    });
});

// POST /api/paiements/singpay/callback
router.post('/singpay/callback', async (req, res) => {
    const reference = req.body?.transaction?.reference || req.body?.reference;

    if (!reference) {
        return res.status(400).json({success: false, message: 'Référence SingPay manquante'});
    }

    try {
        const paiement = await Paiement.findByReference(reference);
        if (!paiement) {
            return res.status(404).json({success: false, message: 'Paiement introuvable'});
        }

        const syncedPayment = await syncSingPayPayment(paiement);
        return res.json({success: true, data: syncedPayment});
    } catch (error) {
        console.error('Erreur callback SingPay:', error);
        return res.status(502).json({
            success: false,
            message: 'Impossible de vérifier la transaction auprès de SingPay'
        });
    }
});

// POST /api/paiements
router.post('/', async (req, res) => {
    try {
        const paiementData = {...req.body};

        if (!paiementData.nupcan && !paiementData.nipcan) {
            return res.status(400).json({
                success: false,
                message: 'NUPCAN requis',
                errors: ['Le NUPCAN est obligatoire pour créer un paiement']
            });
        }

        if (paiementData.methode === 'cinetpay') {
            const cinetResponse = await cinetpayService.initPayment(paiementData);
            if (!cinetResponse.success) {
                return res.status(400).json({success: false, message: cinetResponse.message});
            }

            paiementData.statut = 'en_attente';
            paiementData.reference_paiement = paiementData.reference_paiement || Date.now().toString();
            const paiement = await Paiement.create(paiementData);

            return res.status(201).json({
                success: true,
                data: {paiement, payment_url: cinetResponse.payment_url},
                message: 'Paiement en attente. Redirection vers CinetPay.'
            });
        }

        const {candidat, concours} = await loadPaymentContext(paiementData);
        const officialAmount = Number(concours.fracnc || 0);
        const basePaymentData = {
            candidat_id: candidat.id,
            concours_id: concours.id,
            nupcan: candidat.nupcan,
            montant: officialAmount,
            methode: paiementData.methode,
            numero_telephone: paiementData.numero_telephone || paiementData.telephone
        };

        const existingPayment = await Paiement.findByNupcan(candidat.nupcan);
        if (existingPayment?.statut === 'valide') {
            return res.status(200).json({
                success: true,
                data: existingPayment,
                message: 'Ce paiement est déjà validé'
            });
        }

        if (paiementData.methode === 'gorri') {
            if (officialAmount !== 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ce concours n’est pas gratuit'
                });
            }

            const paiement = await Paiement.create({
                ...basePaymentData,
                statut: 'valide',
                reference_paiement: `GRATUIT-${Date.now()}`
            });
            await finalizeValidatedPayment(paiement);

            return res.status(201).json({
                success: true,
                data: paiement,
                message: 'Candidature gratuite finalisée'
            });
        }

        if (!SINGPAY_METHODS.has(paiementData.methode)) {
            return res.status(400).json({
                success: false,
                message: 'Méthode de paiement non prise en charge'
            });
        }

        if (!Number.isFinite(officialAmount) || officialAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Montant du concours invalide'
            });
        }

        if (!basePaymentData.numero_telephone) {
            return res.status(400).json({
                success: false,
                message: 'Numéro de téléphone requis'
            });
        }

        if (
            existingPayment?.statut === 'en_attente'
            && (SINGPAY_METHODS.has(existingPayment.methode) || MYPVIT_METHODS.has(existingPayment.methode))
        ) {
            return res.status(200).json({
                success: true,
                data: existingPayment,
                message: 'Un paiement mobile est déjà en attente'
            });
        }

        const reference = createMerchantReference(candidat.nupcan);
        const paymentProvider = String(process.env.MOBILE_PAYMENT_PROVIDER || 'mypvit').toLowerCase();
        const storedMethod = paymentProvider === 'mypvit'
            ? `mypvit_${paiementData.methode}`
            : paiementData.methode;
        const paiement = await Paiement.create({
            ...basePaymentData,
            methode: storedMethod,
            statut: 'en_attente',
            reference_paiement: reference
        });

        try {
            if (paymentProvider === 'mypvit') {
                const mypvitResponse = await mypvitService.initPayment({
                    montant: officialAmount,
                    reference_paiement: reference,
                    numero_telephone: basePaymentData.numero_telephone,
                    methode: paiementData.methode,
                    nupcan: candidat.nupcan,
                    description: `Frais concours - ${concours.libcnc || candidat.nupcan}`
                });
                const immediateStatus = mypvitService.mapStatus(mypvitResponse?.status);
                if (immediateStatus === 'rejete') {
                    await Paiement.updatePendingStatus(paiement.id, 'rejete');
                    return res.status(400).json({
                        success: false,
                        message: mypvitResponse?.message || 'MyPVit a refusé la demande de paiement'
                    });
                }
            } else {
                singpayService.assertConfigured();
                const singpayResponse = await singpayService.initiatePayment({
                    amount: officialAmount,
                    reference,
                    phoneNumber: basePaymentData.numero_telephone,
                    method: paiementData.methode
                });

                if (singpayResponse?.status?.success === false) {
                    await Paiement.updatePendingStatus(paiement.id, 'rejete');
                    return res.status(400).json({
                        success: false,
                        message: singpayResponse.status.message || 'SingPay a refusé la demande de paiement'
                    });
                }
            }
        } catch (error) {
            await Paiement.updatePendingStatus(paiement.id, 'rejete');
            throw error;
        }

        return res.status(201).json({
            success: true,
            data: paiement,
            message: paymentProvider === 'mypvit'
                ? 'Demande MyPVit envoyée. Confirmez le paiement sur votre téléphone.'
                : 'Demande SingPay envoyée. Confirmez le paiement sur votre téléphone.'
        });
    } catch (error) {
        console.error('Erreur création paiement:', error.providerResponse || error.message);
        res.status(error.statusCode || 500).json({
            success: false,
            message: error.publicMessage || error.message || 'Erreur lors de la création du paiement',
            code: error.code,
            errors: process.env.NODE_ENV === 'development' ? [error.message] : undefined
        });
    }
});

module.exports = router;
