-- Script pour créer la table des compteurs NIPCAN
-- À exécuter dans phpMyAdmin

CREATE TABLE IF NOT EXISTS `nipcan_counters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `year` INT NOT NULL UNIQUE,
  `counter` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insérer le premier compteur pour l'année en cours
INSERT INTO `nipcan_counters` (`year`, `counter`) 
VALUES (2026, 1)
ON DUPLICATE KEY UPDATE counter = counter;
