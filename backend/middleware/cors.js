const cors = require('cors');

const configuredOrigins = [
    process.env.FRONTEND_URL,
    ...(process.env.CORS_ORIGINS || '').split(',')
]
    .map(origin => origin && origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

const allowedOrigins = [
    ...configuredOrigins,
    'http://localhost:8001',
    'http://127.0.0.1:8001',
    'https://gabonconcours.devgroup.ga',
    'https://gabonconcours.devgroupe.ga'
];

const corsOptions = {
    origin(origin, callback) {
        const normalizedOrigin = origin && origin.replace(/\/+$/, '');
        if (!normalizedOrigin || allowedOrigins.includes(normalizedOrigin)) {
            return callback(null, true);
        }

        return callback(new Error(`Origine CORS non autorisée: ${origin}`));
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
};

module.exports = cors(corsOptions);
