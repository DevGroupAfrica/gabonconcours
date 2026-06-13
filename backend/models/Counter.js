const {getConnection} = require('../config/database');

class Counter {
    static async getNextNupcan() {
        const connection = getConnection();

        // Obtenir la date actuelle
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0'); // Mois sur 2 chiffres
        const day = String(now.getDate()).padStart(2, '0'); // Jour sur 2 chiffres
        const dateKey = `${year}${month}${day}`;

        try {
            // Vérifier s'il y a déjà un compteur pour aujourd'hui
            const [existing] = await connection.execute(
                'SELECT counter FROM nupcan_counters WHERE date_key = ?',
                [dateKey]
            );

            if (existing.length > 0) {
                // Incrémenter le compteur existant
                const newCounter = existing[0].counter + 1;
                await connection.execute(
                    'UPDATE nupcan_counters SET counter = ? WHERE date_key = ?',
                    [newCounter, dateKey]
                );
                return `${dateKey}-${newCounter}`;
            } else {
                // Créer un nouveau compteur pour aujourd'hui
                await connection.execute(
                    'INSERT INTO nupcan_counters (date_key, counter) VALUES (?, ?)',
                    [dateKey, 1]
                );
                return `${dateKey}-1`;
            }
        } catch (error) {
            // Si la table n'existe pas, créer la table et retourner le premier NUPCAN
            if (error.code === 'ER_NO_SUCH_TABLE') {
                await connection.execute(`
          CREATE TABLE IF NOT EXISTS nupcan_counters (
            id INT AUTO_INCREMENT PRIMARY KEY,
            date_key VARCHAR(10) NOT NULL UNIQUE,
            counter INT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);

                await connection.execute(
                    'INSERT INTO nupcan_counters (date_key, counter) VALUES (?, ?)',
                    [dateKey, 1]
                );
                return `${dateKey}-1`;
            }
            throw error;
        }
    }

    static async getNextNipcan() {
        const pool = getConnection();
        const year = new Date().getFullYear();

        await pool.execute(`
          CREATE TABLE IF NOT EXISTS nipcan_counters (
            id INT AUTO_INCREMENT PRIMARY KEY,
            year INT NOT NULL UNIQUE,
            counter INT NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
          )
        `);

        const connection = await pool.getConnection();
        try {
            await connection.execute(
                `INSERT INTO nipcan_counters (year, counter)
                 VALUES (?, LAST_INSERT_ID(1))
                 ON DUPLICATE KEY UPDATE counter = LAST_INSERT_ID(counter + 1)`,
                [year]
            );
            const [rows] = await connection.execute('SELECT LAST_INSERT_ID() AS counter');
            return `NIP${year}${String(rows[0].counter).padStart(6, '0')}`;
        } finally {
            connection.release();
        }
    }
}

module.exports = Counter;
