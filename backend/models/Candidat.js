const {getConnection} = require('../config/database');
const Counter = require('./Counter');

class Candidat {
    static async create(candidatData) {
        const connection = getConnection();
        const generatedNipcan = candidatData.nipcan || await Counter.getNextNipcan();

        if (candidatData.concours_id) {
            const [existing] = await connection.execute(
                'SELECT id, nupcan FROM candidats WHERE nipcan = ? AND concours_id = ? LIMIT 1',
                [generatedNipcan, candidatData.concours_id]
            );
            if (existing.length > 0) {
                const error = new Error('Vous avez déjà postulé à ce concours.');
                error.code = 'DUPLICATE_CANDIDATURE';
                throw error;
            }
        }

        const sanitizedData = {
            niveau_id: candidatData.niveau_id || null,
            nipcan: generatedNipcan,
            nupcan: candidatData.nupcan || null,
            nomcan: candidatData.nomcan || null,
            prncan: candidatData.prncan || null,
            maican: candidatData.maican || null,
            dtncan: candidatData.dtncan || null,
            telcan: candidatData.telcan || null,
            ldncan: candidatData.ldncan || null,
            phtcan: candidatData.phtcan || null, // Nom du fichier photo
            proorg: candidatData.proorg || null,
            proact: candidatData.proact || null,
            proaff: candidatData.proaff || null,
            concours_id: candidatData.concours_id || null,
            filiere_id: candidatData.filiere_id || null
        };

        console.log('Backend: Données candidat à insérer:', sanitizedData);

        const [result] = await connection.execute(
            `INSERT INTO candidats (niveau_id, nipcan, nupcan, nomcan, prncan, maican, dtncan, telcan, ldncan, phtcan, proorg, proact, proaff, concours_id, filiere_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
            [
                sanitizedData.niveau_id,
                sanitizedData.nipcan,
                sanitizedData.nupcan,
                sanitizedData.nomcan,
                sanitizedData.prncan,
                sanitizedData.maican,
                sanitizedData.dtncan,
                sanitizedData.telcan,
                sanitizedData.ldncan,
                sanitizedData.phtcan,
                sanitizedData.proorg,
                sanitizedData.proact,
                sanitizedData.proaff,
                sanitizedData.concours_id,
                sanitizedData.filiere_id
            ]
        );

        // Générer le NUPCAN si non fourni
        let nupcan = sanitizedData.nupcan;
        if (!nupcan) {
            nupcan = `GABCONCOURS-${new Date().getFullYear().toString().slice(-2)}-${result.insertId}`;
            await connection.execute(
                'UPDATE candidats SET nupcan = ?, updated_at = NOW() WHERE id = ?',
                [nupcan, result.insertId]
            );
        }

        if (sanitizedData.concours_id && sanitizedData.filiere_id) {
            await connection.execute(
                `INSERT INTO participations
                 (candidat_id, concours_id, filiere_id, statut, created_at, updated_at)
                 VALUES (?, ?, ?, 'en_attente', NOW(), NOW())
                 ON DUPLICATE KEY UPDATE filiere_id = VALUES(filiere_id), updated_at = NOW()`,
                [result.insertId, sanitizedData.concours_id, sanitizedData.filiere_id]
            );
        }

        console.log('Backend: Candidat créé avec succès, ID:', result.insertId);

        return {
            id: result.insertId,
            nupcan: nupcan,
            ...sanitizedData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM candidats WHERE id = ?',
            [id]
        );
        return rows[0] || null;
    }

    static async findByNupcan(nupcan) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM candidats WHERE nupcan = ?',
            [nupcan]
        );
        return rows[0] || null;
    }

    static async findByNip(nip) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            'SELECT * FROM candidats WHERE nipcan = ?',
            [nip]
        );
        return rows[0] || null;
    }

    static async update(id, candidatData) {
        const connection = getConnection();
        const fields = Object.keys(candidatData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(candidatData), id];

        await connection.execute(
            `UPDATE candidats SET ${fields}, updated_at = NOW() WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    static async delete(id) {
        const connection = getConnection();
        await connection.execute(
            'DELETE FROM candidats WHERE id = ?',
            [id]
        );
    }

    static async findAll() {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT 
        c.*,
        n.nomniv AS niveau_nomniv
      FROM candidats c
      LEFT JOIN niveaux n ON c.niveau_id = n.id
      ORDER BY c.created_at DESC`
        );
        return rows;
    }

    static async getDocuments(nupcan) {
        const connection = getConnection();

        try {
            const [rows] = await connection.execute(
                `SELECT dos.*, d.nomdoc, d.type, d.nom_fichier, d.statut as document_statut
         FROM dossiers dos 
         LEFT JOIN documents d ON dos.document_id = d.id 
         WHERE dos.nupcan = ? 
         ORDER BY dos.created_at DESC`,
                [nupcan]
            );

            return rows;
        } catch (error) {
            console.log('Erreur lors de la récupération des documents:', error);
            return [];
        }
    }

    static async getPaiement(nupcan) {
        const connection = getConnection();

        try {
            const [rows] = await connection.execute(
                'SELECT * FROM paiements WHERE nipcan = ? ORDER BY created_at DESC LIMIT 1',
                [nupcan]
            );

            return rows[0] || null;
        } catch (error) {
            console.log('Erreur lors de la récupération du paiement:', error);
            return null;
        }
    }

    static async findCompleteByNupcan(nupcan) {
        try {
            const connection = getConnection();
            const candidat = await this.findByNupcan(nupcan);

            if (!candidat) {
                console.log(`Candidat non trouvé avec NUPCAN: ${nupcan}`);
                return null;
            }

            const documents = await this.getDocuments(nupcan);
            const paiement = await this.getPaiement(nupcan);
            const etape = this.determineEtapeCandidature(candidat, documents, paiement);

            const candidatComplet = {
                ...candidat,
                etape: etape,
                documentsCount: documents ? documents.length : 0,
                hasPaiement: !!paiement
            };

            console.log('Candidat complet assemblé:', candidatComplet);
            return candidatComplet;
        } catch (error) {
            console.error('Erreur lors de la récupération du candidat complet:', error);
            throw error;
        }
    }

    static determineEtapeCandidature(candidat, documents, paiement) {
        if (!candidat) {
            return 'inscription';
        }

        if (!documents || documents.length === 0) {
            return 'documents';
        }

        if (!paiement) {
            return 'paiement';
        }

        return 'termine';
    }
}

module.exports = Candidat;
