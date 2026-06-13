// Legacy type compatibility layer
// This file provides type assertions and utilities to handle legacy API patterns

declare global {
    interface Window {
        [key: string]: any;
    }
}

// Make API response types more flexible
export interface FlexibleApiResponse<T = any> {
    success?: boolean;
    data?: T;
    message?: string;
    errors?: string[];

    [key: string]: any;
}

// Legacy data types with flexible properties
export interface LegacyCandidat {
    [key: string]: any;

    nomcan?: string;
    prncan?: string;
    dtncan?: string;
    ldncan?: string;
    telcan?: string;
    phtcan?: string;
    maican?: string;
    proorg?: number;
    proact?: number;
    proaff?: number;
    niveau_id?: number;
    nupcan?: string;
    agecnc?: string;
}

export interface LegacyConcours {
    [key: string]: any;

    libcnc?: string;
    etablissement_nomets?: string;
    sescnc?: string;
    fracnc?: number;
    agecnc?: string;
    fincnc?: string;
    niveau_nomniv?: string;
    stacnc?: string;
    matieres?: any[];
}

export interface LegacyFiliere {
    [key: string]: any;

    nomfil?: string;
    description?: string;
    matieres?: any[];
}

export interface LegacyDocument {
    [key: string]: any;

    id?: number;
    nom_document?: string;
    chemin_fichier?: string;
    type_document?: string;
    taille_fichier?: number;
    statut_validation?: string;
    date_upload?: string;
    existing?: boolean;
}

// Utility functions for safe data access
export function safeArray<T = any>(data: any): T[] {
    if (Array.isArray(data)) return data as T[];
    if (data?.data && Array.isArray(data.data)) return data.data as T[];
    return [] as T[];
}

export function safeObject<T = any>(data: any): T {
    if (data?.data && typeof data.data === 'object') return data.data as T;
    if (data && typeof data === 'object') return data as T;
    return {} as T;
}

export function safeProperty<T = any>(obj: any, prop: string, defaultValue?: T): T {
    if (obj && typeof obj === 'object' && prop in obj) {
        return obj[prop] as T;
    }
    return defaultValue as T;
}

// Type assertions for common patterns
export const asArray = <T = any>(data: unknown): T[] => {
    return safeArray<T>(data);
};

export const asObject = <T = any>(data: unknown): T => {
    return safeObject<T>(data);
};

export const asCandidat = (data: unknown): LegacyCandidat => {
    return safeObject<LegacyCandidat>(data);
};

export const asConcours = (data: unknown): LegacyConcours => {
    return safeObject<LegacyConcours>(data);
};

export const asFiliere = (data: unknown): LegacyFiliere => {
    return safeObject<LegacyFiliere>(data);
};

export const asDocument = (data: unknown): LegacyDocument => {
    return safeObject<LegacyDocument>(data);
};