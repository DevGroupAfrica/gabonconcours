const { getConnection } = require('../config/database');

class SupportRequest {
    // Récupérer toutes les demandes
    static async findAll() {
        const connection = await getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM support_requests ORDER BY createdAt DESC'
        );
        return rows;
    }

    // Récupérer une demande par ID
    static async findById(id) {
        const connection = await getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM support_requests WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    // Créer une demande
    static async create(data) {
        const connection = await getConnection();
        const createdAt = new Date();
        const [result] = await connection.execute(
            'INSERT INTO support_requests (name, email, message, createdAt) VALUES (?, ?, ?, ?)',
            [data.name, data.email, data.message, createdAt]
        );
        return { id: result.insertId, ...data, createdAt };
    }

    // Mettre à jour une demande
    static async update(id, data) {
        const connection = await getConnection();
        const fields = [];
        const values = [];

        for (let key in data) {
            fields.push(`${key} = ?`);
            values.push(data[key]);
        }
        values.push(id);

        await connection.execute(
            `UPDATE support_requests SET ${fields.join(', ')} WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    // Ajouter une réponse
    static async addResponse({ support_request_id, admin_id, message, is_internal_note }) {
        const connection = await getConnection();
        const createdAt = new Date();
        const [result] = await connection.execute(
            'INSERT INTO support_responses (support_request_id, admin_id, message, is_internal_note, createdAt) VALUES (?, ?, ?, ?, ?)',
            [support_request_id, admin_id, message, is_internal_note ? 1 : 0, createdAt]
        );

        return { id: result.insertId, support_request_id, admin_id, message, is_internal_note, createdAt };
    }

    // Récupérer toutes les réponses d'une demande
    static async getResponses(support_request_id) {
        const connection = await getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM support_responses WHERE support_request_id = ? ORDER BY createdAt ASC',
            [support_request_id]
        );
        return rows;
    }
}

module.exports = SupportRequest;
