-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : dim. 22 fév. 2026 à 18:05
-- Version du serveur : 9.1.0
-- Version de PHP : 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `gabconcoursv5`
--

-- --------------------------------------------------------

--
-- Structure de la table `activity_feed`
--

DROP TABLE IF EXISTS `activity_feed`;
CREATE TABLE IF NOT EXISTS `activity_feed` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidat_id` int NOT NULL,
  `candidature_id` int DEFAULT NULL,
  `activity_type` enum('candidature_created','document_uploaded','document_validated','document_rejected','payment_completed','message_received','deadline_approaching') COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `metadata` json DEFAULT NULL COMMENT 'Additional activity data',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `candidat_id` (`candidat_id`),
  KEY `candidature_id` (`candidature_id`),
  KEY `activity_type` (`activity_type`),
  KEY `created_at` (`created_at`),
  KEY `idx_activity_candidat_created` (`candidat_id`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `administrateurs`
--

DROP TABLE IF EXISTS `administrateurs`;
CREATE TABLE IF NOT EXISTS `administrateurs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('super_admin','admin_etablissement','sub_admin') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'admin_etablissement',
  `admin_role` enum('notes','documents') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `etablissement_id` int DEFAULT NULL,
  `statut` enum('actif','inactif','suspendu') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'actif',
  `derniere_connexion` timestamp NULL DEFAULT NULL,
  `password_reset_token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_reset_expires` timestamp NULL DEFAULT NULL,
  `created_by` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `etablissement_id` (`etablissement_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_statut` (`statut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `admin_actions`
--

DROP TABLE IF EXISTS `admin_actions`;
CREATE TABLE IF NOT EXISTS `admin_actions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `action_type` enum('validation_document','rejet_document','ajout_note','reponse_message','creation_admin','modification_concours','autre') COLLATE utf8mb4_unicode_ci NOT NULL,
  `entity_type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Type d entité (document, note, message, etc.)',
  `entity_id` int DEFAULT NULL COMMENT 'ID de l entité concernée',
  `candidat_nupcan` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'NUPCAN du candidat concerné',
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `details` json DEFAULT NULL COMMENT 'Détails supplémentaires en JSON',
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin` (`admin_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_candidat` (`candidat_nupcan`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `admin_logs`
--

DROP TABLE IF EXISTS `admin_logs`;
CREATE TABLE IF NOT EXISTS `admin_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `record_id` int DEFAULT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `ip_address` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `admin_id` (`admin_id`),
  KEY `table_name` (`table_name`),
  KEY `created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `candidats`
--

DROP TABLE IF EXISTS `candidats`;
CREATE TABLE IF NOT EXISTS `candidats` (
  `id` int NOT NULL AUTO_INCREMENT,
  `niveau_id` int DEFAULT NULL,
  `concours_id` int DEFAULT NULL,
  `filiere_id` int DEFAULT NULL,
  `nipcan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nupcan` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nomcan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `prncan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `maican` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT '0',
  `dtncan` date DEFAULT NULL,
  `telcan` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ldncan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phtcan` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `proorg` int DEFAULT NULL,
  `proact` int DEFAULT NULL,
  `proaff` int DEFAULT NULL,
  `statut` enum('en_attente','valide','rejete') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `nupcan` (`nupcan`),
  KEY `niveau_id` (`niveau_id`),
  KEY `idx_nipcan` (`nipcan`),
  KEY `idx_nupcan` (`nupcan`),
  KEY `idx_concours` (`concours_id`),
  KEY `idx_statut` (`statut`),
  KEY `idx_candidats_concours_statut` (`concours_id`,`statut`),
  KEY `idx_filiere` (`filiere_id`),
  KEY `idx_created` (`created_at`),
  KEY `idx_candidat_statut` (`statut`),
  KEY `idx_candidat_email` (`maican`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déclencheurs `candidats`
--
DROP TRIGGER IF EXISTS `after_candidat_insert`;
DELIMITER $$
CREATE TRIGGER `after_candidat_insert` AFTER INSERT ON `candidats` FOR EACH ROW BEGIN
    IF NEW.concours_id IS NOT NULL AND NEW.filiere_id IS NOT NULL THEN
        INSERT INTO participations (candidat_id, concours_id, filiere_id, statut, created_at)
        VALUES (NEW.id, NEW.concours_id, NEW.filiere_id, 'en_attente', NOW())
        ON DUPLICATE KEY UPDATE updated_at = NOW();
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `candidatures`
--

DROP TABLE IF EXISTS `candidatures`;
CREATE TABLE IF NOT EXISTS `candidatures` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidat_id` int NOT NULL COMMENT 'Reference to candidats table',
  `concours_id` int NOT NULL COMMENT 'Reference to concours table',
  `filiere_id` int DEFAULT NULL COMMENT 'Reference to filieres table',
  `nupcan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Unique candidature number',
  `statut` enum('draft','documents_pending','documents_submitted','documents_validated','payment_pending','payment_completed','confirmed','rejected','archived') COLLATE utf8mb4_unicode_ci DEFAULT 'draft',
  `progression` int DEFAULT '0' COMMENT 'Completion percentage 0-100',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_candidat_concours` (`candidat_id`,`concours_id`),
  UNIQUE KEY `nupcan` (`nupcan`),
  KEY `candidat_id` (`candidat_id`),
  KEY `concours_id` (`concours_id`),
  KEY `filiere_id` (`filiere_id`),
  KEY `statut` (`statut`),
  KEY `idx_candidature_status_created` (`statut`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `compose`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `compose`;
CREATE TABLE IF NOT EXISTS `compose` (
`candidat_id` int
,`coefficient` decimal(3,1)
,`concours_id` int
,`concours_nom` varchar(255)
,`id` int
,`matiere_id` int
,`nom_matiere` varchar(255)
,`nomcan` varchar(255)
,`notcomp` decimal(5,2)
,`prncan` varchar(255)
);

-- --------------------------------------------------------

--
-- Structure de la table `concours`
--

DROP TABLE IF EXISTS `concours`;
CREATE TABLE IF NOT EXISTS `concours` (
  `id` int NOT NULL AUTO_INCREMENT,
  `etablissement_id` int DEFAULT NULL,
  `niveau_id` int DEFAULT NULL,
  `libcnc` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Nom du concours',
  `fracnc` decimal(10,2) DEFAULT '0.00' COMMENT 'Frais d''inscription',
  `agecnc` int DEFAULT NULL COMMENT 'Age maximum pour participer',
  `sescnc` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Session du concours (ex: 2025/2026)',
  `debcnc` date DEFAULT NULL COMMENT 'Date de début des inscriptions',
  `fincnc` date DEFAULT NULL COMMENT 'Date de fin des inscriptions',
  `stacnc` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '1' COMMENT 'Statut (1=Ouvert, 0=Fermé)',
  `is_gorri` tinyint(1) DEFAULT '0' COMMENT 'Statut Gorri (1=Gratuit, 0=Payant)',
  `etddos` char(1) COLLATE utf8mb4_unicode_ci DEFAULT '0' COMMENT 'État du dossier (ex: 0=non validé, 1=validé)',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `series_bac_acceptees` json DEFAULT NULL COMMENT 'Séries du baccalauréat acceptées (pour première année)',
  `documents_requis` json DEFAULT NULL COMMENT 'Liste des documents requis pour l''inscription',
  `criteres_selection` json DEFAULT NULL COMMENT 'Critères de sélection des candidats',
  `modalites_inscription` json DEFAULT NULL COMMENT 'Modalités et étapes d''inscription',
  `date_publication_resultats` date DEFAULT NULL COMMENT 'Date prévue de publication des résultats',
  `date_debut_cours` date DEFAULT NULL COMMENT 'Date prévue de début des cours',
  `description_concours` text COLLATE utf8mb4_unicode_ci COMMENT 'Description détaillée du concours',
  `conditions_eligibilite` json DEFAULT NULL COMMENT 'Conditions d''éligibilité spécifiques',
  `informations_complementaires` text COLLATE utf8mb4_unicode_ci COMMENT 'Informations complémentaires',
  `contact_email` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Email de contact pour le concours',
  `contact_telephone` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Téléphone de contact pour le concours',
  `lieu_examen` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Lieu de passage de l''examen',
  `type_concours` enum('premiere_annee','master','doctorat','autre') COLLATE utf8mb4_unicode_ci DEFAULT 'autre' COMMENT 'Type de concours',
  `nombre_places_total` int DEFAULT '0' COMMENT 'Nombre total de places disponibles',
  `duree_formation` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Durée de la formation',
  `diplome_delivre` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Diplôme délivré à l''issue de la formation',
  PRIMARY KEY (`id`),
  KEY `idx_etablissement` (`etablissement_id`),
  KEY `idx_niveau` (`niveau_id`),
  KEY `idx_statut` (`stacnc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Liste des concours ouverts';

-- --------------------------------------------------------

--
-- Structure de la table `concours_filieres`
--

DROP TABLE IF EXISTS `concours_filieres`;
CREATE TABLE IF NOT EXISTS `concours_filieres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `concours_id` int NOT NULL,
  `filiere_id` int NOT NULL,
  `places_disponibles` int DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_concours_filiere` (`concours_id`,`filiere_id`),
  KEY `filiere_id` (`filiere_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `documents`
--

DROP TABLE IF EXISTS `documents`;
CREATE TABLE IF NOT EXISTS `documents` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidature_id` int DEFAULT NULL,
  `candidat_id` int DEFAULT NULL,
  `concours_id` int DEFAULT NULL,
  `nomdoc` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom_fichier` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `chemin_fichier` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('en_attente','valide','rejete') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `commentaire_validation` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `validated_by` int DEFAULT NULL,
  `validated_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `concours_id` (`concours_id`),
  KEY `idx_candidat` (`candidat_id`),
  KEY `idx_statut` (`statut`),
  KEY `idx_documents_candidat_statut` (`candidat_id`,`statut`),
  KEY `idx_document_statut` (`statut`),
  KEY `candidature_id` (`candidature_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déclencheurs `documents`
--
DROP TRIGGER IF EXISTS `after_document_update`;
DELIMITER $$
CREATE TRIGGER `after_document_update` AFTER UPDATE ON `documents` FOR EACH ROW BEGIN
    IF NEW.statut != OLD.statut AND NEW.statut IN ('valide', 'rejete') THEN
        -- Récupérer le NUPCAN du candidat
        SET @nupcan = (
            SELECT dos.nupcan
            FROM dossiers dos 
            WHERE dos.document_id = NEW.id 
            LIMIT 1
        );
        
        IF @nupcan IS NOT NULL THEN
            -- Créer une notification
            INSERT INTO notifications (
                candidat_nupcan, 
                type, 
                titre, 
                message, 
                statut, 
                priority,
                created_at
            )
            VALUES (
                @nupcan,
                'document_validation',
                CONCAT('Document ', IF(NEW.statut = 'valide', 'validé', 'rejeté')),
                CONCAT('Votre document "', NEW.nomdoc, '" a été ', IF(NEW.statut = 'valide', 'validé', 'rejeté'), '.'),
                'non_lu',
                IF(NEW.statut = 'valide', 'normal', 'high'),
                NOW()
            );
        END IF;
    END IF;
END
$$
DELIMITER ;
DROP TRIGGER IF EXISTS `after_document_validation`;
DELIMITER $$
CREATE TRIGGER `after_document_validation` AFTER UPDATE ON `documents` FOR EACH ROW BEGIN
  IF NEW.statut != OLD.statut AND (NEW.statut = 'valide' OR NEW.statut = 'rejete') THEN
    IF NEW.validated_by IS NOT NULL THEN
      INSERT INTO admin_actions (
        admin_id,
        action_type,
        entity_type,
        entity_id,
        candidat_nupcan,
        description,
        details
      ) VALUES (
        NEW.validated_by,
        IF(NEW.statut = 'valide', 'validation_document', 'rejet_document'),
        'document',
        NEW.id,
        CONCAT(IF(NEW.statut = 'valide', 'Validation', 'Rejet'), ' du document: ', NEW.nomdoc),
        JSON_OBJECT(
          'statut', NEW.statut,
          'commentaire', NEW.commentaire_validation,
          'type_document', NEW.type
        )
      );
    END IF;
  END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `dossiers`
--

DROP TABLE IF EXISTS `dossiers`;
CREATE TABLE IF NOT EXISTS `dossiers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidat_id` int DEFAULT NULL,
  `candidature_id` int DEFAULT NULL,
  `concours_id` int DEFAULT NULL,
  `document_id` int DEFAULT NULL,
  `nipcan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `docdsr` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `concours_id` (`concours_id`),
  KEY `document_id` (`document_id`),
  KEY `idx_candidat_id` (`candidat_id`),
  KEY `idx_nipcan` (`nipcan`),
  KEY `candidature_id_dossier` (`candidature_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `etablissements`
--

DROP TABLE IF EXISTS `etablissements`;
CREATE TABLE IF NOT EXISTS `etablissements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomets` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `adretes` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefs` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `maiets` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_province` (`province_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `filieres`
--

DROP TABLE IF EXISTS `filieres`;
CREATE TABLE IF NOT EXISTS `filieres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomfil` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `niveau_id` int DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_niveau` (`niveau_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `filiere_matieres`
--

DROP TABLE IF EXISTS `filiere_matieres`;
CREATE TABLE IF NOT EXISTS `filiere_matieres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `filiere_id` int NOT NULL,
  `matiere_id` int NOT NULL,
  `coefficient` decimal(3,1) NOT NULL DEFAULT '1.0',
  `obligatoire` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_filiere_matiere` (`filiere_id`,`matiere_id`),
  KEY `matiere_id` (`matiere_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `matieres`
--

DROP TABLE IF EXISTS `matieres`;
CREATE TABLE IF NOT EXISTS `matieres` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nom_matiere` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `coefficient` decimal(3,1) DEFAULT NULL,
  `duree` int DEFAULT NULL COMMENT 'Durée en heures',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `messages`
--

DROP TABLE IF EXISTS `messages`;
CREATE TABLE IF NOT EXISTS `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidat_nupcan` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `admin_id` int DEFAULT NULL,
  `sujet` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `expediteur` enum('candidat','admin') COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` enum('lu','non_lu') COLLATE utf8mb4_unicode_ci DEFAULT 'non_lu',
  `parent_id` int DEFAULT NULL COMMENT 'Pour les réponses',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `candidat_nupcan` (`candidat_nupcan`),
  KEY `admin_id` (`admin_id`),
  KEY `parent_id` (`parent_id`),
  KEY `statut` (`statut`),
  KEY `idx_message_statut_expediteur` (`statut`,`expediteur`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déclencheurs `messages`
--
DROP TRIGGER IF EXISTS `after_admin_message_response`;
DELIMITER $$
CREATE TRIGGER `after_admin_message_response` AFTER INSERT ON `messages` FOR EACH ROW BEGIN
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
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Structure de la table `niveaux`
--

DROP TABLE IF EXISTS `niveaux`;
CREATE TABLE IF NOT EXISTS `niveaux` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nomniv` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notes`
--

DROP TABLE IF EXISTS `notes`;
CREATE TABLE IF NOT EXISTS `notes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidat_id` int NOT NULL,
  `concours_id` int NOT NULL,
  `matiere_id` int NOT NULL,
  `note` decimal(5,2) NOT NULL,
  `coefficient` decimal(3,1) DEFAULT '1.0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_note` (`candidat_id`,`concours_id`,`matiere_id`),
  KEY `idx_candidat` (`candidat_id`),
  KEY `idx_concours` (`concours_id`),
  KEY `idx_matiere` (`matiere_id`)
) ;

-- --------------------------------------------------------

--
-- Structure de la table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidat_nupcan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `candidat_id` int DEFAULT NULL,
  `type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `titre` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `reference_id` int DEFAULT NULL,
  `reference_type` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('lu','non_lu') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'non_lu',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `priority` enum('low','normal','high') COLLATE utf8mb4_unicode_ci DEFAULT 'normal',
  PRIMARY KEY (`id`),
  KEY `idx_nupcan` (`candidat_nupcan`),
  KEY `idx_statut` (`statut`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_notifications_date` (`candidat_nupcan`,`created_at`),
  KEY `idx_candidat` (`candidat_id`),
  KEY `idx_reference` (`reference_type`,`reference_id`),
  KEY `idx_notification_candidat_read` (`candidat_id`,`statut`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notification_preferences`
--

DROP TABLE IF EXISTS `notification_preferences`;
CREATE TABLE IF NOT EXISTS `notification_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidat_id` int NOT NULL,
  `notification_type` enum('document_validated','document_rejected','payment_confirmed','deadline_reminder','message_received','candidature_created','general') COLLATE utf8mb4_unicode_ci NOT NULL,
  `email_enabled` tinyint(1) DEFAULT '1',
  `in_app_enabled` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_candidat_type` (`candidat_id`,`notification_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `nupcan_counters`
--

DROP TABLE IF EXISTS `nupcan_counters`;
CREATE TABLE IF NOT EXISTS `nupcan_counters` (
  `id` int NOT NULL AUTO_INCREMENT,
  `date_key` varchar(10) NOT NULL,
  `counter` int NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `date_key` (`date_key`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Structure de la table `paiements`
--

DROP TABLE IF EXISTS `paiements`;
CREATE TABLE IF NOT EXISTS `paiements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidat_id` int DEFAULT NULL,
  `candidature_id` int DEFAULT NULL,
  `concours_id` int DEFAULT NULL,
  `nupcan` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `montant` decimal(10,2) NOT NULL,
  `methode` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` enum('en_attente','valide','rejete') CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `reference_paiement` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero_telephone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recu_path` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_nipcan` (`nupcan`),
  KEY `idx_statut` (`statut`),
  KEY `idx_paiements_candidat_statut` (`candidat_id`,`statut`),
  KEY `idx_nupcan` (`nupcan`),
  KEY `idx_candidat_id` (`candidat_id`),
  KEY `idx_concours_id` (`concours_id`),
  KEY `idx_paiement_statut` (`statut`),
  KEY `candidature_id_paiement` (`candidature_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `participations`
--

DROP TABLE IF EXISTS `participations`;
CREATE TABLE IF NOT EXISTS `participations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidat_id` int NOT NULL,
  `concours_id` int NOT NULL,
  `filiere_id` int NOT NULL,
  `statut` enum('en_attente','admis','non_admis','liste_attente') COLLATE utf8mb4_unicode_ci DEFAULT 'en_attente',
  `moyenne_generale` decimal(5,2) DEFAULT NULL,
  `rang` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_participation` (`candidat_id`,`concours_id`),
  KEY `filiere_id` (`filiere_id`),
  KEY `idx_concours` (`concours_id`),
  KEY `idx_statut` (`statut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `provinces`
--

DROP TABLE IF EXISTS `provinces`;
CREATE TABLE IF NOT EXISTS `provinces` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nompro` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `cdepro` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
CREATE TABLE IF NOT EXISTS `sessions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidat_id` int NOT NULL,
  `token` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `candidat_id` (`candidat_id`),
  KEY `idx_token` (`token`),
  KEY `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `support_requests`
--

DROP TABLE IF EXISTS `support_requests`;
CREATE TABLE IF NOT EXISTS `support_requests` (
  `id` int NOT NULL AUTO_INCREMENT,
  `candidat_nupcan` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `sujet` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `statut` enum('nouveau','en_cours','resolu','ferme') COLLATE utf8mb4_unicode_ci DEFAULT 'nouveau',
  `priorite` enum('basse','normale','haute','urgente') COLLATE utf8mb4_unicode_ci DEFAULT 'normale',
  `assigned_to` int DEFAULT NULL COMMENT 'Super admin assigné',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `resolved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `idx_candidat` (`candidat_nupcan`),
  KEY `idx_statut` (`statut`),
  KEY `idx_priorite` (`priorite`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `support_responses`
--

DROP TABLE IF EXISTS `support_responses`;
CREATE TABLE IF NOT EXISTS `support_responses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `support_request_id` int NOT NULL,
  `admin_id` int NOT NULL,
  `message` text NOT NULL,
  `is_internal_note` tinyint(1) DEFAULT '0',
  `createdAt` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_support_request` (`support_request_id`),
  KEY `idx_admin` (`admin_id`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_candidatures_completes`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `vue_candidatures_completes`;
CREATE TABLE IF NOT EXISTS `vue_candidatures_completes` (
`concours_frais` decimal(10,2)
,`concours_nom` varchar(255)
,`created_at` timestamp
,`dtncan` date
,`etablissement_nom` varchar(255)
,`filiere_nom` varchar(255)
,`id` int
,`ldncan` varchar(255)
,`maican` varchar(255)
,`niveau_nom` varchar(255)
,`nomcan` varchar(255)
,`nupcan` varchar(100)
,`phtcan` varchar(255)
,`prncan` varchar(255)
,`statut` enum('en_attente','valide','rejete')
,`telcan` varchar(20)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `vue_stats_etablissements`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `vue_stats_etablissements`;
CREATE TABLE IF NOT EXISTS `vue_stats_etablissements` (
`id` int
,`nb_candidatures` bigint
,`nb_concours` bigint
,`nb_en_attente` bigint
,`nb_rejetees` bigint
,`nb_validees` bigint
,`nomets` varchar(255)
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_admin_activity`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `v_admin_activity`;
CREATE TABLE IF NOT EXISTS `v_admin_activity` (
`derniere_action` timestamp
,`id` int
,`nom` varchar(100)
,`prenom` varchar(100)
,`role` enum('super_admin','admin_etablissement','sub_admin')
,`total_actions` bigint
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_documents_stats`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `v_documents_stats`;
CREATE TABLE IF NOT EXISTS `v_documents_stats` (
`candidats_concernes` bigint
,`statut` enum('en_attente','valide','rejete')
,`total` bigint
);

-- --------------------------------------------------------

--
-- Doublure de structure pour la vue `v_messages_stats`
-- (Voir ci-dessous la vue réelle)
--
DROP VIEW IF EXISTS `v_messages_stats`;
CREATE TABLE IF NOT EXISTS `v_messages_stats` (
`candidats_uniques` bigint
,`expediteur` enum('candidat','admin')
,`statut` enum('lu','non_lu')
,`total` bigint
);

-- --------------------------------------------------------

--
-- Structure de la vue `compose`
--
DROP TABLE IF EXISTS `compose`;

DROP VIEW IF EXISTS `compose`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `compose`  AS SELECT `n`.`id` AS `id`, `n`.`candidat_id` AS `candidat_id`, `n`.`concours_id` AS `concours_id`, `n`.`matiere_id` AS `matiere_id`, `n`.`note` AS `notcomp`, `n`.`coefficient` AS `coefficient`, `c`.`nomcan` AS `nomcan`, `c`.`prncan` AS `prncan`, `co`.`libcnc` AS `concours_nom`, `m`.`nom_matiere` AS `nom_matiere` FROM (((`notes` `n` join `candidats` `c` on((`n`.`candidat_id` = `c`.`id`))) join `concours` `co` on((`n`.`concours_id` = `co`.`id`))) join `matieres` `m` on((`n`.`matiere_id` = `m`.`id`))) ;

-- --------------------------------------------------------

--
-- Structure de la vue `vue_candidatures_completes`
--
DROP TABLE IF EXISTS `vue_candidatures_completes`;

DROP VIEW IF EXISTS `vue_candidatures_completes`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_candidatures_completes`  AS SELECT `c`.`id` AS `id`, `c`.`nupcan` AS `nupcan`, `c`.`nomcan` AS `nomcan`, `c`.`prncan` AS `prncan`, `c`.`maican` AS `maican`, `c`.`telcan` AS `telcan`, `c`.`dtncan` AS `dtncan`, `c`.`ldncan` AS `ldncan`, `c`.`phtcan` AS `phtcan`, `c`.`statut` AS `statut`, `c`.`created_at` AS `created_at`, `co`.`libcnc` AS `concours_nom`, `co`.`fracnc` AS `concours_frais`, `f`.`nomfil` AS `filiere_nom`, `e`.`nomets` AS `etablissement_nom`, `n`.`nomniv` AS `niveau_nom` FROM ((((`candidats` `c` left join `concours` `co` on((`c`.`concours_id` = `co`.`id`))) left join `filieres` `f` on((`c`.`filiere_id` = `f`.`id`))) left join `etablissements` `e` on((`co`.`etablissement_id` = `e`.`id`))) left join `niveaux` `n` on((`c`.`niveau_id` = `n`.`id`))) ;

-- --------------------------------------------------------

--
-- Structure de la vue `vue_stats_etablissements`
--
DROP TABLE IF EXISTS `vue_stats_etablissements`;

DROP VIEW IF EXISTS `vue_stats_etablissements`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vue_stats_etablissements`  AS SELECT `e`.`id` AS `id`, `e`.`nomets` AS `nomets`, count(distinct `co`.`id`) AS `nb_concours`, count(distinct `c`.`id`) AS `nb_candidatures`, count((case when (`c`.`statut` = 'valide') then 1 end)) AS `nb_validees`, count((case when (`c`.`statut` = 'en_attente') then 1 end)) AS `nb_en_attente`, count((case when (`c`.`statut` = 'rejete') then 1 end)) AS `nb_rejetees` FROM ((`etablissements` `e` left join `concours` `co` on((`e`.`id` = `co`.`etablissement_id`))) left join `candidats` `c` on((`co`.`id` = `c`.`concours_id`))) GROUP BY `e`.`id`, `e`.`nomets` ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_admin_activity`
--
DROP TABLE IF EXISTS `v_admin_activity`;

DROP VIEW IF EXISTS `v_admin_activity`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_admin_activity`  AS SELECT `a`.`id` AS `id`, `a`.`nom` AS `nom`, `a`.`prenom` AS `prenom`, `a`.`role` AS `role`, count(distinct `aa`.`id`) AS `total_actions`, max(`aa`.`created_at`) AS `derniere_action` FROM (`administrateurs` `a` left join `admin_actions` `aa` on((`a`.`id` = `aa`.`admin_id`))) GROUP BY `a`.`id`, `a`.`nom`, `a`.`prenom`, `a`.`role` ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_documents_stats`
--
DROP TABLE IF EXISTS `v_documents_stats`;

DROP VIEW IF EXISTS `v_documents_stats`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_documents_stats`  AS SELECT `d`.`statut` AS `statut`, count(0) AS `total`, count(distinct `dos`.`nipcan`) AS `candidats_concernes` FROM (`documents` `d` left join `dossiers` `dos` on((`d`.`id` = `dos`.`document_id`))) GROUP BY `d`.`statut` ;

-- --------------------------------------------------------

--
-- Structure de la vue `v_messages_stats`
--
DROP TABLE IF EXISTS `v_messages_stats`;

DROP VIEW IF EXISTS `v_messages_stats`;
CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `v_messages_stats`  AS SELECT `messages`.`expediteur` AS `expediteur`, `messages`.`statut` AS `statut`, count(0) AS `total`, count(distinct `messages`.`candidat_nupcan`) AS `candidats_uniques` FROM `messages` GROUP BY `messages`.`expediteur`, `messages`.`statut` ;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `activity_feed`
--
ALTER TABLE `activity_feed`
  ADD CONSTRAINT `fk_activity_candidat` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_activity_candidature` FOREIGN KEY (`candidature_id`) REFERENCES `candidatures` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `administrateurs`
--
ALTER TABLE `administrateurs`
  ADD CONSTRAINT `administrateurs_ibfk_1` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `administrateurs_ibfk_2` FOREIGN KEY (`created_by`) REFERENCES `administrateurs` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `admin_actions`
--
ALTER TABLE `admin_actions`
  ADD CONSTRAINT `admin_actions_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `administrateurs` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `admin_logs`
--
ALTER TABLE `admin_logs`
  ADD CONSTRAINT `fk_log_admin` FOREIGN KEY (`admin_id`) REFERENCES `administrateurs` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `candidats`
--
ALTER TABLE `candidats`
  ADD CONSTRAINT `candidats_ibfk_1` FOREIGN KEY (`niveau_id`) REFERENCES `niveaux` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `candidats_ibfk_2` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `candidats_ibfk_3` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `candidatures`
--
ALTER TABLE `candidatures`
  ADD CONSTRAINT `fk_candidature_candidat` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_candidature_concours` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_candidature_filiere` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `concours`
--
ALTER TABLE `concours`
  ADD CONSTRAINT `fk_concours_etablissement` FOREIGN KEY (`etablissement_id`) REFERENCES `etablissements` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_concours_niveau` FOREIGN KEY (`niveau_id`) REFERENCES `niveaux` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `concours_filieres`
--
ALTER TABLE `concours_filieres`
  ADD CONSTRAINT `concours_filieres_ibfk_1` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `concours_filieres_ibfk_2` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `documents`
--
ALTER TABLE `documents`
  ADD CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `documents_ibfk_2` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_document_candidature` FOREIGN KEY (`candidature_id`) REFERENCES `candidatures` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `dossiers`
--
ALTER TABLE `dossiers`
  ADD CONSTRAINT `dossiers_ibfk_1` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dossiers_ibfk_2` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `dossiers_ibfk_3` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_dossier_candidature` FOREIGN KEY (`candidature_id`) REFERENCES `candidatures` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `etablissements`
--
ALTER TABLE `etablissements`
  ADD CONSTRAINT `etablissements_ibfk_1` FOREIGN KEY (`province_id`) REFERENCES `provinces` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `filieres`
--
ALTER TABLE `filieres`
  ADD CONSTRAINT `filieres_ibfk_1` FOREIGN KEY (`niveau_id`) REFERENCES `niveaux` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `filiere_matieres`
--
ALTER TABLE `filiere_matieres`
  ADD CONSTRAINT `filiere_matieres_ibfk_1` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `filiere_matieres_ibfk_2` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `messages`
--
ALTER TABLE `messages`
  ADD CONSTRAINT `fk_message_admin` FOREIGN KEY (`admin_id`) REFERENCES `administrateurs` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_message_parent` FOREIGN KEY (`parent_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `notes`
--
ALTER TABLE `notes`
  ADD CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notes_ibfk_2` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `notes_ibfk_3` FOREIGN KEY (`matiere_id`) REFERENCES `matieres` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  ADD CONSTRAINT `fk_notif_pref_candidat` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `paiements`
--
ALTER TABLE `paiements`
  ADD CONSTRAINT `fk_paiement_candidature` FOREIGN KEY (`candidature_id`) REFERENCES `candidatures` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `paiements_ibfk_1` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `paiements_ibfk_2` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE SET NULL;

--
-- Contraintes pour la table `participations`
--
ALTER TABLE `participations`
  ADD CONSTRAINT `participations_ibfk_1` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `participations_ibfk_2` FOREIGN KEY (`concours_id`) REFERENCES `concours` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `participations_ibfk_3` FOREIGN KEY (`filiere_id`) REFERENCES `filieres` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `sessions`
--
ALTER TABLE `sessions`
  ADD CONSTRAINT `sessions_ibfk_1` FOREIGN KEY (`candidat_id`) REFERENCES `candidats` (`id`) ON DELETE CASCADE;

--
-- Contraintes pour la table `support_requests`
--
ALTER TABLE `support_requests`
  ADD CONSTRAINT `support_requests_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `administrateurs` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
