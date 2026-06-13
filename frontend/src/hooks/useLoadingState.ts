import {useState, useCallback} from 'react';

interface LoadingState {
    [key: string]: boolean;
}

export const useLoadingState = () => {
    const [loadingStates, setLoadingStates] = useState<LoadingState>({});

    const setLoading = useCallback((key: string, loading: boolean) => {
        setLoadingStates(prev => ({
            ...prev,
            [key]: loading
        }));
    }, []);

    const isLoading = useCallback((key: string) => {
        return loadingStates[key] || false;
    }, [loadingStates]);

    const withLoading = useCallback(async <T>(key: string, asyncFn: () => Promise<T>): Promise<T> => {
        try {
            setLoading(key, true);
            return await asyncFn();
        } finally {
            setLoading(key, false);
        }
    }, [setLoading]);

    return {
        setLoading,
        isLoading,
        withLoading,
        loadingStates
    };
};
