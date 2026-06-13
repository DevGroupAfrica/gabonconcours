-- Créer un administrateur pour l'établissement BBS (ID 1)
-- Mot de passe: admin123 (à changer après la première connexion)

-- Vérifier d'abord si l'établissement existe
SELECT id, nomets FROM etablissements WHERE id = 1;

-- Créer l'administrateur pour BBS
-- Le mot de passe hashé correspond à "admin123" avec bcrypt
INSERT INTO administrateurs (
    nom,
    prenom,
    email,
    password,
    role,
    etablissement_id,
    statut,
    created_at,
    updated_at
) VALUES (
    'Admin',
    'BBS',
    'admin@bbs.ga',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYqgdx.Oy6u', -- admin123
    'admin_etablissement',
    1,
    'actif',
    NOW(),
    NOW()
);

-- Vérifier la création
SELECT
    id,
    nom,
    prenom,
    email,
    role,
    etablissement_id,
    statut,
    created_at
FROM administrateurs
WHERE email = 'admin@bbs.ga';

-- Afficher les informations de connexion
SELECT
    '=== INFORMATIONS DE CONNEXION ===' as info,
    'Email: admin@bbs.ga' as email,
    'Mot de passe: admin123' as password,
    'URL: http://localhost:8001/admin' as url;
