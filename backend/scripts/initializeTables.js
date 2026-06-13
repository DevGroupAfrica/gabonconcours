const {getConnection} = require('../config/database');

async function initializeTables() {
    const connection = getConnection();

    try {
        console.log('🔧 Initialisation des tables...');

        // Table pour les notifications
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        candidat_nupcan VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        titre VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        statut ENUM('lu', 'non_lu') DEFAULT 'non_lu',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_nupcan (candidat_nupcan),
        INDEX idx_statut (statut)
      )
    `);

        // Table pour les validations de documents
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS document_validations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        document_id INT NOT NULL,
        statut ENUM('valide', 'rejete') NOT NULL,
        commentaire TEXT,
        admin_id INT,
        candidat_nupcan VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_document (document_id),
        INDEX idx_candidat (candidat_nupcan)
      )
    `);

        // Ajouter des colonnes manquantes à la table documents
        try {
            await connection.execute(`
        ALTER TABLE documents 
        ADD COLUMN IF NOT EXISTS commentaire TEXT,
        ADD COLUMN IF NOT EXISTS validated_by INT,
        ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP NULL
      `);
        } catch (e) {
            // Colonnes déjà présentes
        }

        // Assurer la cohérence de la table participations
        try {
            await connection.execute(`
        ALTER TABLE participations 
        ADD COLUMN IF NOT EXISTS filiere_id INT,
        ADD INDEX IF NOT EXISTS idx_filiere (filiere_id)
      `);
        } catch (e) {
            // Colonne déjà présente
        }

        console.log('✅ Tables initialisées avec succès');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation des tables:', error);
        throw error;
    }
}

// Exporter pour utilisation dans d'autres fichiers
module.exports = {initializeTables};

// Exécuter si appelé directement
if (require.main === module) {
    initializeTables()
        .then(() => {
            console.log('🎉 Initialisation terminée');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Échec de l\'initialisation:', error);
            process.exit(1);
        });
}
