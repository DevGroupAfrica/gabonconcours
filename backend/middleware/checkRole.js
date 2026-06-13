const { getConnection } = require('../config/database');

// Fonction sécurisée pour vérifier les rôles
const hasRole = async (userId, role) => {
    try {
        const connection = getConnection();
        const [roles] = await connection.execute(
            'SELECT 1 FROM user_roles WHERE user_id = ? AND role = ? LIMIT 1',
            [userId, role]
        );
        return roles.length > 0;
    } catch (error) {
        console.error('Erreur vérification rôle:', error);
        return false;
    }
};

// Middleware pour vérifier un rôle
const checkRole = (requiredRole) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.id || req.body?.admin_id;
            
            if (!userId) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Non authentifié' 
                });
            }
            
            const hasRequiredRole = await hasRole(userId, requiredRole);
            
            if (!hasRequiredRole) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Accès refusé - Rôle insuffisant' 
                });
            }
            
            next();
        } catch (error) {
            console.error('Erreur middleware rôle:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erreur serveur' 
            });
        }
    };
};

module.exports = { hasRole, checkRole };
