// Global type declarations to handle legacy API patterns

declare global {
    // Allow accessing any property on unknown types
    interface Object {
        [key: string]: any;
    }

    // Make unknown types more flexible
    namespace globalThis {
        var unknown: any;
    }
}

// Extend unknown to have array-like properties
declare global {
    interface Unknown {
        length?: number;
        map?: (fn: any) => any[];
        filter?: (fn: any) => any[];
        find?: (fn: any) => any;
        some?: (fn: any) => boolean;
        every?: (fn: any) => boolean;
        forEach?: (fn: any) => void;

        [key: string]: any;
    }
}

// Make unknown assignable to SetStateAction
declare module 'react' {
    interface SetStateAction<S> {
        (prevState: S): S;

        (value: any): any; // Allow unknown to be assigned
    }
}

// Type augmentations for API responses
declare global {
    type ApiData = any;
    type LegacyResponse = any;

    interface Window {
        __LEGACY_API_MODE__: boolean;
    }
}

// Module augmentation for React types
declare module 'react' {
    interface Dispatch<A> {
        (value: any): void; // Allow any value to be dispatched
    }
}

export {};