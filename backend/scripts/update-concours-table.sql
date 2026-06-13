-- Script de mise à jour de la table concours pour ajouter les informations détaillées
-- Date: 2025
-- Description: Ajout des champs pour les séries du bac, documents requis, critères de sélection, etc.

-- Ajouter les nouvelles colonnes à la table concours
ALTER TABLE concours
ADD COLUMN IF NOT EXISTS series_bac_acceptees JSON COMMENT 'Séries du baccalauréat acceptées (pour première année)',
ADD COLUMN IF NOT EXISTS documents_requis JSON COMMENT 'Liste des documents requis pour l''inscription',
ADD COLUMN IF NOT EXISTS criteres_selection JSON COMMENT 'Critères de sélection des candidats',
ADD COLUMN IF NOT EXISTS modalites_inscription JSON COMMENT 'Modalités et étapes d''inscription',
ADD COLUMN IF NOT EXISTS date_publication_resultats DATE COMMENT 'Date prévue de publication des résultats',
ADD COLUMN IF NOT EXISTS date_debut_cours DATE COMMENT 'Date prévue de début des cours',
ADD COLUMN IF NOT EXISTS description_concours TEXT COMMENT 'Description détaillée du concours',
ADD COLUMN IF NOT EXISTS conditions_eligibilite JSON COMMENT 'Conditions d''éligibilité spécifiques',
ADD COLUMN IF NOT EXISTS informations_complementaires TEXT COMMENT 'Informations complémentaires',
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255) COMMENT 'Email de contact pour le concours',
ADD COLUMN IF NOT EXISTS contact_telephone VARCHAR(50) COMMENT 'Téléphone de contact pour le concours',
ADD COLUMN IF NOT EXISTS lieu_examen VARCHAR(255) COMMENT 'Lieu de passage de l''examen',
ADD COLUMN IF NOT EXISTS type_concours ENUM('premiere_annee', 'master', 'doctorat', 'autre') DEFAULT 'autre' COMMENT 'Type de concours',
ADD COLUMN IF NOT EXISTS nombre_places_total INT DEFAULT 0 COMMENT 'Nombre total de places disponibles',
ADD COLUMN IF NOT EXISTS duree_formation VARCHAR(100) COMMENT 'Durée de la formation',
ADD COLUMN IF NOT EXISTS diplome_delivre VARCHAR(255) COMMENT 'Diplôme délivré à l''issue de la formation',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_concours_type ON concours(type_concours);
CREATE INDEX IF NOT EXISTS idx_concours_dates ON concours(debcnc, fincnc);
CREATE INDEX IF NOT EXISTS idx_concours_etablissement ON concours(etablissement_id);

-- Exemples de données par défaut pour les documents requis (format JSON)
-- Ces données peuvent être utilisées comme template lors de la création d'un concours

-- Exemple de structure JSON pour series_bac_acceptees:
-- ["Série A", "Série C", "Série D", "Série G"]

-- Exemple de structure JSON pour documents_requis:
-- [
--   {"nom": "Acte de naissance", "obligatoire": true, "description": "Acte de naissance original ou copie certifiée"},
--   {"nom": "Certificat de nationalité", "obligatoire": true, "description": "Certificat de nationalité gabonaise"},
--   {"nom": "Diplôme du Baccalauréat", "obligatoire": true, "description": "Diplôme du Baccalauréat ou équivalent"},
--   {"nom": "Relevé de notes du Baccalauréat", "obligatoire": true, "description": "Relevé de notes complet"},
--   {"nom": "Photo d'identité", "obligatoire": true, "description": "Photo d'identité récente (format 4x4)"},
--   {"nom": "Certificat médical", "obligatoire": true, "description": "Certificat médical de moins de 3 mois"},
--   {"nom": "Casier judiciaire", "obligatoire": true, "description": "Bulletin n°3 du casier judiciaire"}
-- ]

-- Exemple de structure JSON pour criteres_selection:
-- [
--   {"critere": "Moyenne générale au Baccalauréat", "poids": 40, "description": "Note minimale requise: 12/20"},
--   {"critere": "Notes dans les matières principales", "poids": 30, "description": "Mathématiques, Français, etc."},
--   {"critere": "Âge du candidat", "poids": 10, "description": "Respect de la limite d'âge"},
--   {"critere": "Ordre d'arrivée des dossiers", "poids": 20, "description": "Date de soumission du dossier"}
-- ]

-- Exemple de structure JSON pour modalites_inscription:
-- [
--   {"etape": 1, "titre": "Inscription en ligne", "description": "Créer un compte et remplir le formulaire"},
--   {"etape": 2, "titre": "Paiement des frais", "description": "Payer les frais d'inscription via Mobile Money ou carte bancaire"},
--   {"etape": 3, "titre": "Téléchargement des documents", "description": "Scanner et télécharger tous les documents requis"},
--   {"etape": 4, "titre": "Validation du dossier", "description": "Attendre la validation par l'administration"},
--   {"etape": 5, "titre": "Récépissé d'inscription", "description": "Télécharger et imprimer le récépissé"}
-- ]

-- Exemple de structure JSON pour conditions_eligibilite:
-- [
--   {"condition": "Nationalité gabonaise", "obligatoire": true},
--   {"condition": "Âge maximum respecté", "obligatoire": true},
--   {"condition": "Diplôme requis obtenu", "obligatoire": true},
--   {"condition": "Série du bac acceptée", "obligatoire": true, "applicable_si": "premiere_annee"}
-- ]

-- Mettre à jour les concours existants avec des valeurs par défaut
UPDATE concours 
SET 
    type_concours = CASE 
        WHEN niveau_nomniv LIKE '%première%' OR niveau_nomniv LIKE '%1ère%' 
             OR niveau_nomniv LIKE '%Licence 1%' OR niveau_nomniv LIKE '%L1%' 
        THEN 'premiere_annee'
        WHEN niveau_nomniv LIKE '%Master%' OR niveau_nomniv LIKE '%M1%' OR niveau_nomniv LIKE '%M2%'
        THEN 'master'
        WHEN niveau_nomniv LIKE '%Doctorat%' OR niveau_nomniv LIKE '%PhD%'
        THEN 'doctorat'
        ELSE 'autre'
    END,
    documents_requis = JSON_ARRAY(
        JSON_OBJECT('nom', 'Acte de naissance', 'obligatoire', true, 'description', 'Acte de naissance original ou copie certifiée'),
        JSON_OBJECT('nom', 'Certificat de nationalité', 'obligatoire', true, 'description', 'Certificat de nationalité gabonaise'),
        JSON_OBJECT('nom', 'Diplôme du Baccalauréat', 'obligatoire', true, 'description', 'Diplôme du Baccalauréat ou équivalent'),
        JSON_OBJECT('nom', 'Relevé de notes du Baccalauréat', 'obligatoire', true, 'description', 'Relevé de notes complet'),
        JSON_OBJECT('nom', 'Photo d''identité', 'obligatoire', true, 'description', 'Photo d''identité récente'),
        JSON_OBJECT('nom', 'Certificat médical', 'obligatoire', true, 'description', 'Certificat médical de moins de 3 mois'),
        JSON_OBJECT('nom', 'Casier judiciaire', 'obligatoire', true, 'description', 'Bulletin n°3 du casier judiciaire')
    ),
    criteres_selection = JSON_ARRAY(
        JSON_OBJECT('critere', 'Moyenne générale au Baccalauréat', 'poids', 40),
        JSON_OBJECT('critere', 'Notes dans les matières principales', 'poids', 30),
        JSON_OBJECT('critere', 'Âge du candidat', 'poids', 10),
        JSON_OBJECT('critere', 'Ordre d''arrivée des dossiers', 'poids', 20)
    ),
    modalites_inscription = JSON_ARRAY(
        JSON_OBJECT('etape', 1, 'titre', 'Inscription en ligne', 'description', 'Créer un compte et remplir le formulaire'),
        JSON_OBJECT('etape', 2, 'titre', 'Paiement des frais', 'description', 'Payer les frais d''inscription'),
        JSON_OBJECT('etape', 3, 'titre', 'Téléchargement des documents', 'description', 'Scanner et télécharger tous les documents requis'),
        JSON_OBJECT('etape', 4, 'titre', 'Validation du dossier', 'description', 'Attendre la validation par l''administration'),
        JSON_OBJECT('etape', 5, 'titre', 'Récépissé d''inscription', 'description', 'Télécharger et imprimer le récépissé')
    ),
    conditions_eligibilite = JSON_ARRAY(
        JSON_OBJECT('condition', 'Nationalité gabonaise', 'obligatoire', true),
        JSON_OBJECT('condition', 'Âge maximum respecté', 'obligatoire', true),
        JSON_OBJECT('condition', 'Diplôme requis obtenu', 'obligatoire', true)
    )
WHERE documents_requis IS NULL;

-- Mettre à jour les séries du bac pour les concours de première année
UPDATE concours 
SET series_bac_acceptees = JSON_ARRAY('Série A', 'Série C', 'Série D', 'Série G')
WHERE type_concours = 'premiere_annee' AND series_bac_acceptees IS NULL;

-- Afficher un résumé des modifications
SELECT 
    'Mise à jour terminée' AS statut,
    COUNT(*) AS total_concours,
    SUM(CASE WHEN type_concours = 'premiere_annee' THEN 1 ELSE 0 END) AS concours_premiere_annee,
    SUM(CASE WHEN documents_requis IS NOT NULL THEN 1 ELSE 0 END) AS concours_avec_documents,
    SUM(CASE WHEN series_bac_acceptees IS NOT NULL THEN 1 ELSE 0 END) AS concours_avec_series_bac
FROM concours;

-- Vérifier la structure de la table
DESCRIBE concours;
