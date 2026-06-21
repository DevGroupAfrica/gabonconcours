const axios = require('axios');

const DEFAULT_BASE_URL = 'https://gateway.singpay.ga/v1';

const getConfig = () => ({
    baseURL: (process.env.SINGPAY_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, ''),
    clientId: process.env.SINGPAY_CLIENT_ID,
    clientSecret: process.env.SINGPAY_CLIENT_SECRET,
    walletId: process.env.SINGPAY_WALLET_ID,
    disbursement: process.env.SINGPAY_DISBURSEMENT || undefined,
    timeout: Number(process.env.SINGPAY_TIMEOUT_MS || 30000)
});

const assertConfigured = () => {
    const config = getConfig();
    const missing = [];

    if (!config.clientId) missing.push('SINGPAY_CLIENT_ID');
    if (!config.clientSecret) missing.push('SINGPAY_CLIENT_SECRET');
    if (!config.walletId) missing.push('SINGPAY_WALLET_ID');

    if (missing.length > 0) {
        const error = new Error(`Configuration SingPay incomplète: ${missing.join(', ')}`);
        error.code = 'SINGPAY_NOT_CONFIGURED';
        error.statusCode = 503;
        error.publicMessage = 'Le service de paiement est temporairement indisponible. Contactez l’administrateur.';
        throw error;
    }

    return config;
};

const buildHeaders = (config, includeWallet = true) => ({
    'Content-Type': 'application/json',
    'x-client-id': config.clientId,
    'x-client-secret': config.clientSecret,
    ...(includeWallet ? {'x-wallet': config.walletId} : {})
});

const normalizePhoneNumber = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    const countryCode = String(process.env.SINGPAY_PHONE_COUNTRY_CODE || '241');

    if (digits.startsWith(countryCode)) return digits;
    if (digits.startsWith('0')) return `${countryCode}${digits.slice(1)}`;
    return `${countryCode}${digits}`;
};

const getProviderPath = (method) => {
    if (method === 'airtel_money') return '/74/paiement';
    if (method === 'moov') return '/62/paiement';
    throw new Error('Méthode SingPay non prise en charge');
};

const getApiErrorMessage = (error) => {
    const responseData = error.response?.data;
    if (typeof responseData === 'string' && responseData.trim()) {
        return responseData.trim();
    }

    return responseData?.status?.message
        || responseData?.message
        || error.message
        || 'Erreur de communication avec SingPay';
};

const createSingPayError = (error) => {
    const providerResponse = error.response?.data;
    const providerMessage = getApiErrorMessage(error);
    const walletPending = error.response?.status === 401
        && /wallet not accepted|status:\s*pending/i.test(String(providerResponse || providerMessage));

    const singpayError = new Error(providerMessage);
    singpayError.statusCode = walletPending ? 503 : (error.response?.status || 502);
    singpayError.providerResponse = providerResponse;

    if (walletPending) {
        singpayError.code = 'SINGPAY_WALLET_PENDING';
        singpayError.publicMessage = 'Le portefeuille SingPay est en attente d’activation. Veuillez contacter SingPay ou valider le portefeuille dans SingPay Workspace.';
    }

    return singpayError;
};

async function initiatePayment({amount, reference, phoneNumber, method}) {
    const config = assertConfigured();
    const payload = {
        amount: Number(amount),
        reference,
        client_msisdn: normalizePhoneNumber(phoneNumber),
        portefeuille: config.walletId,
        isTransfer: false,
        ...(config.disbursement ? {disbursement: config.disbursement} : {})
    };

    try {
        const response = await axios.post(
            `${config.baseURL}${getProviderPath(method)}`,
            payload,
            {
                headers: buildHeaders(config),
                timeout: config.timeout
            }
        );

        return response.data;
    } catch (error) {
        throw createSingPayError(error);
    }
}

async function findTransactionByReference(reference) {
    const config = assertConfigured();

    try {
        const response = await axios.get(
            `${config.baseURL}/transaction/api/search/by-reference/${encodeURIComponent(reference)}`,
            {
                headers: buildHeaders(config),
                timeout: config.timeout
            }
        );

        return response.data?.transaction || response.data;
    } catch (error) {
        throw createSingPayError(error);
    }
}

function mapTransactionStatus(transaction) {
    const status = String(transaction?.status || '').toLowerCase();
    const result = String(transaction?.result || '').toLowerCase();

    if (result === 'success') return 'valide';

    if (
        status === 'terminate'
        && ['passworderror', 'balanceerror', 'timeouterror', 'error'].includes(result)
    ) {
        return 'rejete';
    }

    return 'en_attente';
}

module.exports = {
    assertConfigured,
    initiatePayment,
    findTransactionByReference,
    mapTransactionStatus,
    normalizePhoneNumber
};
