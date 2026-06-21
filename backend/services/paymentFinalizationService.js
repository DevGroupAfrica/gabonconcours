const Paiement = require('../models/Paiement');
const Candidat = require('../models/Candidat');
const Concours = require('../models/Concours');

async function finalizeValidatedPayment(paiement) {
    const candidat = paiement.candidat_id
        ? await Candidat.findById(paiement.candidat_id)
        : await Candidat.findByNupcan(paiement.nupcan);
    const concours = paiement.concours_id
        ? await Concours.findById(paiement.concours_id)
        : candidat?.concours_id
            ? await Concours.findById(candidat.concours_id)
            : null;

    if (!candidat || !concours) {
        console.warn('Paiement validé sans contexte complet pour la finalisation:', paiement.id);
        return;
    }

    let receiptGenerated = false;
    let emailSent = false;

    try {
        const pdfService = require('./pdfService');
        const receipt = await pdfService.generatePaymentReceipt(candidat, paiement, concours);
        await Paiement.update(paiement.id, {recu_path: receipt.relativePath});
        receiptGenerated = true;
    } catch (error) {
        console.error('Paiement validé, mais erreur génération du reçu:', error.message);
    }

    if (candidat.maican) {
        try {
        const paymentEmailService = require('./paymentEmailService');
        await paymentEmailService.sendPaymentReceipt({
            to: candidat.maican,
            candidat: {
                nom: candidat.nomcan,
                prenom: candidat.prncan,
                nupcan: candidat.nupcan,
                email: candidat.maican
            },
            montant: paiement.montant,
            reference: paiement.reference_paiement,
            concours: concours.libcnc || concours.nom,
            date: paiement.created_at || new Date()
        });
            emailSent = true;
        } catch (error) {
            console.error('Paiement validé, mais email non envoyé:', error.message);
        }
    }

    try {
        const Notification = require('../models/Notification');
        await Notification.create({
            candidat_id: candidat.id,
            type: 'paiement',
            titre: 'Paiement confirmé',
            message: emailSent
                ? `Votre paiement de ${paiement.montant} FCFA a été validé. Le reçu a été envoyé à votre email.`
                : `Votre paiement de ${paiement.montant} FCFA a été validé.${receiptGenerated ? ' Votre reçu est disponible dans votre espace candidat.' : ''}`,
            lu: false
        });
    } catch (error) {
        console.error('Paiement validé, mais notification interne non créée:', error.message);
    }

    try {
        const ParticipationService = require('./participationService');
        await ParticipationService.checkAndUpdateParticipationStatus(candidat.id, concours.id);
    } catch (error) {
        console.error('Paiement validé, mais statut de participation non actualisé:', error.message);
    }

    return {receiptGenerated, emailSent};
}

module.exports = {finalizeValidatedPayment};
