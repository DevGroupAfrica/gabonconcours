import React from 'react';
import {useNavigate, useLocation} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {
    ArrowLeft,
    Home,
    Users,
    FileText,
    Settings,
    BarChart3
} from 'lucide-react';

interface AdminNavigationProps {
    showBackButton?: boolean;
    backUrl?: string;
    backLabel?: string;
}

const AdminNavigation: React.FC<AdminNavigationProps> = ({
                                                             showBackButton = false,
                                                             backUrl = '/admin',
                                                             backLabel = 'Retour'
                                                         }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const navigationItems = [
        {path: '/admin', label: 'Tableau de bord', icon: Home},
        {path: '/admin/candidats', label: 'Candidats', icon: Users},
        {path: '/admin/documents', label: 'Documents', icon: FileText},
        {path: '/admin/statistiques', label: 'Statistiques', icon: BarChart3},
        {path: '/admin/parametres', label: 'Paramètres', icon: Settings},
    ];

    const isActive = (path: string) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    return (
        <div className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">

                    {/* Bouton retour */}
                    {showBackButton && (
                        <Button
                            variant="ghost"
                            onClick={() => navigate(backUrl)}
                            className="mr-4"
                        >
                            <ArrowLeft className="h-4 w-4 mr-2"/>
                            {backLabel}
                        </Button>
                    )}

                    {/* Navigation principale */}
                    <nav className="flex space-x-1">
                        {navigationItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <Button
                                    key={item.path}
                                    variant={isActive(item.path) ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => navigate(item.path)}
                                    className="flex items-center space-x-2"
                                >
                                    <Icon className="h-4 w-4"/>
                                    <span className="hidden sm:inline">{item.label}</span>
                                </Button>
                            );
                        })}
                    </nav>

                    {/* Actions rapides */}
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.location.reload()}
                        >
                            Actualiser
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminNavigation;
