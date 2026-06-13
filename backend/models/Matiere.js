const {getConnection} = require('../config/database');

class Matiere {
    static async findAll() {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT * FROM matieres ORDER BY nom_matiere ASC`
        );
        return rows;
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT * FROM matieres WHERE id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async create(matiereData) {
        const connection = getConnection();
        const [result] = await connection.execute(
            `INSERT INTO matieres (nom_matiere, coefficient, duree, description)
       VALUES (?, ?, ?, ?)`,
            [
                matiereData.nom_matiere,
                matiereData.coefficient || null,
                matiereData.duree || null,
                matiereData.description || null
            ]
        );

        return this.findById(result.insertId);
    }

    static async update(id, matiereData) {
        const connection = getConnection();
        const fields = Object.keys(matiereData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(matiereData), id];

        await connection.execute(
            `UPDATE matieres SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    static async delete(id) {
        const connection = getConnection();
        await connection.execute('DELETE FROM matieres WHERE id = ?', [id]);
        return {success: true};
    }
}

module.exports = Matiere;
