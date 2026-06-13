import {Candidat, CandidatureCompleteData} from "@/types/candidat";
import {filiereService} from "./filiereService";
import {apiService} from "@/services/api.ts";

interface CandidatApiResponse {
    id: number;
    nupcan: string;
    concours_id: number;
    filiere_id: number;
    nomcan: string;
    prncan: string;
    maican: string;
    dtncan: string;
    telcan: string;
    ldncan: string;
    phtcan: string | null;
    niveau_id: number;
    proorg: number;
    proact: number;
    proaff: number;
    nipcan: string | null;
    created_at: string;
    updated_at: string;
}

class CandidatureService {
    private baseUrl = 'http://localhost:8002/api';

    private determineProgression(candidat: any, documents: any[], paiement: any) {
        const etapesCompletes: string[] = [];
        let pourcentage = 0;
        let etapeActuelle = 'inscription';

        if (candidat) {
            etapesCompletes.push('inscription');
            pourcentage = 33;
            etapeActuelle = 'documents';
        }

        if (documents && documents.length > 0) {
            etapesCompletes.push('documents');
            pourcentage = 67;
            etapeActuelle = 'paiement';
        }

        if (paiement && paiement.statut === 'valide') {
            etapesCompletes.push('paiement');
            pourcentage = 100;
            etapeActuelle = 'complete';
        }

        return {
            etapeActuelle,
            etapesCompletes,
            pourcentage
        };
    }

    async createCandidature(formData: FormData): Promise<CandidatureCompleteData> {
        console.log('Service: Création candidature complète');

        try {
            const filiereSelection = filiereService.getFiliereSelection();
            console.log('Service: Données filière récupérées:', filiereSelection);

            if (filiereSelection?.filiere_id) {
                formData.append('filiere_id', filiereSelection.filiere_id.toString());
            }

            console.log('📝 Création candidature avec FormData');
            console.log('📸 Photo phtcan incluse:', formData.has('phtcan'));

            const response = await fetch(`${this.baseUrl}/candidats`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || `Erreur HTTP: ${response.status}`);
            }

            const candidatResponse = await response.json();
            console.log('✅ Candidat créé:', candidatResponse);

            if (!candidatResponse.success || !candidatResponse.data) {
                throw new Error(candidatResponse.message || 'Erreur lors de la création du candidat');
            }

            const candidat = candidatResponse.data as CandidatApiResponse;
            console.log('Service: Candidat créé avec NUPCAN:', candidat.nupcan);

            if (!candidat.nupcan) {
                throw new Error('NUPCAN non généré lors de la création du candidat');
            }

            // Récupérer toutes les données en parallèle pour optimiser
            const [concoursResponse, filiereResponse, sessionResponse] = await Promise.allSettled([
                candidat.concours_id ? apiService.getConcoursById(candidat.concours_id.toString()) : Promise.resolve({
                    success: false,
                    data: null
                }),
                candidat.filiere_id ? apiService.getFiliereWithMatieres(candidat.filiere_id.toString()) : Promise.resolve({
                    success: false,
                    data: null
                }),
                apiService.createSession({nupcan: candidat.nupcan})
            ]);

            // Traiter les résultats avec vérification explicite
            let concours = {};
            if (concoursResponse.status === 'fulfilled') {
                const concoursResult = concoursResponse.value;
                if (concoursResult && typeof concoursResult === 'object' && 'success' in concoursResult && concoursResult.success && 'data' in concoursResult && concoursResult.data) {
                    concours = concoursResult.data;
                    console.log('Service: Concours récupéré:', concours);
                }
            }

            let filiere = {};
            if (filiereResponse.status === 'fulfilled') {
                const filiereResult = filiereResponse.value;
                if (filiereResult && typeof filiereResult === 'object' && 'success' in filiereResult && filiereResult.success && 'data' in filiereResult && filiereResult.data) {
                    filiere = filiereResult.data;
                    console.log('Service: Filière récupérée:', filiere);
                }
            }

            let session = null;
            if (sessionResponse.status === 'fulfilled') {
                const sessionResult = sessionResponse.value;
                if (sessionResult && typeof sessionResult === 'object' && 'success' in sessionResult && sessionResult.success && 'data' in sessionResult && sessionResult.data) {
                    session = sessionResult.data;
                    console.log('Service: Session créée:', session);
                }
            }

            const progression = this.determineProgression(candidat, [], null);

            const candidatureComplete: CandidatureCompleteData = {

                id: candidat.id,
                candidat: candidat as any,
                concours,
                filiere,
                documents: [],
                paiement: null,
                progression,
                session,
                nupcan: candidat.nupcan
            };

            console.log('Service: Candidature complète créée:', candidatureComplete);
            return candidatureComplete;
        } catch (error) {
            console.error('Service: Erreur création candidature:', error);
            throw error;
        }
    }

    async getCandidatureByNupcan(nupcan: string): Promise<CandidatureCompleteData> {
        console.log('Service: Récupération candidature pour NUPCAN:', nupcan);

        if (!nupcan || nupcan === 'null' || nupcan === 'undefined') {
            throw new Error('NUPCAN invalide');
        }

        try {
            // Récupérer les données candidat
            const candidatResponse = await apiService.getCandidatByNupcan(nupcan);
            if (!candidatResponse.success) {
                throw new Error('Candidat non trouvé');
            }

            const candidatData = candidatResponse.data as CandidatApiResponse;
            console.log('Service: Données candidat récupérées:', candidatData);

            // Récupérer les détails du concours en utilisant le concours_id du candidat
            let concours = {};
            if (candidatData && typeof candidatData === 'object' && 'concours_id' in candidatData && candidatData.concours_id) {
                try {
                    console.log('Service: Tentative récupération concours avec ID:', candidatData.concours_id);
                    const concoursResponse = await apiService.getConcoursById(candidatData.concours_id.toString());
                    console.log('Service: Réponse brute concours:', concoursResponse);

                    if (concoursResponse && concoursResponse.data) {
                        concours = concoursResponse.data;
                        console.log('Service: Concours récupéré avec succès:', concours);
                    } else {
                        console.warn('Service: Réponse concours vide ou invalide:', concoursResponse);
                    }
                } catch (error) {
                    console.error('Service: Erreur récupération concours:', error);
                }
            } else {
                console.warn('Service: Pas de concours_id dans les données candidat');
            }

            // filiere
            let filiere = {};
            if (candidatData && typeof candidatData === 'object' && 'filiere_id' in candidatData && candidatData.filiere_id) {
                try {
                    console.log('Service: filiere avec ID:', candidatData.filiere_id);
                    const filiereResponse = await apiService.getFiliereWithMatieres(candidatData.filiere_id.toString());
                    console.log('Service: Réponse filiere:', filiereResponse);

                    if (filiereResponse && filiereResponse.data) {
                        filiere = filiereResponse.data;
                        console.log('Service: filiere récupéré avec succès:', filiere);
                    } else {
                        console.warn('Service: Réponse filiere vide ou invalide:', filiereResponse);
                    }
                } catch (error) {
                    console.error('Service: Erreur récupération filiere:', error);
                }
            } else {
                console.warn('Service: Pas de filiere_id dans les données candidat');
            }

            // Récupérer les documents (avec gestion d'erreur gracieuse)
            let documents: any[] = [];
            try {
                const documentsResponse = await apiService.getDocumentsByNupcan(nupcan);
                if (documentsResponse.success && documentsResponse.data) {
                    documents = Array.isArray(documentsResponse.data) ? documentsResponse.data : [];
                }
            } catch (error) {
                console.warn('Service: Impossible de récupérer les documents:', error);
                // Continue avec un tableau vide
            }

            // Récupérer le paiement (avec gestion d'erreur gracieuse)
            let paiement = null;
            try {
                const paiementResponse = await apiService.getPaiementByNupcan(nupcan);
                if (paiementResponse.success && paiementResponse.data) {
                    paiement = paiementResponse.data;
                }
            } catch (error) {
                console.warn('Service: Impossible de récupérer le paiement:', error);
                // Continue avec null
            }

            // Calculer la progression basée sur les données réelles
            const progression = this.determineProgression(candidatData, documents, paiement);

            const candidatureComplete: CandidatureCompleteData = {
                candidat: candidatData as any,
                concours: concours,
                filiere,
                documents,
                paiement,
                progression,
                session: null,
                nupcan: candidatData && typeof candidatData === 'object' && 'nupcan' in candidatData ? candidatData.nupcan as string : '',
                id: candidatData && typeof candidatData === 'object' && 'id' in candidatData ? candidatData.id as number : 0
            };

            console.log('Service: Candidature complète récupérée:', candidatureComplete);
            return candidatureComplete;
        } catch (error) {
            console.error('Service: Erreur récupération candidature:', error);
            throw error;
        }
    }

    async updateProgression(nupcan: string, etape: 'documents' | 'paiement') {
        console.log(`Service: Mise à jour progression pour ${nupcan}, étape: ${etape}`);
    }

    async isCandidatureComplete(nupcan: string): Promise<boolean> {
        try {
            const candidature = await this.getCandidatureByNupcan(nupcan);
            return candidature.progression.etapeActuelle === 'complete';
        } catch (error) {
            return false;
        }
    }
}

export const candidatureService = new CandidatureService();
export type {CandidatureCompleteData};
