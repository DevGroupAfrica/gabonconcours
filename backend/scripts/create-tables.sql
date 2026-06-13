-- Script de création de toutes les tables manquantes

-- Table des participations (relation candidat-concours)
CREATE TABLE IF NOT EXISTS `participations` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidat_id` INT NOT NULL,
  `concours_id` INT NOT NULL,
  `filiere_id` INT NULL,
  `statut` ENUM('en_attente', 'admis', 'refuse', 'liste_attente') DEFAULT 'en_attente',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidat_id`) REFERENCES `candidats`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`concours_id`) REFERENCES `concours`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`filiere_id`) REFERENCES `filieres`(`id`) ON DELETE SET NULL,
  UNIQUE KEY `unique_participation` (`candidat_id`, `concours_id`),
  INDEX idx_concours (`concours_id`),
  INDEX idx_candidat (`candidat_id`),
  INDEX idx_statut (`statut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des notes
CREATE TABLE IF NOT EXISTS `notes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `participation_id` INT NOT NULL,
  `matiere_id` INT NOT NULL,
  `note` DECIMAL(5,2) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`participation_id`) REFERENCES `participations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`matiere_id`) REFERENCES `matieres`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_note` (`participation_id`, `matiere_id`),
  INDEX idx_participation (`participation_id`),
  INDEX idx_matiere (`matiere_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table des rôles d'utilisateurs (SÉCURITÉ)
CREATE TYPE IF NOT EXISTS `app_role` AS ENUM ('super_admin', 'admin_etablissement', 'admin_concours', 'validateur_documents');

CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `role` ENUM('super_admin', 'admin_etablissement', 'admin_concours', 'validateur_documents') NOT NULL,
  `etablissement_id` INT NULL,
  `concours_id` INT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `administrateurs`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`concours_id`) REFERENCES `concours`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_user_role` (`user_id`, `role`, `etablissement_id`, `concours_id`),
  INDEX idx_user (`user_id`),
  INDEX idx_role (`role`),
  INDEX idx_etablissement (`etablissement_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Fonction de vérification des rôles (SÉCURITÉ)
DELIMITER $$
CREATE FUNCTION IF NOT EXISTS has_role(
    _user_id INT,
    _role VARCHAR(50)
) RETURNS BOOLEAN
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE role_exists BOOLEAN;
    
    SELECT EXISTS(
        SELECT 1
        FROM user_roles
        WHERE user_id = _user_id
        AND role = _role
    ) INTO role_exists;
    
    RETURN role_exists;
END$$
DELIMITER ;

-- Table des logs d'actions admin
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `table_name` VARCHAR(50),
  `record_id` INT,
  `details` TEXT,
  `ip_address` VARCHAR(45),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`admin_id`) REFERENCES `administrateurs`(`id`) ON DELETE CASCADE,
  INDEX idx_admin (`admin_id`),
  INDEX idx_action (`action`),
  INDEX idx_created (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Amélioration de la table notifications
ALTER TABLE `notifications` 
ADD COLUMN IF NOT EXISTS `candidat_id` INT NULL AFTER `user_id`,
ADD COLUMN IF NOT EXISTS `reference_id` INT NULL AFTER `message`,
ADD COLUMN IF NOT EXISTS `reference_type` VARCHAR(50) NULL AFTER `reference_id`,
ADD INDEX IF NOT EXISTS idx_candidat (`candidat_id`),
ADD INDEX IF NOT EXISTS idx_reference (`reference_type`, `reference_id`);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_candidats_concours ON candidats(concours_id);
CREATE INDEX IF NOT EXISTS idx_candidats_filiere ON candidats(filiere_id);
CREATE INDEX IF NOT EXISTS idx_candidats_nupcan ON candidats(nupcan);
CREATE INDEX IF NOT EXISTS idx_paiements_nupcan ON paiements(nupcan);
CREATE INDEX IF NOT EXISTS idx_paiements_statut ON paiements(statut);
CREATE INDEX IF NOT EXISTS idx_documents_statut ON documents(statut);
CREATE INDEX IF NOT EXISTS idx_dossiers_nipcan ON dossiers(nipcan);
CREATE INDEX IF NOT EXISTS idx_messages_candidat ON messages(candidat_nupcan);
CREATE INDEX IF NOT EXISTS idx_messages_statut ON messages(statut);
