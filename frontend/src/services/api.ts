import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8002/api';
export const API_BASE_URL2 = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, '');

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    code?: string;
    errors?: string[];
}

// Helper type for legacy compatibility
export type LegacyApiResponse<T = any> = ApiResponse<T> | T;

// Instance axios pour la compatibilité
export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export class ApiService {
    delete(arg0: string, arg1: { data: { deleted_by: number; }; }): any {
        throw new Error('Method not implemented.');
    }
    get(arg0: string) {
        throw new Error('Method not implemented.');
    }

    post(arg0: string, arg1: {
        password: string;
        role: string;
        admin_role: "notes" | "documents";
        etablissement_id: number;
        nom: string;
        prenom: string;
        created_by: number;
        email: string
    }): any {
        throw new Error('Method not implemented.');
    }
    private token: string | null = null;
    defaults: any;

    constructor(private baseUrl: string = API_BASE_URL) {
    }

    // Méthode pour définir le token
    setToken(token: string) {
        this.token = token;
        api.defaults.headers.Authorization = `Bearer ${token}`;
    }

    // Méthode pour supprimer le token
    clearToken() {
        this.token = null;
        delete api.defaults.headers.Authorization;
    }

    async makeRequest<T>(url: string, method: string, data?: any): Promise<ApiResponse<T>> {
        try {
            const isFormData = data instanceof FormData;
            const storedToken = this.token || localStorage.getItem('adminToken') || localStorage.getItem('token');

            const response = await axios({
                url: `${this.baseUrl}${url}`,
                method,
                data,
                headers: isFormData
                    ? {'Content-Type': 'multipart/form-data'}
                    : {
                        'Content-Type': 'application/json',
                        ...(storedToken ? {Authorization: `Bearer ${storedToken}`} : {}),
                    },
            });

            return response.data;
        } catch (error: any) {
            console.error(`Erreur lors de la requête vers ${url}:`, error);

            if (error.response && error.response.data) {
                return {
                    success: false,
                    message: error.response.data.message || 'Erreur lors de la requête',
                    code: error.response.data.code,
                    errors: error.response.data.errors || [error.message],
                };
            }

            return {
                success: false,
                message: 'Erreur inconnue lors de la requête',
                errors: [error.message],
            };
        }
    }

    async makeFormDataRequest<T>(url: string, method: string, formData: FormData): Promise<ApiResponse<T>> {
        try {
            console.log('API: Envoi FormData vers', url);
            const storedToken = this.token || localStorage.getItem('adminToken') || localStorage.getItem('token');

            const response = await axios({
                url: `${this.baseUrl}${url}`,
                method,
                data: formData,
                headers: {
                    'Content-Type': 'multipart/form-data',
                    ...(storedToken ? {Authorization: `Bearer ${storedToken}`} : {}),
                },
            });

            return response.data;
        } catch (error: any) {
            console.error(`Erreur lors de la requête FormData vers ${url}:`, error);

            if (error.response && error.response.data) {
                return {
                    success: false,
                    message: error.response.data.message || 'Erreur lors de la requête',
                    errors: error.response.data.errors || [error.message],
                };
            }

            return {
                success: false,
                message: 'Erreur inconnue lors de la requête',
                errors: [error.message],
            };
        }
    }

    async getConcours<T>(): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/concours', 'GET');
    }

    async getAdmins<T>(): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/admins', 'GET');
    }

    async getNiveaux<T>(): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/niveaux', 'GET');
    }

    async getFilieres<T>(): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/filieres', 'GET');
    }

    async getEtablissements<T>(): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/etablissements', 'GET');
    }

    async getSessions<T>(): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/sessions', 'GET');
    }

    async createCandidat<T>(data: any): Promise<ApiResponse<T>> {
        if (data instanceof FormData) {
            return this.makeFormDataRequest<T>('/candidats', 'POST', data);
        }
        return this.makeRequest<T>('/candidats', 'POST', data);
    }

    async updateCandidat<T>(id: string, data: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/candidats/${id}`, 'PUT', data);
    }

    async getNupcanAvailability(nupcan: string): Promise<ApiResponse<boolean>> {
        return this.makeRequest<boolean>(`/candidats/check-nupcan?nupcan=${nupcan}`, 'GET');
    }

    async getCandidatByNupcan<T>(nupcan: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/candidats/nupcan/${nupcan}`, 'GET');
    }
 async getCandidatByNipcan<T>(nip: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/candidats/nip/${nip}`, 'GET');
    }
    async createPaiement<T>(data: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/paiements', 'POST', data);
    }

    async getPaiementByNupcan<T>(nupcan: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/paiements/nupcan/${nupcan}`, 'GET');
    }

    async getCandidats<T>(): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/candidats', 'GET');
    }

    async getAdministrateurs(): Promise<ApiResponse<any[]>> {
        return this.makeRequest<any[]>('/administrateurs', 'GET');
    }

    async getDocumentsByCandidat(nupcan: string) {
        console.log('API: Récupération documents pour candidat:', nupcan);
        try {
            const response = await this.makeRequest(`/dossiers/nupcan/${nupcan}`, 'GET');
            console.log('API: Documents récupérés:', response);
            return response;
        } catch (error) {
            console.error('API: Erreur récupération documents:', error);
            throw error;
        }
    }

    async validateDocument(documentId: string, statut: 'valide' | 'rejete', commentaire?: string) {
        console.log('API: Validation document:', documentId, statut);
        try {
            const response = await this.makeRequest(`/document-validation/${documentId}`, 'PUT', {
                statut,
                commentaire,
                admin_id: 1,
            });
            console.log('API: Document validé:', response);
            return response;
        } catch (error) {
            console.error('API: Erreur validation document:', error);
            throw error;
        }
    }

    async downloadDocument(documentId: string): Promise<Blob> {
        console.log('API: Téléchargement document:', documentId);
        try {
            const response = await fetch(`${this.baseUrl}/documents/${documentId}/download`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.blob();
        } catch (error) {
            console.error('API: Erreur téléchargement document:', error);
            throw error;
        }
    }

    async getDossiers<T>(): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/dossiers', 'GET');
    }

    async getAdminDossiers<T>(): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/dossiers/admin/all', 'GET');
    }

    async getDocumentsByNupcan<T>(nupcan: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/dossiers/nupcan/${nupcan}`, 'GET');
    }

    async updateDocumentStatus<T>(documentId: string, statut: string, commentaire?: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/document-validation/${documentId}`, 'PUT', {
            statut,
            commentaire,
            admin_id: 1,
        });
    }

    async createDossier<T>(data: any): Promise<ApiResponse<T>> {
        if (data instanceof FormData) {
            return this.makeFormDataRequest<T>('/dossiers', 'POST', data);
        }
        return this.makeRequest<T>('/dossiers', 'POST', data);
    }

    async getConcoursById<T>(id: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/concours/${id}`, 'GET');
    }

    async getConcoursFiliere<T>(concoursId: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/concours/${concoursId}/filieres`, 'GET');
    }

    async createConcours<T>(data: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/concours', 'POST', data);
    }

    async updateConcours<T>(id: string, data: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/concours/${id}`, 'PUT', data);
    }

    async deleteConcours<T>(id: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/concours/${id}`, 'DELETE');
    }

    async getFiliereWithMatieres<T>(filiereId: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/filieres/${filiereId}/matieres`, 'GET');
    }

    async getProvinces<T>(): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/provinces', 'GET');
    }

    async getStatistics<T>(): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/statistics', 'GET');
    }

    async getPaiements<T>(): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/paiements', 'GET');
    }

    async getPaiementByCandidat<T>(candidatId: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/paiements/candidat/${candidatId}`, 'GET');
    }

    async getCandidatByNip<T>(nip: string): Promise<ApiResponse<T>> {
        return this.getCandidatByNupcan<T>(nip);
    }

    async verifyNipcan<T>(nipcan: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/candidats/nipcan/verify', 'POST', { nipcan });
    }

    async createEtudiant<T>(data: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/etudiants', 'POST', data);
    }

    async getCandidateNotifications<T>(candidatId: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/notifications/candidat/${candidatId}`, 'GET');
    }

    async getNotifications<T>(candidatId: number): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/notifications/candidat/${candidatId}`, 'GET');
    }

    async markNotificationAsRead<T>(notificationId: string | number): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/notifications/${notificationId}/read`, 'PUT');
    }

    async sendReceiptByEmail<T>(nupcan: string, email: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/email/send-receipt', 'POST', {nupcan, email});
    }

    async createEtablissement<T>(data: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/etablissements', 'POST', data);
    }

    async updateEtablissement<T>(id: string, data: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/etablissements/${id}`, 'PUT', data);
    }

    async deleteEtablissement<T>(id: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/etablissements/${id}`, 'DELETE');
    }

    async createFiliere<T>(data: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/filieres', 'POST', data);
    }

    async updateFiliere<T>(id: string, data: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/filieres/${id}`, 'PUT', data);
    }

    async deleteFiliere<T>(id: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/filieres/${id}`, 'DELETE');
    }

    async createNiveau<T>(data: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/niveaux', 'POST', data);
    }

    async updateNiveau<T>(id: string, data: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/niveaux/${id}`, 'PUT', data);
    }

    async deleteNiveau<T>(id: string): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/niveaux/${id}`, 'DELETE');
    }

    async createSession<T>(data: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/sessions', 'POST', data);
    }

    async deleteNotification(notificationId: string) {
        return this.makeRequest(`/notifications/${notificationId}`, 'DELETE');
    }

    async deleteAllNotifications(candidatId: string) {
        return this.makeRequest(`/notifications/candidat/${candidatId}`, 'DELETE');
    }

    // Messages
    async getMessages<T>(candidatId: number): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/messages/candidat/${candidatId}`, 'GET');
    }

    async sendMessage<T>(messageData: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>('/messages', 'POST', messageData);
    }

    // Documents - nouvelles méthodes
    async replaceDocument<T>(documentId: number, formData: FormData): Promise<ApiResponse<T>> {
        return this.makeFormDataRequest<T>(`/documents/${documentId}/replace`, 'PUT', formData);
    }

    async deleteDocument<T>(documentId: number): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/documents/${documentId}`, 'DELETE');
    }

    // Admin - changement de mot de passe
    async updateAdminPassword<T>(adminId: number, passwordData: any): Promise<ApiResponse<T>> {
        return this.makeRequest<T>(`/admin/management/admins/${adminId}/password`, 'PUT', passwordData);
    }
}

export const apiService = new ApiService();
