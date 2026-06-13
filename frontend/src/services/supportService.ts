import { apiService } from './api';

export interface SupportRequest {
    id: number;
    candidat_nupcan?: string;
    email: string;
    nom: string;
    sujet: string;
    message: string;
    statut: 'nouveau' | 'en_cours' | 'resolu' | 'ferme';
    priorite: 'basse' | 'normale' | 'haute' | 'urgente';
    assigned_to?: number;
    created_at: string;
    updated_at: string;
    resolved_at?: string;
    nomcan?: string;
    prncan?: string;
    admin_nom?: string;
    admin_prenom?: string;
    responses?: SupportResponse[];
}

export interface SupportResponse {
    id: number;
    support_request_id: number;
    admin_id: number;
    message: string;
    is_internal_note: boolean;
    created_at: string;
    admin_nom?: string;
    admin_prenom?: string;
}

class SupportService {
    // Créer une demande de support
    async createRequest(data: {
        candidat_nupcan?: string;
        email: string;
        nom: string;
        sujet: string;
        message: string;
        priorite?: 'basse' | 'normale' | 'haute' | 'urgente';
    }): Promise<any> {
        try {
            const response = await apiService.makeRequest(
                '/support/requests',
                'POST',
                data
            );
            return response;
        } catch (error) {
            console.error('Erreur création demande:', error);
            throw error;
        }
    }

    // Récupérer toutes les demandes (super admin)
    async getRequests(filters?: {
        statut?: string;
        priorite?: string;
        assigned_to?: number;
    }): Promise<SupportRequest[]> {
        try {
            const queryParams = new URLSearchParams();
            
            if (filters) {
                Object.entries(filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null) {
                        queryParams.append(key, value.toString());
                    }
                });
            }

            const response = await apiService.makeRequest<SupportRequest[]>(
                `/support/requests?${queryParams.toString()}`,
                'GET'
            );
            
            return response.data || [];
        } catch (error) {
            console.error('Erreur récupération demandes:', error);
            return [];
        }
    }

    // Récupérer une demande spécifique
    async getRequest(id: number): Promise<SupportRequest | null> {
        try {
            const response = await apiService.makeRequest<SupportRequest>(
                `/support/requests/${id}`,
                'GET'
            );
            
            return response.data || null;
        } catch (error) {
            console.error('Erreur récupération demande:', error);
            return null;
        }
    }

    // Mettre à jour une demande
    async updateRequest(
        id: number,
        data: {
            statut?: string;
            priorite?: string;
            assigned_to?: number;
        }
    ): Promise<any> {
        try {
            const response = await apiService.makeRequest(
                `/support/requests/${id}`,
                'PUT',
                data
            );
            return response;
        } catch (error) {
            console.error('Erreur mise à jour demande:', error);
            throw error;
        }
    }

    // Répondre à une demande
    async addResponse(data: {
        support_request_id: number;
        admin_id: number;
        message: string;
        is_internal_note?: boolean;
    }): Promise<any> {
        try {
            const response = await apiService.makeRequest(
                `/support/requests/${data.support_request_id}/responses`,
                'POST',
                data
            );
            return response;
        } catch (error) {
            console.error('Erreur ajout réponse:', error);
            throw error;
        }
    }

    // Récupérer les réponses d'une demande
    async getResponses(requestId: number): Promise<SupportResponse[]> {
        try {
            const response = await apiService.makeRequest<SupportResponse[]>(
                `/support/requests/${requestId}/responses`,
                'GET'
            );
            
            return response.data || [];
        } catch (error) {
            console.error('Erreur récupération réponses:', error);
            return [];
        }
    }
}

export const supportService = new SupportService();
