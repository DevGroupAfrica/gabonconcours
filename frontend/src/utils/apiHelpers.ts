import {ApiResponse} from '@/services/api';

// Fonction helper pour extraire les données de manière sécurisée
export function extractApiData<T>(response: ApiResponse<T>): T | null {
    if (response.success) {
        return response.data || null;
    }
    return null;
}

// Fonction helper pour vérifier si la réponse est un succès
export function isApiSuccess<T>(response: ApiResponse<T>): response is { success: true; data: T; message?: string } {
    return response.success === true;
}

// Fonction helper pour obtenir le message d'erreur
export function getApiErrorMessage<T>(response: ApiResponse<T>): string {
    if (!response.success) {
        return response.message || 'Erreur inconnue';
    }
    return '';
}

// Fonction helper pour obtenir les données avec fallback
export function getApiDataWithFallback<T>(response: ApiResponse<T>, fallback: T): T {
    return extractApiData(response) ?? fallback;
}

// Type guard pour les réponses de succès
export function isSuccessResponse<T>(response: ApiResponse<T>): response is {
    success: true;
    data: T;
    message?: string
} {
    return 'success' in response && response.success === true;
}
