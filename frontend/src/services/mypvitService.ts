import { api } from './api';

export interface MyPVITPaymentRequest {
    nupcan: string;
    montant: number;
    numero_telephone: string;
    candidat_id?: number;
    concours_id?: number;
}

export interface MyPVITPaymentResponse {
    success: boolean;
    message: string;
    data?: {
        payment_id: number;
        reference: string;
        transaction_id?: string;
        payment_url?: string;
        ussd_code?: string;
    };
}

class MyPVITService {
    /**
     * Initialise un paiement MyPVIT
     */
    async initPayment(data: MyPVITPaymentRequest): Promise<MyPVITPaymentResponse> {
        try {
            const response = await api.post('/mypvit/init', data);
            return response;
        } catch (error: any) {
            console.error('Erreur initPayment MyPVIT:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Erreur lors de l\'initialisation du paiement'
            };
        }
    }

    /**
     * Vérifie le statut d'un paiement
     */
    async checkPaymentStatus(transaction_id: string): Promise<any> {
        try {
            const response = await api.get(`/mypvit/status/${transaction_id}`);
            return response;
        } catch (error: any) {
            console.error('Erreur checkPaymentStatus:', error);
            throw error;
        }
    }
}

export const mypvitService = new MyPVITService();
