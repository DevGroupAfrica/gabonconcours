-- Script complet pour le système multi-candidature
-- À exécuter dans phpMyAdmin

-- 1. Ajouter la colonne nipcan dans candidats
ALTER TABLE `candidats` 
ADD COLUMN `nipcan` VARCHAR(50) DEFAULT NULL AFTER `nupcan`;

-- 2. Ajouter la colonne username dans candidats
ALTER TABLE `candidats` 
ADD COLUMN `username` VARCHAR(100) DEFAULT NULL AFTER `nipcan`;

-- 3. Ajouter les index
ALTER TABLE `candidats` 
ADD UNIQUE INDEX `idx_nipcan_unique` (`nipcan`);

ALTER TABLE `candidats` 
ADD INDEX `idx_username` (`username`);

-- 4. Créer la table des compteurs NIPCAN
CREATE TABLE IF NOT EXISTS `nipcan_counters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `year` INT NOT NULL UNIQUE,
  `counter` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Insérer le premier compteur pour 2026
INSERT INTO `nipcan_counters` (`year`, `counter`) 
VALUES (2026, 1)
ON DUPLICATE KEY UPDATE counter = counter;

-- 6. Générer NIPCAN et USERNAME pour les candidats existants
UPDATE `candidats` 
SET 
  `nipcan` = CONCAT('NIP', YEAR(created_at), LPAD(id, 6, '0')),
  `username` = LOWER(CONCAT(SUBSTRING(nomcan, 1, 1), prncan))
WHERE `nipcan` IS NULL OR `nipcan` = '';

-- 7. Vérifier que la colonne nupcan existe dans dossiers
-- (Si erreur, ignorer)
ALTER TABLE `dossiers` 
ADD COLUMN `nupcan` VARCHAR(50) DEFAULT NULL AFTER `nipcan`;

ALTER TABLE `dossiers` 
ADD INDEX `idx_nupcan` (`nupcan`);

-- 8. Vérifier que la colonne nupcan existe dans paiements
-- (Si erreur, ignorer)
ALTER TABLE `paiements` 
ADD COLUMN `nupcan` VARCHAR(50) DEFAULT NULL AFTER `nipcan`;

ALTER TABLE `paiements` 
ADD INDEX `idx_nupcan_paiement` (`nupcan`);

-- Afficher un résumé
SELECT 
  'Candidats avec NIPCAN' as info,
  COUNT(*) as total
FROM candidats 
WHERE nipcan IS NOT NULL

UNION ALL

SELECT 
  'Candidats avec USERNAME' as info,
  COUNT(*) as total
FROM candidats 
WHERE username IS NOT NULL;
