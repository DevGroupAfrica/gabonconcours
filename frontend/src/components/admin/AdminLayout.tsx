import React, {memo} from 'react';
import {Outlet, Link, useLocation} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {
    Home,
    Trophy,
    Users,
    Building,
    FileText,
    Settings,
    BarChart3,
    LogOut,
    UserCog,
    GraduationCap,
    BookOpen
} from 'lucide-react';
import {useAdminAuth} from '@/contexts/AdminAuthContext';

interface AdminLayoutProps {
    children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = memo(({children}) => {
    const location = useLocation();
    const {admin, logout} = useAdminAuth();

    // Menu items selon le rôle
    const getMenuItems = () => {
        const baseItems = [
            { path: '/admin/dashboard', label: 'Dashboard', icon: Home }
        ];

        // Super Admin voit tout
        if (admin?.role === 'super_admin') {
            return [
                ...baseItems,
                { path: '/admin/candList', label: 'Candidats', icon: Users },
                { path: '/admin/concours-filieres', label: 'Concours x Filières', icon: Trophy },
                { path: '/admin/filiere-matieres', label: 'Filières x Matières', icon: BookOpen },
                { path: '/admin/logs', label: 'Journal d\'activité', icon: FileText },
                { path: '/admin/support', label: 'Support client', icon: UserCog },
                { path: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 },
                { path: '/admin/profile', label: 'Profil', icon: Settings }
            ];
        }

        // Admin établissement voit tout sauf super-admin features
        if (admin?.role === 'admin_etablissement') {
            return [
                ...baseItems,
                { path: '/admin/concours', label: 'Concours', icon: Trophy },
                { path: '/admin/messagerie', label: 'Messages', icon: Settings },
                { path: '/admin/statistiques', label: 'Statistiques', icon: BarChart3 },
                { path: '/admin/sous-admins', label: 'Sous-Admins', icon: UserCog },
                { path: '/admin/profile', label: 'Profil', icon: Settings }
            ];
        }

        // Sub-admin Notes
        if (admin?.role === 'sub_admin' && admin?.admin_role === 'notes') {
            return [
                ...baseItems,
                { path: '/admin/concours', label: 'Concours', icon: GraduationCap },
                { path: '/admin/profile', label: 'Profil', icon: Settings }
            ];
        }

        // Sub-admin Documents
        if (admin?.role === 'sub_admin' && admin?.admin_role === 'documents') {
            return [
                ...baseItems,
                { path: '/admin/concours', label: 'Concours', icon: GraduationCap },
                { path: '/admin/profile', label: 'Profil', icon: Settings }
            ];
        }

        return baseItems;
    };

    const menuItems = getMenuItems();

    const isActive = (path: string) => {
        if (path === '/admin/dashboard') {
            return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
        }
        return location.pathname.startsWith(path);
    };

    console.log('Rendering AdminLayout for path:', location.pathname);

    return (
        <div className="flex min-h-screen bg-[#f5f8fc]">
            {/* Sidebar */}
            <div className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-[#102554] text-white">
                <div className="border-b border-white/10 p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center bg-[#2A6DF3]">
                            <GraduationCap className="h-5 w-5"/>
                        </div>
                        <div>
                            <h2 className="font-bold tracking-tight">GABConcours</h2>
                            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Administration</p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 space-y-1 px-3 py-5">
                    {menuItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`flex items-center space-x-3 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                                isActive(item.path)
                                    ? 'border-white/10 bg-white text-[#1746A2] shadow-sm'
                                    : 'border-transparent text-slate-300 hover:bg-white/5 hover:text-white'
                            }`}
                        >
                            <item.icon className="h-5 w-5"/>
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="border-t border-white/10 p-4">
                    <div className="flex items-center space-x-3 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center bg-[#2A6DF3]">
              <span className="text-sm font-medium text-white">
                {admin?.prenom?.charAt(0) || 'A'}
              </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                                {admin?.prenom} {admin?.nom}
                            </p>
                            <p className="truncate text-xs text-slate-500">
                                {admin?.email}
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" className="w-full justify-start text-slate-400 hover:bg-white/5 hover:text-white" onClick={logout}>
                        <LogOut className="h-4 w-4 mr-2"/>
                        Déconnexion
                    </Button>
                    <Button variant="ghost" className="mt-1 w-full justify-start text-slate-400 hover:bg-white/5 hover:text-white" asChild>
                        <Link to="/">
                            <Home className="h-4 w-4 mr-2"/>
                            Retour au site
                        </Link>
                    </Button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col">
                <header className="sticky top-0 z-20 border-b border-[#dbe7f6] bg-white/95 px-8 py-4 backdrop-blur">
                    <div className="mx-auto flex max-w-[1500px] items-center justify-between">
                        <div>
                            <h1 className="text-base font-semibold text-slate-950">Administration</h1>
                            <p className="text-sm text-slate-500">
                                Gestion de la plateforme GabConcours
                            </p>
                        </div>
                        <div className="flex items-center space-x-4">
	              <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-[#1746A2]">
                Session : <strong>{admin?.role}</strong>
              </span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-5 lg:p-8">
                    <div className="mx-auto max-w-[1500px]">{children || <Outlet/>}</div>
                </main>
            </div>
        </div>
    );
});

export default AdminLayout;
