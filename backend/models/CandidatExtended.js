const {getConnection} = require('../config/database');

class CandidatExtended {
    static async findByNupcan(nupcan) {
        if (!nupcan || typeof nupcan !== 'string') {
            throw new Error('NUPCAN invalide');
        }

        const connection = getConnection();
        console.log('Recherche SQL pour NUPCAN:', nupcan); // Log ajouté
        try {
            const [rows] = await connection.execute(
                'SELECT * FROM candidats WHERE nupcan = ?',
                [nupcan]
            );
            console.log('Résultat SQL:', rows); // Log ajouté
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur SQL lors de la recherche par NUPCAN:', error);
            throw new Error(`Erreur SQL: ${error.message}`);
        }
    }

    static extendCandidatModel(CandidatModel) {
        CandidatModel.findByNupcan = this.findByNupcan;
        return CandidatModel;
    }
}

module.exports = CandidatExtended;