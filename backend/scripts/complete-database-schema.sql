
-- Script SQL complet pour la base de données GabConcours
-- Version cohérente avec le système

-- Création de la base de données
CREATE DATABASE IF NOT EXISTS `gabconcoursv5` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `gabconcoursv5`;

-- ======================================
-- TABLES DE RÉFÉRENCE
-- ======================================

-- Table des provinces
CREATE TABLE IF NOT EXISTS `provinces` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nompro` VARCHAR(255) NOT NULL,
  `cdepro` VARCHAR(10),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des établissements
CREATE TABLE IF NOT EXISTS `etablissements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nomets` VARCHAR(255) NOT NULL,
  `adresse` VARCHAR(255),
  `telephone` VARCHAR(20),
  `email` VARCHAR(255),
  `photo` VARCHAR(255),
  `province_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`province_id`) REFERENCES `provinces`(`id`) ON DELETE SET NULL,
  INDEX `idx_province` (`province_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des niveaux
CREATE TABLE IF NOT EXISTS `niveaux` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nomniv` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des filières
CREATE TABLE IF NOT EXISTS `filieres` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nomfil` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `niveau_id` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`niveau_id`) REFERENCES `niveaux`(`id`) ON DELETE SET NULL,
  INDEX `idx_niveau` (`niveau_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des matières
CREATE TABLE IF NOT EXISTS `matieres` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom_matiere` VARCHAR(255) NOT NULL,
  `coefficient` DECIMAL(3,1),
  `duree` INT COMMENT 'Durée en heures',
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================
-- TABLES PRINCIPALES
-- ======================================

-- Table des concours
CREATE TABLE IF NOT EXISTS `concours` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `etablissement_id` INT,
  `niveau_id` INT,
  `libcnc` VARCHAR(255) NOT NULL,
  `fracnc` DECIMAL(10,2) DEFAULT 0,
  `agecnc` INT,
  `sescnc` VARCHAR(100),
  `debcnc` DATE,
  `fincnc` DATE,
  `stacnc` VARCHAR(1) DEFAULT '1',
  `etddos` VARCHAR(1) DEFAULT '0',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`niveau_id`) REFERENCES `niveaux`(`id`) ON DELETE SET NULL,
  INDEX `idx_etablissement` (`etablissement_id`),
  INDEX `idx_niveau` (`niveau_id`),
  INDEX `idx_statut` (`stacnc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de liaison concours-filières
CREATE TABLE IF NOT EXISTS `concours_filieres` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `concours_id` INT NOT NULL,
  `filiere_id` INT NOT NULL,
  `places_disponibles` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`concours_id`) REFERENCES `concours`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`filiere_id`) REFERENCES `filieres`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_concours_filiere` (`concours_id`, `filiere_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table de liaison filière-matières
CREATE TABLE IF NOT EXISTS `filiere_matieres` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `filiere_id` INT NOT NULL,
  `matiere_id` INT NOT NULL,
  `coefficient` DECIMAL(3,1) NOT NULL DEFAULT 1,
  `obligatoire` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`filiere_id`) REFERENCES `filieres`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`matiere_id`) REFERENCES `matieres`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_filiere_matiere` (`filiere_id`, `matiere_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================
-- TABLES DES CANDIDATS
-- ======================================

-- Table des candidats
CREATE TABLE IF NOT EXISTS `candidats` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `niveau_id` INT,
  `concours_id` INT,
  `filiere_id` INT,
  `nipcan` VARCHAR(50),
  `nupcan` VARCHAR(100) UNIQUE NOT NULL,
  `nomcan` VARCHAR(255) NOT NULL,
  `prncan` VARCHAR(255) NOT NULL,
  `maican` VARCHAR(255) NOT NULL,
  `dtncan` DATE,
  `telcan` VARCHAR(20),
  `ldncan` VARCHAR(255),
  `phtcan` VARCHAR(255),
  `proorg` INT,
  `proact` INT,
  `proaff` INT,
  `statut` ENUM('en_attente', 'valide', 'rejete') DEFAULT 'en_attente',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`niveau_id`) REFERENCES `niveaux`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`concours_id`) REFERENCES `concours`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`filiere_id`) REFERENCES `filieres`(`id`) ON DELETE SET NULL,
  INDEX `idx_nipcan` (`nipcan`),
  INDEX `idx_nupcan` (`nupcan`),
  INDEX `idx_concours` (`concours_id`),
  INDEX `idx_statut` (`statut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des sessions
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidat_id` INT NOT NULL,
  `token` VARCHAR(255) NOT NULL UNIQUE,
  `expires_at` TIMESTAMP NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidat_id`) REFERENCES `candidats`(`id`) ON DELETE CASCADE,
  INDEX `idx_token` (`token`),
  INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================
-- TABLES DES DOCUMENTS ET DOSSIERS
-- ======================================

-- Table des documents
CREATE TABLE IF NOT EXISTS `documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidat_id` INT,
  `concours_id` INT,
  `nomdoc` VARCHAR(255) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `nom_fichier` VARCHAR(255) NOT NULL,
  `chemin_fichier` VARCHAR(500),
  `statut` ENUM('en_attente', 'valide', 'rejete') DEFAULT 'en_attente',
  `commentaire` TEXT,
  `validated_by` INT,
  `validated_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidat_id`) REFERENCES `candidats`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`concours_id`) REFERENCES `concours`(`id`) ON DELETE CASCADE,
  INDEX `idx_candidat` (`candidat_id`),
  INDEX `idx_statut` (`statut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des dossiers (liaison candidats-documents-concours)
CREATE TABLE IF NOT EXISTS `dossiers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidat_id` INT,
  `concours_id` INT,
  `document_id` INT,
  `nipcan` VARCHAR(50),
  `docdsr` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidat_id`) REFERENCES `candidats`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`concours_id`) REFERENCES `concours`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
  INDEX `idx_candidat_id` (`candidat_id`),
  INDEX `idx_nipcan` (`nipcan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================
-- TABLES DES PAIEMENTS
-- ======================================

-- Table des paiements
CREATE TABLE IF NOT EXISTS `paiements` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidat_id` INT,
  `concours_id` INT,
  `nupcan` VARCHAR(50),
  `montant` DECIMAL(10,2) NOT NULL,
  `methode` VARCHAR(50) NOT NULL,
  `statut` ENUM('en_attente', 'valide', 'rejete') DEFAULT 'en_attente',
  `reference_paiement` VARCHAR(255),
  `numero_telephone` VARCHAR(20),
  `recu_path` VARCHAR(500),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidat_id`) REFERENCES `candidats`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`concours_id`) REFERENCES `concours`(`id`) ON DELETE SET NULL,
  INDEX `idx_nipcan` (`nipcan`),
  INDEX `idx_statut` (`statut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================
-- TABLES DES PARTICIPATIONS
-- ======================================

-- Table des participations
CREATE TABLE IF NOT EXISTS `participations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidat_id` INT,
  `concours_id` INT,
  `filiere_id` INT,
  `nipcan` VARCHAR(50),
  `statut` ENUM('en_cours', 'complete', 'abandonne') DEFAULT 'en_cours',
  `numero_candidature` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidat_id`) REFERENCES `candidats`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`concours_id`) REFERENCES `concours`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`filiere_id`) REFERENCES `filieres`(`id`) ON DELETE SET NULL,
  INDEX `idx_candidat_id` (`candidat_id`),
  INDEX `idx_concours_id` (`concours_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================
-- TABLES D'ADMINISTRATION
-- ======================================

-- Table des administrateurs
CREATE TABLE IF NOT EXISTS `administrateurs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nom` VARCHAR(100) NOT NULL,
  `prenom` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('super_admin', 'admin_etablissement') NOT NULL DEFAULT 'admin_etablissement',
  `etablissement_id` INT NULL,
  `statut` ENUM('actif', 'inactif', 'suspendu') NOT NULL DEFAULT 'actif',
  `derniere_connexion` TIMESTAMP NULL,
  `password_reset_token` VARCHAR(255) NULL,
  `password_reset_expires` TIMESTAMP NULL,
  `created_by` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`created_by`) REFERENCES `administrateurs`(`id`) ON DELETE SET NULL,
  INDEX `idx_email` (`email`),
  INDEX `idx_role` (`role`),
  INDEX `idx_statut` (`statut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================
-- TABLES DE NOTIFICATIONS
-- ======================================

-- Table des notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidat_nupcan` VARCHAR(50) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `titre` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `statut` ENUM('lu', 'non_lu') DEFAULT 'non_lu',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_nupcan` (`candidat_nupcan`),
  INDEX `idx_statut` (`statut`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour les validations de documents
CREATE TABLE IF NOT EXISTS `document_validations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `document_id` INT NOT NULL,
  `statut` ENUM('valide', 'rejete') NOT NULL,
  `commentaire` TEXT,
  `admin_id` INT,
  `candidat_nupcan` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `administrateurs`(`id`) ON DELETE SET NULL,
  INDEX `idx_document` (`document_id`),
  INDEX `idx_candidat` (`candidat_nupcan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;




-- Table pour la messagerie interne
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidat_nupcan` VARCHAR(50) NOT NULL,
  `admin_id` INT NULL,
  `sujet` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `expediteur` ENUM('candidat', 'admin') NOT NULL,
  `statut` ENUM('non_lu', 'lu') DEFAULT 'non_lu',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidat_nupcan`) REFERENCES `candidats`(`nupcan`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `administrateurs`(`id`) ON DELETE SET NULL,
  INDEX idx_candidat_messages (`candidat_nupcan`),
  INDEX idx_admin_messages (`admin_id`),
  INDEX idx_statut (`statut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ======================================
-- DONNÉES DE TEST
-- ======================================

-- Insertion des provinces
INSERT IGNORE INTO `provinces` (`nompro`, `cdepro`) VALUES 
('Estuaire', 'EST'),
('Haut-Ogooué', 'HO'),
('Moyen-Ogooué', 'MO'),
('Ngounié', 'NGO'),
('Nyanga', 'NYA'),
('Ogooué-Ivindo', 'OI'),
('Ogooué-Lolo', 'OL'),
('Ogooué-Maritime', 'OM'),
('Woleu-Ntem', 'WN');

-- Insertion des établissements
INSERT IGNORE INTO `etablissements` (`nomets`, `adresse`, `telephone`, `email`, `province_id`) VALUES 
('Université Omar Bongo', 'Libreville, Gabon', '+241 01 23 45 67', 'contact@uob.ga', 1),
('Université des Sciences et Techniques de Masuku', 'Franceville, Gabon', '+241 01 23 45 68', 'contact@ustm.ga', 2),
('École Normale Supérieure', 'Libreville, Gabon', '+241 01 23 45 69', 'contact@ens.ga', 1),
('Institut Supérieur de Technologie', 'Port-Gentil, Gabon', '+241 01 23 45 70', 'contact@ist.ga', 3);

-- Insertion des niveaux
INSERT IGNORE INTO `niveaux` (`nomniv`, `description`) VALUES 
('Licence 1', 'Première année de licence'),
('Licence 2', 'Deuxième année de licence'),
('Licence 3', 'Troisième année de licence'),
('Master 1', 'Première année de master'),
('Master 2', 'Deuxième année de master'),
('Doctorat', 'Études doctorales'),
('Terminale C', 'Terminale série C (Mathématiques et Sciences Physiques)'),
('Terminale D', 'Terminale série D (Mathématiques et Sciences de la Nature)'),
('Terminale A', 'Terminale série A (Littéraire)'),
('BTS', 'Brevet de Technicien Supérieur');

-- Insertion des filières
INSERT IGNORE INTO `filieres` (`nomfil`, `description`, `niveau_id`) VALUES 
('Informatique', 'Sciences de l\'informatique et du numérique', 1),
('Mathématiques', 'Mathématiques pures et appliquées', 1),
('Physique', 'Sciences physiques et applications', 1),
('Biologie', 'Sciences de la vie et de la terre', 1),
('Génie Civil', 'Ingénierie civile et construction', 1),
('Économie', 'Sciences économiques et gestion', 1),
('Lettres Modernes', 'Littérature et langues modernes', 1),
('Histoire-Géographie', 'Sciences humaines et sociales', 1),
('Médecine', 'Sciences médicales', 1),
('Droit', 'Sciences juridiques', 1);

-- Insertion des matières
INSERT IGNORE INTO `matieres` (`nom_matiere`, `coefficient`, `duree`, `description`) VALUES 
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
('Sciences Naturelles', 3.0, 3, 'Sciences de la nature');

-- Insertion des concours
INSERT IGNORE INTO `concours` (`etablissement_id`, `niveau_id`, `libcnc`, `fracnc`, `agecnc`, `sescnc`, `debcnc`, `fincnc`, `stacnc`) VALUES 
(1, 1, 'Concours d\'entrée en Licence 1 - Sciences', 50000, 25, '2024-2025', '2024-01-01', '2024-12-31', '1'),
(1, 4, 'Concours d\'entrée en Master - Informatique', 75000, 30, '2024-2025', '2024-01-01', '2024-12-31', '1'),
(2, 1, 'Concours USTM - Formation Technique', 60000, 28, '2024-2025', '2024-01-01', '2024-12-31', '1'),
(3, 1, 'Concours École Normale Supérieure', 45000, 26, '2024-2025', '2024-01-01', '2024-12-31', '1'),
(4, 10, 'Concours BTS - Institut Technologique', 40000, 22, '2024-2025', '2024-01-01', '2024-12-31', '1');

-- Insertion des relations concours-filières
INSERT IGNORE INTO `concours_filieres` (`concours_id`, `filiere_id`, `places_disponibles`) VALUES 
(1, 1, 50), (1, 2, 30), (1, 3, 40), (1, 4, 35),
(2, 1, 25),
(3, 1, 20), (3, 5, 25), (3, 9, 15),
(4, 7, 30), (4, 8, 25), (4, 6, 20),
(5, 1, 30), (5, 5, 25), (5, 6, 20);

-- Insertion des relations filière-matières
INSERT IGNORE INTO `filiere_matieres` (`filiere_id`, `matiere_id`, `coefficient`, `obligatoire`) VALUES 
-- Informatique
(1, 1, 4.0, TRUE), (1, 2, 3.0, TRUE), (1, 9, 4.0, TRUE), (1, 4, 2.0, TRUE), (1, 5, 2.0, FALSE),
-- Mathématiques  
(2, 1, 5.0, TRUE), (2, 2, 4.0, TRUE), (2, 3, 2.0, FALSE), (2, 4, 2.0, TRUE),
-- Physique
(3, 1, 4.0, TRUE), (3, 2, 5.0, TRUE), (3, 3, 3.0, TRUE), (3, 4, 2.0, TRUE),
-- Biologie
(4, 1, 3.0, TRUE), (4, 3, 3.0, TRUE), (4, 8, 4.0, TRUE), (4, 12, 3.0, TRUE), (4, 4, 2.0, TRUE);

-- Création du super admin par défaut
INSERT IGNORE INTO `administrateurs` (`nom`, `prenom`, `email`, `password`, `role`, `statut`) VALUES 
('Super', 'Admin', 'superadmin@gabconcours.ga', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'super_admin', 'actif');

-- ======================================
-- INDEX SUPPLÉMENTAIRES POUR PERFORMANCE
-- ======================================

-- Index pour optimiser les requêtes fréquentes
CREATE INDEX IF NOT EXISTS `idx_candidats_concours_statut` ON `candidats` (`concours_id`, `statut`);
CREATE INDEX IF NOT EXISTS `idx_documents_candidat_statut` ON `documents` (`candidat_id`, `statut`);
CREATE INDEX IF NOT EXISTS `idx_paiements_candidat_statut` ON `paiements` (`candidat_id`, `statut`);
CREATE INDEX IF NOT EXISTS `idx_notifications_date` ON `notifications` (`candidat_nupcan`, `created_at`);

-- ======================================
-- VUES UTILES
-- ======================================

-- Vue pour les candidatures complètes
CREATE OR REPLACE VIEW `vue_candidatures_completes` AS
SELECT 
    c.id,
    c.nupcan,
    c.nomcan,
    c.prncan,
    c.maican,
    c.telcan,
    c.dtncan,
    c.ldncan,
    c.phtcan,
    c.statut,
    c.created_at,
    co.libcnc as concours_nom,
    co.fracnc as concours_frais,
    f.nomfil as filiere_nom,
    e.nomets as etablissement_nom,
    n.nomniv as niveau_nom
FROM candidats c
LEFT JOIN concours co ON c.concours_id = co.id
LEFT JOIN filieres f ON c.filiere_id = f.id
LEFT JOIN etablissements e ON co.etablissement_id = e.id
LEFT JOIN niveaux n ON c.niveau_id = n.id;

-- Vue pour les statistiques par établissement
CREATE OR REPLACE VIEW `vue_stats_etablissements` AS
SELECT 
    e.id,
    e.nomets,
    COUNT(DISTINCT co.id) as nb_concours,
    COUNT(DISTINCT c.id) as nb_candidatures,
    COUNT(CASE WHEN c.statut = 'valide' THEN 1 END) as nb_validees,
    COUNT(CASE WHEN c.statut = 'en_attente' THEN 1 END) as nb_en_attente,
    COUNT(CASE WHEN c.statut = 'rejete' THEN 1 END) as nb_rejetees
FROM etablissements e
LEFT JOIN concours co ON e.id = co.etablissement_id
LEFT JOIN candidats c ON co.id = c.concours_id
GROUP BY e.id, e.nomets;

COMMIT;
