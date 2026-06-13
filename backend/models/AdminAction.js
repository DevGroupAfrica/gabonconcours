const { getConnection } = require('../config/database');

class AdminAction {
    /**
     * Créer une nouvelle action admin
     */
    static async create(actionData) {
        const connection = getConnection();
        
        try {
            const [result] = await connection.execute(
                `INSERT INTO admin_actions 
                (admin_id, action_type, entity_type, entity_id, candidat_nupcan, description, details, ip_address)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    actionData.admin_id,
                    actionData.action_type,
                    actionData.entity_type,
                    actionData.entity_id || null,
                    actionData.candidat_nupcan || null,
                    actionData.description,
                    actionData.details ? JSON.stringify(actionData.details) : null,
                    actionData.ip_address || null
                ]
            );
            
            return {
                id: result.insertId,
                ...actionData,
                created_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erreur création action admin:', error);
            throw error;
        }
    }
    
    /**
     * Récupérer toutes les actions avec filtres
     */
    static async findAll(filters = {}) {
        const connection = getConnection();
        
        let query = `
            SELECT aa.*, 
                   a.nom as admin_nom, 
                   a.prenom as admin_prenom, 
                   a.email as admin_email,
                   a.role as admin_role,
                   c.nomcan, c.prncan
            FROM admin_actions aa
            LEFT JOIN administrateurs a ON aa.admin_id = a.id
            LEFT JOIN candidats c ON aa.candidat_nupcan = c.nupcan
            WHERE 1=1
        `;
        
        const params = [];
        
        if (filters.admin_id) {
            query += ' AND aa.admin_id = ?';
            params.push(filters.admin_id);
        }
        
        if (filters.action_type) {
            query += ' AND aa.action_type = ?';
            params.push(filters.action_type);
        }
        
        if (filters.candidat_nupcan) {
            query += ' AND aa.candidat_nupcan = ?';
            params.push(filters.candidat_nupcan);
        }
        
        if (filters.date_debut) {
            query += ' AND aa.created_at >= ?';
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ' AND aa.created_at <= ?';
            params.push(filters.date_fin);
        }
        
        if (filters.etablissement_id) {
            query += ' AND a.etablissement_id = ?';
            params.push(filters.etablissement_id);
        }
        
        query += ' ORDER BY aa.created_at DESC';
        
        if (filters.limit) {
            query += ' LIMIT ?';
            params.push(parseInt(filters.limit));
        }
        
        try {
            const [rows] = await connection.execute(query, params);
            
            // Parser les détails JSON
            return rows.map(row => ({
                ...row,
                details: row.details ? JSON.parse(row.details) : null
            }));
        } catch (error) {
            console.error('Erreur récupération actions admin:', error);
            return [];
        }
    }
    
    /**
     * Récupérer les statistiques des actions
     */
    static async getStats(filters = {}) {
        const connection = getConnection();
        
        let query = `
            SELECT 
                COUNT(*) as total_actions,
                SUM(CASE WHEN action_type = 'validation_document' THEN 1 ELSE 0 END) as validations,
                SUM(CASE WHEN action_type = 'rejet_document' THEN 1 ELSE 0 END) as rejets,
                SUM(CASE WHEN action_type = 'ajout_note' THEN 1 ELSE 0 END) as notes,
                SUM(CASE WHEN action_type = 'reponse_message' THEN 1 ELSE 0 END) as messages,
                DATE(created_at) as date
            FROM admin_actions
            WHERE 1=1
        `;
        
        const params = [];
        
        if (filters.admin_id) {
            query += ' AND admin_id = ?';
            params.push(filters.admin_id);
        }
        
        if (filters.date_debut) {
            query += ' AND created_at >= ?';
            params.push(filters.date_debut);
        }
        
        if (filters.date_fin) {
            query += ' AND created_at <= ?';
            params.push(filters.date_fin);
        }
        
        query += ' GROUP BY DATE(created_at) ORDER BY date DESC';
        
        try {
            const [rows] = await connection.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Erreur stats actions admin:', error);
            return [];
        }
    }
    
    /**
     * Récupérer l'activité récente
     */
    static async getRecentActivity(limit = 50) {
        return this.findAll({ limit });
    }
    
    /**
     * Récupérer les actions par admin
     */
    static async findByAdmin(adminId, limit = 100) {
        return this.findAll({ admin_id: adminId, limit });
    }
    
    /**
     * Récupérer les actions pour un candidat
     */
    static async findByCandidat(nupcan) {
        return this.findAll({ candidat_nupcan: nupcan });
    }
}

module.exports = AdminAction;
