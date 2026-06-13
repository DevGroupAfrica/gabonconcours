import {useState, useEffect} from 'react';
import {apiService, type ApiResponse} from '@/services/api';

interface RealtimeData {
    paiements: any[];
    candidats: any[];
    statistics: any;
    isLoading: boolean;
    error: string | null;
}

export const useRealtimeData = (): RealtimeData => {
    const [data, setData] = useState<RealtimeData>({
        paiements: [],
        candidats: [],
        statistics: null,
        isLoading: true,
        error: null
    });

    const fetchData = async () => {
        try {
            setData(prev => ({...prev, isLoading: true, error: null}));

            const [paiementsResponse, candidatsResponse, statisticsResponse] = await Promise.allSettled([
                apiService.getPaiements(),
                apiService.getCandidats(),
                apiService.getStatistics()
            ]);

            const paiements = paiementsResponse.status === 'fulfilled' && paiementsResponse.value.success
                ? (paiementsResponse.value.data as any[]) || []
                : [];

            const candidats = candidatsResponse.status === 'fulfilled' && candidatsResponse.value.success
                ? (candidatsResponse.value.data as any[]) || []
                : [];

            const statistics = statisticsResponse.status === 'fulfilled' && statisticsResponse.value.success
                ? statisticsResponse.value.data
                : null;

            setData({
                paiements,
                candidats,
                statistics,
                isLoading: false,
                error: null
            });
        } catch (error) {
            console.error('Erreur lors du chargement des données temps réel:', error);
            setData(prev => ({
                ...prev,
                isLoading: false,
                error: 'Erreur lors du chargement des données'
            }));
        }
    };

    useEffect(() => {
        fetchData().then(r => {
        });

        // Rafraîchir les données toutes les 30 secondes
        const interval = setInterval(fetchData, 30000);

        return () => clearInterval(interval);
    }, []);

    return data;
};
