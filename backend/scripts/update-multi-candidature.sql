-- ============================================
-- Script de mise à jour pour Multi-Candidature
-- Date: 2026-02-22
-- Description: Ajout des tables et modifications pour le système multi-candidature
-- ============================================

-- 1. Ajouter contrainte unique sur NIPCAN si pas déjà fait
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'candidats' 
AND INDEX_NAME = 'idx_nipcan_unique';

SET @query = IF(@index_exists = 0, 
    'ALTER TABLE `candidats` ADD UNIQUE INDEX `idx_nipcan_unique` (`nipcan`)',
    'SELECT ''Index idx_nipcan_unique already exists'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. Ajouter champs manquants dans candidats (vérification avant ajout)
-- Vérifier et ajouter password
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'candidats' 
AND COLUMN_NAME = 'password';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE `candidats` ADD COLUMN `password` VARCHAR(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT ''Mot de passe hashé pour authentification''',
    'SELECT ''Column password already exists'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier et ajouter last_login
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'candidats' 
AND COLUMN_NAME = 'last_login';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE `candidats` ADD COLUMN `last_login` TIMESTAMP NULL DEFAULT NULL COMMENT ''Dernière connexion''',
    'SELECT ''Column last_login already exists'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier et ajouter email_verified
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'candidats' 
AND COLUMN_NAME = 'email_verified';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE `candidats` ADD COLUMN `email_verified` TINYINT(1) DEFAULT 0 COMMENT ''Email vérifié (0=non, 1=oui)''',
    'SELECT ''Column email_verified already exists'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3. Créer table pour gérer les sessions/authentification des candidats
CREATE TABLE IF NOT EXISTS `candidat_sessions` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL COMMENT 'NIPCAN du candidat',
    `token` VARCHAR(255) NOT NULL COMMENT 'Token de session JWT',
    `expires_at` DATETIME NOT NULL COMMENT 'Date d''expiration du token',
    `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'Adresse IP de connexion',
    `user_agent` TEXT DEFAULT NULL COMMENT 'User agent du navigateur',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_token` (`token`),
    INDEX `idx_nipcan` (`nipcan`),
    INDEX `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Sessions d''authentification des candidats';

-- 4. Créer table pour les mots de passe et authentification
CREATE TABLE IF NOT EXISTS `candidat_auth` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL UNIQUE COMMENT 'NIPCAN du candidat',
    `password_hash` VARCHAR(255) NOT NULL COMMENT 'Hash du mot de passe (bcrypt)',
    `email` VARCHAR(255) DEFAULT NULL COMMENT 'Email pour récupération',
    `telephone` VARCHAR(20) DEFAULT NULL COMMENT 'Téléphone pour récupération',
    `password_reset_token` VARCHAR(255) DEFAULT NULL COMMENT 'Token de réinitialisation',
    `password_reset_expires` DATETIME DEFAULT NULL COMMENT 'Expiration du token',
    `failed_login_attempts` INT DEFAULT 0 COMMENT 'Nombre de tentatives échouées',
    `locked_until` DATETIME DEFAULT NULL COMMENT 'Compte verrouillé jusqu''à',
    `last_login` DATETIME DEFAULT NULL COMMENT 'Dernière connexion réussie',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_email` (`email`),
    INDEX `idx_telephone` (`telephone`),
    INDEX `idx_reset_token` (`password_reset_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Authentification et sécurité des candidats';

-- 5. Créer table pour l'historique des connexions
CREATE TABLE IF NOT EXISTS `candidat_login_history` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL COMMENT 'NIPCAN du candidat',
    `login_time` DATETIME NOT NULL COMMENT 'Date et heure de connexion',
    `ip_address` VARCHAR(45) DEFAULT NULL COMMENT 'Adresse IP',
    `user_agent` TEXT DEFAULT NULL COMMENT 'User agent',
    `success` TINYINT(1) DEFAULT 1 COMMENT 'Connexion réussie (1) ou échouée (0)',
    `failure_reason` VARCHAR(255) DEFAULT NULL COMMENT 'Raison de l''échec',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_nipcan` (`nipcan`),
    INDEX `idx_login_time` (`login_time`),
    INDEX `idx_success` (`success`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Historique des connexions des candidats';

-- 6. Améliorer la table candidatures (déjà existante, ajout de champs)
-- Vérifier et ajouter nipcan
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'candidatures' 
AND COLUMN_NAME = 'nipcan';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE `candidatures` ADD COLUMN `nipcan` VARCHAR(50) DEFAULT NULL COMMENT ''NIPCAN du candidat propriétaire'' AFTER `candidat_id`',
    'SELECT ''Column nipcan already exists in candidatures'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier et ajouter etape_actuelle
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'candidatures' 
AND COLUMN_NAME = 'etape_actuelle';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE `candidatures` ADD COLUMN `etape_actuelle` ENUM(''inscription'',''documents'',''paiement'',''resultats'',''complete'') DEFAULT ''inscription'' COMMENT ''Étape actuelle de la candidature''',
    'SELECT ''Column etape_actuelle already exists'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier et ajouter documents_valides
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'candidatures' 
AND COLUMN_NAME = 'documents_valides';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE `candidatures` ADD COLUMN `documents_valides` INT DEFAULT 0 COMMENT ''Nombre de documents validés''',
    'SELECT ''Column documents_valides already exists'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier et ajouter documents_total
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'candidatures' 
AND COLUMN_NAME = 'documents_total';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE `candidatures` ADD COLUMN `documents_total` INT DEFAULT 0 COMMENT ''Nombre total de documents requis''',
    'SELECT ''Column documents_total already exists'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier et ajouter paiement_statut
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'candidatures' 
AND COLUMN_NAME = 'paiement_statut';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE `candidatures` ADD COLUMN `paiement_statut` ENUM(''en_attente'',''valide'',''rejete'') DEFAULT NULL COMMENT ''Statut du paiement''',
    'SELECT ''Column paiement_statut already exists'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Vérifier et ajouter notes_disponibles
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'candidatures' 
AND COLUMN_NAME = 'notes_disponibles';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE `candidatures` ADD COLUMN `notes_disponibles` TINYINT(1) DEFAULT 0 COMMENT ''Notes disponibles (0=non, 1=oui)''',
    'SELECT ''Column notes_disponibles already exists'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter index sur nipcan si pas déjà fait
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'candidatures' 
AND INDEX_NAME = 'idx_nipcan';

SET @query = IF(@index_exists = 0, 
    'ALTER TABLE `candidatures` ADD INDEX `idx_nipcan` (`nipcan`)',
    'SELECT ''Index idx_nipcan already exists on candidatures'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter index sur etape_actuelle si pas déjà fait
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'candidatures' 
AND INDEX_NAME = 'idx_etape';

SET @query = IF(@index_exists = 0, 
    'ALTER TABLE `candidatures` ADD INDEX `idx_etape` (`etape_actuelle`)',
    'SELECT ''Index idx_etape already exists'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. Ajouter champ nipcan dans paiements si pas déjà fait
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'paiements' 
AND COLUMN_NAME = 'nipcan';

SET @query = IF(@col_exists = 0, 
    'ALTER TABLE `paiements` ADD COLUMN `nipcan` VARCHAR(50) DEFAULT NULL COMMENT ''NIPCAN du candidat'' AFTER `candidat_id`',
    'SELECT ''Column nipcan already exists in paiements'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Ajouter index sur nipcan dans paiements si pas déjà fait
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'paiements' 
AND INDEX_NAME = 'idx_nipcan_paiement';

SET @query = IF(@index_exists = 0, 
    'ALTER TABLE `paiements` ADD INDEX `idx_nipcan_paiement` (`nipcan`)',
    'SELECT ''Index idx_nipcan_paiement already exists'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 8. Créer table pour les préférences utilisateur
CREATE TABLE IF NOT EXISTS `candidat_preferences` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL UNIQUE COMMENT 'NIPCAN du candidat',
    `langue` ENUM('fr','en') DEFAULT 'fr' COMMENT 'Langue préférée',
    `theme` ENUM('light','dark','auto') DEFAULT 'light' COMMENT 'Thème de l''interface',
    `notifications_email` TINYINT(1) DEFAULT 1 COMMENT 'Recevoir notifications par email',
    `notifications_sms` TINYINT(1) DEFAULT 0 COMMENT 'Recevoir notifications par SMS',
    `newsletter` TINYINT(1) DEFAULT 0 COMMENT 'S''abonner à la newsletter',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_nipcan` (`nipcan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Préférences des candidats';

-- 9. Créer table pour les activités du candidat (feed d'activités)
CREATE TABLE IF NOT EXISTS `candidat_activities` (
    `id` INT PRIMARY KEY AUTO_INCREMENT,
    `nipcan` VARCHAR(50) NOT NULL COMMENT 'NIPCAN du candidat',
    `nupcan` VARCHAR(100) DEFAULT NULL COMMENT 'NUPCAN de la candidature concernée',
    `activity_type` ENUM(
        'candidature_created',
        'document_uploaded',
        'document_validated',
        'document_rejected',
        'payment_completed',
        'message_received',
        'note_published',
        'deadline_approaching'
    ) NOT NULL COMMENT 'Type d''activité',
    `titre` VARCHAR(255) NOT NULL COMMENT 'Titre de l''activité',
    `description` TEXT DEFAULT NULL COMMENT 'Description détaillée',
    `metadata` JSON DEFAULT NULL COMMENT 'Données supplémentaires en JSON',
    `is_read` TINYINT(1) DEFAULT 0 COMMENT 'Activité lue (0=non, 1=oui)',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_nipcan` (`nipcan`),
    INDEX `idx_nupcan` (`nupcan`),
    INDEX `idx_type` (`activity_type`),
    INDEX `idx_created` (`created_at`),
    INDEX `idx_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Fil d''activités des candidats';

-- 10. Créer vue pour le dashboard candidat
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
    
    -- Informations concours
    con.id as concours_id,
    con.libcnc as concours_nom,
    con.fracnc as concours_frais,
    e.nomets as etablissement,
    
    -- Informations filière
    f.id as filiere_id,
    f.nomfil as filiere_nom,
    
    -- Statistiques documents
    (SELECT COUNT(*) FROM dossiers dos 
     JOIN documents d ON dos.document_id = d.id 
     WHERE dos.nipcan = c.nupcan) as documents_total,
    (SELECT COUNT(*) FROM dossiers dos 
     JOIN documents d ON dos.document_id = d.id 
     WHERE dos.nipcan = c.nupcan AND d.statut = 'valide') as documents_valides,
    
    -- Statut paiement
    p.statut as paiement_statut,
    p.montant as paiement_montant,
    
    -- Notes disponibles
    (SELECT COUNT(*) FROM notes n WHERE n.candidat_id = c.id) > 0 as has_notes,
    
    -- Progression (calculée)
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

-- 11. Créer procédure stockée pour récupérer le dashboard d'un candidat
DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS `sp_get_candidat_dashboard`(IN p_nipcan VARCHAR(50))
BEGIN
    -- Informations du candidat
    SELECT 
        nipcan,
        nomcan as nom,
        prncan as prenom,
        maican as email,
        telcan as telephone,
        phtcan as photo
    FROM candidats 
    WHERE nipcan = p_nipcan 
    LIMIT 1;
    
    -- Liste des candidatures
    SELECT * FROM v_candidat_dashboard 
    WHERE nipcan = p_nipcan 
    ORDER BY candidature_date DESC;
    
    -- Notifications non lues
    SELECT 
        id,
        type,
        titre,
        message,
        priority,
        created_at
    FROM notifications 
    WHERE candidat_nupcan IN (
        SELECT nupcan FROM candidats WHERE nipcan = p_nipcan
    )
    AND statut = 'non_lu'
    ORDER BY created_at DESC
    LIMIT 10;
    
    -- Activités récentes
    SELECT 
        activity_type as type,
        titre,
        description,
        created_at
    FROM candidat_activities 
    WHERE nipcan = p_nipcan 
    ORDER BY created_at DESC 
    LIMIT 10;
END$$

DELIMITER ;

-- 12. Créer trigger pour créer automatiquement une activité lors d'une nouvelle candidature
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS `after_candidat_insert_activity` 
AFTER INSERT ON `candidats`
FOR EACH ROW
BEGIN
    IF NEW.nipcan IS NOT NULL THEN
        INSERT INTO candidat_activities (
            nipcan,
            nupcan,
            activity_type,
            titre,
            description,
            created_at
        ) VALUES (
            NEW.nipcan,
            NEW.nupcan,
            'candidature_created',
            'Nouvelle candidature créée',
            CONCAT('Candidature pour le concours ', 
                   (SELECT libcnc FROM concours WHERE id = NEW.concours_id LIMIT 1)),
            NOW()
        );
    END IF;
END$$

DELIMITER ;

-- 13. Créer trigger pour créer une activité lors de la validation d'un document
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS `after_document_validation_activity` 
AFTER UPDATE ON `documents`
FOR EACH ROW
BEGIN
    DECLARE v_nipcan VARCHAR(50);
    
    IF NEW.statut != OLD.statut AND NEW.statut IN ('valide', 'rejete') THEN
        -- Récupérer le NIPCAN
        SELECT c.nipcan INTO v_nipcan
        FROM dossiers dos
        JOIN candidats c ON dos.nipcan = c.nupcan
        WHERE dos.document_id = NEW.id
        LIMIT 1;
        
        IF v_nipcan IS NOT NULL THEN
            INSERT INTO candidat_activities (
                nipcan,
                nupcan,
                activity_type,
                titre,
                description,
                created_at
            ) VALUES (
                v_nipcan,
                (SELECT nipcan FROM dossiers WHERE document_id = NEW.id LIMIT 1),
                IF(NEW.statut = 'valide', 'document_validated', 'document_rejected'),
                CONCAT('Document ', IF(NEW.statut = 'valide', 'validé', 'rejeté')),
                CONCAT('Votre document "', NEW.nomdoc, '" a été ', 
                       IF(NEW.statut = 'valide', 'validé', 'rejeté')),
                NOW()
            );
        END IF;
    END IF;
END$$

DELIMITER ;

-- 14. Créer index pour améliorer les performances (vérification avant création)
-- Index sur candidats
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'candidats' 
AND INDEX_NAME = 'idx_candidats_nipcan_concours';

SET @query = IF(@index_exists = 0, 
    'CREATE INDEX `idx_candidats_nipcan_concours` ON `candidats` (`nipcan`, `concours_id`)',
    'SELECT ''Index idx_candidats_nipcan_concours already exists'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index sur dossiers
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'dossiers' 
AND INDEX_NAME = 'idx_dossiers_nipcan_document';

SET @query = IF(@index_exists = 0, 
    'CREATE INDEX `idx_dossiers_nipcan_document` ON `dossiers` (`nipcan`, `document_id`)',
    'SELECT ''Index idx_dossiers_nipcan_document already exists'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Index sur notifications
SET @index_exists = 0;
SELECT COUNT(*) INTO @index_exists 
FROM information_schema.STATISTICS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME = 'notifications' 
AND INDEX_NAME = 'idx_notifications_nipcan_statut';

SET @query = IF(@index_exists = 0, 
    'CREATE INDEX `idx_notifications_nipcan_statut` ON `notifications` (`candidat_nupcan`, `statut`)',
    'SELECT ''Index idx_notifications_nipcan_statut already exists'' as message');
PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 15. Mettre à jour les données existantes (migration)
-- Générer des NIPCAN pour les candidats qui n'en ont pas
UPDATE candidats 
SET nipcan = CONCAT('NIP', YEAR(created_at), LPAD(id, 6, '0'))
WHERE nipcan IS NULL OR nipcan = '';

-- 16. Créer fonction pour générer un NIPCAN unique
DELIMITER $$

CREATE FUNCTION IF NOT EXISTS `generate_nipcan`() 
RETURNS VARCHAR(50)
DETERMINISTIC
BEGIN
    DECLARE new_nipcan VARCHAR(50);
    DECLARE counter INT;
    DECLARE year_part VARCHAR(4);
    
    SET year_part = YEAR(NOW());
    
    -- Obtenir le prochain numéro
    SELECT COALESCE(MAX(CAST(SUBSTRING(nipcan, 8) AS UNSIGNED)), 0) + 1 
    INTO counter
    FROM candidats 
    WHERE nipcan LIKE CONCAT('NIP', year_part, '%');
    
    SET new_nipcan = CONCAT('NIP', year_part, LPAD(counter, 6, '0'));
    
    RETURN new_nipcan;
END$$

DELIMITER ;

-- 17. Ajouter des commentaires sur les tables
ALTER TABLE `candidats` COMMENT = 'Table principale des candidats - Un candidat peut avoir plusieurs candidatures (NUPCAN) mais un seul NIPCAN';
ALTER TABLE `candidatures` COMMENT = 'Table des candidatures - Chaque candidature a un NUPCAN unique lié à un NIPCAN';
ALTER TABLE `candidat_sessions` COMMENT = 'Sessions d''authentification - Gestion des tokens JWT pour les candidats';
ALTER TABLE `candidat_auth` COMMENT = 'Authentification - Mots de passe et sécurité des comptes candidats';

-- ============================================
-- FIN DU SCRIPT
-- ============================================

-- Afficher un message de confirmation
SELECT 'Base de données mise à jour avec succès pour le système multi-candidature!' as message;
SELECT 'Tables créées: candidat_sessions, candidat_auth, candidat_login_history, candidat_preferences, candidat_activities' as info;
SELECT 'Vues créées: v_candidat_dashboard' as info;
SELECT 'Procédures créées: sp_get_candidat_dashboard' as info;
SELECT 'Triggers créés: after_candidat_insert_activity, after_document_validation_activity' as info;
