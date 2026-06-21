import { api, apiService } from './api';

export interface Document {
  id: string;
  nomdoc: string;
  type?: string;
  document_statut: 'valide' | 'rejete' | 'en_attente';
  url: string;
  taille?: number;
}

export interface DocumentData {
  id: string | number;
  nomdoc: string;
  type?: string;
  statut: 'valide' | 'rejete' | 'en_attente';
  document_statut?: 'valide' | 'rejete' | 'en_attente';
  docdsr?: string;
  nom_fichier?: string;
  url?: string;
  taille?: number;
  taille_fichier?: number;
  chemin_fichier?: string;
  commentaire_validation?: string;
  create_at?: string;
  created_at?: string;
}

export interface RequiredDocument {
  nom: string;
  obligatoire: boolean;
  description?: string;
}

export const documentService = {
  async getRequiredDocuments(nupcan: string): Promise<RequiredDocument[]> {
    try {
      const response = await api.get(`/documents/candidate/required/${encodeURIComponent(nupcan)}`);
      return response.data.data?.documents || [];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Impossible de charger les documents requis.');
    }
  },

  async getDocumentsByNupcan(nupcan: string): Promise<Document[]> {
    try {
      const response = await api.get(`/candidats/nupcan/${encodeURIComponent(nupcan)}/documents`);
      return response.data.data.map((doc: any) => ({
        id: doc.id.toString(),
        nomdoc: doc.nomdoc,
        type: doc.type,
        document_statut: doc.document_statut || doc.statut || 'en_attente',
        url: doc.docdsr || doc.nom_fichier || doc.fichier,
        taille: doc.taille || (doc.nom_fichier ? 1024 : undefined),
      }));
    } catch (error: any) {
      console.error('Error fetching documents by nupcan:', error);
      throw new Error(error.response?.data?.message || 'Impossible de charger les documents.');
    }
  },

  async uploadDocument(formData: FormData): Promise<Document> {
    try {
      const response = await api.post('/documents/candidate/add', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const doc = response.data.data;
      return {
        id: doc.id.toString(),
        nomdoc: doc.nomdoc,
        type: doc.type,
        document_statut: doc.statut || 'en_attente',
        url: doc.docdsr || doc.nom_fichier,
        taille: doc.taille,
      };
    } catch (error: any) {
      console.error('Error uploading document:', error);
      throw new Error(error.response?.data?.message || 'Impossible d’ajouter le document.');
    }
  },

  async replaceDocument(id: string, data: File | FormData): Promise<Document> {
    try {
      let formData: FormData;

      if (data instanceof FormData) {
        formData = data;
      } else {
        formData = new FormData();
        formData.append('file', data);
      }

      console.log('Remplacement document ID:', id);
      const response = await api.put(`/documents/${id}/replace`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      console.log('Réponse remplacement:', response.data);
      const doc = response.data.data;

     return {
  id: doc.id?.toString() || id,
  nomdoc: doc.nomdoc || '',
  type: doc.type || '',
  document_statut: doc.statut || doc.document_statut || 'en_attente',
  url: doc.docdsr || doc.nom_fichier || doc.chemin_fichier || '',
  taille: doc.taille || doc.taille_fichier || 0,
  docdsr: doc.docdsr || '',
};

    } catch (error: any) {
      console.error('Erreur lors du remplacement du document :', error);
      throw new Error(error.response?.data?.message || 'Échec du remplacement du document');
    }
  },

  async updateDocument(id: string, file: File): Promise<Document> {
    return this.replaceDocument(id, file);
  },

  async updateDocumentStatus(id: string, statut: string, commentaire?: string): Promise<any> {
    try {
      const response = await api.put(`/documents/${id}/status`, { statut, commentaire });
      return response.data;
    } catch (error: any) {
      console.error('Erreur mise à jour statut:', error);
      throw new Error(error.response?.data?.message || 'Échec de la mise à jour du statut');
    }
  },

  async deleteDocument(nupcan: string, documentId: string): Promise<void> {
    try {
      console.log('Suppression document:', documentId);
      const response = await apiService.makeRequest(`/documents/${documentId}`, 'DELETE');
      if (!response.success) throw new Error(response.message);
    } catch (error: any) {
      console.error('Erreur suppression document:', error);
      throw new Error(error.response?.data?.message || error.message || 'Impossible de supprimer le document.');
    }
  },

  async getDocumentsByCandidat(nupcan: string): Promise<any> {
    return this.getDocumentsByNupcan(nupcan);
  },

  async validateDocument(documentId: string, validationData: any): Promise<any> {
    try {
      const response = await api.put(`/documents/${documentId}/status`, {
        statut: validationData.statut,
        commentaire: validationData.commentaire,
      });
      return response.data;
    } catch (error: any) {
      console.error('Error validating document:', error);
      throw new Error(error.response?.data?.message || 'Impossible de valider le document.');
    }
  },

  async downloadDocument(documentId: string): Promise<Blob> {
    try {
      const response = await fetch(`${api.defaults.baseURL}/documents/${documentId}/download`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      return await response.blob();
    } catch (error: any) {
      console.error('Error downloading document:', error);
      throw new Error(error.message || 'Impossible de télécharger le document.');
    }
  },

  getDocumentPreviewUrl(documentId: string): string {
    return `${api.defaults.baseURL}/documents/${documentId}/download`;
  },
};
