-- ============================================
-- SCRIPT DE VÉRIFICATION DE LA BASE DE DONNÉES
-- Exécute ce script pour voir l'état actuel
-- ============================================

-- 1. Vérifier les colonnes de la table candidats
SELECT '=== COLONNES TABLE CANDIDATS ===' as info;
SHOW COLUMNS FROM candidats;

-- 2. Vérifier les colonnes de la table dossiers
SELECT '=== COLONNES TABLE DOSSIERS ===' as info;
SHOW COLUMNS FROM dossiers;

-- 3. Vérifier les colonnes de la table paiements
SELECT '=== COLONNES TABLE PAIEMENTS ===' as info;
SHOW COLUMNS FROM paiements;

-- 4. Vérifier si la table nipcan_counters existe
SELECT '=== TABLE NIPCAN_COUNTERS ===' as info;
SHOW TABLES LIKE 'nipcan_counters';

-- 5. Statistiques candidats
SELECT '=== STATISTIQUES CANDIDATS ===' as info;
SELECT 
  'Total candidats' as type, 
  COUNT(*) as nombre 
FROM candidats
UNION ALL
SELECT 
  'Avec NIPCAN' as type, 
  COUNT(*) as nombre 
FROM candidats 
WHERE nipcan IS NOT NULL AND nipcan != ''
UNION ALL
SELECT 
  'Sans NIPCAN' as type, 
  COUNT(*) as nombre 
FROM candidats 
WHERE nipcan IS NULL OR nipcan = ''
UNION ALL
SELECT 
  'Avec USERNAME' as type, 
  COUNT(*) as nombre 
FROM candidats 
WHERE username IS NOT NULL AND username != ''
UNION ALL
SELECT 
  'Sans USERNAME' as type, 
  COUNT(*) as nombre 
FROM candidats 
WHERE username IS NULL OR username = '';

-- 6. Statistiques dossiers
SELECT '=== STATISTIQUES DOSSIERS ===' as info;
SELECT 
  'Total dossiers' as type, 
  COUNT(*) as nombre 
FROM dossiers
UNION ALL
SELECT 
  'Avec NUPCAN' as type, 
  COUNT(*) as nombre 
FROM dossiers 
WHERE nupcan IS NOT NULL AND nupcan != ''
UNION ALL
SELECT 
  'Sans NUPCAN' as type, 
  COUNT(*) as nombre 
FROM dossiers 
WHERE nupcan IS NULL OR nupcan = '';

-- 7. Statistiques paiements
SELECT '=== STATISTIQUES PAIEMENTS ===' as info;
SELECT 
  'Total paiements' as type, 
  COUNT(*) as nombre 
FROM paiements
UNION ALL
SELECT 
  'Avec NUPCAN' as type, 
  COUNT(*) as nombre 
FROM paiements 
WHERE nupcan IS NOT NULL AND nupcan != ''
UNION ALL
SELECT 
  'Sans NUPCAN' as type, 
  COUNT(*) as nombre 
FROM paiements 
WHERE nupcan IS NULL OR nupcan = '';

-- 8. Exemples de candidats
SELECT '=== EXEMPLES CANDIDATS (5 derniers) ===' as info;
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

-- 9. Exemples de dossiers
SELECT '=== EXEMPLES DOSSIERS (5 derniers) ===' as info;
SELECT 
  id, 
  nipcan, 
  nupcan, 
  candidat_id,
  created_at
FROM dossiers 
ORDER BY id DESC 
LIMIT 5;

-- 10. Exemples de paiements
SELECT '=== EXEMPLES PAIEMENTS (5 derniers) ===' as info;
SELECT 
  id, 
  nipcan, 
  nupcan, 
  montant,
  statut,
  created_at
FROM paiements 
ORDER BY id DESC 
LIMIT 5;

-- 11. Vérifier les compteurs NIPCAN
SELECT '=== COMPTEURS NIPCAN ===' as info;
SELECT * FROM nipcan_counters;

-- 12. Vérifier les compteurs NUPCAN
SELECT '=== COMPTEURS NUPCAN ===' as info;
SELECT * FROM nupcan_counters ORDER BY date_key DESC LIMIT 10;

-- ============================================
-- INTERPRÉTATION DES RÉSULTATS
-- ============================================
-- 
-- ✅ BON SIGNE:
-- - Colonnes nipcan, nupcan, username existent dans candidats
-- - Colonne nupcan existe dans dossiers
-- - Colonne nupcan existe dans paiements
-- - Table nipcan_counters existe
-- - Tous les candidats ont un NIPCAN et USERNAME
-- - Tous les dossiers ont un NUPCAN
-- 
-- ❌ PROBLÈME:
-- - Colonnes manquantes → Exécute EXECUTE_MOI.sql
-- - Candidats sans NIPCAN → Exécute EXECUTE_MOI.sql
-- - Dossiers sans NUPCAN → Exécute EXECUTE_MOI.sql
-- 
-- ============================================
