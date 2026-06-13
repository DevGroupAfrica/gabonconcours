-- ============================================
-- Script de Test pour Multi-Candidature
-- Date: 2026-02-22
-- Description: Tests de validation du système multi-candidature
-- ============================================

-- 1. TEST: Vérifier que toutes les tables existent
SELECT 'TEST 1: Vérification des tables' as test_name;
SELECT 
    TABLE_NAME,
    CASE 
        WHEN TABLE_NAME IN (
            'candidat_sessions',
            'candidat_auth',
            'candidat_login_history',
            'candidat_preferences',
            'candidat_activities'
        ) THEN '✅ OK'
        ELSE '❌ MANQUANT'
    END as statut
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'gabconcoursv5'
AND TABLE_NAME LIKE 'candidat%'
ORDER BY TABLE_NAME;

-- 2. TEST: Vérifier les colonnes ajoutées dans candidats
SELECT 'TEST 2: Colonnes dans candidats' as test_name;
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'gabconcoursv5'
AND TABLE_NAME = 'candidats'
AND COLUMN_NAME IN ('nipcan', 'password', 'last_login', 'email_verified')
ORDER BY COLUMN_NAME;

-- 3. TEST: Vérifier les index
SELECT 'TEST 3: Index créés' as test_name;
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    COLUMN_NAME,
    NON_UNIQUE
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = 'gabconcoursv5'
AND INDEX_NAME LIKE '%nipcan%'
ORDER BY TABLE_NAME, INDEX_NAME;

-- 4. TEST: Vérifier la vue v_candidat_dashboard
SELECT 'TEST 4: Vue v_candidat_dashboard' as test_name;
SELECT 
    TABLE_NAME,
    VIEW_DEFINITION
FROM information_schema.VIEWS
WHERE TABLE_SCHEMA = 'gabconcoursv5'
AND TABLE_NAME = 'v_candidat_dashboard';

-- 5. TEST: Vérifier les procédures stockées
SELECT 'TEST 5: Procédures stockées' as test_name;
SELECT 
    ROUTINE_NAME,
    ROUTINE_TYPE,
    DTD_IDENTIFIER as RETURN_TYPE
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'gabconcoursv5'
AND ROUTINE_NAME LIKE '%candidat%'
ORDER BY ROUTINE_NAME;

-- 6. TEST: Vérifier les triggers
SELECT 'TEST 6: Triggers' as test_name;
SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE,
    ACTION_TIMING
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = 'gabconcoursv5'
AND TRIGGER_NAME LIKE '%activity%'
ORDER BY TRIGGER_NAME;

-- 7. TEST: Vérifier que tous les candidats ont un NIPCAN
SELECT 'TEST 7: NIPCAN pour tous les candidats' as test_name;
SELECT 
    COUNT(*) as total_candidats,
    SUM(CASE WHEN nipcan IS NOT NULL AND nipcan != '' THEN 1 ELSE 0 END) as avec_nipcan,
    SUM(CASE WHEN nipcan IS NULL OR nipcan = '' THEN 1 ELSE 0 END) as sans_nipcan,
    CASE 
        WHEN SUM(CASE WHEN nipcan IS NULL OR nipcan = '' THEN 1 ELSE 0 END) = 0 
        THEN '✅ OK - Tous les candidats ont un NIPCAN'
        ELSE '❌ ERREUR - Certains candidats n''ont pas de NIPCAN'
    END as statut
FROM candidats;

-- 8. TEST: Tester la fonction generate_nipcan()
SELECT 'TEST 8: Fonction generate_nipcan()' as test_name;
SELECT 
    generate_nipcan() as nipcan_genere,
    CASE 
        WHEN generate_nipcan() LIKE 'NIP%' 
        THEN '✅ OK - Format correct'
        ELSE '❌ ERREUR - Format incorrect'
    END as statut;

-- 9. TEST: Compter les candidatures par NIPCAN
SELECT 'TEST 9: Candidatures par NIPCAN' as test_name;
SELECT 
    nipcan,
    COUNT(*) as nombre_candidatures,
    GROUP_CONCAT(nupcan SEPARATOR ', ') as liste_nupcan
FROM candidats
WHERE nipcan IS NOT NULL
GROUP BY nipcan
ORDER BY nombre_candidatures DESC
LIMIT 10;

-- 10. TEST: Vérifier la structure de candidat_sessions
SELECT 'TEST 10: Structure candidat_sessions' as test_name;
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'gabconcoursv5'
AND TABLE_NAME = 'candidat_sessions'
ORDER BY ORDINAL_POSITION;

-- 11. TEST: Vérifier la structure de candidat_auth
SELECT 'TEST 11: Structure candidat_auth' as test_name;
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_KEY
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'gabconcoursv5'
AND TABLE_NAME = 'candidat_auth'
ORDER BY ORDINAL_POSITION;

-- 12. TEST: Tester la vue v_candidat_dashboard avec données réelles
SELECT 'TEST 12: Données de la vue v_candidat_dashboard' as test_name;
SELECT 
    nipcan,
    nupcan,
    nomcan,
    prncan,
    concours_nom,
    filiere_nom,
    documents_total,
    documents_valides,
    paiement_statut,
    progression
FROM v_candidat_dashboard
LIMIT 5;

-- 13. TEST: Vérifier les contraintes de clés étrangères
SELECT 'TEST 13: Contraintes de clés étrangères' as test_name;
SELECT 
    TABLE_NAME,
    CONSTRAINT_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'gabconcoursv5'
AND TABLE_NAME LIKE 'candidat%'
AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME;

-- 14. TEST: Statistiques globales
SELECT 'TEST 14: Statistiques globales' as test_name;
SELECT 
    'Candidats' as entite,
    COUNT(*) as total
FROM candidats
UNION ALL
SELECT 
    'NIPCAN uniques' as entite,
    COUNT(DISTINCT nipcan) as total
FROM candidats
WHERE nipcan IS NOT NULL
UNION ALL
SELECT 
    'Candidatures (NUPCAN)' as entite,
    COUNT(*) as total
FROM candidats
UNION ALL
SELECT 
    'Sessions actives' as entite,
    COUNT(*) as total
FROM candidat_sessions
WHERE expires_at > NOW()
UNION ALL
SELECT 
    'Comptes authentifiés' as entite,
    COUNT(*) as total
FROM candidat_auth
UNION ALL
SELECT 
    'Activités enregistrées' as entite,
    COUNT(*) as total
FROM candidat_activities;

-- 15. TEST: Vérifier les doublons de NIPCAN
SELECT 'TEST 15: Doublons de NIPCAN' as test_name;
SELECT 
    nipcan,
    COUNT(*) as occurrences,
    CASE 
        WHEN COUNT(*) = 1 THEN '✅ OK'
        ELSE '❌ DOUBLON DÉTECTÉ'
    END as statut
FROM candidats
WHERE nipcan IS NOT NULL
GROUP BY nipcan
HAVING COUNT(*) > 1;

-- Si aucun résultat, c'est bon
SELECT 
    CASE 
        WHEN NOT EXISTS (
            SELECT 1 FROM candidats 
            WHERE nipcan IS NOT NULL 
            GROUP BY nipcan 
            HAVING COUNT(*) > 1
        ) 
        THEN '✅ OK - Aucun doublon de NIPCAN'
        ELSE '❌ ATTENTION - Doublons détectés ci-dessus'
    END as resultat_final;

-- 16. TEST FINAL: Résumé de tous les tests
SELECT 'RÉSUMÉ FINAL' as section;
SELECT 
    '✅ Tables créées' as test,
    (SELECT COUNT(*) FROM information_schema.TABLES 
     WHERE TABLE_SCHEMA = 'gabconcoursv5' 
     AND TABLE_NAME LIKE 'candidat%') as resultat,
    '5 attendues' as attendu
UNION ALL
SELECT 
    '✅ Vue créée' as test,
    (SELECT COUNT(*) FROM information_schema.VIEWS 
     WHERE TABLE_SCHEMA = 'gabconcoursv5' 
     AND TABLE_NAME = 'v_candidat_dashboard') as resultat,
    '1 attendue' as attendu
UNION ALL
SELECT 
    '✅ Procédure créée' as test,
    (SELECT COUNT(*) FROM information_schema.ROUTINES 
     WHERE ROUTINE_SCHEMA = 'gabconcoursv5' 
     AND ROUTINE_NAME = 'sp_get_candidat_dashboard') as resultat,
    '1 attendue' as attendu
UNION ALL
SELECT 
    '✅ Fonction créée' as test,
    (SELECT COUNT(*) FROM information_schema.ROUTINES 
     WHERE ROUTINE_SCHEMA = 'gabconcoursv5' 
     AND ROUTINE_NAME = 'generate_nipcan') as resultat,
    '1 attendue' as attendu
UNION ALL
SELECT 
    '✅ Triggers créés' as test,
    (SELECT COUNT(*) FROM information_schema.TRIGGERS 
     WHERE TRIGGER_SCHEMA = 'gabconcoursv5' 
     AND TRIGGER_NAME LIKE '%activity%') as resultat,
    '2 attendus' as attendu
UNION ALL
SELECT 
    '✅ Candidats avec NIPCAN' as test,
    (SELECT COUNT(*) FROM candidats WHERE nipcan IS NOT NULL AND nipcan != '') as resultat,
    CONCAT((SELECT COUNT(*) FROM candidats), ' attendus') as attendu;

-- Message final
SELECT 
    '🎉 TESTS TERMINÉS' as message,
    'Vérifiez les résultats ci-dessus' as action,
    'Tous les tests doivent être ✅ OK' as note;

-- ============================================
-- FIN DES TESTS
-- ============================================
