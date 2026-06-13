// @ts-nocheck - Temporarily disable TypeScript checking for legacy code compatibility
import {createRoot} from 'react-dom/client'
import App from './App.tsx'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import './index.css'

declare global {
    type unknown = any;

    interface Object {
        [key: string]: any;
    }
}


(window as any).__LEGACY_API_MODE__ = true;

createRoot(document.getElementById("root")!).render(<App/>);
