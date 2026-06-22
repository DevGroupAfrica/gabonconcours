const cors = require('cors');

const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:8001',
    'http://localhost:8001',
    'http://127.0.0.1:8001',
    'https://gabonconcours.vercel.app',
    "http://gabconcours.devgroup.ga", 
    "https://gabconcours.devgroup.ga",
    "http://api.gabconcours.devgroup.ga", 
    "https://api.gabconcours.devgroup.ga"
];

const corsOptions = {
    origin(origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
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