-- Script pour corriger la table paiements
-- Remplacer nipcan par nupcan et ajouter recu_path

-- Renommer la colonne nipcan en nupcan si elle existe
ALTER TABLE `paiements` 
CHANGE COLUMN `nipcan` `nupcan` VARCHAR(50);

-- Ajouter la colonne recu_path si elle n'existe pas
ALTER TABLE `paiements` 
ADD COLUMN IF NOT EXISTS `recu_path` VARCHAR(500) AFTER `numero_telephone`;

-- Ajouter des index pour améliorer les performances
ALTER TABLE `paiements` 
ADD INDEX IF NOT EXISTS `idx_nupcan` (`nupcan`),
ADD INDEX IF NOT EXISTS `idx_candidat_id` (`candidat_id`),
ADD INDEX IF NOT EXISTS `idx_concours_id` (`concours_id`);
