export interface Candidat {
    id: number;
    nomcan: string;
    prncan: string;
    maican: string;
    telcan: string;
    dtncan: string;
    ldncan: string;
    nipcan?: string;
    phtcan?: File;
    proorg: number;
    proact: number;
    proaff: number;
    niveau_id: number;
    nupcan: string;
    concours_id?: number;
    filiere_id?: number;
    created_at?: string;
    statut?: string;
}

export interface CandidatureCompleteData {
    id: number;
    candidat: Candidat;
    concours: any;
    filiere?: any;
    documents: any[];
    paiement?: any;
    progression: {
        etapeActuelle: string;
        etapesCompletes: string[];
        pourcentage: number;
    };
    nupcan: string;
    session?: any;
}
