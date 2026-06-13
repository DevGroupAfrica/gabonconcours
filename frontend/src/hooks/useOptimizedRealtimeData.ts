import {useQuery, useQueryClient} from '@tanstack/react-query';
import {apiService} from '@/services/api';
import {useEffect, useMemo, useCallback} from 'react';

export const useOptimizedRealtimeData = () => {
    const queryClient = useQueryClient();

    // Fonction mémorisée pour invalider les queries
    const invalidateQueries = useCallback(() => {
        queryClient.invalidateQueries({queryKey: ['admin-concours']});
        queryClient.invalidateQueries({queryKey: ['admin-candidats']});
        queryClient.invalidateQueries({queryKey: ['admin-statistics']});
        queryClient.invalidateQueries({queryKey: ['admin-paiements']});
        queryClient.invalidateQueries({queryKey: ['dossiers']});
    }, [queryClient]);

    // Refresh data every 60 seconds (moins fréquent pour réduire les re-rendus)
    useEffect(() => {
        const interval = setInterval(invalidateQueries, 60000);
        return () => clearInterval(interval);
    }, [invalidateQueries]);

    const {data: concoursData, isLoading: concoursLoading} = useQuery({
        queryKey: ['admin-concours'],
        queryFn: () => apiService.getConcours(),
        staleTime: 30000, // Considérer les données comme fraîches pendant 30s
        refetchInterval: 60000,
    });

    const {data: candidatsData, isLoading: candidatsLoading} = useQuery({
        queryKey: ['admin-candidats'],
        queryFn: () => apiService.getCandidats(),
        staleTime: 30000,
        refetchInterval: 60000,
    });

    const {data: statisticsData, isLoading: statsLoading} = useQuery({
        queryKey: ['admin-statistics'],
        queryFn: () => apiService.getStatistics(),
        staleTime: 30000,
        refetchInterval: 60000,
    });

    const {data: paiementsData, isLoading: paiementsLoading} = useQuery({
        queryKey: ['admin-paiements'],
        queryFn: () => apiService.getPaiements(),
        staleTime: 30000,
        refetchInterval: 60000,
    });

    const {data: dossiersData, isLoading: dossiersLoading} = useQuery({
        queryKey: ['dossiers'],
        queryFn: () => apiService.getDossiers(),
        staleTime: 30000,
        refetchInterval: 60000,
    });

    // Mémoiser les données pour éviter les re-calculs
    const optimizedData = useMemo(() => {
        const concours = concoursData?.data || [];
        const candidats = candidatsData?.data || [];
        const statistics = statisticsData?.data || {
            candidats: 0,
            concours: 0,
            etablissements: 0,
            participations: 0,
            paiements: 0
        };
        const paiements = paiementsData?.data || [];
        const dossiers = dossiersData?.data || [];

        // Métriques calculées et mémorisées
        const candidatsNouveaux = (candidats as any[]).filter((c: any) => {
            const dateCreation = new Date(c.created_at);
            const maintenant = new Date();
            const diffJours = (maintenant.getTime() - dateCreation.getTime()) / (1000 * 3600 * 24);
            return diffJours <= 7;
        }).length;

        const concoursActifs = (concours as any[]).filter((c: any) => c.stacnc === '1').length;
        const paiementsEnAttente = (paiements as any[]).filter((p: any) => p.statut === 'en_attente').length;
        const dossiersEnAttente = (dossiers as any[]).filter((d: any) => d.document_statut === 'en_attente').length;
        const tauxCompletion = (candidats as any[]).length > 0 ? Math.round(((paiements as any[]).length / (candidats as any[]).length) * 100) : 0;

        return {
            concours,
            candidats,
            statistics,
            paiements,
            dossiers,
            metriques: {
                candidatsNouveaux,
                concoursActifs,
                paiementsEnAttente,
                dossiersEnAttente,
                tauxCompletion
            }
        };
    }, [concoursData, candidatsData, statisticsData, paiementsData, dossiersData]);

    const isLoading = concoursLoading || candidatsLoading || statsLoading || paiementsLoading || dossiersLoading;

    return {
        ...optimizedData,
        isLoading,
        refresh: invalidateQueries
    };
};
