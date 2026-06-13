const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');

// Fonction helper pour log
async function createLog(user_type, user_id, action, details = null, etablissement_id = null, ip_address = null) {
    try {
        const connection = getConnection();
        await connection.execute(
            `INSERT INTO logs (user_type, user_id, action, details, etablissement_id, ip_address, created_at)
             VALUES (?, ?, ?, ?, ?, ?, NOW())`,
            [user_type, user_id, action, details, etablissement_id, ip_address]
        );
    } catch (error) {
        console.error('Erreur création log:', error);
    }
}

// Middleware pour logger les actions admin
const logAdminAction = (action) => {
    return async (req, res, next) => {
        const adminData = req.admin || req.body.admin_id || null;
        const ip = req.ip || req.connection.remoteAddress;
        
        if (adminData) {
            await createLog(
                'admin',
                adminData.id || adminData,
                action,
                JSON.stringify({
                    method: req.method,
                    path: req.path,
                    body: req.body
                }),
                adminData.etablissement_id || null,
                ip
            );
        }
        next();
    };
};

// Middleware pour logger les actions candidat
const logCandidatAction = (action) => {
    return async (req, res, next) => {
        const candidatData = req.candidat || req.body.candidat_id || null;
        const ip = req.ip || req.connection.remoteAddress;
        
        if (candidatData) {
            await createLog(
                'candidat',
                candidatData.id || candidatData,
                action,
                JSON.stringify({
                    method: req.method,
                    path: req.path
                }),
                null,
                ip
            );
        }
        next();
    };
};

module.exports = {
    createLog,
    logAdminAction,
    logCandidatAction
};
