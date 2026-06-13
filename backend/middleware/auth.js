const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        console.log('Auth: Aucun token fourni'); // Log ajouté
        return res.status(401).json({
            success: false,
            message: 'Token d\'accès requis'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'votre_secret_jwt', (err, decoded) => {
        if (err) {
            console.log('Auth: Token invalide', err.message); // Log ajouté
            return res.status(403).json({
                success: false,
                message: 'Token invalide'
            });
        }

        req.admin = {
            adminId: decoded.adminId || decoded.id,
            id: decoded.adminId || decoded.id,
            role: decoded.role || 'admin_etablissement',
            etablissement_id: decoded.etablissement_id || null,
            nom: decoded.nom,
            prenom: decoded.prenom,
            email: decoded.email,
            admin_role: decoded.admin_role || 'notes'  
        };

        console.log('Auth: Admin authentifié', req.admin.email);
        next();
    });
};

const authenticateAdmin = authenticateToken;

module.exports = {authenticateToken, authenticateAdmin};