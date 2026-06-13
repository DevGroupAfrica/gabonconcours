// services/cinetpayService.js
const axios = require('axios');

const CINETPAY_API_KEY = process.env.CINETPAY_API_KEY;
const CINETPAY_SITE_ID = process.env.CINETPAY_SITE_ID;
const CINETPAY_BASE_URL = "https://api-checkout.cinetpay.com/v2/payment";

async function initPayment(paiementData) {
    try {
        const payload = {
            apikey: CINETPAY_API_KEY,
            site_id: CINETPAY_SITE_ID,
            transaction_id: paiementData.reference_paiement,
            amount: paiementData.montant,
            currency: "XAF",
            description: `Paiement concours - ${paiementData.nupcan}`,
            notify_url: "https://ton-domaine.com/api/paiements/cinetpay/callback",
            return_url: "https://ton-domaine.com/succes/" + encodeURIComponent(paiementData.nupcan),
            channels: "MOBILE_MONEY",
            lang: "fr",
            metadata: JSON.stringify({
                nupcan: paiementData.nupcan,
                methode: paiementData.methode
            }),
            customer_name: paiementData.nupcan,
            customer_surname: "",
            customer_email: "noreply@concours.ga",
            customer_phone_number: paiementData.numero_telephone
        };

        console.log("Initialisation CinetPay :", payload);

        const response = await axios.post(`${CINETPAY_BASE_URL}`, payload);

        if (response.data.code === "201" || response.data.code === "00") {
            return {
                success: true,
                message: "Paiement initialisé avec succès",
                payment_url: response.data.data.payment_url,
                token: response.data.data.payment_token
            };
        } else {
            throw new Error(response.data.description || "Erreur CinetPay");
        }
    } catch (error) {
        console.error("Erreur initPayment CinetPay:", error.message);
        return {
            success: false,
            message: error.message
        };
    }
}

async function verifyPayment(transaction_id) {
    try {
        const payload = {
            apikey: CINETPAY_API_KEY,
            site_id: CINETPAY_SITE_ID,
            transaction_id
        };

        const response = await axios.post("https://api-checkout.cinetpay.com/v2/payment/check", payload);

        return response.data;
    } catch (error) {
        console.error("Erreur verifyPayment:", error.message);
        throw error;
    }
}

module.exports = { initPayment, verifyPayment };
