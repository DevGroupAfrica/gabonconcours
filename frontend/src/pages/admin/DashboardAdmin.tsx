import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import ExportModal from '@/components/admin/ExportModal';

import {
    Users,
    FileText,
    TrendingUp,
    CheckCircle,
    Clock,
    Download,
    MessageSquare,
    GraduationCap,
    Trophy,
    AlertCircle,
    BookOpen,
    ArrowRight,
    CreditCard,
    UserPlus
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import AdminLayout from '@/components/admin/AdminLayout';
import CandidatesList from '@/components/admin/CandidatesList';
import DocumentValidation from '@/components/admin/DocumentValidation';
import GradeManagement from '@/components/admin/GradeManagement';
import MessagerieAdmin from '@/components/admin/MessagerieAdmin';
import { exportService } from '@/services/exportService';
import {adminCandidatureService} from "@/services/adminCandidatureService.ts";
import {useAdminAuth} from "@/contexts/AdminAuthContext.tsx";
import {adminConcoursService} from "@/services/adminConcoursService.ts";
import {Message} from "postcss";
import ConcoursDetails from "@/pages/ConcoursDetails.tsx";
import Concours from "@/pages/Concours.tsx";
import ConcoursBasedDashboard from "@/components/admin/ConcoursBasedDashboard.tsx";
import AdminProfile from "@/components/admin/AdminProfile.tsx";
import FiliereConcoursFilter from "@/components/admin/FiliereConcoursFilter.tsx";
import SubAdminsManager from "@/components/admin/SubAdminsManager.tsx";
import NotificationAlerts from '@/components/admin/NotificationAlerts';

// Composant wrapper pour DocumentValidation
const DocumentValidationTab: React.FC = () => {
    const { data: documents, isLoading, refetch } = useQuery({
        queryKey: ['admin-documents'],
        queryFn: async () => {
            const response = await apiService.getAdminDossiers<any[]>();
            return response.data || [];
        },
        refetchInterval: 30000,
    });

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4">Chargement des documents...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return <DocumentValidation documents={documents || []} onRefresh={refetch} />;
};

interface DashboardStats {
    candidats: {
        total: number;
        complets: number;
        en_attente: number;
        validation_admin: number;
        valides?: number;
    };
    documents: {
        total: number;
        en_attente: number;
        valides: number;
        rejetes: number;
    };
    paiements: {
        total: number;
        valides: number;
        en_attente: number;
        montant_total: number;
    };
    messages: {
        total: number;
        non_lus: number;
    };
}




const DashboardAdmin: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'candidats' | 'documents' | 'notes' | 'messages'>('overview');
    const [selectedConcours, setSelectedConcours] = useState<number | null>(null);
    const {admin, token, isLoading} = useAdminAuth();
const [exportModalOpen, setExportModalOpen] = useState(false);

    const { data: messages } = useQuery<Message[]>({
        queryKey: ['admin-messages'],
        queryFn: async () => {
            const response = await apiService.makeRequest<Message[]>('/messages/admin', 'GET');
            return response.data || [];
        },
        refetchInterval: 10000,
    });
    const defaultStats: DashboardStats = {
        candidats: { total: 0, complets: 0, en_attente: 0, validation_admin: 0 },
        documents: { total: 0, en_attente: 0, valides: 0, rejetes: 0 },
        paiements: { total: 0, valides: 0, en_attente: 0, montant_total: 0 },
        messages: { total: 0, non_lus: 0 },
    };



    const unreadCount = messages?.filter((m) => m.statut === 'non_lu' && m.expediteur === 'candidat').length || 0;

    
    const { data: rawStats, isLoading: statsLoading } = useQuery<Partial<DashboardStats>>({
        queryKey: ['admin-dashboard-stats'],
        queryFn: async () => {
            const response = await apiService.getStatistics<Partial<DashboardStats>>();
            return response.data || {};
        },
        refetchInterval: 30000,
    });

    const stats: DashboardStats = {
        candidats: {
            ...defaultStats.candidats,
            ...(rawStats?.candidats || {}),
            complets: rawStats?.candidats?.complets ?? rawStats?.candidats?.valides ?? 0,
        },
        documents: {...defaultStats.documents, ...(rawStats?.documents || {})},
        paiements: {...defaultStats.paiements, ...(rawStats?.paiements || {})},
        messages: {...defaultStats.messages, ...(rawStats?.messages || {})},
    };

    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
    const etablissementId = adminData.etablissement_id || 1;



    const {data: concoursData, isLoading: isLoadingConcours} = useQuery({
        queryKey: ['concours', admin?.etablissement_id],
        queryFn: () => adminConcoursService.getConcoursByEtablissement(admin?.etablissement_id ??0),
        enabled: !!admin?.etablissement_id && !!token,
        retry: 2,
    });





    const handleExportCandidatesExcel = async () => {
        try {
            await exportService.exportCandidatesExcel(selectedConcours || undefined);
            toast({
                title: 'Export réussi',
                description: 'La liste des candidats a été exportée en Excel',
            });
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible d\'exporter les candidats',
                variant: 'destructive',
            });
        }
    };

    const handleExportCandidatesPDF = async () => {
        try {
            await exportService.exportCandidatesPDF(selectedConcours || undefined);
            toast({
                title: 'Export réussi',
                description: 'La liste des candidats a été exportée en PDF',
            });
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible d\'exporter les candidats',
                variant: 'destructive',
            });
        }
    };

    const handleExportGradesExcel = async () => {
        try {
            await exportService.exportGradesExcel(selectedConcours || undefined);
            toast({
                title: 'Export réussi',
                description: 'Les notes ont été exportées en Excel',
            });
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible d\'exporter les notes',
                variant: 'destructive',
            });
        }
    };

    const quickActions = admin?.role === 'admin_etablissement'
        ? [
            {
                title: 'Gérer les concours',
                description: 'Consulter les concours et leurs candidatures',
                icon: Trophy,
                badge: `${concoursData?.length || 0} concours`,
                action: () => navigate('/admin/concours'),
            },
            {
                title: 'Voir les candidats',
                description: 'Rechercher et suivre les dossiers candidats',
                icon: Users,
                badge: `${stats.candidats.total} candidat(s)`,
                action: () => navigate('/admin/candidats'),
            },
            {
                title: 'Valider les documents',
                description: 'Traiter les pièces justificatives reçues',
                icon: FileText,
                badge: `${stats.documents.en_attente} en attente`,
                action: () => navigate('/admin/dossiers'),
            },
            {
                title: 'Contrôler les paiements',
                description: 'Suivre les paiements et les validations',
                icon: CreditCard,
                badge: `${stats.paiements.en_attente} en attente`,
                action: () => navigate('/admin/paiements'),
            },
            {
                title: 'Répondre aux messages',
                description: 'Échanger avec les candidats',
                icon: MessageSquare,
                badge: `${unreadCount} non lu(s)`,
                action: () => navigate('/admin/messagerie'),
            },
            {
                title: 'Gérer les sous-admins',
                description: 'Organiser les accès de votre équipe',
                icon: UserPlus,
                badge: 'Équipe',
                action: () => navigate('/admin/sous-admins'),
            },
        ]
        : [
            {
                title: admin?.admin_role === 'documents' ? 'Valider les documents' : 'Saisir les notes',
                description: admin?.admin_role === 'documents'
                    ? 'Traiter les pièces justificatives reçues'
                    : 'Gérer les notes des candidats',
                icon: admin?.admin_role === 'documents' ? FileText : BookOpen,
                badge: admin?.admin_role === 'documents'
                    ? `${stats.documents.en_attente} en attente`
                    : `${stats.candidats.complets} candidat(s)`,
                action: () => navigate(admin?.admin_role === 'documents' ? '/admin/dossiers' : '/admin/notes'),
            },
            {
                title: 'Voir les concours',
                description: 'Accéder aux concours de l’établissement',
                icon: Trophy,
                badge: `${concoursData?.length || 0} concours`,
                action: () => navigate('/admin/concours'),
            },
        ];

    if (statsLoading) {
        return (
            <AdminLayout>
                <div className="p-8 text-center">Chargement des statistiques...</div>
            </AdminLayout>
        );
    }


    return (
        

            <div className="space-y-7">
                <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white px-7 py-8 sm:px-9">
                    <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-end">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A6DF3]">Espace administration</p>
                            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-slate-950 sm:text-4xl">Pilotez vos concours en un coup d'œil.</h1>
                            <p className="mt-3 text-sm text-slate-500">{adminData.etablissement_nom || 'École Normale Supérieure'} · Données actualisées automatiquement</p>
                        </div>
                        <Button className="rounded-md bg-[#2A6DF3] hover:bg-[#205fdc]" onClick={() => setExportModalOpen(true)}>
                            <Download className="h-4 w-4"/>Exporter les données
                        </Button>
                    </div>
                </div>

                {/* Notifications / Alertes */}
                <NotificationAlerts />

                <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
                <TabsList className="grid h-auto w-full max-w-md grid-cols-2 rounded-xl border border-[#e1e6fa] bg-white p-1">
                        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                        <TabsTrigger value="concours">Concours</TabsTrigger>
                    

                    </TabsList>

                    <TabsContent value="overview" className="space-y-6">
                        {/* Statistiques globales */}
                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
                            <Card className="rounded-md border-slate-200 shadow-none">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Candidats</CardTitle>
                                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[#2A6DF3]"><Users className="h-5 w-5"/></span>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-semibold tracking-tight text-[#111c59]">{stats?.candidats?.total ?? 0}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {stats?.candidats?.complets?? 0} dossiers complets
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-md border-slate-200 shadow-none">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Documents</CardTitle>
                                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[#2A6DF3]"><FileText className="h-5 w-5"/></span>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-3xl font-semibold tracking-tight text-[#111c59]">{stats?.documents?.en_attente??0}</div>
                                    <p className="text-xs text-muted-foreground">En attente de validation</p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-md border-slate-200 shadow-none">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Paiements</CardTitle>
                                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[#2A6DF3]"><TrendingUp className="h-5 w-5"/></span>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-semibold tracking-tight text-[#111c59]">
                                        {stats?.paiements?.montant_total?.toLocaleString()?? 0} FCFA
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {stats?.paiements?.valides ?? 0} validés
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="rounded-md border-slate-200 shadow-none">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Messages</CardTitle>
                                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[#2A6DF3]"><MessageSquare className="h-5 w-5"/></span>
                                </CardHeader>
                                <CardContent>
                                    <Badge variant="destructive">{unreadCount} non lu(s)</Badge>

                                </CardContent>
                            </Card>
                        </div>

                        <Card className="rounded-md border-slate-200 shadow-none">
                            <CardHeader className="flex flex-row items-center justify-between gap-4">
                                <div>
                                    <CardTitle>Actions rapides</CardTitle>
                                    <p className="mt-1 text-sm text-slate-500">Accédez directement aux tâches les plus fréquentes.</p>
                                </div>
                                <Button variant="outline" size="sm" onClick={() => setExportModalOpen(true)}>
                                    <Download className="mr-2 h-4 w-4"/>
                                    Exporter
                                </Button>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                    {quickActions.map(action => (
                                        <button
                                            key={action.title}
                                            type="button"
                                            onClick={action.action}
                                            className="group flex min-h-32 items-start gap-4 rounded-md border border-slate-200 p-4 text-left transition-all hover:border-[#2A6DF3] hover:bg-blue-50/40"
                                        >
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#2A6DF3]">
                                                <action.icon className="h-5 w-5"/>
                                            </span>
                                            <span className="min-w-0 flex-1">
                                                <span className="flex items-start justify-between gap-3">
                                                    <span className="font-semibold text-slate-900">{action.title}</span>
                                                    <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-[#2A6DF3]"/>
                                                </span>
                                                <span className="mt-1 block text-sm text-slate-500">{action.description}</span>
                                                <Badge variant="secondary" className="mt-3 font-normal">{action.badge}</Badge>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Concours actifs */}
                        <Card className="rounded-md border-slate-200 shadow-none">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5" />
                                        Concours Actifs
                                    </CardTitle>
                                   <div className="flex gap-2">
  <Button
    variant="outline"
    size="sm"
    onClick={() => setExportModalOpen(true)} 
  >
    <Download className="h-4 w-4 mr-2" />
    Exporter
  </Button>
</div>

                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {concoursData && concoursData.length > 0 ? (
                                        concoursData.map((concours: any) => (
                                            <Card
                                                key={concours.id}
                                                className="cursor-pointer rounded-md border-slate-200 transition-colors hover:border-[#2A6DF3]"
                                                onClick={() => setSelectedConcours(concours.id)}
                                            >
                                                <CardHeader>
                                                    <CardTitle className="text-lg">{concours.libcnc}</CardTitle>
                                                    <p className="text-sm text-muted-foreground">
                                                        Session: {concours.sescnc}
                                                    </p>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between text-sm">
                                                            <span>Date limite:</span>
                                                            <Badge variant="outline">
                                                                {new Date(concours.dlican).toLocaleDateString('fr-FR')}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex justify-between text-sm">
                                                            <span>Frais:</span>
                                                            <span className="font-semibold">
                                                                {concours.fracnc?.toLocaleString()} FCFA
                                                            </span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    ) : (
                                        <div className="col-span-3 text-center py-12 text-muted-foreground">
                                            <Trophy className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                            <p>Aucun concours actif</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Actions rapides */}
                        {/*<div className="grid grid-cols-1 md:grid-cols-3 gap-6">*/}
                        {/*    <Card className="cursor-pointer hover:border-primary transition-colors"*/}
                        {/*          onClick={() => setActiveTab('documents')}>*/}
                        {/*        <CardHeader>*/}
                        {/*            <CardTitle className="flex items-center gap-2">*/}
                        {/*                <AlertCircle className="h-5 w-5 text-orange-600" />*/}
                        {/*                Documents en attente*/}
                        {/*            </CardTitle>*/}
                        {/*        </CardHeader>*/}
                        {/*        <CardContent>*/}
                        {/*            <div className="text-3xl font-bold">{stats?.documents?.en_attente ?? 0}</div>*/}
                        {/*            <p className="text-sm text-muted-foreground mt-2">*/}
                        {/*                Nécessitent une validation*/}
                        {/*            </p>*/}
                        {/*        </CardContent>*/}
                        {/*    </Card>*/}

                        {/*    <Card className="cursor-pointer hover:border-primary transition-colors"*/}
                        {/*          onClick={() => setActiveTab('messages')}>*/}
                        {/*        <CardHeader>*/}
                        {/*            <CardTitle className="flex items-center gap-2">*/}
                        {/*                <MessageSquare className="h-5 w-5 text-blue-600" />*/}
                        {/*                Messages non lus*/}
                        {/*            </CardTitle>*/}
                        {/*        </CardHeader>*/}
                        {/*        <CardContent>*/}
                        {/*            <div className="text-3xl font-bold">{stats?.messages?.non_lus ?? 0}</div>*/}
                        {/*            <p className="text-sm text-muted-foreground mt-2">*/}
                        {/*                Des candidats nécessitent une réponse*/}
                        {/*            </p>*/}
                        {/*        </CardContent>*/}
                        {/*    </Card>*/}

                        {/*    <Card className="cursor-pointer hover:border-primary transition-colors"*/}
                        {/*          onClick={() => setActiveTab('notes')}>*/}
                        {/*        <CardHeader>*/}
                        {/*            <CardTitle className="flex items-center gap-2">*/}
                        {/*                <BookOpen className="h-5 w-5 text-green-600" />*/}
                        {/*                Gestion des notes*/}
                        {/*            </CardTitle>*/}
                        {/*        </CardHeader>*/}
                        {/*        <CardContent>*/}
                        {/*            <div className="text-3xl font-bold">*/}
                        {/*                {stats?.candidats?.complets ?? 0}*/}
                        {/*            </div>*/}
                        {/*            <p className="text-sm text-muted-foreground mt-2">*/}
                        {/*                Candidats éligibles*/}
                        {/*            </p>*/}
                        {/*        </CardContent>*/}
                        {/*    </Card>*/}
                        {/*</div>*/}


                    </TabsContent>

                    <TabsContent value="concours">
                        <ConcoursBasedDashboard  />
                    </TabsContent>

                  
                </Tabs>
                <ExportModal
  open={exportModalOpen}
  onClose={() => setExportModalOpen(false)}
  concoursList={concoursData || []}
/>

            </div>
            

    );
    
};

export default DashboardAdmin;
