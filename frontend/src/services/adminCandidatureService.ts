import {apiService} from './api';

export interface AdminCandidatureData {
    id: number;
    candidat_id: number;
    concours_id: number;
    filiere_id: number;
    statut: 'en_attente' | 'valide' | 'rejete';
    created_at: string;
    updated_at: string;
    candidat: {
        nupcan: string;
        nomcan: string;
        prncan: string;
        maican: string;
        telcan: string;
        dtncan: string;
        ldncan: string;
        phtcan?: string;
    };
    concours: {
        libcnc: string;
        sescnc: string;
        fracnc: number;
    };
    filiere: {
        nomfil: string;
    };
    paiement?: {
        statut: string;
        montant: number;
        methode: string;
        reference_paiement: string;
    };
    documents?: any[];
}

class AdminCandidatureService {
    async getAllCandidaturesByConcours(concoursId: number): Promise<AdminCandidatureData[]> {
        try {
            console.log('AdminCandidatureService: Récupération candidatures pour concours:', concoursId);
            const response = await apiService.makeRequest<any[]>(
                `/admin/concours/${concoursId}/candidats`,
                'GET'
            );
            // Transformer les données pour correspondre à AdminCandidatureData
            const transformedData: AdminCandidatureData[] = (response.data || []).map(item => ({
                id: item.id,
                candidat_id: item.id,
                concours_id: item.concours_id,
                filiere_id: item.filiere_id,
                statut: item.statut || 'en_attente',
                created_at: item.created_at,
                updated_at: item.updated_at,
                candidat: {
                    nupcan: item.nupcan,
                    nomcan: item.nomcan,
                    prncan: item.prncan,
                    maican: item.maican,
                    telcan: item.telcan,
                    dtncan: item.dtncan,
                    ldncan: item.ldncan || '',
                    phtcan: item.phtcan,
                },
                concours: {
                    libcnc: item.libcnc,
                    sescnc: item.sescnc || '',
                    fracnc: item.fracnc || 0,
                },
                filiere: {
                    nomfil: item.nomfil,
                },
                paiement: item.paiement, // Peut être undefined
                documents: item.documents || [],
            }));
            return transformedData;
        } catch (error: any) {
            console.error('AdminCandidatureService: Erreur récupération candidatures:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            throw error;
        }
    }

    async getCandidatureByNupcan(nupcan: string): Promise<AdminCandidatureData | null> {
        try {
            console.log('AdminCandidatureService: Récupération candidature par NUPCAN:', nupcan);
            const response = await apiService.makeRequest<any>(
                `/candidats/nupcan/${nupcan}`,
                'GET'
            );
            if (!response.data) return null;
            // Transformer les données
            const item = response.data;
            const transformedData: AdminCandidatureData = {
                id: item.id,
                candidat_id: item.id,
                concours_id: item.concours_id,
                filiere_id: item.filiere_id,
                statut: item.statut || 'en_attente',
                created_at: item.created_at,
                updated_at: item.updated_at,
                candidat: {
                    nupcan: item.nupcan,
                    nomcan: item.nomcan,
                    prncan: item.prncan,
                    maican: item.maican,
                    telcan: item.telcan,
                    dtncan: item.dtncan,
                    ldncan: item.ldncan || '',
                    phtcan: item.phtcan,
                },
                concours: item.concours || {
                    libcnc: '',
                    sescnc: '',
                    fracnc: 0,
                },
                filiere: item.filiere || {
                    nomfil: '',
                },
                paiement: item.paiement,
                documents: item.documents || [],
            };
            return transformedData;
        } catch (error: any) {
            console.error('AdminCandidatureService: Erreur récupération candidature:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
            });
            throw error;
        }
    }
}

export const adminCandidatureService = new AdminCandidatureService();