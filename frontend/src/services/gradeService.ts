import { apiService, ApiResponse } from './api';

export interface Grade {
  id: number;
  participation_id: number;
  matiere_id: number;
  note: number;
  nommat: string;
  coefmat: number;
  created_at: string;
  updated_at: string;
}

export interface GradeInput {
  nupcan: string;
  concours_id: number;
  matiere_id: number;
  note: number;
  admin_id?: number;
}

export interface CandidateGrades {
  candidat: any;
  notes: Grade[];
  moyenneGenerale: number | null;
}

class GradeService {
  // Récupérer les notes d'un candidat
  async getCandidateGrades(nupcan: string): Promise<ApiResponse<CandidateGrades>> {
    return apiService.makeRequest<CandidateGrades>(`/grades/candidat/${nupcan}`, 'GET');
  }

  // Récupérer les notes d'un concours
  async getConcoursGrades(concoursId: number): Promise<ApiResponse<Grade[]>> {
    return apiService.makeRequest<Grade[]>(`/grades/concours/${concoursId}`, 'GET');
  }

  // Créer ou mettre à jour une note
  async saveGrade(gradeData: GradeInput): Promise<ApiResponse<any>> {
    return apiService.makeRequest('/grades', 'POST', gradeData);
  }

  // Saisir plusieurs notes en une fois
  async saveBatchGrades(notes: GradeInput[], adminId?: number): Promise<ApiResponse<any>> {
    return apiService.makeRequest('/grades/batch', 'POST', { notes, admin_id: adminId });
  }
}

export const gradeService = new GradeService();
