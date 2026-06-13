import {apiService} from './api';

export interface AdminConcoursData {
    id: number;
    libcnc: string;
    sescnc: string;
    debcnc: string;
    fincnc: string;
    fracnc: number;
    etablissement_id: number;
    created_at: string;
    updated_at: string;
}

class AdminConcoursService {
    etablissement_id: number;
    async getConcoursByEtablissement(etablissementId: number): Promise<AdminConcoursData[]> {
        try {
            console.log('AdminConcoursService: Récupération concours pour établissement:', etablissementId);
            const response = await apiService.makeRequest<AdminConcoursData[]>(
                `/admin/etablissement/${etablissementId}/concours`,
                'GET'
            );
            return response.data || [];
        } catch (error) {
            console.error('AdminConcoursService: Erreur récupération concours:', error);
            throw error;
        }
    }

    async getConcoursById(id: number): Promise<AdminConcoursData | null> {
        try {
            const response = await apiService.getConcoursById<AdminConcoursData>(id.toString());
            return response.data || null;
        } catch (error) {
            console.error('AdminConcoursService: Erreur récupération concours:', error);
            throw error;
        }
    }
}

export const adminConcoursService = new AdminConcoursService();