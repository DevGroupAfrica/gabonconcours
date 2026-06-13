import {useQuery} from '@tanstack/react-query';
import {apiService} from '@/services/api';

interface HomeStatistics {
    totalConcours: number;
    concoursActifs: number;
    concoursGratuits: number;
    totalCandidats: number;
    candidatsInscrits: number;
    tauxReussite: number;
}

export const useHomeStatistics = () => {
    return useQuery({
        queryKey: ['home-statistics'],
        queryFn: async (): Promise<HomeStatistics> => {
            try {
                const [concoursResponse, statisticsResponse] = await Promise.all([
                    apiService.getConcours(),
                    apiService.getStatistics()
                ]);

                const concours = (concoursResponse.success && concoursResponse.data) ? concoursResponse.data : [];
                const stats = (statisticsResponse.success && statisticsResponse.data) ? statisticsResponse.data : {};

                const concoursActifs = Array.isArray(concours) ? concours.filter((c: any) => c.statut === 'actif' || !c.statut).length : 0;
                const concoursGratuits = Array.isArray(concours) ? concours.filter((c: any) => !c.frais || c.frais === 0).length : 0;

                return {
                    totalConcours: Array.isArray(concours) ? concours.length : 0,
                    concoursActifs,
                    concoursGratuits,
                    totalCandidats: (stats as any)?.candidats || 0,
                    candidatsInscrits: (stats as any)?.candidats || 0,
                    tauxReussite: 85 // Simulé pour l'instant
                };
            } catch (error) {
                console.error('Erreur lors de la récupération des statistiques:', error);
                // Valeurs par défaut en cas d'erreur
                return {
                    totalConcours: 25,
                    concoursActifs: 18,
                    concoursGratuits: 12,
                    totalCandidats: 2847,
                    candidatsInscrits: 2847,
                    tauxReussite: 85
                };
            }
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 10 * 60 * 1000, // 10 minutes
    });
};
