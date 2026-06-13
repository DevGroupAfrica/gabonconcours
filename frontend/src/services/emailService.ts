import {apiService} from './api';

export interface EmailReceiptData {
    maican: string;
    nupcan: string;
    candidatData: any;
    pdfAttachment?: string;
}

export interface EmailNotificationData {
    candidat: {
        maican: string;
        nomcan: string;
        prncan: string;
        nupcan: string;
    };
    document: {
        type: string;
        nomdoc: string;
    };
    statut: 'valide' | 'rejete';
    commentaire?: string;
}

class EmailService {
    // Envoyer un reçu par email
    async sendReceiptEmail(data: EmailReceiptData): Promise<{ success: boolean; message: string }> {
        try {
            console.log('Envoi reçu email:', data.maican);
            const response = await apiService.makeRequest('/email/receipt', 'POST', data);
            return {
                success: response.success || false,
                message: response.message || 'Email envoyé'
            };
        } catch (error) {
            console.error('Erreur envoi reçu email:', error);
            throw error;
        }
    }

    // Envoyer une notification de validation de document
    async sendDocumentValidationNotification(data: {
        document: { type: string; nom: string };
        candidat: { nomcan: string; prncan: string; nupcan: any; maican: string };
        commentaire: string;
        statut: "valide" | "rejete"
    }): Promise<{ success: boolean; message: string }> {
        try {
            console.log('Envoi notification validation:', data);
            const response = await apiService.makeRequest('/email/document-validation', 'POST', data);
            return {
                success: response.success || false,
                message: response.message || 'Email de confirmation envoyé'
            };
        } catch (error) {
            console.error('Erreur envoi notification:', error);
            throw error;
        }
    }

    // Envoyer un email de confirmation
    async sendConfirmationEmail(data: any): Promise<{ success: boolean; message: string }> {
        try {
            console.log('Envoi email confirmation:', data);
            const response = await apiService.makeRequest('/email/confirmation', 'POST', data);
            return {
                success: response.success || false,
                message: response.message || 'Reçu envoyé par email'
            };
        } catch (error) {
            console.error('Erreur envoi email confirmation:', error);
            throw error;
        }
    }
}

export const emailService = new EmailService();
