export interface CandidatureFormData {
    nomcan: string;
    prncan: string;
    maican: string;
    dtncan: string;
    telcan: string;
    ldncan: string;
    niveau_id: number;
    nipcan: string;
    proorg: number;
    proact: number;
    proaff: number;
    concours_id: number;
    phtcan?: File;
}

export interface CandidatureState {
    candidatData: any;
    concoursData: any;
    documentsData: any[];
    paiementData: any;
    sessionData?: any;
    progression: {
        etapeActuelle: 'inscription' | 'documents' | 'paiement' | 'complete';
        etapesCompletes: string[];
        pourcentage: number;
    };
    lastUpdated?: Date;
}

class CandidatureStateManager {
    private states: Map<string, CandidatureState> = new Map();

    validateNupcanFormat(nupcan: string): boolean {
        // Valider le format NUPCAN (ex: 2025630-15)
        const nupcanRegex = /^\d{8}-\d{1,4}$/;
        return nupcanRegex.test(nupcan);
    }

    async initializeNewCandidature(concoursId: string): Promise<CandidatureState> {
        try {
            const concoursResponse = await fetch(`http://localhost:8002/api/concours/${concoursId}`);
            const concoursData = await concoursResponse.json();

            const state: CandidatureState = {
                candidatData: null,
                concoursData: concoursData.data,
                documentsData: [],
                paiementData: null,
                sessionData: null,
                progression: {
                    etapeActuelle: 'inscription',
                    etapesCompletes: [],
                    pourcentage: 0,
                },
            };

            const candidatureId = `temp_${concoursId}_${Date.now()}`;
            this.states.set(candidatureId, state);

            return state;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation:', error);
            throw error;
        }
    }

    async initializeContinueCandidature(nupcan: string): Promise<any> {
        try {
            const response = await fetch(`http://localhost:8002/api/candidats/nupcan/${encodeURIComponent(nupcan)}`);
            const candidatureData = await response.json();

            if (!candidatureData.success) {
                throw new Error('Candidature non trouvée');
            }

            return candidatureData.data;
        } catch (error) {
            console.error('Erreur lors de l\'initialisation continue:', error);
            throw error;
        }
    }

    async finalizeInscription(candidatureId: string, formData: CandidatureFormData): Promise<void> {
        const state = this.states.get(candidatureId);
        if (state) {
            state.candidatData = formData;
            state.progression.etapeActuelle = 'documents';
            state.progression.etapesCompletes = ['inscription'];
            state.progression.pourcentage = 33;
        }
    }

    async updateProgression(nupcan: string, etape: 'documents' | 'paiement'): Promise<void> {
        try {
            // Mettre à jour la progression via l'API
            await fetch(`http://localhost:8002/api/candidats/${nupcan}/progression`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({etape}),
            });
        } catch (error) {
            console.error('Erreur mise à jour progression:', error);
        }
    }

    getState(candidatureId: string): CandidatureState | undefined {
        return this.states.get(candidatureId);
    }

    updateState(candidatureId: string, updates: Partial<CandidatureState>): void {
        const state = this.states.get(candidatureId);
        if (state) {
            Object.assign(state, updates);
        }
    }

    saveState(candidatureId: string, state: Partial<CandidatureState>): void {
        const existingState = this.states.get(candidatureId) || {
            candidatData: null,
            concoursData: null,
            documentsData: [],
            paiementData: null,
            sessionData: null,
            progression: {
                etapeActuelle: 'inscription' as const,
                etapesCompletes: [],
                pourcentage: 0,
            },
        };

        this.states.set(candidatureId, {...existingState, ...state});
    }
}

export const candidatureStateManager = new CandidatureStateManager();

// Export des types pour les autres fichiers
export type {CandidatData, ConcoursData} from '@/hooks/useCandidatureState';
