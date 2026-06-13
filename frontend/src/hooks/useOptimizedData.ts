import {useQuery, useQueryClient} from '@tanstack/react-query';
import {apiService} from '@/services/api';

export const useOptimizedCandidatData = (nupcan: string) => {
    const queryClient = useQueryClient();

    return useQuery({
        queryKey: ['candidat-optimized', nupcan],
        queryFn: () => apiService.getCandidatByNupcan(nupcan),
        enabled: !!nupcan,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (remplace cacheTime)
        refetchOnWindowFocus: false,
        retry: 2,
        select: (data) => {
            // Optimiser les données reçues
            const candidat = (data as any)?.data;
            if (!candidat) return null;

            return {
                ...(candidat as any),
                // Prétraiter les données pour éviter les calculs répétés
                fullName: `${(candidat as any).prncan} ${(candidat as any).nomcan}`,
                formattedBirthDate: new Date((candidat as any).dtncan).toLocaleDateString('fr-FR'),
                documentsCount: (candidat as any).documents?.length || 0,
                hasValidDocuments: (candidat as any).documents?.some((doc: any) =>
                    doc.statut === 'valide' || doc.document_statut === 'valide'
                ) || false,
                hasValidPayment: (candidat as any).paiement?.statut === 'valide',
                completionPercentage: calculateCompletionPercentage(candidat),
            };
        },
    });
};

const calculateCompletionPercentage = (candidat: any) => {
    let percentage = 33; // Base pour inscription

    if (candidat.documents?.length > 0) {
        percentage = 67;
    }

    if (candidat.paiement?.statut === 'valide') {
        percentage = 100;
    }

    return percentage;
};

export const usePrefetchedData = () => {
    const queryClient = useQueryClient();

    const prefetchConcours = () => {
        queryClient.prefetchQuery({
            queryKey: ['concours'],
            queryFn: () => apiService.getConcours(),
            staleTime: 10 * 60 * 1000,
        });
    };

    const prefetchEtablissements = () => {
        queryClient.prefetchQuery({
            queryKey: ['etablissements'],
            queryFn: () => apiService.getEtablissements(),
            staleTime: 10 * 60 * 1000,
        });
    };

    return {prefetchConcours, prefetchEtablissements};
};
