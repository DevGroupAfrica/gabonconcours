-- Script rapide pour ajouter le support NIPCAN
-- À exécuter dans phpMyAdmin

-- 1. Ajouter la colonne nipcan dans candidats (si elle n'existe pas)
ALTER TABLE `candidats` 
ADD COLUMN `nipcan` VARCHAR(50) DEFAULT NULL AFTER `nupcan`;

-- 2. Ajouter l'index unique sur nipcan
ALTER TABLE `candidats` 
ADD UNIQUE INDEX `idx_nipcan_unique` (`nipcan`);

-- 3. Créer la table des compteurs NIPCAN
CREATE TABLE IF NOT EXISTS `nipcan_counters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `year` INT NOT NULL UNIQUE,
  `counter` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Insérer le premier compteur pour 2026
INSERT INTO `nipcan_counters` (`year`, `counter`) 
VALUES (2026, 1)
ON DUPLICATE KEY UPDATE counter = counter;

-- 5. Générer des NIPCAN pour les candidats existants qui n'en ont pas
UPDATE `candidats` 
SET `nipcan` = CONCAT('NIP', YEAR(created_at), LPAD(id, 6, '0'))
WHERE `nipcan` IS NULL OR `nipcan` = '';
