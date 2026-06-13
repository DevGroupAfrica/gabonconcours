import { apiService } from './api';

export interface Message {
    id: number;
    candidat_nupcan: string;
    admin_id?: number;
    sujet: string;
    message: string;
    expediteur: 'candidat' | 'admin';
    statut: 'lu' | 'non_lu';
    created_at: string;
    updated_at: string;
    nomcan?: string;
    prncan?: string;
    maican?: string;
    admin_nom?: string;
    admin_prenom?: string;
}

class MessageService {
    // Récupérer les messages d'un candidat
    async getMessagesByNupcan(nupcan: string): Promise<Message[]> {
        try {
            const response = await apiService.makeRequest<Message[]>(
                `/messages/candidat/${nupcan}`,
                'GET'
            );
            return response.data || [];
        } catch (error) {
            console.error('Erreur récupération messages:', error);
            return [];
        }
    }

    // Envoyer un message (candidat)
    async sendMessage(data: {
        nupcan: string;
        sujet: string;
        message: string;
        admin_id?: number;
    }): Promise<any> {
        try {
            const response = await apiService.makeRequest(
                '/messages/candidat',
                'POST',
                data
            );
            return response;
        } catch (error) {
            console.error('Erreur envoi message:', error);
            throw error;
        }
    }

    // Répondre à un message (admin)
    async replyMessage(data: {
        message_id?: number;
        nupcan: string;
        admin_id: number;
        sujet?: string;
        message: string;
    }): Promise<any> {
        try {
            const response = await apiService.makeRequest(
                '/messages/admin/repondre',
                'POST',
                data
            );
            return response;
        } catch (error) {
            console.error('Erreur réponse message:', error);
            throw error;
        }
    }

    // Marquer un message comme lu
    async markAsRead(messageId: number): Promise<any> {
        try {
            const response = await apiService.makeRequest(
                `/messages/${messageId}/marquer-lu`,
                'PUT'
            );
            return response;
        } catch (error) {
            console.error('Erreur marquage message:', error);
            throw error;
        }
    }

    // Récupérer les messages admin avec filtres
    async getAdminMessages(filters?: {
        concours_id?: number;
        etablissement_id?: number;
    }): Promise<Message[]> {
        try {
            const queryParams = new URLSearchParams();
            if (filters?.concours_id) {
                queryParams.append('concours_id', filters.concours_id.toString());
            }
            if (filters?.etablissement_id) {
                queryParams.append('etablissement_id', filters.etablissement_id.toString());
            }

            const response = await apiService.makeRequest<Message[]>(
                `/messages/admin?${queryParams.toString()}`,
                'GET'
            );
            return response.data || [];
        } catch (error) {
            console.error('Erreur récupération messages admin:', error);
            return [];
        }
    }

    // Récupérer les statistiques des messages
    async getStats(): Promise<any> {
        try {
            const response = await apiService.makeRequest('/messages/stats', 'GET');
            return response.data || {};
        } catch (error) {
            console.error('Erreur récupération stats:', error);
            return {};
        }
    }
}

export const messageService = new MessageService();
