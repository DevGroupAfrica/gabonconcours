const { getConnection } = require('../config/database');

class Paiement {
    static async create(paiementData) {
        const connection = getConnection();

        const sanitizedData = {
            candidat_id: paiementData.candidat_id || null,
            concours_id: paiementData.concours_id || null,
            nupcan: paiementData.nupcan || paiementData.nipcan || null,
            montant: parseFloat(paiementData.montant) || 0,
            methode: paiementData.methode || 'airtel_money',
            statut: paiementData.statut || 'valide',
            reference_paiement: paiementData.reference_paiement || paiementData.reference || null,
            numero_telephone: paiementData.numero_telephone || paiementData.telephone || null
        };

        if (!sanitizedData.nupcan) {
            throw new Error('NUPCAN est requis pour créer un paiement');
        }

        const [result] = await connection.execute(
            `INSERT INTO paiements (candidat_id, concours_id, nupcan, montant, methode, statut, reference_paiement, numero_telephone, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                sanitizedData.candidat_id,
                sanitizedData.concours_id,
                sanitizedData.nupcan,
                sanitizedData.montant,
                sanitizedData.methode,
                sanitizedData.statut,
                sanitizedData.reference_paiement,
                sanitizedData.numero_telephone
            ]
        );

        return {
            id: result.insertId,
            ...sanitizedData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(`SELECT * FROM paiements WHERE id = ?`, [id]);
        return rows[0] || null;
    }

    static async findByNupcan(nupcan) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT * FROM paiements WHERE nupcan = ? ORDER BY created_at DESC LIMIT 1`,
            [nupcan]
        );
        return rows[0] || null;
    }

    static async update(id, data) {
        const connection = getConnection();
        const fields = Object.keys(data)
            .map(key => `${key} = ?`)
            .join(', ');
        const values = Object.values(data);

        const [result] = await connection.execute(
            `UPDATE paiements SET ${fields}, updated_at = NOW() WHERE id = ?`,
            [...values, id]
        );

        if (result.affectedRows === 0) throw new Error('Aucun paiement trouvé');
        return await Paiement.findById(id);
    }
}

module.exports = Paiement;
