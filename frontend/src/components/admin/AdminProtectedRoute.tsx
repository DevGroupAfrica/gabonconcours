import React from 'react';
import {Navigate} from 'react-router-dom';
import {useAdminAuth} from '@/contexts/AdminAuthContext';

interface AdminProtectedRouteProps {
    children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({children}) => {
    const {isAuthenticated, isLoading} = useAdminAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Vérification de l'authentification...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/admin/login" replace/>;
    }

    return <>{children}</>;
};

export default AdminProtectedRoute;
