import {useState, useCallback} from 'react';
import {toast} from '@/hooks/use-toast';

interface AdminStateOptions {
    onSuccess?: (message: string) => void;
    onError?: (error: string) => void;
}

export const useAdminState = (options: AdminStateOptions = {}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const executeAction = useCallback(async (
        action: () => Promise<any>,
        successMessage: string = 'Action réussie'
    ) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await action();

            toast({
                title: "Succès",
                description: successMessage,
            });

            if (options.onSuccess) {
                options.onSuccess(successMessage);
            }

            return result;
        } catch (err: any) {
            const errorMessage = err.message || 'Une erreur est survenue';
            setError(errorMessage);

            toast({
                title: "Erreur",
                description: errorMessage,
                variant: "destructive",
            });

            if (options.onError) {
                options.onError(errorMessage);
            }

            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [options]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isLoading,
        error,
        executeAction,
        clearError
    };
};
