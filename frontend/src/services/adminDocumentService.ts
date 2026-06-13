import {apiService} from './api';

export interface AdminDocumentData {
    document_statut: string;
    id: number;
    document_id?: number;
    nomdoc: string;
    type: string;
    nom_fichier: string;
    statut: 'en_attente' | 'valide' | 'rejete';
    commentaire_validation?: string;
    created_at: string;
    updated_at: string;
    // Données du candidat
    nupcan: string;
    candidat_id: number;
    concours_id: number;
    nomcan: string;
    prncan: string;
    maican: string;
    libcnc: string;
}

export interface DocumentValidationRequest {
    statut: 'valide' | 'rejete';
    commentaire?: string;
    admin_id?: number;
}

export interface DocumentStats {
    total: number;
    en_attente: number;
    valide: number;
    rejete: number;
}

class AdminDocumentService {
    // Récupérer tous les documents avec infos candidat
    async getAllDocumentsWithCandidatInfo(): Promise<{
        success: boolean;
        data: AdminDocumentData[];
        message?: string
    }> {
        try {
            console.log('AdminDocumentService: Récupération documents admin');
            const response = await apiService.getAdminDossiers<AdminDocumentData[]>();
            return {
                success: response.success || false,
                data: response.data || [],
                message: response.message
            };
        } catch (error) {
            console.error('AdminDocumentService: Erreur récupération documents:', error);
            throw error;
        }
    }

    // Valider un document
    async validateDocument(documentId: number, statut: "valide" | "rejete", commentaire?: string): Promise<{
        success: boolean;
        message?: string
    }> {
        try {
            console.log('AdminDocumentService: Validation document:', documentId, statut);
            const response = await apiService.updateDocumentStatus(documentId.toString(), statut, commentaire);
            if (!response.success) {
                throw new Error(response.message || 'Le statut du document n’a pas été mis à jour');
            }
            return {
                success: true,
                message: response.message
            };
        } catch (error) {
            console.error('AdminDocumentService: Erreur validation document:', error);
            throw error;
        }
    }

    // Obtenir les statistiques
    async getDocumentStats(): Promise<{ success: boolean; data: DocumentStats; message?: string }> {
        try {
            const response = await apiService.makeRequest<{
                stats: any[];
                totals: DocumentStats
            }>('/document-validation/stats', 'GET');

            if (response.success && response.data) {
                return {
                    success: true,
                    data: response.data.totals,
                    message: 'Statistiques récupérées'
                };
            }

            return {
                success: false,
                data: {total: 0, en_attente: 0, valide: 0, rejete: 0},
                message: 'Erreur récupération statistiques'
            };
        } catch (error) {
            console.error('AdminDocumentService: Erreur statistiques:', error);
            throw error;
        }
    }

    // Télécharger un document
    async downloadDocument(nomFichier: string): Promise<Blob> {
        try {
            console.log('AdminDocumentService: Téléchargement document:', nomFichier);
            const response = await fetch(`http://localhost:8002/uploads/documents/${nomFichier}`);
            if (!response.ok) {
                throw new Error('Erreur lors du téléchargement');
            }
            return await response.blob();
        } catch (error) {
            console.error('AdminDocumentService: Erreur téléchargement:', error);
            throw error;
        }
    }

    // Obtenir l'URL de prévisualisation
    getDocumentPreviewUrl(nomFichier: string): string {
        return `http://localhost:8002/uploads/documents/${nomFichier}`;
    }

    // Ajouter la méthode manquante
    async getCandidatDocuments(nupcan: string): Promise<AdminDocumentData[]> {
        try {
            console.log('AdminDocumentService: Récupération documents candidat:', nupcan);
            const response = await apiService.getDocumentsByNupcan<AdminDocumentData[]>(nupcan);
            return response.data || [];
        } catch (error) {
            console.error('AdminDocumentService: Erreur récupération documents candidat:', error);
            throw error;
        }
    }
}

export const adminDocumentService = new AdminDocumentService();
