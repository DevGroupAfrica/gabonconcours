const {getConnection} = require('../config/database');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

class Admin {
    static async findAll(filters = {}) {
        const connection = getConnection();
        let query = `
      SELECT a.*, e.nomets as etablissement_nom
      FROM administrateurs a
      LEFT JOIN etablissements e ON a.etablissement_id = e.id
    `;

        const conditions = [];
        const values = [];

        if (filters.role) {
            conditions.push('a.role = ?');
            values.push(filters.role);
        }

        if (filters.etablissement_id) {
            conditions.push('a.etablissement_id = ?');
            values.push(filters.etablissement_id);
        }

        if (conditions.length > 0) {
            query += ' WHERE ' + conditions.join(' AND ');
        }
        if(filters.admin_role){
            conditions.push('a.admin_role = ?');
            values.push(filters.admin_role);
        }

        query += ' ORDER BY a.created_at DESC';

        const [rows] = await connection.execute(query, values);
        return rows;
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT a.*, e.nomets as etablissement_nom
       FROM administrateurs a
       LEFT JOIN etablissements e ON a.etablissement_id = e.id
       WHERE a.id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async findByEmail(email) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT a.*, e.nomets as etablissement_nom
       FROM administrateurs a
       LEFT JOIN etablissements e ON a.etablissement_id = e.id
       WHERE a.email = ?`,
            [email]
        );
        return rows[0] || null;
    }

    static async create(adminData, createdBy = null) {
        const connection = getConnection();

        let password, hashedPassword;

        // Pour le super admin, utiliser un mot de passe fixe
        if (adminData.role === 'super_admin') {
            password = 'admin123';
            hashedPassword = await bcrypt.hash(password, 12);
        } else {
            // Pour les autres admins, générer un mot de passe temporaire
            password = crypto.randomBytes(8).toString('hex');
            hashedPassword = await bcrypt.hash(password, 12);
        }

        const [result] = await connection.execute(
            `INSERT INTO administrateurs (nom, prenom, email, password, role, etablissement_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                adminData.nom,
                adminData.prenom,
                adminData.email,
                hashedPassword,
                adminData.role,
                adminData.etablissement_id || null,
                createdBy
            ]
        );

        const newAdmin = await this.findById(result.insertId);

        // Retourner l'admin avec le mot de passe pour information
        return {
            ...newAdmin,
            temp_password: password
        };
    }


    static async update(id, adminData) {
        const connection = getConnection();

        const fields = [];
        const values = [];

        if (adminData.nom) {
            fields.push('nom = ?');
            values.push(adminData.nom);
        }

        if (adminData.prenom) {
            fields.push('prenom = ?');
            values.push(adminData.prenom);
        }

        if (adminData.email) {
            fields.push('email = ?');
            values.push(adminData.email);
        }

        if (adminData.statut) {
            fields.push('statut = ?');
            values.push(adminData.statut);
        }

        if (adminData.etablissement_id !== undefined) {
            fields.push('etablissement_id = ?');
            values.push(adminData.etablissement_id);
        }

        if (fields.length === 0) {
            throw new Error('Aucune donnée à mettre à jour');
        }

        values.push(id);

        await connection.execute(
            `UPDATE administrateurs SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    static async updatePassword(id, newPassword) {
        const connection = getConnection();
        const hashedPassword = await bcrypt.hash(newPassword, 12);

        await connection.execute(
            'UPDATE administrateurs SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
            [hashedPassword, id]
        );

        return true;
    }

    static async updateLastLogin(id) {
        const connection = getConnection();
        await connection.execute(
            'UPDATE administrateurs SET derniere_connexion = CURRENT_TIMESTAMP WHERE id = ?',
            [id]
        );
    }

    static async verifyPassword(email, password) {
        const admin = await this.findByEmail(email);
        if (!admin || admin.statut !== 'actif') {
            return null;
        }

        const isValid = await bcrypt.compare(password, admin.password);
        if (!isValid) {
            return null;
        }

        await this.updateLastLogin(admin.id);
        return admin;
    }

    static async delete(id) {
        const connection = getConnection();
        const [result] = await connection.execute(
            'DELETE FROM administrateurs WHERE id = ? AND role != "super_admin"',
            [id]
        );
        return result.affectedRows > 0;
    }

    static async createPasswordResetToken(email) {
        const connection = getConnection();
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 3600000); // 1 heure

        await connection.execute(
            'UPDATE administrateurs SET password_reset_token = ?, password_reset_expires = ? WHERE email = ?',
            [token, expires, email]
        );

        return token;
    }

    static async resetPassword(token, newPassword) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT id FROM administrateurs WHERE password_reset_token = ? AND password_reset_expires > NOW()',
            [token]
        );

        if (rows.length === 0) {
            throw new Error('Token invalide ou expiré');
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);
        await connection.execute(
            'UPDATE administrateurs SET password = ?, password_reset_token = NULL, password_reset_expires = NULL WHERE id = ?',
            [hashedPassword, rows[0].id]
        );

        return true;
    }
}

module.exports = Admin;
