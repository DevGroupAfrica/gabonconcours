import {useState, useCallback} from 'react';
import {candidatureService, CandidatureCompleteData} from '@/services/candidatureService';
import {toast} from '@/hooks/use-toast';

export const useCandidature = () => {
    const [candidatureData, setCandidatureData] = useState<CandidatureCompleteData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createCandidature = useCallback(async (formData: FormData) => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Hook: Création candidature');
            const candidature = await candidatureService.createCandidature(formData);
            setCandidatureData(candidature);
            localStorage.setItem('candidat_nipcan', candidature.candidat.nipcan);

            toast({
                title: "Candidature créée avec succès !",
                description: `Votre NIP personnel : ${candidature.candidat.nipcan}`,
            });

            return candidature;
        } catch (error: any) {
            console.error('Hook: Erreur création candidature:', error);
            setError(error.message);
            toast({
                title: "Erreur",
                description: error.message || "Erreur lors de la création de la candidature",
                variant: "destructive",
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const loadCandidature = useCallback(async (nupcan: string) => {
        setIsLoading(true);
        setError(null);
        try {
            console.log('Hook: Chargement candidature pour NUPCAN:', nupcan);
            const candidature = await candidatureService.getCandidatureByNupcan(nupcan);
            setCandidatureData(candidature);
            return candidature;
        } catch (error: any) {
            console.error('Hook: Erreur chargement candidature:', error);
            setError(error.message);
            toast({
                title: "Erreur",
                description: error.message || "Erreur lors du chargement de la candidature",
                variant: "destructive",
            });
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const updateProgression = useCallback(async (nupcan: string, etape: 'documents' | 'paiement') => {
        try {
            await candidatureService.updateProgression(nupcan, etape);
            // Recharger les données pour mise à jour
            if (candidatureData && candidatureData.nupcan === nupcan) {
                await loadCandidature(nupcan);
            }
        } catch (error: any) {
            console.error('Hook: Erreur mise à jour progression:', error);
        }
    }, [candidatureData, loadCandidature]);

    const checkCandidatureComplete = useCallback(async (nupcan: string) => {
        try {
            return await candidatureService.isCandidatureComplete(nupcan);
        } catch (error: any) {
            console.error('Hook: Erreur vérification candidature complète:', error);
            return false;
        }
    }, []);

    return {
        candidatureData,
        isLoading,
        error,
        createCandidature,
        loadCandidature,
        updateProgression,
        checkCandidatureComplete,
        setCandidatureData,
    };
};
