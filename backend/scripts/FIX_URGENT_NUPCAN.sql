-- ============================================
-- SCRIPT URGENT: Ajouter nupcan dans dossiers et paiements
-- À exécuter IMMÉDIATEMENT dans phpMyAdmin
-- ============================================

-- 1. Ajouter nupcan dans la table dossiers
ALTER TABLE `dossiers` 
ADD COLUMN `nupcan` VARCHAR(50) DEFAULT NULL AFTER `nipcan`;

-- 2. Ajouter l'index pour nupcan dans dossiers
ALTER TABLE `dossiers`
ADD INDEX `idx_nupcan_dossier` (`nupcan`);

-- 3. Ajouter nupcan dans la table paiements
ALTER TABLE `paiements`
ADD COLUMN `nupcan` VARCHAR(50) DEFAULT NULL AFTER `nipcan`;

-- 4. Ajouter l'index pour nupcan dans paiements
ALTER TABLE `paiements`
ADD INDEX `idx_nupcan_paiement` (`nupcan`);

-- 5. Copier les valeurs de nipcan vers nupcan dans dossiers (temporaire)
-- Cela permet au système de fonctionner immédiatement
UPDATE `dossiers` 
SET `nupcan` = `nipcan` 
WHERE `nupcan` IS NULL AND `nipcan` IS NOT NULL;

-- 6. Copier les valeurs de nipcan vers nupcan dans paiements (temporaire)
UPDATE `paiements` 
SET `nupcan` = `nipcan` 
WHERE `nupcan` IS NULL AND `nipcan` IS NOT NULL;

-- 7. Vérifier que ça a marché
SELECT 'Vérification dossiers' as info;
SELECT COUNT(*) as total, 
       SUM(CASE WHEN nupcan IS NOT NULL THEN 1 ELSE 0 END) as avec_nupcan
FROM dossiers;

SELECT 'Vérification paiements' as info;
SELECT COUNT(*) as total,
       SUM(CASE WHEN nupcan IS NOT NULL THEN 1 ELSE 0 END) as avec_nupcan
FROM paiements;

-- 8. Afficher quelques exemples
SELECT 'Exemples dossiers' as info;
SELECT id, nipcan, nupcan, candidat_id 
FROM dossiers 
LIMIT 5;

SELECT 'Exemples paiements' as info;
SELECT id, nipcan, nupcan, montant, statut
FROM paiements
LIMIT 5;
