-- 🔧 Renommer la colonne nipcan en nupcan dans la table dossiers
-- Cette colonne contient le NUPCAN (numéro de candidature), pas le NIPCAN

-- Renommer la colonne
ALTER TABLE dossiers 
CHANGE COLUMN nipcan nupcan VARCHAR(50);

-- Vérifier le résultat
DESCRIBE dossiers;

-- Tester que les données sont toujours là
SELECT 
    'Vérification après renommage' as info,
    nupcan,
    COUNT(*) as nombre_documents
FROM dossiers
GROUP BY nupcan
ORDER BY nupcan;
