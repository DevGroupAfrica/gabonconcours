-- ============================================
-- Script de mise à jour SIMPLIFIÉ pour Multi-Candidature
-- Date: 2026-02-22
-- Compatible avec phpMyAdmin
-- ============================================

-- IMPORTANT: Exécuter ce script section par section dans phpMyAdmin
-- Copier-coller chaque section séparément

-- ============================================
-- SECTION 1: Modifications table candidats
-- ============================================

-- Ajouter index unique sur nipcan (ignorer l'erreur si existe déjà)
ALTER TABLE `candidats` 
ADD UNIQUE INDEX `idx_nipcan_unique` (`nipcan`);

-- Ajouter colonne password (ignorer l'erreur si existe déjà)
ALTER TABLE `candidats` 
ADD COLUMN `password` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mot de passe hashé';

-- Ajouter colonne last_login (ignorer l'erreur si existe déjà)
ALTER TABLE `candidats` 
ADD COLUMN `last_login` TIMESTAMP NULL DEFAULT NULL COMMENT 'Dernière connexion';

-- Ajouter colonne email_verified (ignorer l'erreur si existe déjà)
ALTER TABLE `candidats` 
ADD COLUMN `email_verified` TINYINT(1) DEFAULT 0 COMMENT 'Email vérifié';

-- ============================================
-- SECTION 2: Nouvelle table candidat_sessions
-- ============================================

CREATE TABLE IF NOT EXISTS `candidat_sessions` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL COMMENT 'NIPCAN du candidat',
    `token` VARCHAR(255) NOT NULL COMMENT 'Token de session JWT',
    `expires_at` DATETIME NOT NULL COMMENT 'Date expiration',
    `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'Adresse IP',
    `user_agent` TEXT DEFAULT NULL COMMENT 'User agent',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_token` (`token`),
    INDEX `idx_nipcan` (`nipcan`),
    INDEX `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECTION 3: Nouvelle table candidat_auth
-- ============================================

CREATE TABLE IF NOT EXISTS `candidat_auth` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL UNIQUE COMMENT 'NIPCAN du candidat',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Hash du mot de passe',
    `email` VARCHAR(255) DEFAULT NULL COMMENT 'Email',
    `telephone` VARCHAR(20) DEFAULT NULL COMMENT 'Téléphone',
    `password_reset_token` VARCHAR(255) DEFAULT NULL COMMENT 'Token reset',
    `password_reset_expires` DATETIME DEFAULT NULL COMMENT 'Expiration token',
    `failed_login_attempts` INT DEFAULT 0 COMMENT 'Tentatives échouées',
    `locked_until` DATETIME DEFAULT NULL COMMENT 'Verrouillé jusqu''à',
    `last_login` DATETIME DEFAULT NULL COMMENT 'Dernière connexion',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_email` (`email`),
    INDEX `idx_telephone` (`telephone`),
    INDEX `idx_reset_token` (`password_reset_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECTION 4: Nouvelle table candidat_login_history
-- ============================================

CREATE TABLE IF NOT EXISTS `candidat_login_history` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL COMMENT 'NIPCAN du candidat',
    `login_time` DATETIME NOT NULL COMMENT 'Date connexion',
    `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'Adresse IP',
    `user_agent` TEXT DEFAULT NULL COMMENT 'User agent',
    `success` TINYINT(1) DEFAULT 1 COMMENT 'Succès (1) ou échec (0)',
    `failure_reason` VARCHAR(255) DEFAULT NULL COMMENT 'Raison échec',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_nipcan` (`nipcan`),
    INDEX `idx_login_time` (`login_time`),
    INDEX `idx_success` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECTION 5: Nouvelle table candidat_preferences
-- ============================================

CREATE TABLE IF NOT EXISTS `candidat_preferences` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL UNIQUE COMMENT 'NIPCAN du candidat',
    `langue` ENUM('fr','en') DEFAULT 'fr' COMMENT 'Langue',
    `theme` ENUM('light','dark','auto') DEFAULT 'light' COMMENT 'Thème',
    `notifications_email` TINYINT(1) DEFAULT 1 COMMENT 'Notifs email',
    `notifications_sms` TINYINT(1) DEFAULT 0 COMMENT 'Notifs SMS',
    `newsletter` TINYINT(1) DEFAULT 0 COMMENT 'Newsletter',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_nipcan` (`nipcan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECTION 6: Nouvelle table candidat_activities
-- ============================================

CREATE TABLE IF NOT EXISTS `candidat_activities` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL COMMENT 'NIPCAN du candidat',
    `nupcan` VARCHAR(100) DEFAULT NULL COMMENT 'NUPCAN candidature',
    `activity_type` ENUM(
        'candidature_created',
        'document_uploaded',
        'document_validated',
        'document_rejected',
        'payment_completed',
        'message_received',
        'note_published',
        'deadline_approaching'
    ) NOT NULL COMMENT 'Type activité',
    `titre` VARCHAR(255) NOT NULL COMMENT 'Titre',
    `description` TEXT DEFAULT NULL COMMENT 'Description',
    `metadata` JSON DEFAULT NULL COMMENT 'Données JSON',
    `is_read` TINYINT(1) DEFAULT 0 COMMENT 'Lu (0=non, 1=oui)',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_nipcan` (`nipcan`),
    INDEX `idx_nupcan` (`nupcan`),
    INDEX `idx_type` (`activity_type`),
    INDEX `idx_created` (`created_at`),
    INDEX `idx_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- SECTION 7: Modifications table candidatures
-- ============================================

-- Ajouter colonne nipcan (ignorer l'erreur si existe déjà)
ALTER TABLE `candidatures` 
ADD COLUMN `nipcan` VARCHAR(50) DEFAULT NULL COMMENT 'NIPCAN du candidat' AFTER `candidat_id`;

-- Ajouter colonne etape_actuelle (ignorer l'erreur si existe déjà)
ALTER TABLE `candidatures` 
ADD COLUMN `etape_actuelle` ENUM('inscription','documents','paiement','resultats','complete') 
DEFAULT 'inscription' COMMENT 'Étape actuelle';

-- Ajouter colonne documents_valides (ignorer l'erreur si existe déjà)
ALTER TABLE `candidatures` 
ADD COLUMN `documents_valides` INT DEFAULT 0 COMMENT 'Docs validés';

-- Ajouter colonne documents_total (ignorer l'erreur si existe déjà)
ALTER TABLE `candidatures` 
ADD COLUMN `documents_total` INT DEFAULT 0 COMMENT 'Docs total';

-- Ajouter colonne paiement_statut (ignorer l'erreur si existe déjà)
ALTER TABLE `candidatures` 
ADD COLUMN `paiement_statut` ENUM('en_attente','valide','rejete') DEFAULT NULL COMMENT 'Statut paiement';

-- Ajouter colonne notes_disponibles (ignorer l'erreur si existe déjà)
ALTER TABLE `candidatures` 
ADD COLUMN `notes_disponibles` TINYINT(1) DEFAULT 0 COMMENT 'Notes dispo';

-- Ajouter index sur nipcan (ignorer l'erreur si existe déjà)
ALTER TABLE `candidatures` 
ADD INDEX `idx_nipcan` (`nipcan`);

-- Ajouter index sur etape_actuelle (ignorer l'erreur si existe déjà)
ALTER TABLE `candidatures` 
ADD INDEX `idx_etape` (`etape_actuelle`);

-- ============================================
-- SECTION 8: Modifications table paiements
-- ============================================

-- Ajouter colonne nipcan (ignorer l'erreur si existe déjà)
ALTER TABLE `paiements` 
ADD COLUMN `nipcan` VARCHAR(50) DEFAULT NULL COMMENT 'NIPCAN du candidat' AFTER `candidat_id`;

-- Ajouter index sur nipcan (ignorer l'erreur si existe déjà)
ALTER TABLE `paiements` 
ADD INDEX `idx_nipcan_paiement` (`nipcan`);

-- ============================================
-- SECTION 9: Index supplémentaires
-- ============================================

-- Index sur candidats (ignorer l'erreur si existe déjà)
ALTER TABLE `candidats` 
ADD INDEX `idx_candidats_nipcan_concours` (`nipcan`, `concours_id`);

-- Index sur dossiers (ignorer l'erreur si existe déjà)
ALTER TABLE `dossiers` 
ADD INDEX `idx_dossiers_nipcan_document` (`nipcan`, `document_id`);

-- Index sur notifications (ignorer l'erreur si existe déjà)
ALTER TABLE `notifications` 
ADD INDEX `idx_notifications_nipcan_statut` (`candidat_nupcan`, `statut`);

-- ============================================
-- SECTION 10: Migration des données
-- ============================================

-- Générer des NIPCAN pour les candidats qui n'en ont pas
UPDATE candidats 
SET nipcan = CONCAT('NIP', YEAR(created_at), LPAD(id, 6, '0'))
WHERE nipcan IS NULL OR nipcan = '';

-- ============================================
-- SECTION 11: Vue v_candidat_dashboard
-- ============================================

CREATE OR REPLACE VIEW `v_candidat_dashboard` AS
SELECT 
    c.nipcan,
    c.nupcan,
    c.nomcan,
    c.prncan,
    c.maican,
    c.telcan,
    c.phtcan,
    c.created_at as candidature_date,
    con.id as concours_id,
    con.libcnc as concours_nom,
    con.fracnc as concours_frais,
    e.nomets as etablissement,
    f.id as filiere_id,
    f.nomfil as filiere_nom,
    (SELECT COUNT(*) FROM dossiers dos 
     JOIN documents d ON dos.document_id = d.id 
     WHERE dos.nipcan = c.nupcan) as documents_total,
    (SELECT COUNT(*) FROM dossiers dos 
     JOIN documents d ON dos.document_id = d.id 
     WHERE dos.nipcan = c.nupcan AND d.statut = 'valide') as documents_valides,
    p.statut as paiement_statut,
    p.montant as paiement_montant,
    (SELECT COUNT(*) FROM notes n WHERE n.candidat_id = c.id) > 0 as has_notes,
    CASE 
        WHEN (SELECT COUNT(*) FROM notes n WHERE n.candidat_id = c.id) > 0 THEN 100
        WHEN p.statut = 'valide' THEN 75
        WHEN (SELECT COUNT(*) FROM dossiers dos 
              JOIN documents d ON dos.document_id = d.id 
              WHERE dos.nipcan = c.nupcan AND d.statut = 'valide') > 0 THEN 50
        ELSE 25
    END as progression
FROM candidats c
LEFT JOIN concours con ON c.concours_id = con.id
LEFT JOIN etablissements e ON con.etablissement_id = e.id
LEFT JOIN filieres f ON c.filiere_id = f.id
LEFT JOIN paiements p ON c.nupcan = p.nupcan OR c.nupcan = p.nipcan;

-- ============================================
-- FIN DU SCRIPT
-- ============================================

SELECT 'Script exécuté avec succès!' as message;
SELECT 'Vérifiez les tables créées avec: SHOW TABLES LIKE ''candidat%'';' as info;
