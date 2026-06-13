const { getConnection } = require('../config/database');

class AdminLog {
    static async create(logData) {
        const connection = getConnection();
        
        const [result] = await connection.execute(
            `INSERT INTO admin_logs (admin_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
            [
                logData.admin_id,
                logData.action,
                logData.table_name,
                logData.record_id || null,
                JSON.stringify(logData.old_values || {}),
                JSON.stringify(logData.new_values || {}),
                logData.ip_address || null,
                logData.user_agent || null
            ]
        );
        
        return {
            id: result.insertId,
            ...logData,
            created_at: new Date().toISOString()
        };
    }
    
    static async findAll(filters = {}) {
        const connection = getConnection();
        let query = `
            SELECT al.*, a.nom as admin_nom, a.prenom as admin_prenom
            FROM admin_logs al
            LEFT JOIN administrateurs a ON al.admin_id = a.id
            WHERE 1=1
        `;
        const values = [];
        
        if (filters.admin_id) {
            query += ' AND al.admin_id = ?';
            values.push(filters.admin_id);
        }
        
        if (filters.table_name) {
            query += ' AND al.table_name = ?';
            values.push(filters.table_name);
        }
        
        query += ' ORDER BY al.created_at DESC LIMIT 1000';
        
        const [rows] = await connection.execute(query, values);
        return rows;
    }
}

module.exports = AdminLog;
