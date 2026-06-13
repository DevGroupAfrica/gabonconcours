import axios from 'axios';
import {ApiResponse} from "@/services/api.ts";

const BASE_URL = 'http://localhost:8002/api/admin';
const BASE_URL2 = 'http://localhost:8002/api';

 async function makeRequest<T>(url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', data?: any): Promise<ApiResponse<T>> {
    try {
        const token = localStorage.getItem('adminToken');
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

        const response = await axios({
            method,
            url: `${this.baseURL}${url}`,
            data,
            headers
        });

        return response.data;
    } catch (error: any) {
        console.error(`Erreur lors de la requête ${method} vers ${url}:`, error);

        if (axios.isAxiosError(error)) {
            return {
                success: false,
                message: error.response?.data?.message || error.message,
                errors: error.response?.data?.errors || [error.message]
            };
        }

        return {
            success: false,
            message: 'Erreur inconnue',
            errors: [error.message]
        };
    }
}


export const adminApiService = {
    // Authentification
    login: async (credentials: { email: string; password: string }) => {
        try {
            console.log('Tentative de connexion admin avec:', credentials.email);
            const response = await axios.post(`${BASE_URL}/auth/login`, credentials);
            console.log('Réponse login:', response.data);

            if (response.data.success && response.data.token) {
                localStorage.setItem('adminToken', response.data.token);
                localStorage.setItem('adminUser', JSON.stringify(response.data.admin));
            }

            return response.data;
        } catch (error: any) {
            console.error('Erreur login admin:', error);
            throw new Error(error.response?.data?.message || 'Erreur de connexion');
        }
    },

    logout: () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
    },

    getCurrentAdmin: () => {
        try {
            const adminData = localStorage.getItem('adminUser');
            return adminData ? JSON.parse(adminData) : null;
        } catch {
            return null;
        }
    },

    getToken: () => {
        return localStorage.getItem('adminToken');
    },

    // Gestion des admins
    getAdmins: async () => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/management/admins`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur récupération admins:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des admins');
        }
    },

    createAdmin: async (adminData: any) => {
        try {
            console.log('Service createAdmin appelé avec:', adminData);
            const token = adminApiService.getToken();
            const response = await axios.post(`${BASE_URL}/management/admins`, adminData, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Réponse API:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Réponse API:', error.response?.status, error.response?.statusText);
            console.error('Erreur API:', error.response?.data);
            throw new Error(error.response?.data?.message || `Erreur ${error.response?.status}: ${error.response?.statusText}`);
        }
    },

    updateAdmin: async (id: number, adminData: any) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.put(`${BASE_URL}/management/admins/${id}`, adminData, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur modification admin:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la modification');
        }
    },

    deleteAdmin: async (id: number) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.delete(`${BASE_URL}/management/admins/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur suppression admin:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la suppression');
        }
    },

    // Statistiques
    getStats: async () => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur récupération stats:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des statistiques');
        }
    },

    // Candidats
    getCandidats: async () => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/candidats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur récupération candidats:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des candidats');
        }
    },

    getCandidatDetails: async (nupcan: string) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/candidats/${nupcan}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur récupération détails candidat:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des détails');
        }
    },

    // Établissement
    getCandidatsByEtablissement: async (etablissementId: number) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/etablissement/${etablissementId}/candidats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur récupération candidats établissement:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des candidats');
        }
    },

    getDossiersByEtablissement: async (etablissementId: number) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/etablissement/${etablissementId}/dossiers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur récupération dossiers établissement:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des dossiers');
        }
    },

    getPaiementsByEtablissement: async (etablissementId: number) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/etablissement/${etablissementId}/paiements`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur récupération paiements établissement:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des paiements');
        }
    },

    validateDocument: async (documentId: number, status: 'valide' | 'rejete', motif?: string) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.post(`${BASE_URL}/documents/${documentId}/validate`, {
                statut: status,
                motif: motif
            }, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur validation document:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la validation');
        }
    },

    // Notifications
    sendNotification: async (candidatNupcan: string, type: string, message: string) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.post(`${BASE_URL}/notifications`, {
                candidat_nupcan: candidatNupcan,
                type: type,
                message: message
            }, {
                headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error: any) {
            console.error('Erreur envoi notification:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de l\'envoi de la notification');
        }
    },

    // Support
    getSupportRequests: async ({page, limit, searchTerm, filterStatus}: {
        page: number;
        limit: number;
        searchTerm: string;
        filterStatus: string;
    }) => {
        const response = await axios.get(`${BASE_URL2}/support`, {
            params: {page, limit, search: searchTerm, status: filterStatus},
        });
        return response.data;
    },

    // Nouvelles fonctions ajoutées
    getConcoursByEtablissement: async (etablissementId: string | number) => {
        try {
            const token = adminApiService.getToken();
            const response = await axios.get(`${BASE_URL}/etablissement/${etablissementId}/concours`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            return { success: true, data: response.data, message: '' };
        } catch (error: any) {
            console.error('Erreur récupération concours établissement:', error);
            throw new Error(error.response?.data?.message || 'Erreur lors de la récupération des concours');
        }
    },

    async getCandidatsByConcours(concoursId: string | number): Promise<ApiResponse<any[]>> {
        const response = await makeRequest<any[]>(`/concours/${concoursId}/candidats`, 'GET');
        return {
            success: response.success || false,
            data: response.data || [],
            message: response.message || '',
            errors: response.errors
        };
    }

};
