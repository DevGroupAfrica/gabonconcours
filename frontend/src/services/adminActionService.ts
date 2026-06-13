import { apiService } from './api';

export interface AdminAction {
    id: number;
    admin_id: number;
    action_type: 'validation_document' | 'rejet_document' | 'ajout_note' | 'reponse_message' | 'creation_admin' | 'modification_concours' | 'autre';
    entity_type: string;
    entity_id?: number;
    candidat_nupcan?: string;
    description: string;
    details?: any;
    ip_address?: string;
    created_at: string;
    admin_nom?: string;
    admin_prenom?: string;
    admin_email?: string;
    admin_role?: string;
    nomcan?: string;
    prncan?: string;
}

export interface AdminActionFilters {
    admin_id?: number;
    action_type?: string;
    candidat_nupcan?: string;
    date_debut?: string;
    date_fin?: string;
    etablissement_id?: number;
    limit?: number;
}

class AdminActionService {
    // Récupérer toutes les actions avec filtres
    async getActions(filters?: AdminActionFilters): Promise<AdminAction[]> {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, value.toString());
                    }
                });
            }

            const response = await apiService.makeRequest<{ data: AdminAction[]; count: number }>(
                `/admin-actions?${queryParams.toString()}`,
                'GET'
            );
            
            return response.data?.data || [];
        } catch (error) {
            console.error('Erreur récupération actions:', error);
            return [];
        }
    }

    // Récupérer les statistiques
    async getStats(filters?: {
        admin_id?: number;
        date_debut?: string;
        date_fin?: string;
    }): Promise<any[]> {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, value.toString());
                    }
                });
            }

            const response = await apiService.makeRequest(
                `/admin-actions/stats?${queryParams.toString()}`,
                'GET'
            );
            
            return response.data || [];
        } catch (error) {
            console.error('Erreur récupération stats:', error);
            return [];
        }
    }

    // Récupérer l'activité récente
    async getRecentActivity(limit: number = 50): Promise<AdminAction[]> {
        try {
            const response = await apiService.makeRequest<{ data: AdminAction[] }>(
                `/admin-actions/recent?limit=${limit}`,
                'GET'
            );
            
            return response.data?.data || [];
        } catch (error) {
            console.error('Erreur récupération activité récente:', error);
            return [];
        }
    }

    // Récupérer les actions d'un admin
    async getActionsByAdmin(adminId: number): Promise<AdminAction[]> {
        try {
            const response = await apiService.makeRequest<{ data: AdminAction[] }>(
                `/admin-actions/admin/${adminId}`,
                'GET'
            );
            
            return response.data?.data || [];
        } catch (error) {
            console.error('Erreur récupération actions admin:', error);
            return [];
        }
    }

    // Récupérer les actions pour un candidat
    async getActionsByCandidat(nupcan: string): Promise<AdminAction[]> {
        try {
            const response = await apiService.makeRequest<{ data: AdminAction[] }>(
                `/admin-actions/candidat/${nupcan}`,
                'GET'
            );
            
            return response.data?.data || [];
        } catch (error) {
            console.error('Erreur récupération actions candidat:', error);
            return [];
        }
    }
}

export const adminActionService = new AdminActionService();
