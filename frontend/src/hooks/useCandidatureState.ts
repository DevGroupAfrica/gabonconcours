import {useState, useCallback} from 'react';
import {candidatureService} from '@/services/candidatureService';

export interface CandidatData {
    id: number;
    nomcan: string;
    prncan: string;
    maican: string;
    telcan: string;
    dtncan: string;
    ldncan: string;
    nipcan?: string;
    phtcan: File;
    proorg: number;
    proact: number;
    proaff: number;
    niveau_id: number;

    nupcan: string;
    concours_id?: number;
}

export interface ConcoursData {
    id: number;
    libcnc: string;
    fracnc: string;
    agecnc: number;
    sescnc: string;
    debcnc: string;
    fincnc: string;
    etablissement_nomets: string;
    etablissement_id?: number;
    etablissement_num: number;
    niveau_id?: number;
}

export interface DocumentData {
    id: number;
    type: string;
    nom_fichier: string;
    statut: string;
}

export interface PaiementData {
    id: number;
    montant: number;
    statut: string;
    methode: string;
    date_paiement?: string;
}

export interface ProgressionData {
    etapeActuelle: 'inscription' | 'documents' | 'paiement' | 'complete';
    etapesCompletes: string[];
    pourcentage: number;
}

export interface CandidatureStateData {
    candidatData: CandidatData | null;
    concoursData: ConcoursData | null;
    documentsData: DocumentData[];
    paiementData: PaiementData | null;
    progression: ProgressionData;
    sessionData?: any;
    formData?: any;
}

export const useCandidatureState = () => {
    const [candidatureState, setCandidatureState] = useState<CandidatureStateData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fonction pour normaliser l'étape actuelle
    const normalizeEtapeActuelle = (etape: string): 'inscription' | 'documents' | 'paiement' | 'complete' => {
        if (etape === 'termine') return 'complete';
        if (['inscription', 'documents', 'paiement', 'complete'].includes(etape)) {
            return etape as 'inscription' | 'documents' | 'paiement' | 'complete';
        }
        return 'inscription'; // default fallback
    };

    const initializeContinueCandidature = useCallback(async (nupcan: string) => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Hook: Initialisation candidature continue pour NUPCAN:', nupcan);
            const candidature = await candidatureService.getCandidatureByNupcan(nupcan);

            setCandidatureState({
                candidatData: {
                    id: candidature.candidat.id,
                    nomcan: candidature.candidat.nomcan,
                    prncan: candidature.candidat.prncan,
                    maican: candidature.candidat.maican,
                    telcan: candidature.candidat.telcan,
                    dtncan: candidature.candidat.dtncan,
                    ldncan: candidature.candidat.ldncan,
                    proorg: candidature.candidat.proorg,
                    proact: candidature.candidat.proact,
                    proaff: candidature.candidat.proaff,
                    phtcan: candidature.candidat.phtcan,
                    nipcan: candidature.candidat.nipcan,
                    niveau_id: candidature.concours.niveau_id || 0,
                    nupcan: candidature.nupcan,
                    concours_id: candidature.candidat.concours_id || candidature.concours.id,
                },
                concoursData: {
                    id: candidature.concours.id,
                    libcnc: candidature.concours.libcnc,
                    fracnc: candidature.concours.fracnc,
                    agecnc: candidature.concours.agecnc,
                    sescnc: candidature.concours.sescnc,
                    debcnc: candidature.concours.debcnc,
                    fincnc: candidature.concours.fincnc,
                    etablissement_nomets: candidature.concours.etablissement_nomets,
                    etablissement_num: candidature.concours.etablissement_num,
                    etablissement_id: candidature.concours.etablissement_id || 0,
                    niveau_id: candidature.concours.niveau_id || 0,
                },
                documentsData: candidature.documents,
                paiementData: candidature.paiement,
                progression: {
                    etapeActuelle: normalizeEtapeActuelle(candidature.progression.etapeActuelle),
                    etapesCompletes: candidature.progression.etapesCompletes,
                    pourcentage: candidature.progression.pourcentage
                },
                sessionData: candidature.session,
            });
            return candidature;
        } catch (error: any) {
            console.error('Hook: Erreur initialisation candidature:', error);
            setError(error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const initializeNewCandidature = useCallback(async (concoursId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Hook: Initialisation nouvelle candidature pour concours:', concoursId);
            // For new candidature, we set basic state structure with the real concours ID
            setCandidatureState({
                candidatData: null,
                concoursData: null,
                documentsData: [],
                paiementData: null,
                progression: {
                    etapeActuelle: 'inscription',
                    etapesCompletes: [],
                    pourcentage: 0,
                },
                sessionData: null,
                formData: {concours_id: parseInt(concoursId)},
            });
            return {concours_id: concoursId};
        } catch (error: any) {
            console.error('Hook: Erreur initialisation nouvelle candidature:', error);
            setError(error.message);
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const refreshCandidatureState = useCallback(async () => {
        if (candidatureState?.candidatData?.nupcan) {
            await initializeContinueCandidature(candidatureState.candidatData.nupcan);
        }
    }, [candidatureState?.candidatData?.nupcan, initializeContinueCandidature]);

    const updateProgression = useCallback(async (nupcan: string, etape: 'documents' | 'paiement') => {
        try {
            await candidatureService.updateProgression(nupcan, etape);
            await refreshCandidatureState();
        } catch (error: any) {
            console.error('Hook: Erreur mise à jour progression:', error);
        }
    }, [refreshCandidatureState]);

    return {
        candidatureState,
        isLoading,
        error,
        initializeContinueCandidature,
        initializeNewCandidature,
        refreshCandidatureState,
        updateProgression,
        setCandidatureState,
    };
};
