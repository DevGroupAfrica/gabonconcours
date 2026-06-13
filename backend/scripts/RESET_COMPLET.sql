-- ============================================
-- SCRIPT DE RESET COMPLET
-- À exécuter dans phpMyAdmin
-- ============================================

-- 1. AJOUTER LES COLONNES MANQUANTES DANS CANDIDATS
-- (Ignorer les erreurs si elles existent déjà)

-- Ajouter nipcan
ALTER TABLE `candidats` 
ADD COLUMN IF NOT EXISTS `nipcan` VARCHAR(50) DEFAULT NULL AFTER `nupcan`;

-- Ajouter username  
ALTER TABLE `candidats`
ADD COLUMN IF NOT EXISTS `username` VARCHAR(100) DEFAULT NULL AFTER `nipcan`;

-- 2. AJOUTER LES INDEX
ALTER TABLE `candidats` 
ADD UNIQUE INDEX IF NOT EXISTS `idx_nipcan_unique` (`nipcan`);

ALTER TABLE `candidats`
ADD INDEX IF NOT EXISTS `idx_username` (`username`);

-- 3. CRÉER LA TABLE DES COMPTEURS NIPCAN
CREATE TABLE IF NOT EXISTS `nipcan_counters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `year` INT NOT NULL UNIQUE,
  `counter` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. INSÉRER LE COMPTEUR POUR 2026
INSERT INTO `nipcan_counters` (`year`, `counter`) 
VALUES (2026, 1)
ON DUPLICATE KEY UPDATE counter = counter;

-- 5. METTRE À JOUR LES CANDIDATS EXISTANTS
-- Générer NIPCAN et USERNAME pour tous les candidats qui n'en ont pas
UPDATE `candidats` 
SET 
  `nipcan` = CONCAT('NIP', YEAR(COALESCE(created_at, NOW())), LPAD(id, 6, '0')),
  `username` = LOWER(CONCAT(SUBSTRING(nomcan, 1, 1), REPLACE(prncan, ' ', '')))
WHERE `nipcan` IS NULL OR `nipcan` = '' OR `username` IS NULL OR `username` = '';

-- 6. VÉRIFIER LES COLONNES DANS DOSSIERS
ALTER TABLE `dossiers`
ADD COLUMN IF NOT EXISTS `nupcan` VARCHAR(50) DEFAULT NULL AFTER `nipcan`;

ALTER TABLE `dossiers`
ADD INDEX IF NOT EXISTS `idx_nupcan_dossier` (`nupcan`);

-- 7. VÉRIFIER LES COLONNES DANS PAIEMENTS  
ALTER TABLE `paiements`
ADD COLUMN IF NOT EXISTS `nupcan` VARCHAR(50) DEFAULT NULL AFTER `nipcan`;

ALTER TABLE `paiements`
ADD INDEX IF NOT EXISTS `idx_nupcan_paiement` (`nupcan`);

-- 8. AFFICHER UN RÉSUMÉ
SELECT '=== RÉSUMÉ ===' as info;

SELECT 
  'Total candidats' as info,
  COUNT(*) as valeur
FROM candidats

UNION ALL

SELECT 
  'Candidats avec NIPCAN' as info,
  COUNT(*) as valeur
FROM candidats 
WHERE nipcan IS NOT NULL AND nipcan != ''

UNION ALL

SELECT 
  'Candidats avec USERNAME' as info,
  COUNT(*) as valeur
FROM candidats 
WHERE username IS NOT NULL AND username != ''

UNION ALL

SELECT 
  'Candidats sans NIPCAN' as info,
  COUNT(*) as valeur
FROM candidats 
WHERE nipcan IS NULL OR nipcan = '';

-- 9. AFFICHER LES 5 PREMIERS CANDIDATS
SELECT 
  id,
  nipcan,
  nupcan,
  username,
  nomcan,
  prncan,
  created_at
FROM candidats
ORDER BY id DESC
LIMIT 5;
