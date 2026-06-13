-- ============================================
-- Script de Rollback Multi-Candidature
-- Date: 2026-02-22
-- ATTENTION: Ce script supprime toutes les modifications
-- ============================================

USE gabconcoursv5;

-- 1. Supprimer les tables créées
DROP TABLE IF EXISTS `candidat_activities`;
DROP TABLE IF EXISTS `candidat_preferences`;
DROP TABLE IF EXISTS `candidat_login_history`;
DROP TABLE IF EXISTS `candidat_auth`;
DROP TABLE IF EXISTS `candidat_sessions`;

-- 2. Supprimer les colonnes ajoutées dans candidats
ALTER TABLE `candidats` 
DROP COLUMN IF EXISTS `password`,
DROP COLUMN IF EXISTS `last_login`,
DROP COLUMN IF EXISTS `email_verified`;

-- 3. Supprimer l'index unique sur nipcan
ALTER TABLE `candidats` DROP INDEX IF EXISTS `idx_nipcan_unique`;

-- 4. Supprimer les colonnes ajoutées dans candidatures
ALTER TABLE `candidatures`
DROP COLUMN IF EXISTS `nipcan`,
DROP COLUMN IF EXISTS `etape_actuelle`,
DROP COLUMN IF EXISTS `documents_valides`,
DROP COLUMN IF EXISTS `documents_total`,
DROP COLUMN IF EXISTS `paiement_statut`,
DROP COLUMN IF EXISTS `notes_disponibles`;

-- 5. Supprimer les index de candidatures
ALTER TABLE `candidatures` 
DROP INDEX IF EXISTS `idx_nipcan`,
DROP INDEX IF EXISTS `idx_etape`;

-- 6. Supprimer la colonne nipcan de paiements
ALTER TABLE `paiements` DROP COLUMN IF EXISTS `nipcan`;
ALTER TABLE `paiements` DROP INDEX IF EXISTS `idx_nipcan_paiement`;

-- 7. Supprimer les index supplémentaires
ALTER TABLE `candidats` DROP INDEX IF EXISTS `idx_candidats_nipcan_concours`;
ALTER TABLE `dossiers` DROP INDEX IF EXISTS `idx_dossiers_nipcan_document`;

-- Message de confirmation
SELECT 'Rollback effectué avec succès!' as message;
SELECT 'Toutes les modifications multi-candidature ont été supprimées' as info;

COMMIT;
