const {getConnection} = require('../config/database');

async function initAdminTable() {
    try {
        const connection = getConnection();

        // Créer la table administrateurs si elle n'existe pas
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS administrateurs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('super_admin', 'admin_etablissement') NOT NULL DEFAULT 'admin_etablissement',
        etablissement_id INT NULL,
        statut ENUM('actif', 'inactif', 'suspendu') NOT NULL DEFAULT 'actif',
        derniere_connexion TIMESTAMP NULL,
        password_reset_token VARCHAR(255) NULL,
        password_reset_expires TIMESTAMP NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES administrateurs(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

        console.log('✅ Table administrateurs créée ou vérifiée');

    } catch (error) {
        console.error('❌ Erreur lors de la création de la table administrateurs:', error);
    }
}

module.exports = initAdminTable;
