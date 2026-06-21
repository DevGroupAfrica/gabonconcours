import React, {memo} from 'react';
import {Outlet, Link, useLocation} from 'react-router-dom';
import {
    BarChart3,
    BookOpen,
    ChevronDown,
    CircleDollarSign,
    FileText,
    GraduationCap,
    Home,
    LogOut,
    MessageSquare,
    Settings,
    Trophy,
    UserCog,
    Users,
} from 'lucide-react';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AdminLayoutProps {
    children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = memo(({children}) => {
    const location = useLocation();
    const {admin, logout} = useAdminAuth();

    const getMenuGroups = () => {
        if (admin?.role === 'super_admin') {
            return [
                {
                    label: 'Gestion',
                    icon: Users,
                    items: [
                        {path: '/admin/candList', label: 'Candidats', icon: Users},
                        {path: '/admin/concour', label: 'Concours', icon: Trophy},
                        {path: '/admin/gestion-etablissements', label: 'Établissements', icon: GraduationCap},
                        {path: '/admin/gestion-admins', label: 'Administrateurs', icon: UserCog},
                    ],
                },
                {
                    label: 'Configuration',
                    icon: Settings,
                    items: [
                        {path: '/admin/concours-filieres', label: 'Concours x Filières', icon: Trophy},
                        {path: '/admin/filiere-matieres', label: 'Filières x Matières', icon: BookOpen},
                        {path: '/admin/matieres', label: 'Matières', icon: BookOpen},
                    ],
                },
                {
                    label: 'Suivi',
                    icon: BarChart3,
                    items: [
                        {path: '/admin/statistiques', label: 'Statistiques', icon: BarChart3},
                        {path: '/admin/logs', label: 'Journal d’activité', icon: FileText},
                        {path: '/admin/support', label: 'Support', icon: MessageSquare},
                    ],
                },
            ];
        }

        if (admin?.role === 'admin_etablissement') {
            return [
                {
                    label: 'Gestion',
                    icon: Trophy,
                    items: [
                        {path: '/admin/concours', label: 'Concours', icon: Trophy},
                        {path: '/admin/candidats', label: 'Candidats', icon: Users},
                        {path: '/admin/dossiers', label: 'Documents', icon: FileText},
                        {path: '/admin/paiements', label: 'Paiements', icon: CircleDollarSign},
                    ],
                },
                {
                    label: 'Équipe & échanges',
                    icon: UserCog,
                    items: [
                        {path: '/admin/messagerie', label: 'Messages', icon: MessageSquare},
                        {path: '/admin/sous-admins', label: 'Sous-admins', icon: UserCog},
                    ],
                },
                {
                    label: 'Suivi',
                    icon: BarChart3,
                    items: [
                        {path: '/admin/statistiques', label: 'Statistiques', icon: BarChart3},
                    ],
                },
            ];
        }

        const subAdminItems = admin?.admin_role === 'documents'
            ? [{path: '/admin/dossiers', label: 'Documents', icon: FileText}]
            : [{path: '/admin/notes', label: 'Notes', icon: BookOpen}];

        return [{
            label: 'Gestion',
            icon: GraduationCap,
            items: [
                {path: '/admin/concours', label: 'Concours', icon: GraduationCap},
                ...subAdminItems,
            ],
        }];
    };

    const menuGroups = getMenuGroups();
    const isActive = (path: string) => path === '/admin/dashboard'
        ? location.pathname === '/admin' || location.pathname === '/admin/dashboard'
        : location.pathname.startsWith(path);
    const isGroupActive = (items: Array<{path: string}>) => items.some(item => isActive(item.path));

    return (
        <div className="min-h-screen bg-[#f7f9fc]">
            <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
                <div className="flex h-[70px] w-full items-center justify-between gap-6 px-4 lg:px-6">
                    <Link to="/admin/dashboard" className="flex shrink-0 items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-[#2A6DF3] text-white">
                            <GraduationCap className="h-5 w-5"/>
                        </span>
                        <div>
                            <p className="font-bold tracking-tight text-slate-950">GABConcours</p>
                            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-slate-400">Administration</p>
                        </div>
                    </Link>

                    <div className="hidden min-w-0 flex-1 border-l border-slate-200 pl-6 md:block">
                        <p className="text-sm font-semibold text-slate-900">Administration</p>
                        <p className="text-xs text-slate-500">Gestion de la plateforme GABConcours</p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                        <Link to="/admin/profile" className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-slate-50">
                            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-sm font-bold text-[#2A6DF3]">
                                {admin?.prenom?.charAt(0) || 'A'}
                            </span>
                            <span className="hidden text-left sm:block">
                                <span className="block text-xs font-semibold text-slate-900">{admin?.prenom} {admin?.nom}</span>
                                <span className="block text-[10px] text-slate-400">{admin?.role}</span>
                            </span>
                        </Link>
                        <button onClick={logout} className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 hover:bg-slate-50 hover:text-red-600" title="Déconnexion">
                            <LogOut className="h-4 w-4"/>
                        </button>
                    </div>
                </div>

                <nav className="border-t border-slate-100">
                    <div className="flex w-full gap-1 overflow-x-auto px-4 py-2 lg:px-6">
                        <Link
                            to="/admin/dashboard"
                            className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                                isActive('/admin/dashboard')
                                    ? 'bg-blue-50 text-[#1746a2]'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                            }`}
                        >
                            <Home className="h-4 w-4"/>
                            Dashboard
                        </Link>

                        {menuGroups.map(group => (
                            <DropdownMenu key={group.label}>
                                <DropdownMenuTrigger
                                    className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium outline-none transition-colors ${
                                        isGroupActive(group.items)
                                            ? 'bg-blue-50 text-[#1746a2]'
                                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                                    }`}
                                >
                                    <group.icon className="h-4 w-4"/>
                                    {group.label}
                                    <ChevronDown className="h-3.5 w-3.5"/>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-60 border-slate-200 p-2">
                                    <DropdownMenuLabel className="px-2 text-xs uppercase tracking-wide text-slate-400">
                                        {group.label}
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator/>
                                    {group.items.map(item => (
                                        <DropdownMenuItem key={item.path} asChild>
                                            <Link
                                                to={item.path}
                                                className={`flex cursor-pointer gap-3 px-2 py-2.5 ${
                                                    isActive(item.path) ? 'bg-blue-50 text-[#1746a2]' : ''
                                                }`}
                                            >
                                                <item.icon className="h-4 w-4"/>
                                                {item.label}
                                            </Link>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ))}

                        <Link
                            to="/admin/profile"
                            className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                                isActive('/admin/profile')
                                    ? 'bg-blue-50 text-[#1746a2]'
                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                            }`}
                        >
                            <Settings className="h-4 w-4"/>
                            Profil
                        </Link>
                        <Link to="/" className="ml-auto flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-950">
                            Retour au site
                        </Link>
                    </div>
                </nav>
            </header>

            <main className="w-full p-4 lg:p-6">
                {children || <Outlet/>}
            </main>
        </div>
    );
});

export default AdminLayout;
