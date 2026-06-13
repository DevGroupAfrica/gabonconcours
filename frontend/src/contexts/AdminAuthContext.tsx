import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { api, apiService } from '@/services/api';

interface Admin {

    id: number;
    nom: string;
    prenom: string;
    email: string;
    admin_role : 'notes' | 'documents';
    role: 'super_admin' | 'admin_etablissement'| 'sub_admin';
    etablissement_id?: number;
    etablissement_nom?: string;
}

interface AdminAuthContextType {
    admin: Admin | null;
    setAdmin: React.Dispatch<React.SetStateAction<Admin | null>>;
    token: string | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    isSuperAdmin: boolean;
}

const BASE_URL = 'http://localhost:8002/api/admin';
const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('adminToken'));
    const [isLoading, setIsLoading] = useState(true);
    const apiServiceRef = useRef<typeof apiService>(apiService);

    useEffect(() => {
        const savedToken = localStorage.getItem('adminToken');
        const savedAdmin = localStorage.getItem('adminData');

        if (savedToken && savedAdmin) {
            try {
                const parsedAdmin = JSON.parse(savedAdmin);
                setAdmin(parsedAdmin);
                setToken(savedToken);
                apiServiceRef.current.setToken(savedToken);
            } catch {
                localStorage.removeItem('adminToken');
                localStorage.removeItem('adminData');
                apiServiceRef.current.clearToken();
            }
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (token) apiServiceRef.current.setToken(token);
        else apiServiceRef.current.clearToken();
    }, [token]);

    const login = async (email: string, password: string): Promise<boolean> => {
        const response = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (data.success && data.data) {
            setAdmin(data.data.admin);
            setToken(data.data.token);
            localStorage.setItem('adminToken', data.data.token);
            localStorage.setItem('adminData', JSON.stringify(data.data.admin));
            return true;
        }
        throw new Error(data.message || 'Échec de connexion');
    };

    const logout = () => {
        setAdmin(null);
        setToken(null);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminData');
        apiServiceRef.current.clearToken();
    };

    const isAuthenticated = !!admin && !!token;
    const isSuperAdmin = admin?.role === 'super_admin';

    return (
        <AdminAuthContext.Provider
            value={{
                admin,
                setAdmin,
                token,
                isLoading,
                login,
                logout,
                isAuthenticated,
                isSuperAdmin,
            }}
        >
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);
    if (context === undefined) {
        throw new Error('useAdminAuth must be used within an AdminAuthProvider');
    }
    return context;
};
