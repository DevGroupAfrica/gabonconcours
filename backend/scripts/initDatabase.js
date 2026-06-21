const mysql = require('mysql2/promise');
require('dotenv').config();

const databaseUrl = process.env.DATABASE_URL
    ? new URL(process.env.DATABASE_URL)
    : null;

const dbConfig = {
    host: databaseUrl?.hostname || process.env.DB_HOST || 'localhost',
    user: databaseUrl
        ? decodeURIComponent(databaseUrl.username)
        : process.env.DB_USER || 'root',
    password: databaseUrl
        ? decodeURIComponent(databaseUrl.password)
        : process.env.DB_PASSWORD || '',
    port: Number(databaseUrl?.port || process.env.DB_PORT || 3306),
    charset: 'utf8mb4',
    timezone: '+00:00'
};

async function initializeDatabase() {
    let connection;

    try {
        // Connexion sans spécifier de base de données
        connection = await mysql.createConnection(dbConfig);

        const dbName = databaseUrl?.pathname.replace(/^\//, '')
            || process.env.DB_NAME
            || 'gabconcoursv5';
        console.log(`🔄 Initialisation de la base de données: ${dbName}`);

        // Créer la base de données si elle n'existe pas
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Base de données ${dbName} créée ou existe déjà`);

        // Utiliser la base de données
        await connection.execute(`USE \`${dbName}\``);

        // Créer les tables dans l'ordre correct (en respectant les dépendances)

        // Table des provinces
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS provinces (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nompro VARCHAR(255) NOT NULL,
        cdepro VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ Table provinces créée');

        // Table des établissements
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS etablissements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nomets VARCHAR(255) NOT NULL,
        adresse VARCHAR(255),
        telephone VARCHAR(20),
        email VARCHAR(255),
        photo VARCHAR(255),
        province_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (province_id) REFERENCES provinces(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ Table etablissements créée');

        // Table des niveaux
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS niveaux (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nomniv VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ Table niveaux créée');

        // Table des filières
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS filieres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nomfil VARCHAR(255) NOT NULL,
        description TEXT,
        niveau_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (niveau_id) REFERENCES niveaux(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ Table filieres créée');

        // Table des matières
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS matieres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom_matiere VARCHAR(255) NOT NULL,
        coefficient DECIMAL(3,1),
        duree INT COMMENT 'Durée en heures',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ Table matieres créée');

        // Table des concours
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS concours (
        id INT AUTO_INCREMENT PRIMARY KEY,
        etablissement_id INT,
        niveau_id INT,
        libcnc VARCHAR(255) NOT NULL,
        fracnc DECIMAL(10,2) DEFAULT 0,
        agecnc INT,
        sescnc VARCHAR(100),
        debcnc DATE,
        fincnc DATE,
        stacnc VARCHAR(1) DEFAULT '1',
        etddos VARCHAR(1) DEFAULT '0',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (etablissement_id) REFERENCES etablissements(id) ON DELETE SET NULL,
        FOREIGN KEY (niveau_id) REFERENCES niveaux(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ Table concours créée');

        // Table de liaison concours-filières
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS concours_filieres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        concours_id INT NOT NULL,
        filiere_id INT NOT NULL,
        places_disponibles INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (concours_id) REFERENCES concours(id) ON DELETE CASCADE,
        FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE,
        UNIQUE KEY unique_concours_filiere (concours_id, filiere_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ Table concours_filieres créée');

        // Table de liaison filière-matières
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS filiere_matieres (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filiere_id INT NOT NULL,
        matiere_id INT NOT NULL,
        coefficient DECIMAL(3,1) NOT NULL DEFAULT 1,
        obligatoire BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE,
        FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE CASCADE,
        UNIQUE KEY unique_filiere_matiere (filiere_id, matiere_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ Table filiere_matieres créée');

        // Table des candidats
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS candidats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        niveau_id INT,
        concours_id INT,
        filiere_id INT,
        nipcan VARCHAR(50),
        nupcan VARCHAR(100) UNIQUE,
        nomcan VARCHAR(255) NOT NULL,
        prncan VARCHAR(255) NOT NULL,
        maican VARCHAR(255) NOT NULL,
        dtncan DATE,
        telcan VARCHAR(20),
        phtcan VARCHAR(255),
        proorg INT,
        proact INT,
        proaff INT,
        ldncan VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (niveau_id) REFERENCES niveaux(id) ON DELETE SET NULL,
        FOREIGN KEY (concours_id) REFERENCES concours(id) ON DELETE SET NULL,
        FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE SET NULL,
        INDEX idx_nipcan (nipcan),
        INDEX idx_nupcan (nupcan)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ Table candidats créée');

        // Table des sessions
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        candidat_id INT NOT NULL,
        token VARCHAR(255) NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (candidat_id) REFERENCES candidats(id) ON DELETE CASCADE,
        INDEX idx_token (token),
        INDEX idx_expires_at (expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ Table sessions créée');

        // Table des documents
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nomdoc VARCHAR(255) NOT NULL,
        type VARCHAR(50) NOT NULL,
        nom_fichier VARCHAR(255) NOT NULL,
        statut ENUM('en_attente', 'valide', 'rejete') DEFAULT 'en_attente',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ Table documents créée');

        // Table des dossiers (liaison candidats-documents-concours)
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS dossiers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        candidat_id INT,
        concours_id INT,
        document_id INT,
        nipcan VARCHAR(50),
        docdsr VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (candidat_id) REFERENCES candidats(id) ON DELETE CASCADE,
        FOREIGN KEY (concours_id) REFERENCES concours(id) ON DELETE CASCADE,
        FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
        INDEX idx_candidat_id (candidat_id),
        INDEX idx_nipcan (nipcan)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ Table dossiers créée');

        // Table des paiements (CORRIGÉE)
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS paiements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        candidat_id INT,
        concours_id INT,
        nipcan VARCHAR(50),
        montant DECIMAL(10,2) NOT NULL,
        methode VARCHAR(50) NOT NULL,
        statut ENUM('en_attente', 'valide', 'rejete') DEFAULT 'en_attente',
        reference_paiement VARCHAR(255),
        numero_telephone VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (candidat_id) REFERENCES candidats(id) ON DELETE SET NULL,
        FOREIGN KEY (concours_id) REFERENCES concours(id) ON DELETE SET NULL,
        INDEX idx_nipcan (nipcan)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ Table paiements créée');

        // Table des participations
        await connection.execute(`
      CREATE TABLE IF NOT EXISTS participations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        candidat_id INT,
        concours_id INT,
        filiere_id INT,
        nipcan VARCHAR(50),
        statut ENUM('en_cours', 'complete', 'abandonne') DEFAULT 'en_cours',
        numero_candidature VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (candidat_id) REFERENCES candidats(id) ON DELETE CASCADE,
        FOREIGN KEY (concours_id) REFERENCES concours(id) ON DELETE CASCADE,
        FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE SET NULL,
        INDEX idx_candidat_id (candidat_id),
        INDEX idx_concours_id (concours_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
        console.log('✅ Table participations créée');

        // Insérer des données de test si les tables sont vides
        const [provinces] = await connection.execute('SELECT COUNT(*) as count FROM provinces');
        if (provinces[0].count === 0) {
            await connection.execute(`
        INSERT INTO provinces (nompro, cdepro) VALUES 
        ('Estuaire', 'EST'),
        ('Haut-Ogooué', 'HO'),
        ('Moyen-Ogooué', 'MO'),
        ('Ngounié', 'NGO'),
        ('Nyanga', 'NYA'),
        ('Ogooué-Ivindo', 'OI'),
        ('Ogooué-Lolo', 'OL'),
        ('Ogooué-Maritime', 'OM'),
        ('Woleu-Ntem', 'WN')
      `);
            console.log('✅ Données de test ajoutées pour provinces');
        }

        const [etablissements] = await connection.execute('SELECT COUNT(*) as count FROM etablissements');
        if (etablissements[0].count === 0) {
            await connection.execute(`
        INSERT INTO etablissements (nomets, adresse, telephone, email, province_id) VALUES 
        ('Université Omar Bongo', 'Libreville, Gabon', '+241 01 23 45 67', 'contact@uob.ga', 1),
        ('Université des Sciences et Techniques de Masuku', 'Franceville, Gabon', '+241 01 23 45 68', 'contact@ustm.ga', 2),
        ('École Normale Supérieure', 'Libreville, Gabon', '+241 01 23 45 69', 'contact@ens.ga', 1),
        ('Institut Supérieur de Technologie', 'Port-Gentil, Gabon', '+241 01 23 45 70', 'contact@ist.ga', 3)
      `);
            console.log('✅ Données de test ajoutées pour etablissements');
        }

        const [niveaux] = await connection.execute('SELECT COUNT(*) as count FROM niveaux');
        if (niveaux[0].count === 0) {
            await connection.execute(`
        INSERT INTO niveaux (nomniv, description) VALUES 
        ('Licence 1', 'Première année de licence'),
        ('Licence 2', 'Deuxième année de licence'),
        ('Licence 3', 'Troisième année de licence'),
        ('Master 1', 'Première année de master'),
        ('Master 2', 'Deuxième année de master'),
        ('Doctorat', 'Études doctorales'),
        ('Terminale C', 'Terminale série C (Mathématiques et Sciences Physiques)'),
        ('Terminale D', 'Terminale série D (Mathématiques et Sciences de la Nature)'),
        ('Terminale A', 'Terminale série A (Littéraire)'),
        ('BTS', 'Brevet de Technicien Supérieur')
      `);
            console.log('✅ Données de test ajoutées pour niveaux');
        }

        const [filieres] = await connection.execute('SELECT COUNT(*) as count FROM filieres');
        if (filieres[0].count === 0) {
            await connection.execute(`
        INSERT INTO filieres (nomfil, description, niveau_id) VALUES 
        ('Informatique', 'Sciences de l\'informatique et du numérique', 1),
        ('Mathématiques', 'Mathématiques pures et appliquées', 1),
        ('Physique', 'Sciences physiques et applications', 1),
        ('Biologie', 'Sciences de la vie et de la terre', 1),
        ('Génie Civil', 'Ingénierie civile et construction', 1),
        ('Économie', 'Sciences économiques et gestion', 1),
        ('Lettres Modernes', 'Littérature et langues modernes', 1),
        ('Histoire-Géographie', 'Sciences humaines et sociales', 1),
        ('Médecine', 'Sciences médicales', 1),
        ('Droit', 'Sciences juridiques', 1)
      `);
            console.log('✅ Données de test ajoutées pour filieres');
        }

        const [matieres] = await connection.execute('SELECT COUNT(*) as count FROM matieres');
        if (matieres[0].count === 0) {
            await connection.execute(`
        INSERT INTO matieres (nom_matiere, coefficient, duree, description) VALUES 
        ('Mathématiques', 4.0, 4, 'Mathématiques générales'),
        ('Physique', 3.0, 3, 'Physique générale'),
        ('Chimie', 2.0, 2, 'Chimie générale'),
        ('Français', 3.0, 3, 'Expression française'),
        ('Anglais', 2.0, 2, 'Langue anglaise'),
        ('Histoire', 2.0, 2, 'Histoire générale'),
        ('Géographie', 2.0, 2, 'Géographie générale'),
        ('Biologie', 3.0, 3, 'Sciences de la vie'),
        ('Informatique', 3.0, 3, 'Sciences informatiques'),
        ('Économie', 3.0, 3, 'Sciences économiques'),
        ('Philosophie', 2.0, 2, 'Philosophie générale'),
        ('Sciences Naturelles', 3.0, 3, 'Sciences de la nature')
      `);
            console.log('✅ Données de test ajoutées pour matieres');
        }

        const [concours] = await connection.execute('SELECT COUNT(*) as count FROM concours');
        if (concours[0].count === 0) {
            await connection.execute(`
        INSERT INTO concours (etablissement_id, niveau_id, libcnc, fracnc, agecnc, sescnc, debcnc, fincnc, stacnc) VALUES 
        (1, 1, 'Concours d\'entrée en Licence 1 - Sciences', 50000, 25, '2024-2025', '2024-01-01', '2024-12-31', '1'),
        (1, 4, 'Concours d\'entrée en Master - Informatique', 75000, 30, '2024-2025', '2024-01-01', '2024-12-31', '1'),
        (2, 1, 'Concours USTM - Formation Technique', 60000, 28, '2024-2025', '2024-01-01', '2024-12-31', '1'),
        (3, 1, 'Concours École Normale Supérieure', 45000, 26, '2024-2025', '2024-01-01', '2024-12-31', '1'),
        (4, 10, 'Concours BTS - Institut Technologique', 40000, 22, '2024-2025', '2024-01-01', '2024-12-31', '1')
      `);
            console.log('✅ Données de test ajoutées pour concours');
        }

        const [concoursFilieres] = await connection.execute('SELECT COUNT(*) as count FROM concours_filieres');
        if (concoursFilieres[0].count === 0) {
            await connection.execute(`
        INSERT INTO concours_filieres (concours_id, filiere_id, places_disponibles) VALUES 
        (1, 1, 50), (1, 2, 30), (1, 3, 40), (1, 4, 35),
        (2, 1, 25),
        (3, 1, 20), (3, 5, 25), (3, 9, 15),
        (4, 7, 30), (4, 8, 25), (4, 6, 20),
        (5, 1, 30), (5, 5, 25), (5, 6, 20)
      `);
            console.log('✅ Données de test ajoutées pour concours_filieres');
        }

        const [filiereMatieres] = await connection.execute('SELECT COUNT(*) as count FROM filiere_matieres');
        if (filiereMatieres[0].count === 0) {
            await connection.execute(`
        INSERT INTO filiere_matieres (filiere_id, matiere_id, coefficient, obligatoire) VALUES 
        -- Informatique
        (1, 1, 4.0, TRUE), (1, 2, 3.0, TRUE), (1, 9, 4.0, TRUE), (1, 4, 2.0, TRUE), (1, 5, 2.0, FALSE),
        -- Mathématiques  
        (2, 1, 5.0, TRUE), (2, 2, 4.0, TRUE), (2, 3, 2.0, FALSE), (2, 4, 2.0, TRUE),
        -- Physique
        (3, 1, 4.0, TRUE), (3, 2, 5.0, TRUE), (3, 3, 3.0, TRUE), (3, 4, 2.0, TRUE),
        -- Biologie
        (4, 1, 3.0, TRUE), (4, 3, 3.0, TRUE), (4, 8, 4.0, TRUE), (4, 12, 3.0, TRUE), (4, 4, 2.0, TRUE)
      `);
            console.log('✅ Données de test ajoutées pour filiere_matieres');
        }

        console.log('🎉 Initialisation de la base de données terminée avec succès !');

    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation de la base de données:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Exécuter si appelé directement
if (require.main === module) {
    initializeDatabase()
        .then(() => {
            console.log('✅ Script d\'initialisation terminé');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Erreur fatale:', error);
            process.exit(1);
        });
}

module.exports = {initializeDatabase};
