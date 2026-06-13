const {getConnection} = require('../config/database');
const {v4: uuidv4} = require('uuid');

class Session {
    static async create(sessionData, expiresInHours = 24) {
        const connection = getConnection();

        try {
            const token = uuidv4();
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + expiresInHours);

            console.log('Session.create - Données reçues:', sessionData);

            // Gérer les différents types de données d'entrée
            let candidatId, nupcan;

            if (typeof sessionData === 'string') {
                // Si c'est un NUPCAN, récupérer l'ID du candidat
                nupcan = sessionData;
                console.log('Session.create - Recherche candidat pour NUPCAN:', nupcan);

                const [candidatRows] = await connection.execute(
                    'SELECT id FROM candidats WHERE nupcan = ?',
                    [nupcan]
                );

                if (candidatRows.length === 0) {
                    console.log('Session.create - Candidat non trouvé pour NUPCAN:', nupcan);
                    // Créer une session temporaire sans candidat_id
                    candidatId = null;
                } else {
                    candidatId = candidatRows[0].id;
                    console.log('Session.create - Candidat trouvé avec ID:', candidatId);
                }
            } else if (typeof sessionData === 'object' && sessionData.nupcan) {
                nupcan = sessionData.nupcan;
                console.log('Session.create - Objet avec NUPCAN:', nupcan);

                const [candidatRows] = await connection.execute(
                    'SELECT id FROM candidats WHERE nupcan = ?',
                    [nupcan]
                );

                if (candidatRows.length === 0) {
                    console.log('Session.create - Candidat non trouvé pour NUPCAN objet:', nupcan);
                    candidatId = null;
                } else {
                    candidatId = candidatRows[0].id;
                    console.log('Session.create - Candidat trouvé pour objet avec ID:', candidatId);
                }
            } else {
                candidatId = sessionData;
                console.log('Session.create - ID candidat direct:', candidatId);
            }

            // Vérifier si une session active existe déjà pour ce candidat
            if (candidatId) {
                const [existingSessions] = await connection.execute(
                    'SELECT * FROM sessions WHERE candidat_id = ? AND expires_at > NOW()',
                    [candidatId]
                );

                if (existingSessions.length > 0) {
                    // Étendre la session existante
                    const existingSession = existingSessions[0];
                    await connection.execute(
                        'UPDATE sessions SET expires_at = ?, updated_at = NOW() WHERE id = ?',
                        [expiresAt, existingSession.id]
                    );

                    console.log('Session.create - Session existante étendue:', existingSession.id);
                    return {
                        ...existingSession,
                        expires_at: expiresAt,
                        updated_at: new Date().toISOString()
                    };
                }
            }

            // Créer une nouvelle session
            const [result] = await connection.execute(
                `INSERT INTO sessions (candidat_id, token, expires_at, created_at, updated_at)
         VALUES (?, ?, ?, NOW(), NOW())`,
                [candidatId, token, expiresAt]
            );

            console.log('Session.create - Nouvelle session créée:', result.insertId);

            return {
                id: result.insertId,
                candidat_id: candidatId,
                token,
                expires_at: expiresAt,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Session.create - Erreur lors de la création de session:', error);
            // Ne pas faire échouer la création de candidature pour une erreur de session
            return {
                id: null,
                candidat_id: null,
                token: null,
                expires_at: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                error: error.message
            };
        }
    }

    static async findByToken(token) {
        const connection = getConnection();

        try {
            const [rows] = await connection.execute(
                `SELECT s.*, c.nomcan, c.prncan, c.nupcan
         FROM sessions s
         LEFT JOIN candidats c ON s.candidat_id = c.id
         WHERE s.token = ? AND s.expires_at > NOW()`,
                [token]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur lors de la recherche de session par token:', error);
            return null;
        }
    }

    static async findByCandidatId(candidatId) {
        const connection = getConnection();

        try {
            const [rows] = await connection.execute(
                'SELECT * FROM sessions WHERE candidat_id = ? AND expires_at > NOW() ORDER BY created_at DESC',
                [candidatId]
            );
            return rows;
        } catch (error) {
            console.error('Erreur lors de la recherche de sessions par candidat:', error);
            return [];
        }
    }

    static async findByNupcan(nupcan) {
        const connection = getConnection();

        try {
            const [rows] = await connection.execute(
                `SELECT s.*, c.nomcan, c.prncan, c.nupcan
         FROM sessions s
         LEFT JOIN candidats c ON s.candidat_id = c.id
         WHERE c.nupcan = ? AND s.expires_at > NOW()
         ORDER BY s.created_at DESC`,
                [nupcan]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Erreur lors de la recherche de session par NUPCAN:', error);
            return null;
        }
    }

    static async deleteExpired() {
        const connection = getConnection();

        try {
            const [result] = await connection.execute(
                'DELETE FROM sessions WHERE expires_at <= NOW()'
            );
            return result.affectedRows;
        } catch (error) {
            console.error('Erreur lors de la suppression des sessions expirées:', error);
            return 0;
        }
    }

    static async deleteByToken(token) {
        const connection = getConnection();

        try {
            const [result] = await connection.execute(
                'DELETE FROM sessions WHERE token = ?',
                [token]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de la suppression de session par token:', error);
            return false;
        }
    }

    static async extendSession(token, additionalHours = 24) {
        const connection = getConnection();

        try {
            const newExpiresAt = new Date();
            newExpiresAt.setHours(newExpiresAt.getHours() + additionalHours);

            const [result] = await connection.execute(
                'UPDATE sessions SET expires_at = ?, updated_at = NOW() WHERE token = ?',
                [newExpiresAt, token]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Erreur lors de l\'extension de session:', error);
            return false;
        }
    }
}

module.exports = Session;
