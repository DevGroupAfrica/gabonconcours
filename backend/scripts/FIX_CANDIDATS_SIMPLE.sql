-- ============================================
-- SCRIPT: Ajouter NIPCAN et USERNAME dans candidats
-- À exécuter dans phpMyAdmin
-- ============================================

-- 1. Ajouter la colonne nipcan
ALTER TABLE `candidats` 
ADD COLUMN `nipcan` VARCHAR(50) DEFAULT NULL AFTER `nupcan`;

-- 2. Ajouter la colonne username
ALTER TABLE `candidats`
ADD COLUMN `username` VARCHAR(100) DEFAULT NULL AFTER `nipcan`;

-- 3. Ajouter les index
ALTER TABLE `candidats` 
ADD UNIQUE INDEX `idx_nipcan_unique` (`nipcan`);

ALTER TABLE `candidats`
ADD INDEX `idx_username` (`username`);

-- 4. Créer la table des compteurs NIPCAN
CREATE TABLE `nipcan_counters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `year` INT NOT NULL UNIQUE,
  `counter` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Insérer les compteurs pour 2025 et 2026
INSERT INTO `nipcan_counters` (`year`, `counter`) VALUES (2025, 1);
INSERT INTO `nipcan_counters` (`year`, `counter`) VALUES (2026, 1);

-- 6. Générer NIPCAN et USERNAME pour tous les candidats existants
UPDATE `candidats` 
SET 
  `nipcan` = CONCAT('NIP', YEAR(COALESCE(created_at, NOW())), LPAD(id, 6, '0')),
  `username` = LOWER(CONCAT(SUBSTRING(nomcan, 1, 1), REPLACE(prncan, ' ', '')))
WHERE `nipcan` IS NULL OR `username` IS NULL;

-- 7. Vérifier les résultats
SELECT 'Vérification candidats' as info;
SELECT 
  COUNT(*) as total,
  SUM(CASE WHEN nipcan IS NOT NULL THEN 1 ELSE 0 END) as avec_nipcan,
  SUM(CASE WHEN username IS NOT NULL THEN 1 ELSE 0 END) as avec_username
FROM candidats;

-- 8. Afficher quelques exemples
SELECT 'Exemples de candidats' as info;
SELECT id, nipcan, nupcan, username, nomcan, prncan, created_at
FROM candidats
ORDER BY id DESC
LIMIT 5;
