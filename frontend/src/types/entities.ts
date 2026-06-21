

// =================================================================
// FICHIER : services/types.ts (Typescript Interfaces)
// =================================================================

export interface Province {
    id: number;
    nompro: string;
    cdepro: string;
    created_at?: string;
    updated_at?: string;
}

export interface Niveau {
    id: number;
    nomniv: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface Filiere {
    id: number;
    nomfil: string;
    description: string;
    niveau_id: number;
    created_at: string;
    updated_at: string;
}

export interface ConcoursFiliere {
    id: number;
    concours_id: number;
    filiere_id: number;
    places_disponibles: number;
    created_at: string;
    updated_at: string;
    // Propriétés relationnelles
    nomfil?: string;
    description?: string;
}

export interface Etablissement {
    id: number;
    nomets: string;
    adresse: string;
    telephone: string;
    email: string;
    photo?: string;
    province_id: number;
    created_at: string;
    updated_at: string;
}

export interface Concours {
    type_concours: string;
    id: number;
    etablissement_id: number;
    etablissement_nomets: string;
     etablissement_num: string;

    etablissement_photo?: string;
    niveau_id: number;
    niveau_nomniv: string;
    libcnc: string; // nom du concours
    sescnc: string; // session
    debcnc: string; // date début
    fincnc: string; // date fin
    stacnc: string; // statut (1=ouvert, 2=fermé, 3=terminé) - string
    agecnc: number; // âge limite
    fracnc: number; // frais inscription - CORRECTION: changé en number
    etddos: number; // état dossier (0/1)
    is_gorri: number | boolean; // NOUVEAU: 0 ou 1 pour le statut gorri
    created_at: string;
    updated_at: string;
    // Nouvelles propriétés pour les filières
    filieres?: ConcoursFiliere[];
    // Documents requis (peut être string JSON ou array)
    documents_requis?: string | Array<{
        nom: string;
        obligatoire: boolean;
        description?: string;
    }>;
    series_bac_acceptees?: string | string[];
    criteres_selection?: string | any[];
    modalites_inscription?: string | any[];
}

export interface Candidat {
    id: number;
    niveau_id: number;
    niveau_nomniv?: string;
    nipcan?: string; // identifiant personnel unique
    nupcan: string; // numéro de procédure généré - REQUIS
    nomcan: string;
    prncan: string;
    maican: string;
    telcan: string;
    dtncan: string;
    ldncan: string;
    phtcan?: File; // photo du candidat - REQUIS POUR LE DASHBOARD
    proorg: number; // province d'origine
    proact: number; // province d'activité
    proaff: number; // province d'affectation
    concours_id?: number; // ID du concours
    filiere_id?: number; // ID de la filière choisie
    created_at: string;
    updated_at: string;
    // Propriétés additionnelles pour l'admin
    participations_count?: number;
    statut?: string;
}

export interface Participation {
    id: number;
    candidat_id: number;
    concours_id: number;
    filiere_id?: number; // Nouvelle propriété pour la filière
    stspar: number; // statut numérique
    numero_candidature: string; // identifiant unique
    statut: 'inscrit' | 'paye' | 'valide' | 'en_attente';
    created_at: string;
    updated_at: string;
    // Propriétés relationnelles
    libcnc?: string;
    nomets?: string;
    nomcan?: string;
    prncan?: string;
    nupcan?: string;
    nomfil?: string; // nom de la filière
}

export interface Document {
    id: number;
    nomdoc: string;
    type: string;
    nom_fichier: string;
    statut: 'en_attente' | 'valide' | 'rejete';
    created_at: string;
    updated_at: string;
}

export interface Dossier {
    id: number;
    concours_id: number;
    document_id: number;
    nipcan: string; // identifiant du candidat
    docdsr: string; // description
    created_at: string;
    updated_at: string;
    // Propriétés relationnelles
    nomdoc?: string;
    type?: string;
    nom_fichier?: string;
    document_statut?: string;
    nomcan?: string;
    prncan?: string;
    nupcan?: string;
    libcnc?: string;
    type_document?: string; // Type de document pour l'affichage
}

export interface Paiement {
    id: number;
    candidat_id: number;
    concours_id?: number; // NOUVEAU CHAMP
    mntfrai: string; // montant dû
    datfrai: string; // date
    montant?: number; // montant payé
    reference?: string; // référence transaction
    statut?: 'en_attente' | 'valide' | 'rejete';
    methode?: string; // méthode de paiement
    numero_telephone?: string; // NOUVEAU CHAMP
    created_at: string;
    updated_at: string;
    // Propriétés relationnelles
    candidat_nom?: string;
    candidat_nip?: string;
    concours?: string;
    date_paiement?: string;
    nomcan?: string;
    prncan?: string;
    nipcan?: string;
    nupcan?: string;
    libcnc?: string;
}

export interface Session {
    id: number;
    candidat_id: number;
    token: string;
    expires_at: string;
    created_at: string;
    updated_at: string;
    // Propriétés relationnelles
    nomcan?: string;
    prncan?: string;
    nupcan?: string;
}

// Types pour les réponses API
export interface ApiResponse<T> {
    success?: boolean;
    data: T;
    message?: string;
    errors?: string[];
}

export interface ConcoursApiResponse {
    data: Concours[];
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

// Types additionnels pour l'interface utilisateur
export interface DocumentOption {
    value: string;
    label: string;
    required: boolean;
    description?: string; // NOUVEAU: description du document
}

export interface Matiere {
    id: number;
    nom_matiere: string;
    coefficient?: number;
    duree?: number; // durée en heures
    description?: string;
    created_at: string;
    updated_at: string;
}

export interface FiliereMatiere {
    id: number;
    filiere_id: number;
    matiere_id: number;
    coefficient: number;
    obligatoire: boolean;
    created_at: string;
    updated_at: string;
    // Propriétés relationnelles
    nom_matiere?: string;
    duree?: number;
}
