-- Script d'initialisation complète du système de candidature gabonais
-- Exécuter après les tables de base

USE `gabconcoursv5`;

-- Table pour lier concours et filières
CREATE TABLE IF NOT EXISTS `concours_filieres` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `concours_id` INT NOT NULL,
  `filiere_id` INT NOT NULL,
  `places_disponibles` INT DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_concours_filiere` (`concours_id`, `filiere_id`),
  FOREIGN KEY (`concours_id`) REFERENCES `concours`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`filiere_id`) REFERENCES `filieres`(`id`) ON DELETE CASCADE,
  INDEX `idx_concours` (`concours_id`),
  INDEX `idx_filiere` (`filiere_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour lier filières et matières
CREATE TABLE IF NOT EXISTS `filiere_matieres` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `filiere_id` INT NOT NULL,
  `matiere_id` INT NOT NULL,
  `coefficient` DECIMAL(3,1) NOT NULL DEFAULT 1.0,
  `obligatoire` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_filiere_matiere` (`filiere_id`, `matiere_id`),
  FOREIGN KEY (`filiere_id`) REFERENCES `filieres`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`matiere_id`) REFERENCES `matieres`(`id`) ON DELETE CASCADE,
  INDEX `idx_filiere` (`filiere_id`),
  INDEX `idx_matiere` (`matiere_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour les actions des administrateurs
CREATE TABLE IF NOT EXISTS `admin_actions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `admin_id` INT NOT NULL,
  `action_type` ENUM('validation_document', 'rejet_document', 'ajout_note', 'reponse_message', 'creation_admin', 'modification_concours', 'autre') NOT NULL,
  `entity_type` VARCHAR(50) NOT NULL COMMENT 'Type d entité (document, note, message, etc.)',
  `entity_id` INT NULL COMMENT 'ID de l entité concernée',
  `candidat_nupcan` VARCHAR(50) NULL COMMENT 'NUPCAN du candidat concerné',
  `description` TEXT NOT NULL,
  `details` JSON NULL COMMENT 'Détails supplémentaires en JSON',
  `ip_address` VARCHAR(45) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`admin_id`) REFERENCES `administrateurs`(`id`) ON DELETE CASCADE,
  INDEX `idx_admin` (`admin_id`),
  INDEX `idx_action_type` (`action_type`),
  INDEX `idx_candidat` (`candidat_nupcan`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Amélioration de la table messages si elle existe déjà
-- Ajouter une colonne pour les pièces jointes si nécessaire
ALTER TABLE `messages` 
  ADD COLUMN IF NOT EXISTS `parent_message_id` INT NULL COMMENT 'ID du message parent pour les réponses',
  ADD COLUMN IF NOT EXISTS `is_read_by_admin` TINYINT(1) DEFAULT 0 COMMENT 'Lu par admin',
  ADD COLUMN IF NOT EXISTS `is_read_by_candidat` TINYINT(1) DEFAULT 0 COMMENT 'Lu par candidat',
  ADD INDEX IF NOT EXISTS `idx_parent` (`parent_message_id`);

-- Amélioration de la table documents
ALTER TABLE `documents`
  ADD COLUMN IF NOT EXISTS `can_replace` TINYINT(1) DEFAULT 1 COMMENT 'Peut être remplacé',
  ADD COLUMN IF NOT EXISTS `replacement_count` INT DEFAULT 0 COMMENT 'Nombre de remplacements',
  ADD COLUMN IF NOT EXISTS `last_replaced_at` TIMESTAMP NULL COMMENT 'Date dernier remplacement';

-- Amélioration de la table notifications
ALTER TABLE `notifications`
  ADD COLUMN IF NOT EXISTS `action_url` VARCHAR(255) NULL COMMENT 'URL de l action à effectuer',
  ADD COLUMN IF NOT EXISTS `priority` ENUM('low', 'normal', 'high', 'urgent') DEFAULT 'normal';

-- Vue pour les statistiques des documents par candidat
CREATE OR REPLACE VIEW `v_candidat_documents_stats` AS
SELECT 
  c.nupcan,
  c.nomcan,
  c.prncan,
  c.maican,
  COUNT(d.id) as total_documents,
  SUM(CASE WHEN d.statut = 'valide' THEN 1 ELSE 0 END) as documents_valides,
  SUM(CASE WHEN d.statut = 'rejete' THEN 1 ELSE 0 END) as documents_rejetes,
  SUM(CASE WHEN d.statut = 'en_attente' THEN 1 ELSE 0 END) as documents_en_attente
FROM candidats c
LEFT JOIN documents d ON c.nupcan = d.nipcan
GROUP BY c.nupcan, c.nomcan, c.prncan, c.maican;

-- Vue pour l'activité des administrateurs
CREATE OR REPLACE VIEW `v_admin_activity` AS
SELECT 
  a.id as admin_id,
  a.nom,
  a.prenom,
  a.email,
  a.role,
  COUNT(aa.id) as total_actions,
  MAX(aa.created_at) as derniere_action,
  SUM(CASE WHEN aa.action_type = 'validation_document' THEN 1 ELSE 0 END) as validations,
  SUM(CASE WHEN aa.action_type = 'rejet_document' THEN 1 ELSE 0 END) as rejets,
  SUM(CASE WHEN aa.action_type = 'ajout_note' THEN 1 ELSE 0 END) as notes_ajoutees,
  SUM(CASE WHEN aa.action_type = 'reponse_message' THEN 1 ELSE 0 END) as messages_repondus
FROM administrateurs a
LEFT JOIN admin_actions aa ON a.id = aa.admin_id
GROUP BY a.id, a.nom, a.prenom, a.email, a.role;

-- Table pour le support client
CREATE TABLE IF NOT EXISTS `support_requests` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `candidat_nupcan` VARCHAR(50) NULL,
  `email` VARCHAR(255) NOT NULL,
  `nom` VARCHAR(100) NOT NULL,
  `sujet` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `statut` ENUM('nouveau', 'en_cours', 'resolu', 'ferme') DEFAULT 'nouveau',
  `priorite` ENUM('basse', 'normale', 'haute', 'urgente') DEFAULT 'normale',
  `assigned_to` INT NULL COMMENT 'Super admin assigné',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`assigned_to`) REFERENCES `administrateurs`(`id`) ON DELETE SET NULL,
  INDEX `idx_candidat` (`candidat_nupcan`),
  INDEX `idx_statut` (`statut`),
  INDEX `idx_priorite` (`priorite`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table pour les réponses aux demandes de support
CREATE TABLE IF NOT EXISTS `support_responses` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `support_request_id` INT NOT NULL,
  `admin_id` INT NOT NULL,
  `message` TEXT NOT NULL,
  `is_internal_note` TINYINT(1) DEFAULT 0 COMMENT 'Note interne non visible par le client',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`support_request_id`) REFERENCES `support_requests`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `administrateurs`(`id`) ON DELETE CASCADE,
  INDEX `idx_support_request` (`support_request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Trigger pour créer une action admin lors de la validation d'un document
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS `after_document_validation` 
AFTER UPDATE ON `documents`
FOR EACH ROW
BEGIN
  IF NEW.statut != OLD.statut AND (NEW.statut = 'valide' OR NEW.statut = 'rejete') THEN
    INSERT INTO admin_actions (
      admin_id,
      action_type,
      entity_type,
      entity_id,
      candidat_nupcan,
      description,
      details
    ) VALUES (
      COALESCE(NEW.validated_by, 1),
      IF(NEW.statut = 'valide', 'validation_document', 'rejet_document'),
      'document',
      NEW.id,
      NEW.nipcan,
      CONCAT(IF(NEW.statut = 'valide', 'Validation', 'Rejet'), ' du document: ', NEW.nomdoc),
      JSON_OBJECT(
        'statut', NEW.statut,
        'commentaire', NEW.commentaire_validation,
        'type_document', NEW.type
      )
    );
  END IF;
END$$

DELIMITER ;

-- Trigger pour créer une notification lors d'une réponse admin
DELIMITER $$

CREATE TRIGGER IF NOT EXISTS `after_admin_message_response`
AFTER INSERT ON `messages`
FOR EACH ROW
BEGIN
  IF NEW.expediteur = 'admin' THEN
    INSERT INTO notifications (
      user_type,
      user_id,
      type,
      titre,
      message,
      action_url,
      priority
    ) VALUES (
      'candidat',
      NEW.candidat_nupcan,
      'message',
      'Nouvelle réponse à votre message',
      CONCAT('Vous avez reçu une réponse concernant: ', NEW.sujet),
      '/candidat/messages',
      'high'
    );
    
    INSERT INTO admin_actions (
      admin_id,
      action_type,
      entity_type,
      entity_id,
      candidat_nupcan,
      description
    ) VALUES (
      NEW.admin_id,
      'reponse_message',
      'message',
      NEW.id,
      NEW.candidat_nupcan,
      CONCAT('Réponse au message: ', NEW.sujet)
    );
  END IF;
END$$

DELIMITER ;

-- Index supplémentaires pour optimiser les performances
ALTER TABLE `documents` 
  ADD INDEX IF NOT EXISTS `idx_statut_nipcan` (`statut`, `nipcan`);

ALTER TABLE `messages`
  ADD INDEX IF NOT EXISTS `idx_expediteur_statut` (`expediteur`, `statut`);

ALTER TABLE `paiements`
  ADD INDEX IF NOT EXISTS `idx_statut` (`statut`);

-- Données de test pour les relations concours-filières
INSERT IGNORE INTO `concours_filieres` (`concours_id`, `filiere_id`, `places_disponibles`)
SELECT c.id, f.id, 50
FROM concours c
CROSS JOIN filieres f
LIMIT 10;

-- Données de test pour les relations filières-matières
INSERT IGNORE INTO `filiere_matieres` (`filiere_id`, `matiere_id`, `coefficient`, `obligatoire`)
SELECT f.id, m.id, 
  CASE 
    WHEN m.nom_matiere = 'Mathématiques' THEN 3.0
    WHEN m.nom_matiere = 'Français' THEN 2.0
    ELSE 1.0
  END,
  1
FROM filieres f
CROSS JOIN matieres m
LIMIT 20;

-- Message de confirmation
SELECT '✅ Toutes les tables ont été créées avec succès!' as Status;
SELECT COUNT(*) as 'Nombre de concours-filières' FROM concours_filieres;
SELECT COUNT(*) as 'Nombre de filières-matières' FROM filiere_matieres;
