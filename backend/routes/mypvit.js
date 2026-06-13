// routes/mypvit.js
const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const { initPayment, verifyPayment } = require('../services/mypvitService');
const { sendReceiptEmail } = require('../services/emailService');

/**
 * POST /api/mypvit/init
 * Initialise un paiement MyPVIT
 */
router.post('/init', async (req, res) => {
    try {
        const { nupcan, montant, numero_telephone, candidat_id, concours_id } = req.body;

        if (!nupcan || !montant || !numero_telephone) {
            return res.status(400).json({
                success: false,
                message: "Données manquantes (nupcan, montant, numero_telephone)"
            });
        }

        const connection = getConnection();

        // Générer une référence unique
        const reference = `PVIT-${Date.now()}-${nupcan}`;

        // Créer l'enregistrement de paiement
        const [paiementResult] = await connection.execute(
            `INSERT INTO paiements (nupcan, montant, methode, statut, reference_paiement, numero_telephone)
             VALUES (?, ?, 'mypvit', 'en_attente', ?, ?)`,
            [nupcan, montant, reference, numero_telephone]
        );

        // Initialiser le paiement MyPVIT
        const paymentInit = await initPayment({
            reference_paiement: reference,
            montant,
            nupcan,
            numero_telephone,
            candidat_id,
            concours_id
        });

        if (paymentInit.success) {
            // Mettre à jour avec transaction_id si disponible
            if (paymentInit.transaction_id) {
                await connection.execute(
                    `UPDATE paiements SET reference_paiement = ? WHERE id = ?`,
                    [paymentInit.transaction_id, paiementResult.insertId]
                );
            }

            return res.json({
                success: true,
                message: "Paiement initialisé",
                data: {
                    payment_id: paiementResult.insertId,
                    reference: reference,
                    transaction_id: paymentInit.transaction_id,
                    payment_url: paymentInit.payment_url,
                    ussd_code: paymentInit.ussd_code
                }
            });
        } else {
            // Supprimer le paiement en cas d'échec
            await connection.execute(`DELETE FROM paiements WHERE id = ?`, [paiementResult.insertId]);
            
            return res.status(500).json({
                success: false,
                message: paymentInit.message
            });
        }
    } catch (error) {
        console.error("❌ Erreur init MyPVIT:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de l'initialisation du paiement"
        });
    }
});

/**
 * POST /api/mypvit/callback
 * Callback MyPVIT pour mise à jour automatique du statut
 */
router.post('/callback', async (req, res) => {
    try {
        console.log("🔔 MyPVIT Callback reçu:", req.body);

        const { transaction_id, status, reference, metadata } = req.body;

        if (!transaction_id) {
            return res.status(400).json({ success: false, message: "transaction_id manquant" });
        }

        const connection = getConnection();

        // Mettre à jour le statut du paiement
        const newStatus = status === 'success' || status === 'completed' ? 'valide' : 'echoue';
        
        await connection.execute(
            `UPDATE paiements SET statut = ?, updated_at = NOW() 
             WHERE reference_paiement = ? OR reference_paiement = ?`,
            [newStatus, transaction_id, reference]
        );

        // Si paiement validé, vérifier si tous les documents sont validés
        if (newStatus === 'valide' && metadata) {
            const meta = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
            const nupcan = meta.nupcan;

            if (nupcan) {
                // Récupérer le candidat
                const [candidats] = await connection.execute(
                    `SELECT * FROM candidats WHERE nupcan = ?`,
                    [nupcan]
                );

                if (candidats.length > 0) {
                    const candidat = candidats[0];

                    // Vérifier si tous les documents sont validés
                    const [documents] = await connection.execute(
                        `SELECT COUNT(*) as total, 
                         SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as valides
                         FROM documents WHERE nupcan = ?`,
                        [nupcan]
                    );

                    const { total, valides } = documents[0];

                    // Si tous les documents ET le paiement sont validés, changer le statut
                    if (total > 0 && total === valides) {
                        await connection.execute(
                            `UPDATE candidats SET statut = 'valide' WHERE nupcan = ?`,
                            [nupcan]
                        );

                        // Créer notification
                        await connection.execute(
                            `INSERT INTO notifications (candidat_nupcan, type, titre, message, statut)
                             VALUES (?, 'validation', 'Candidature validée', 'Votre candidature a été validée avec succès. Tous vos documents et votre paiement ont été approuvés.', 'non_lu')`,
                            [nupcan]
                        );

                        // Envoyer email
                        if (candidat.maican) {
                            await sendReceiptEmail({
                                to: candidat.maican,
                                nupcan: nupcan,
                                candidatData: { candidat }
                            }).catch(err => console.error("Erreur envoi email:", err));
                        }
                    }
                }
            }
        }

        res.json({ success: true, message: "Callback traité" });
    } catch (error) {
        console.error("❌ Erreur callback MyPVIT:", error);
        res.status(500).json({ success: false, message: "Erreur traitement callback" });
    }
});

/**
 * GET /api/mypvit/status/:transaction_id
 * Vérifier le statut d'un paiement
 */
router.get('/status/:transaction_id', async (req, res) => {
    try {
        const { transaction_id } = req.params;
        const result = await verifyPayment(transaction_id);
        res.json(result);
    } catch (error) {
        console.error("❌ Erreur vérification paiement:", error);
        res.status(500).json({
            success: false,
            message: "Erreur lors de la vérification du paiement"
        });
    }
});

module.exports = router;
