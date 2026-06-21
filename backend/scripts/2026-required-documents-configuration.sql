-- GabConcours - Mise à niveau du système de documents requis
-- Compatible MySQL 8+

START TRANSACTION;

ALTER TABLE concours
    ADD COLUMN IF NOT EXISTS documents_requis JSON NULL
    COMMENT 'Documents autorisés pour le concours: [{nom, obligatoire, description}]';

ALTER TABLE candidats
    ADD COLUMN IF NOT EXISTS nipcan VARCHAR(50) NULL,
    ADD COLUMN IF NOT EXISTS nupcan VARCHAR(100) NULL;

ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS candidat_id INT NULL,
    ADD COLUMN IF NOT EXISTS concours_id INT NULL,
    ADD COLUMN IF NOT EXISTS chemin_fichier VARCHAR(500) NULL,
    ADD COLUMN IF NOT EXISTS commentaire_validation TEXT NULL,
    ADD COLUMN IF NOT EXISTS validated_by INT NULL,
    ADD COLUMN IF NOT EXISTS validated_at TIMESTAMP NULL;

ALTER TABLE dossiers
    ADD COLUMN IF NOT EXISTS nupcan VARCHAR(100) NULL;

-- Nettoie les configurations invalides sans remplacer les configurations existantes.
UPDATE concours
SET documents_requis = JSON_ARRAY()
WHERE documents_requis IS NULL OR JSON_VALID(documents_requis) = 0;

COMMIT;
