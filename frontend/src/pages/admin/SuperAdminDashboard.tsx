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
    Mail
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

    const quickActions = [
        {
            title: 'Créer un Établissement',
            description: 'Ajouter un nouvel établissement',
            icon: Building,
            action: () => navigate('/admin/gestion-etablissements'),
            color: 'bg-blue-500'
        },
        {
            title: 'Créer un Admin',
            description: 'Ajouter un administrateur',
            icon: Users,
            action: () => navigate('/admin/gestion-admins'),
            color: 'bg-green-500'
        },
        {
            title: 'Gérer les Concours',
            description: 'Configuration globale',
            icon: Trophy,
            action: () => navigate('/admin/concour'),
            color: 'bg-purple-500'
        },
        {
            title: 'Gérer les Filières',
            description: 'Configuration des filières',
            icon: Settings,
            action: () => navigate('/admin/filieres'),
            color: 'bg-orange-500'
        },
          {
            title: 'Gérer les matières',
            description: 'Configuration des matières',
            icon: Settings,
            action: () => navigate('/admin/matieres'),
            color: 'bg-orange-500'
        }

    ];

    return (
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Dashboard Super Admin</h1>
                    <p className="text-muted-foreground">Vue d'ensemble de la plateforme GabConcours</p>
                </div>
            </div>

            {/* Notifications / Alertes */}
            <NotificationAlerts />

            {/* Left Section: Statistiques et Actions Rapides */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Statistiques principales */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <Building className="h-8 w-8 text-blue-500"/>
                                    <div>
                                        <p className="text-2xl font-bold">{etablissements.length}</p>
                                        <p className="text-sm text-muted-foreground">Établissements</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <Users className="h-8 w-8 text-green-500"/>
                                    <div>
                                        <p className="text-2xl font-bold">{admins.length}</p>
                                        <p className="text-sm text-muted-foreground">Administrateurs</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <Trophy className="h-8 w-8 text-purple-500"/>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.totalConcours || 0}</p>
                                        <p className="text-sm text-muted-foreground">Concours Actifs</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <FileText className="h-8 w-8 text-orange-500"/>
                                    <div>
                                        <p className="text-2xl font-bold">{stats.totalCandidatures || 0}</p>
                                        <p className="text-sm text-muted-foreground">Candidatures</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions rapides */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions Rapides</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {quickActions.map((action, index) => (
                                    <div
                                        key={index}
                                        className="p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                                        onClick={action.action}
                                    >
                                        <div
                                            className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                                            <action.icon className="h-6 w-6 text-white"/>
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
                        <Card>
                            <CardHeader>
                                <CardTitle>Répartition par Établissement</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {etablissements.slice(0, 5).map((etablissement: any) => (
                                        <div key={etablissement.id} className="flex justify-between items-center">
                                            <span className="text-sm">{etablissement.nomets}</span>
                                            <span
                                                className="text-sm font-medium">{etablissement.candidatures_count || 1} candidatures</span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Activité Récente</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                        <span className="text-sm">Nouvelle candidature reçue</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                        <span className="text-sm">Admin créé pour IST</span>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                        <span className="text-sm">Nouveau concours publié</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Right Section: Support Requests */}
                <div className="lg:col-span-1 space-y-4">
                    <Card className="h-[calc(100vh-200px)] overflow-y-auto">
                        <CardHeader>
                            <CardTitle className="flex justify-between items-center">
                                <span>Messages</span>
                                <input
                                    type="text"
                                    placeholder="Rechercher..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-1/2 p-2 border rounded-md"
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