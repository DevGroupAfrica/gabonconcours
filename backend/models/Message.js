const { getConnection } = require('../config/database');

class Message {
    static async create(messageData) {
        const connection = getConnection();
        
        const [result] = await connection.execute(
            `INSERT INTO messages (candidat_id, sender_type, sender_id, message, lu, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
                messageData.candidat_id,
                messageData.sender_type, // 'candidat' ou 'admin'
                messageData.sender_id,
                messageData.message,
                false
            ]
        );
        
        return {
            id: result.insertId,
            ...messageData,
            lu: false,
            created_at: new Date().toISOString()
        };
    }
    
    static async findByCandidatId(candidat_id) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            `SELECT m.*, 
                    c.nomcan, c.prncan,
                    a.nom as admin_nom, a.prenom as admin_prenom
             FROM messages m
             LEFT JOIN candidats c ON m.candidat_id = c.id
             LEFT JOIN administrateurs a ON m.sender_id = a.id AND m.sender_type = 'admin'
             WHERE m.candidat_id = ?
             ORDER BY m.created_at ASC`,
            [candidat_id]
        );
        
        return rows;
    }
    
    static async markAsRead(id) {
        const connection = getConnection();
        
        await connection.execute(
            'UPDATE messages SET lu = true WHERE id = ?',
            [id]
        );
    }
    
    static async getUnreadCount(candidat_id) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            'SELECT COUNT(*) as count FROM messages WHERE candidat_id = ? AND lu = false AND sender_type = "admin"',
            [candidat_id]
        );
        
        return rows[0].count;
    }
}

module.exports = Message;
