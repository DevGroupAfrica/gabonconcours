const {getConnection} = require('../config/database');

class Filiere {
    static async findAll() {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT f.*, n.nomniv as niveau_nomniv
       FROM filieres f
       LEFT JOIN niveaux n ON f.niveau_id = n.id
       ORDER BY f.nomfil ASC`
        );
        return rows;
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT f.*, n.nomniv as niveau_nomniv
       FROM filieres f
       LEFT JOIN niveaux n ON f.niveau_id = n.id
       WHERE f.id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async findWithMatieres(id) {
        const connection = getConnection();
        const [filiere] = await connection.execute(
            `SELECT f.*, n.nomniv as niveau_nomniv
       FROM filieres f
       LEFT JOIN niveaux n ON f.niveau_id = n.id
       WHERE f.id = ?`,
            [id]
        );

        if (!filiere[0]) return null;

        const [matieres] = await connection.execute(
            `SELECT m.*, fm.coefficient, fm.obligatoire
       FROM matieres m
       INNER JOIN filiere_matieres fm ON m.id = fm.matiere_id
       WHERE fm.filiere_id = ?
       ORDER BY m.nom_matiere ASC`,
            [id]
        );

        return {
            ...filiere[0],
            matieres
        };
    }

    static async create(filiereData) {
        const connection = getConnection();
        const [result] = await connection.execute(
            `INSERT INTO filieres (nomfil, description, niveau_id)
       VALUES (?, ?, ?)`,
            [
                filiereData.nomfil,
                filiereData.description || null,
                filiereData.niveau_id
            ]
        );

        return this.findById(result.insertId);
    }

    static async update(id, filiereData) {
        const connection = getConnection();
        
        // Filtrer les champs qui n'existent pas dans la table filieres
        const validFields = ['nomfil', 'description', 'niveau_id'];
        const filteredData = Object.keys(filiereData)
            .filter(key => validFields.includes(key))
            .reduce((obj, key) => {
                obj[key] = filiereData[key];
                return obj;
            }, {});
        
        const fields = Object.keys(filteredData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(filteredData), id];

        await connection.execute(
            `UPDATE filieres SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    static async delete(id) {
        const connection = getConnection();
        await connection.execute('DELETE FROM filieres WHERE id = ?', [id]);
        return {success: true};
    }
}

module.exports = Filiere;
