// @ts-nocheck

import React, {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {
    Users,
    Building,
    Trophy,
    FileText,
    DollarSign,
    TrendingUp,
    Plus,
    Settings,
    Mail,
    Activity,
    FileCheck,
    FileX,
    RefreshCw
} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {adminApiService} from '@/services/adminApi';
import {apiService} from '@/services/api';
import NotificationAlerts from '@/components/admin/NotificationAlerts';

const SuperAdminDashboard = () => {
    const navigate = useNavigate();

    // Récupérer les statistiques globales
    const {data: statsData} = useQuery({
        queryKey: ['super-admin-stats'],
        queryFn: () => apiService.getStatistics(),
    });

    const {data: adminsData} = useQuery({
        queryKey: ['all-admins'],
        queryFn: () => adminApiService.getAdmins(),
    });

    const {data: etablissementsData} = useQuery({
        queryKey: ['etablissements'],
        queryFn: () => apiService.getEtablissements(),
    });

    const {
        data: activityData,
        isLoading: activityLoading,
        isError: activityError,
        refetch: refetchActivity,
    } = useQuery({
        queryKey: ['super-admin-recent-activity'],
        queryFn: () => apiService.makeRequest<any[]>('/admin-logs', 'GET'),
        refetchInterval: 30000,
    });

    // Récupérer les messages de support
    const [page, setPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const limit = 5;

    const {data: supportData} = useQuery({
        queryKey: ['support-requests', page, searchTerm, filterStatus],
        queryFn: () => adminApiService.getSupportRequests({page, limit, searchTerm, filterStatus}),
        keepPreviousData: true,
    });

    const stats = statsData?.data || {};
    const admins = adminsData?.data || [];
    const etablissements = etablissementsData?.data || [];
    const supportRequests = supportData?.data?.requests || [];
    const totalPages = supportData?.data?.totalPages || 1;
    const recentActivity = activityData?.data?.slice(0, 5) || [];

    const activityLabels: Record<string, string> = {
        validation_document: 'Document validé',
        rejet_document: 'Document rejeté',
        envoi_message: 'Message envoyé',
        attribution_note: 'Note attribuée',
        creation_candidat: 'Candidat créé',
        modification_candidat: 'Candidat modifié',
        CREATE: 'Élément créé',
        UPDATE: 'Élément modifié',
        DELETE: 'Élément supprimé',
        LOGIN: 'Connexion administrateur',
        EXPORT: 'Données exportées',
        VALIDATE: 'Validation effectuée',
    };

    const getActivityIcon = (action: string) => {
        if (action === 'validation_document' || action === 'VALIDATE') return FileCheck;
        if (action === 'rejet_document' || action === 'DELETE') return FileX;
        if (action === 'envoi_message') return Mail;
        return Activity;
    };

    const quickActions = [
        {
            title: 'Créer un Établissement',
            description: 'Ajouter un nouvel établissement',
            icon: Building,
            action: () => navigate('/admin/gestion-etablissements'),
            color: 'bg-blue-50 text-[#2A6DF3]'
        },
        {
            title: 'Créer un Admin',
            description: 'Ajouter un administrateur',
            icon: Users,
            action: () => navigate('/admin/gestion-admins'),
            color: 'bg-blue-50 text-[#2A6DF3]'
        },
        {
            title: 'Gérer les Concours',
            description: 'Configuration globale',
            icon: Trophy,
            action: () => navigate('/admin/concour'),
            color: 'bg-blue-50 text-[#2A6DF3]'
        },
        {
            title: 'Gérer les Filières',
            description: 'Configuration des filières',
            icon: Settings,
            action: () => navigate('/admin/filieres'),
            color: 'bg-blue-50 text-[#2A6DF3]'
        },
          {
            title: 'Gérer les matières',
            description: 'Configuration des matières',
            icon: Settings,
            action: () => navigate('/admin/matieres'),
            color: 'bg-blue-50 text-[#2A6DF3]'
        }

    ];

    return (
        <div className="space-y-7">
            <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white px-7 py-8 sm:px-9">
                <div className="relative">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A6DF3]">Super administration</p>
                    <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl">Vue globale de GABConcours.</h1>
                    <p className="mt-3 text-sm text-slate-500">Établissements, administrateurs, concours et demandes de support.</p>
                </div>
            </div>

            {/* Notifications / Alertes */}
            <NotificationAlerts />

            {/* Left Section: Statistiques et Actions Rapides */}
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_330px]">
                {/* Statistiques principales */}
                <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                        <Card className="rounded-md border-slate-200 shadow-none">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                <Building className="h-6 w-6 text-[#2A6DF3]"/>
                                    <div>
                                        <p className="text-2xl font-bold">{etablissements.length}</p>
                                        <p className="text-sm text-muted-foreground">Établissements</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-md border-slate-200 shadow-none">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <Users className="h-6 w-6 text-[#2A6DF3]"/>
                                    <div>
                                        <p className="text-2xl font-bold">{admins.length}</p>
                                        <p className="text-sm text-muted-foreground">Administrateurs</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-md border-slate-200 shadow-none">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <Trophy className="h-6 w-6 text-[#2A6DF3]"/>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.totalConcours || 0}</p>
                                        <p className="text-sm text-muted-foreground">Concours Actifs</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-md border-slate-200 shadow-none">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <FileText className="h-6 w-6 text-[#2A6DF3]"/>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.totalCandidatures || 0}</p>
                                        <p className="text-sm text-muted-foreground">Candidatures</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions rapides */}
                    <Card className="rounded-md border-slate-200 shadow-none">
                        <CardHeader>
                            <CardTitle>Actions Rapides</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                {quickActions.map((action, index) => (
                                    <div
                                        key={index}
                                        className="cursor-pointer rounded-md border border-slate-200 p-4 transition-colors hover:border-[#2A6DF3]"
                                        onClick={action.action}
                                    >
                                        <div
                                            className={`mb-3 flex h-10 w-10 items-center justify-center rounded-md ${action.color}`}>
                                            <action.icon className="h-5 w-5"/>
                                        </div>
                                        <h3 className="font-semibold mb-1">{action.title}</h3>
                                        <p className="text-sm text-muted-foreground">{action.description}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistiques détaillées */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card className="rounded-md border-slate-200 shadow-none">
                            <CardHeader>
                                <CardTitle>Répartition par Établissement</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {etablissements.slice(0, 5).map((etablissement: any) => (
                                        <div key={etablissement.id} className="flex justify-between items-center">
                                            <span className="text-sm">{etablissement.nomets}</span>
                                            <span
                                                className="text-sm font-medium">{etablissement.candidatures_count ?? 0} candidatures</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-md border-slate-200 shadow-none">
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between gap-3">
                                    <span>Activité récente</span>
                                    <Button variant="ghost" size="sm" onClick={() => refetchActivity()} disabled={activityLoading}>
                                        <RefreshCw className={`h-4 w-4 ${activityLoading ? 'animate-spin' : ''}`}/>
                                    </Button>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {activityLoading ? (
                                    <div className="space-y-3">
                                        {[1, 2, 3].map(item => <div key={item} className="h-12 animate-pulse rounded-md bg-slate-100"/>)}
                                    </div>
                                ) : activityError ? (
                                    <div className="rounded-md border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                                        Impossible de charger l’activité récente.
                                    </div>
                                ) : recentActivity.length > 0 ? (
                                    <div className="space-y-1">
                                        {recentActivity.map((log: any) => {
                                            const ActivityIcon = getActivityIcon(log.action);
                                            return (
                                                <div key={log.id} className="flex items-start gap-3 rounded-md px-2 py-3 hover:bg-slate-50">
                                                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#2A6DF3]">
                                                        <ActivityIcon className="h-4 w-4"/>
                                                    </span>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-slate-900">
                                                            {activityLabels[log.action] || log.action}
                                                        </p>
                                                        <p className="truncate text-xs text-slate-500">
                                                            {log.admin_prenom || log.admin_nom
                                                                ? `${log.admin_prenom || ''} ${log.admin_nom || ''}`.trim()
                                                                : 'Système'}
                                                            {' · '}
                                                            {new Date(log.created_at).toLocaleString('fr-FR')}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="rounded-md border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
                                        Aucune activité enregistrée pour le moment.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Section: Support Requests */}
                <div className="space-y-4">
                    <Card className="max-h-[620px] overflow-y-auto rounded-md border-slate-200 shadow-none">
                        <CardHeader>
                            <CardTitle className="flex flex-col gap-3 text-lg">
                                <span>Messages</span>
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full rounded-md border p-2 text-sm font-normal"
                                />
                            </CardTitle>
                            <div className="flex space-x-2">
                                {/*<select*/}
                                {/*    value={filterStatus}*/}
                                {/*    onChange={(e) => setFilterStatus(e.target.value)}*/}
                                {/*    className="p-2 border rounded-md"*/}
                                {/*>*/}
                                {/*  <option value="all">Tous</option>*/}
                                {/*  <option value="unread">Non lus</option>*/}
                                {/*  <option value="read">Lus</option>*/}
                                {/*</select>*/}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {supportRequests.length > 0 ? (
                                <>
                                    {supportRequests.map((request) => (
                                        <div key={request.id} className="border-b py-3">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{request.name}</p>
                                                    <p className="text-sm text-muted-foreground">{request.email}</p>
                                                    <p className="text-sm">{request.message.substring(0, 50)}{request.message.length > 50 ? '...' : ''}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {new Date(request.createdAt).toLocaleString('fr-FR', {timeZone: 'Africa/Porto-Novo'})}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs ${request.status === 'unread' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {request.status}
                        </span>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="flex justify-center mt-4 space-x-2">
                                        <Button
                                            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                                            disabled={page === 1}
                                        >
                                            Précédent
                                        </Button>
                                        <span>{page} / {totalPages}</span>
                                        <Button
                                            onClick={() => setPage((prev) => prev + 1)}
                                            disabled={page === totalPages}
                                        >
                                            Suivant
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <p className="text-center text-muted-foreground">Aucun message de support.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SuperAdminDashboard;
