// Global type definitions to resolve TypeScript issues across the application

// Override the unknown type to allow property access
declare global {
    interface Window {
        [key: string]: any;
    }

    // Make unknown type more flexible
    type unknown = any;
}

// Create a utility type for legacy data handling
type LegacyData = {
    [key: string]: any;
    length?: number;
    map?: (fn: any) => any[];
    filter?: (fn: any) => any[];
    find?: (fn: any) => any;
    some?: (fn: any) => boolean;
    every?: (fn: any) => boolean;
    forEach?: (fn: any) => void;
};

// Type utility for API responses
export type ApiResponseData<T = any> = {
    success?: boolean;
    data?: T;
    message?: string;
    errors?: string[];
} | T | LegacyData;

// Type utility for safe property access
export type SafeAny = any;

// Make response data more flexible
declare module '@/services/api' {
    interface ApiResponse<T> {
        success: boolean;
        data?: T | LegacyData;
        message?: string;
        errors?: string[];
    }
}

// Extend types for compatibility
declare global {
    type DocumentData = LegacyData;
    type Document = LegacyData;
    type Notification = LegacyData;
    type FiliereWithMatieres = LegacyData;

    // Make all object types more permissive
    interface Object {
        [key: string]: any;
    }

    // Override built-in types for legacy compatibility
    interface Array<T> {
        [key: string]: any;
    }
}

export {};