import { apiService } from './api';

class ExportService {
  private baseUrl = 'http://localhost:8002/api';

  // Exporter les candidats en Excel
  async exportCandidatesExcel(concoursId?: number): Promise<void> {
    try {
      const url = `${this.baseUrl}/exports/candidatures/concours/${concoursId ? `?concours_id=${concoursId}` : ''}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erreur export Excel candidats:', error);
      throw error;
    }
  }

  // Exporter les candidats en PDF
  async exportCandidatesPDF(concoursId?: number): Promise<void> {
    try {
      const url = `${this.baseUrl}/exports/candidatures/concours/${concoursId ? `?concours_id=${concoursId}` : ''}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erreur export PDF candidats:', error);
      throw error;
    }
  }

  // Exporter les notes en Excel
  async exportGradesExcel(concoursId?: number): Promise<void> {
    try {
      const url = `${this.baseUrl}/exports/notes/excel${concoursId ? `?concours_id=${concoursId}` : ''}`;
      window.open(url, '_blank');
    } catch (error) {
      console.error('Erreur export Excel notes:', error);
      throw error;
    }
  }

  // Générer un rapport personnalisé
  async generateCustomReport(filters: any): Promise<Blob> {
    try {
      const response = await fetch(`${this.baseUrl}/exports/custom`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(filters),
      });

      if (!response.ok) {
        throw new Error('Erreur génération rapport');
      }

      return await response.blob();
    } catch (error) {
      console.error('Erreur génération rapport:', error);
      throw error;
    }
  }
}

export const exportService = new ExportService();
