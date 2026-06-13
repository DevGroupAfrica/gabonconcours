import { apiService } from './api';

export interface UserRole {
    role: string;
}

class RoleService {
    // Vérifier si un utilisateur a un rôle spécifique
    async hasRole(userId: number, role: string): Promise<boolean> {
        try {
            const response = await apiService.makeRequest<UserRole[]>(
                `/user-roles/${userId}`,
                'GET'
            );
            
            if (response.success && response.data) {
                return response.data.some((r: UserRole) => r.role === role);
            }
            
            return false;
        } catch (error) {
            console.error('Erreur vérification rôle:', error);
            return false;
        }
    }
    
    // Obtenir tous les rôles d'un utilisateur
    async getUserRoles(userId: number): Promise<string[]> {
        try {
            const response = await apiService.makeRequest<UserRole[]>(
                `/user-roles/${userId}`,
                'GET'
            );
            
            if (response.success && response.data) {
                return response.data.map((r: UserRole) => r.role);
            }
            
            return [];
        } catch (error) {
            console.error('Erreur récupération rôles:', error);
            return [];
        }
    }
    
    // Assigner un rôle à un utilisateur
    async assignRole(userId: number, role: string): Promise<boolean> {
        try {
            const response = await apiService.makeRequest(
                '/user-roles',
                'POST',
                { user_id: userId, role }
            );
            
            return response.success || false;
        } catch (error) {
            console.error('Erreur assignation rôle:', error);
            return false;
        }
    }
    
    // Retirer un rôle d'un utilisateur
    async removeRole(userId: number, role: string): Promise<boolean> {
        try {
            const response = await apiService.makeRequest(
                `/user-roles/${userId}/${role}`,
                'DELETE'
            );
            
            return response.success || false;
        } catch (error) {
            console.error('Erreur retrait rôle:', error);
            return false;
        }
    }
}

export const roleService = new RoleService();
