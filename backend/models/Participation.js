const {getConnection} = require('../config/database');

class Participation {
    static async create(participationData) {
        const connection = getConnection();

        // Générer un numéro de candidature unique

        const [result] = await connection.execute(
            `INSERT INTO participations (candidat_id, concours_id, nupcan, statut)
       VALUES (?, ?, ?, ?)`,
            [
                participationData.candidat_id,
                participationData.concours_id,
                participationData.nupcan,
                participationData.statut || 'inscrit'
            ]
        );

        return {
            id: result.insertId,

            ...participationData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT p.*, c.libcnc, e.nomets, cand.nomcan, cand.prncan, cand.nupcan
       FROM participations p
       LEFT JOIN concours c ON p.concours_id = c.id
       LEFT JOIN etablissements e ON c.etablissement_id = e.id
       LEFT JOIN candidats cand ON p.candidat_id = cand.id
       WHERE p.id = ?`,
            [id]
        );
        return rows[0] || null;
    }

    static async findByNupcan(nupcan) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT p.*, c.libcnc, e.nomets, cand.nomcan, cand.prncan, cand.nupcan
       FROM participations p
       LEFT JOIN concours c ON p.concours_id = c.id
       LEFT JOIN etablissements e ON c.etablissement_id = e.id
       LEFT JOIN candidats cand ON p.candidat_id = cand.id
       WHERE p.nupcan = ?`,
            [nupcan]
        );
        return rows[0] || null;
    }

    static async findByCandidatId(candidatId) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT p.*, c.libcnc, e.nomets
       FROM participations p
       LEFT JOIN concours c ON p.concours_id = c.id
       LEFT JOIN etablissements e ON c.etablissement_id = e.id
       WHERE p.candidat_id = ?`,
            [candidatId]
        );
        return rows;
    }

    static async update(id, participationData) {
        const connection = getConnection();
        const fields = Object.keys(participationData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(participationData), id];

        await connection.execute(
            `UPDATE participations SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    static async delete(id) {
        const connection = getConnection();
        await connection.execute('DELETE FROM participations WHERE id = ?', [id]);
        return {success: true};
    }

    // Nouvelle méthode pour créer une participation directement lors de l'inscription
    static async createFromCandidature(candidatId, concoursId = null) {
        const participationData = {
            candidat_id: candidatId,
            concours_id: concoursId,


            statut: 'inscrit'
        };

        return this.create(participationData);
    }
}

module.exports = Participation;
