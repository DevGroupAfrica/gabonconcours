const axios = require('axios');

let cachedSecret = null;
let secretExpiresAt = 0;
let pendingSecretResolver = null;

const getConfig = () => ({
    baseURL: (process.env.MYPVIT_BASE_URL || 'https://api.mypvit.pro').replace(/\/+$/, ''),
    operationAccountCode: process.env.MYPVIT_OPERATION_ACCOUNT_CODE,
    password: process.env.MYPVIT_API_PASSWORD,
    renewPath: process.env.MYPVIT_RENEW_PATH,
    restPath: process.env.MYPVIT_REST_PATH,
    statusPath: process.env.MYPVIT_STATUS_PATH,
    receptionUrlCode: process.env.MYPVIT_RECEPTION_URL_CODE,
    callbackUrlCode: process.env.MYPVIT_CALLBACK_URL_CODE,
    timeout: Number(process.env.MYPVIT_TIMEOUT_MS || 30000)
});

const assertConfigured = (requirements = ['operationAccountCode', 'password', 'renewPath']) => {
    const config = getConfig();
    const labels = {
        operationAccountCode: 'MYPVIT_OPERATION_ACCOUNT_CODE',
        password: 'MYPVIT_API_PASSWORD',
        renewPath: 'MYPVIT_RENEW_PATH',
        restPath: 'MYPVIT_REST_PATH',
        statusPath: 'MYPVIT_STATUS_PATH',
        receptionUrlCode: 'MYPVIT_RECEPTION_URL_CODE',
        callbackUrlCode: 'MYPVIT_CALLBACK_URL_CODE'
    };
    const missing = requirements.filter((key) => !config[key]).map((key) => labels[key]);

    if (missing.length) {
        const error = new Error(`Configuration MyPVit incomplète: ${missing.join(', ')}`);
        error.code = 'MYPVIT_NOT_CONFIGURED';
        error.statusCode = 503;
        throw error;
    }

    return config;
};

const normalizePath = (path) => path.startsWith('/') ? path : `/${path}`;

const truncate = (value, maxLength) => String(value || '').trim().slice(0, maxLength);

const normalizePhoneNumber = (value) => {
    const digits = String(value || '').replace(/\D/g, '');
    if (digits.startsWith('241')) return `0${digits.slice(3)}`;
    if (digits.startsWith('0')) return digits;
    return `0${digits}`;
};

const operatorFromMethod = (method) => {
    if (method === 'airtel_money') return 'AIRTEL_MONEY';
    if (method === 'moov') return 'MOOV_MONEY';
    throw new Error('Opérateur MyPVit non pris en charge');
};

const validateOperatorPhone = (phoneNumber, method) => {
    const normalized = normalizePhoneNumber(phoneNumber);
    const prefixes = method === 'airtel_money'
        ? ['074', '076']
        : method === 'moov'
            ? ['060', '062', '066']
            : [];

    if (normalized.length !== 9 || !prefixes.some((prefix) => normalized.startsWith(prefix))) {
        const operator = method === 'airtel_money' ? 'Airtel Money' : 'Moov Money';
        const error = new Error(`Le numéro fourni n’est pas un numéro ${operator} valide.`);
        error.statusCode = 400;
        error.code = 'MYPVIT_INVALID_OPERATOR_PHONE';
        throw error;
    }

    return normalized;
};

const extractApiMessage = (error) => {
    const data = error.response?.data;
    if (Array.isArray(data?.messages) && data.messages.length) {
        return data.messages
            .map((message) => typeof message === 'string'
                ? message
                : message?.message || message?.defaultMessage || JSON.stringify(message))
            .join(' ');
    }
    return data?.message || data?.error || error.message || 'Erreur MyPVit';
};

const createApiError = (error) => {
    const apiError = new Error(extractApiMessage(error));
    apiError.statusCode = error.response?.status || 502;
    apiError.code = error.response?.data?.error || 'MYPVIT_API_ERROR';
    apiError.providerResponse = error.response?.data;
    return apiError;
};

const receiveSecret = (payload) => {
    const secret = payload?.secret_key
        || payload?.secret
        || payload?.['X-Secret']
        || payload?.x_secret
        || payload?.token;
    if (!secret) return false;

    const expiresIn = Number(payload?.expires_in || payload?.expiresIn || 3600);
    cachedSecret = secret;
    secretExpiresAt = Date.now() + Math.max(60, expiresIn - 60) * 1000;

    if (pendingSecretResolver) {
        pendingSecretResolver(secret);
        pendingSecretResolver = null;
    }

    return true;
};

const waitForDeliveredSecret = (timeoutMs = 12000) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
        if (pendingSecretResolver) pendingSecretResolver = null;
        reject(new Error('MyPVit n’a pas livré la clé secrète dans le délai prévu'));
    }, timeoutMs);

    pendingSecretResolver = (secret) => {
        clearTimeout(timer);
        resolve(secret);
    };
});

async function renewSecret() {
    const config = assertConfigured([
        'operationAccountCode',
        'password',
        'renewPath',
        'receptionUrlCode'
    ]);
    const secretPromise = waitForDeliveredSecret();
    const body = new URLSearchParams({
        operationAccountCode: config.operationAccountCode,
        receptionUrlCode: config.receptionUrlCode,
        password: config.password
    });

    const response = await axios.post(
        `${config.baseURL}${normalizePath(config.renewPath)}`,
        body.toString(),
        {
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            timeout: config.timeout
        }
    );

    if (receiveSecret(response.data)) return cachedSecret;
    return secretPromise;
}

async function getSecret() {
    if (cachedSecret && Date.now() < secretExpiresAt) return cachedSecret;
    return renewSecret();
}

async function initPayment(paiementData) {
    const config = assertConfigured([
        'operationAccountCode',
        'restPath',
        'callbackUrlCode'
    ]);
    const amount = Number(paiementData.montant);

    if (!Number.isFinite(amount) || amount <= 500) {
        const error = new Error('MyPVit exige un montant supérieur à 500 FCFA.');
        error.statusCode = 400;
        error.code = 'MYPVIT_AMOUNT_TOO_LOW';
        throw error;
    }

    const secret = await getSecret();
    const customerAccountNumber = validateOperatorPhone(
        paiementData.numero_telephone,
        paiementData.methode
    );
    const payload = {
        amount,
        callback_url_code: config.callbackUrlCode,
        customer_account_number: customerAccountNumber,
        merchant_operation_account_code: config.operationAccountCode,
        transaction_type: 'PAYMENT',
        owner_charge: process.env.MYPVIT_OWNER_CHARGE || 'MERCHANT',
        owner_charge_operator: process.env.MYPVIT_OPERATOR_OWNER_CHARGE || 'MERCHANT',
        free_info: truncate(paiementData.nupcan, 50),
        product: truncate(paiementData.description || 'Frais concours', 15),
        operator_code: operatorFromMethod(paiementData.methode),
        reference: truncate(paiementData.reference_paiement, 15),
        service: 'RESTFUL'
    };

    try {
        const response = await axios.post(
            `${config.baseURL}${normalizePath(config.restPath)}`,
            payload,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Secret': secret,
                    'X-Callback-MediaType': 'application/json'
                },
                timeout: config.timeout
            }
        );

        return response.data;
    } catch (error) {
        throw createApiError(error);
    }
}

async function verifyPayment(reference) {
    const config = assertConfigured([
        'operationAccountCode',
        'statusPath'
    ]);
    const secret = await getSecret();
    const response = await axios.get(
        `${config.baseURL}${normalizePath(config.statusPath)}`,
        {
            headers: {'X-Secret': secret},
            params: {
                transactionId: reference,
                accountOperationCode: config.operationAccountCode,
                transactionOperation: 'PAYMENT'
            },
            timeout: config.timeout
        }
    );

    return response.data;
}

const mapStatus = (status) => {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'SUCCESS') return 'valide';
    if (normalized === 'FAILED') return 'rejete';
    return 'en_attente';
};

module.exports = {
    assertConfigured,
    renewSecret,
    initPayment,
    verifyPayment,
    receiveSecret,
    mapStatus,
    truncate,
    normalizePhoneNumber,
    validateOperatorPhone,
    operatorFromMethod
};
