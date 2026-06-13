-- ============================================
-- Script Simple de Mise à Jour Multi-Candidature
-- Date: 2026-02-22
-- Instructions: Exécuter ce script dans phpMyAdmin
-- ============================================

USE gabconcoursv5;

-- 1. Ajouter colonnes dans candidats (ignorer si existe déjà)
ALTER TABLE `candidats` 
ADD COLUMN `password` VARCHAR(255) DEFAULT NULL COMMENT 'Mot de passe hashé',
ADD COLUMN `last_login` TIMESTAMP NULL DEFAULT NULL COMMENT 'Dernière connexion',
ADD COLUMN `email_verified` TINYINT(1) DEFAULT 0 COMMENT 'Email vérifié';

-- 2. Ajouter index unique sur nipcan
ALTER TABLE `candidats` ADD UNIQUE INDEX `idx_nipcan_unique` (`nipcan`);

-- 3. Créer table candidat_sessions
CREATE TABLE `candidat_sessions` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL,
    `token` VARCHAR(255) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_token` (`token`),
    INDEX `idx_nipcan` (`nipcan`),
    INDEX `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Créer table candidat_auth
CREATE TABLE `candidat_auth` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) DEFAULT NULL,
    `telephone` VARCHAR(20) DEFAULT NULL,
    `password_reset_token` VARCHAR(255) DEFAULT NULL,
    `password_reset_expires` DATETIME DEFAULT NULL,
    `failed_login_attempts` INT DEFAULT 0,
    `locked_until` DATETIME DEFAULT NULL,
    `last_login` DATETIME DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_email` (`email`),
    INDEX `idx_telephone` (`telephone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Créer table candidat_login_history
CREATE TABLE `candidat_login_history` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL,
    `login_time` DATETIME NOT NULL,
    `ip_address` VARCHAR(45) DEFAULT NULL,
    `user_agent` TEXT DEFAULT NULL,
    `success` TINYINT(1) DEFAULT 1,
    `failure_reason` VARCHAR(255) DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_nipcan` (`nipcan`),
    INDEX `idx_login_time` (`login_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Créer table candidat_preferences
CREATE TABLE `candidat_preferences` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL UNIQUE,
    `langue` ENUM('fr','en') DEFAULT 'fr',
    `theme` ENUM('light','dark','auto') DEFAULT 'light',
    `notifications_email` TINYINT(1) DEFAULT 1,
    `notifications_sms` TINYINT(1) DEFAULT 0,
    `newsletter` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Créer table candidat_activities
CREATE TABLE `candidat_activities` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL,
    `nupcan` VARCHAR(100) DEFAULT NULL,
    `activity_type` ENUM(
        'candidature_created',
        'document_uploaded',
        'document_validated',
        'document_rejected',
        'payment_completed',
        'message_received',
        'note_published',
        'deadline_approaching'
    ) NOT NULL,
    `titre` VARCHAR(255) NOT NULL,
    `description` TEXT DEFAULT NULL,
    `metadata` JSON DEFAULT NULL,
    `is_read` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_nipcan` (`nipcan`),
    INDEX `idx_nupcan` (`nupcan`),
    INDEX `idx_type` (`activity_type`),
    INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Ajouter colonnes dans candidatures
ALTER TABLE `candidatures`
ADD COLUMN `nipcan` VARCHAR(50) DEFAULT NULL AFTER `candidat_id`,
ADD COLUMN `etape_actuelle` ENUM('inscription','documents','paiement','resultats','complete') DEFAULT 'inscription',
ADD COLUMN `documents_valides` INT DEFAULT 0,
ADD COLUMN `documents_total` INT DEFAULT 0,
ADD COLUMN `paiement_statut` ENUM('en_attente','valide','rejete') DEFAULT NULL,
ADD COLUMN `notes_disponibles` TINYINT(1) DEFAULT 0,
ADD INDEX `idx_nipcan` (`nipcan`),
ADD INDEX `idx_etape` (`etape_actuelle`);

-- 9. Ajouter colonne nipcan dans paiements
ALTER TABLE `paiements`
ADD COLUMN `nipcan` VARCHAR(50) DEFAULT NULL AFTER `candidat_id`,
ADD INDEX `idx_nipcan_paiement` (`nipcan`);

-- 10. Créer index supplémentaires
CREATE INDEX `idx_candidats_nipcan_concours` ON `candidats` (`nipcan`, `concours_id`);
CREATE INDEX `idx_dossiers_nipcan_document` ON `dossiers` (`nipcan`, `document_id`);

-- 11. Mettre à jour les NIPCAN existants
UPDATE candidats 
SET nipcan = CONCAT('NIP', YEAR(created_at), LPAD(id, 6, '0'))
WHERE nipcan IS NULL OR nipcan = '';

-- 12. Message de confirmation
SELECT 'Base de données mise à jour avec succès!' as message;
SELECT 'Tables créées: candidat_sessions, candidat_auth, candidat_login_history, candidat_preferences, candidat_activities' as info;

COMMIT;
