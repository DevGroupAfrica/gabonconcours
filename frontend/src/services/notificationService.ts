import {api} from './api';

export interface Notification {
    id: number;
    candidat_nupcan: string;
    type: string;
    titre: string;
    message: string;
    statut: 'lu' | 'non_lu';
    created_at: string;
    updated_at: string;
}

class NotificationService {
    // Récupérer les notifications d'un candidat
    async getNotifications(nupcan: string): Promise<Notification[]> {
        try {
            const response = await api.get(`/notifications/${nupcan}`);
            return response.data || [];
        } catch (error) {
            console.error('Erreur lors de la récupération des notifications:', error);
            return [];
        }
    }

    // Marquer une notification comme lue
    async markAsRead(notificationId: number): Promise<void> {
        try {
            await api.put(`/notifications/${notificationId}/read`);
        } catch (error) {
            console.error('Erreur lors du marquage de la notification:', error);
            throw error;
        }
    }

    // Marquer toutes les notifications comme lues
    async markAllAsRead(nupcan: string): Promise<void> {
        try {
            await api.put(`/notifications/${nupcan}/read-all`);
        } catch (error) {
            console.error('Erreur lors du marquage des notifications:', error);
            throw error;
        }
    }

    // Créer une notification (côté admin)
    async createNotification(data: {
        candidat_nupcan: string;
        type: string;
        titre: string;
        message: string;
    }): Promise<void> {
        try {
            await api.post('/notifications', data);
        } catch (error) {
            console.error('Erreur lors de la création de la notification:', error);
            throw error;
        }
    }

    // Envoyer une notification par email
    async sendEmailNotification(data: {
        to: string;
        subject: string;
        message: string;
        candidat_nupcan: string;
    }): Promise<void> {
        try {
            await api.post('/email/send-notification', data);
        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification par email:', error);
            throw error;
        }
    }
}

export const notificationService = new NotificationService();
