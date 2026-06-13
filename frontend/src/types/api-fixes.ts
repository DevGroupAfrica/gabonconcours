
export type SafeApiResponse<T = any> = {
    success?: boolean;
    data?: T;
    message?: string;
    errors?: string[];
} | T;

// Helper function to safely access API response data
export function safeApiData<T>(response: any): T | null {
    if (!response) return null;

    // If it's a proper API response with data property
    if (response.success !== undefined && response.data !== undefined) {
        return response.data;
    }

    // If it's direct data
    return response as T;
}

// Helper function to check if array-like data exists
export function safeArrayData<T>(response: any): T[] {
    const data = safeApiData<T[]>(response);
    return Array.isArray(data) ? data : [];
}

// Helper function to check if object data exists
export function safeObjectData<T>(response: any): T | {} {
    const data = safeApiData<T>(response);
    return data || ({} as T);
}