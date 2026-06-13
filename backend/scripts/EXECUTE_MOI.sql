-- ============================================
-- 🚨 SCRIPT À EXÉCUTER MAINTENANT
-- Copie-colle tout ce fichier dans phpMyAdmin
-- ============================================

-- ÉTAPE 1: Ajouter NIPCAN dans candidats
ALTER TABLE `candidats` 
ADD COLUMN `nipcan` VARCHAR(50) DEFAULT NULL AFTER `nupcan`;

-- ÉTAPE 2: Ajouter USERNAME dans candidats
ALTER TABLE `candidats`
ADD COLUMN `username` VARCHAR(100) DEFAULT NULL AFTER `nipcan`;

-- ÉTAPE 3: Ajouter index NIPCAN
ALTER TABLE `candidats` 
ADD UNIQUE INDEX `idx_nipcan_unique` (`nipcan`);

-- ÉTAPE 4: Ajouter index USERNAME
ALTER TABLE `candidats`
ADD INDEX `idx_username` (`username`);

-- ÉTAPE 5: Créer table compteurs NIPCAN
CREATE TABLE `nipcan_counters` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `year` INT NOT NULL UNIQUE,
  `counter` INT NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ÉTAPE 6: Insérer compteurs pour 2025 et 2026
INSERT INTO `nipcan_counters` (`year`, `counter`) VALUES (2025, 1);
INSERT INTO `nipcan_counters` (`year`, `counter`) VALUES (2026, 1);

-- ÉTAPE 7: Générer NIPCAN pour candidats existants
UPDATE `candidats` 
SET `nipcan` = CONCAT('NIP', YEAR(COALESCE(created_at, NOW())), LPAD(id, 6, '0'))
WHERE `nipcan` IS NULL;

-- ÉTAPE 8: Générer USERNAME pour candidats existants
UPDATE `candidats` 
SET `username` = LOWER(CONCAT(SUBSTRING(nomcan, 1, 1), REPLACE(prncan, ' ', '')))
WHERE `username` IS NULL;

-- ÉTAPE 9: 🔥 CRITIQUE - Ajouter NUPCAN dans dossiers
ALTER TABLE `dossiers` 
ADD COLUMN `nupcan` VARCHAR(50) DEFAULT NULL AFTER `nipcan`;

-- ÉTAPE 10: Ajouter index NUPCAN dans dossiers
ALTER TABLE `dossiers`
ADD INDEX `idx_nupcan_dossier` (`nupcan`);

-- ÉTAPE 11: 🔥 CRITIQUE - Ajouter NUPCAN dans paiements
ALTER TABLE `paiements`
ADD COLUMN `nupcan` VARCHAR(50) DEFAULT NULL AFTER `nipcan`;

-- ÉTAPE 12: Ajouter index NUPCAN dans paiements
ALTER TABLE `paiements`
ADD INDEX `idx_nupcan_paiement` (`nupcan`);

-- ÉTAPE 13: Copier NIPCAN vers NUPCAN dans dossiers (temporaire)
UPDATE `dossiers` 
SET `nupcan` = `nipcan` 
WHERE `nupcan` IS NULL AND `nipcan` IS NOT NULL;

-- ÉTAPE 14: Copier NIPCAN vers NUPCAN dans paiements (temporaire)
UPDATE `paiements` 
SET `nupcan` = `nipcan` 
WHERE `nupcan` IS NULL AND `nipcan` IS NOT NULL;

-- ============================================
-- ✅ VÉRIFICATION
-- ============================================

SELECT '=== RÉSUMÉ ===' as info;

SELECT 'Total candidats' as type, COUNT(*) as nombre 
FROM candidats
UNION ALL
SELECT 'Avec NIPCAN' as type, COUNT(*) as nombre 
FROM candidats WHERE nipcan IS NOT NULL
UNION ALL
SELECT 'Avec USERNAME' as type, COUNT(*) as nombre 
FROM candidats WHERE username IS NOT NULL
UNION ALL
SELECT 'Dossiers avec NUPCAN' as type, COUNT(*) as nombre 
FROM dossiers WHERE nupcan IS NOT NULL
UNION ALL
SELECT 'Paiements avec NUPCAN' as type, COUNT(*) as nombre 
FROM paiements WHERE nupcan IS NOT NULL;

-- Afficher quelques exemples
SELECT '=== EXEMPLES CANDIDATS ===' as info;
SELECT id, nipcan, nupcan, username, nomcan, prncan 
FROM candidats 
ORDER BY id DESC 
LIMIT 5;

-- ============================================
-- 🎉 TERMINÉ!
-- Maintenant:
-- 1. Redémarre le backend (Ctrl+C puis npm start)
-- 2. Va sur http://localhost:8001/connexion
-- 3. Entre un NIPCAN (ex: NIP2025000001)
-- ============================================
