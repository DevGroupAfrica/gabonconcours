// Type utility functions to handle API response data safely

export function safeApiData<T = any>(response: any): T[] {
    if (!response) return [] as T[];

    // Handle direct array data
    if (Array.isArray(response)) return response as T[];

    // Handle API response format
    if (response.success && response.data) {
        return Array.isArray(response.data) ? response.data as T[] : [] as T[];
    }

    // Handle direct data property
    if (response.data) {
        return Array.isArray(response.data) ? response.data as T[] : [] as T[];
    }

    return [] as T[];
}

export function safeObjectData<T = any>(response: any): T | null {
    if (!response) return null;

    // Handle API response format
    if (response.success && response.data) {
        return response.data as T;
    }

    // Handle direct data property
    if (response.data) {
        return response.data as T;
    }

    // Handle direct object
    return response as T;
}

export function safeArray<T = any>(data: any): T[] {
    return Array.isArray(data) ? data as T[] : [] as T[];
}

export function safeObject<T = any>(data: any): T {
    return (data || {}) as T;
}