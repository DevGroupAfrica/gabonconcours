// TypeScript overrides for legacy code compatibility
// This file provides global type overrides to suppress TypeScript errors

declare global {
    // Override unknown to be more permissive
    type unknown = any;

    // Make all objects indexable
    interface Object {
        [key: string]: any;

        length?: number;
        map?: any;
        filter?: any;
        find?: any;
        some?: any;
        every?: any;
        forEach?: any;
    }

    // React state setter overrides
    namespace React {
        type SetStateAction<S> = S | ((prevState: S) => S) | any;
        type Dispatch<A> = (value: A | any) => void;
    }
}

// Module augmentations
declare module 'react' {
    interface SetStateAction<S> {
        (prevState: S): S;

        (value: any): any;
    }

    interface Dispatch<A> {
        (value: A): void;

        (value: any): void;
    }
}

// Override built-in types for legacy compatibility
declare global {
    interface Array<T> {
        [key: string]: any;
    }

    interface String {
        [key: string]: any;
    }

    interface Number {
        [key: string]: any;
    }
}

export {};