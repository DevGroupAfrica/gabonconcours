const { getConnection } = require('../config/database');

class Notification {
    static async create(notificationData) {
        const connection = getConnection();

        try {
            const [result] = await connection.execute(
                `INSERT INTO notifications (candidat_id, type, titre, message, statut, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
                [
                    notificationData.candidat_id,
                    notificationData.type || 'info',
                    notificationData.titre,
                    notificationData.message,
                    notificationData.statut || false
                ]
            );

            return {
                id: result.insertId,
                ...notificationData,
                created_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Erreur création notification:', error);
            throw error;
        }
    }

    static async findByCandidat(candidatId) {
        const connection = getConnection();

        try {
            const [rows] = await connection.execute(
                `SELECT * FROM notifications WHERE candidat_id = ? ORDER BY created_at DESC`,
                [candidatId]
            );
            return rows;
        } catch (error) {
            console.error('Erreur récupération notifications:', error);
            return [];
        }
    }

    static async markAsRead(id) {
        const connection = getConnection();

        try {
            await connection.execute(
                'UPDATE notifications SET lu = true WHERE id = ?',
                [id]
            );
            return { success: true };
        } catch (error) {
            console.error('Erreur marquage notification:', error);
            throw error;
        }
    }

    static async delete(id) {
        const connection = getConnection();

        try {
            await connection.execute('DELETE FROM notifications WHERE id = ?', [id]);
            return { success: true };
        } catch (error) {
            console.error('Erreur suppression notification:', error);
            throw error;
        }
    }

    static async deleteAllByCandidat(candidatId) {
        const connection = getConnection();

        try {
            await connection.execute('DELETE FROM notifications WHERE candidat_id = ?', [candidatId]);
            return { success: true };
        } catch (error) {
            console.error('Erreur suppression notifications:', error);
            throw error;
        }
    }
}

module.exports = Notification;
