import {apiService} from './api';

export interface FiliereWithMatieresData {
    id: number;
    nomfil: string;
    description?: string;
    niveau_id: number;
    niveau_nomniv?: string;
    matieres: Array<{
        id: number;
        nom_matiere: string;
        coefficient: number;
        obligatoire?: boolean;
        duree?: number;
    }>;
}

class FiliereService {

    // Récupérer les données de filière depuis sessionStorage
    getFiliereSelection(): any {
        const data = sessionStorage.getItem('filiereSelection');
        return data ? JSON.parse(data) : null;
    }

    // Nettoyer les données de filière
    clearFiliereSelection(): void {
        sessionStorage.removeItem('filiereSelection');
    }

    // Récupérer une filière avec ses matières
    async getFiliereWithMatieres(filiereId: string): Promise<FiliereWithMatieresData | null> {
        try {
            const response = await apiService.getFiliereWithMatieres(filiereId);
            if (response.success && response.data) {
                return response.data as FiliereWithMatieresData;
            }
            return null;
        } catch (error) {
            console.error('Erreur lors de la récupération de la filière:', error);
            return null;
        }
    }
}

export const filiereService = new FiliereService();
