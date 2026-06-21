import React, {useCallback, useEffect, useState} from 'react';
import {useNavigate, useParams} from 'react-router-dom';
import {
    Award, Bell, Building2, CalendarDays, CheckCircle2, ChevronRight, CircleUserRound, CreditCard,
    FileText, Fingerprint, GraduationCap, LayoutDashboard, LogOut, Mail, Menu, MessageSquare, Phone,
    Plus, RefreshCw, ShieldCheck, X
} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {apiService} from '@/services/api';
import DocumentsManager from '@/components/candidat/DocumentsManager';
import NotificationPanel from '@/components/candidate/NotificationPanel';
import MessagerieCandidat from '@/components/MessagerieCandidat';
import GradesBulletin from '@/components/candidat/GradesBulletin';
import {toast} from '@/hooks/use-toast';

interface Candidature {
    nupcan: string;
    concours: {id: number; libcnc: string; etablissement: string};
    filiere: {id: number; nomfil: string};
    statut: string;
    progression: number;
    created_at: string;
    documents_count: number;
    documents_valides: number;
    paiement_statut: string | null;
}

interface DashboardData {
    candidat: {id: number; nipcan: string; nomcan: string; prncan: string; maican: string; telcan: string; phtcan: string};
    candidatures: Candidature[];
    statistiques: {total: number; en_cours: number; completes: number};
}

type Tab = 'overview' | 'applications' | 'documents' | 'notifications' | 'messages' | 'results' | 'profile';

const DashboardNipcan = () => {
    const {nipcan: routeValue} = useParams<{nipcan: string}>();
    const navigate = useNavigate();
    const [nipcan, setNipcan] = useState('');
    const [data, setData] = useState<DashboardData | null>(null);
    const [selectedNupcan, setSelectedNupcan] = useState('');
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [loading, setLoading] = useState(true);
    const [mobileMenu, setMobileMenu] = useState(false);

    useEffect(() => {
        const resolveNipcan = async () => {
            if (!routeValue) return;
            if (routeValue.startsWith('NIP')) {
                setNipcan(routeValue);
                return;
            }
            const response = await apiService.makeRequest<{nipcan: string}>(`/candidats/nupcan/${routeValue}/nipcan`, 'GET');
            if (response.success && response.data) {
                setNipcan(response.data.nipcan);
                navigate(`/dashboard/${response.data.nipcan}`, {replace: true});
            }
        };
        resolveNipcan();
    }, [routeValue, navigate]);

    const loadDashboard = useCallback(async () => {
        if (!nipcan) return;
        setLoading(true);
        try {
            const response = await apiService.makeRequest<DashboardData>(`/candidats/nipcan/${nipcan}/dashboard`, 'GET');
            if (!response.success || !response.data) throw new Error(response.message || 'Impossible de charger le dashboard');
            setData(response.data);
            setSelectedNupcan(current => current || response.data!.candidatures[0]?.nupcan || '');
            localStorage.setItem('candidat_nipcan', nipcan);
        } catch (error: any) {
            toast({title: 'Erreur', description: error.message, variant: 'destructive'});
        } finally {
            setLoading(false);
        }
    }, [nipcan]);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    if (loading) return <LoadingScreen/>;
    if (!data) return <EmptyScreen onLogin={() => navigate('/connexion')}/>;

    const selected = data.candidatures.find(item => item.nupcan === selectedNupcan) || data.candidatures[0];
    const changeTab = (tab: Tab) => {
        setActiveTab(tab);
        setMobileMenu(false);
    };

    const menu = [
        {id: 'overview' as Tab, label: 'Vue d’ensemble', icon: LayoutDashboard},
        {id: 'applications' as Tab, label: 'Mes candidatures', icon: GraduationCap},
        {id: 'documents' as Tab, label: 'Documents', icon: FileText, requiresApplication: true},
        {id: 'notifications' as Tab, label: 'Notifications', icon: Bell, requiresApplication: true},
        {id: 'messages' as Tab, label: 'Messages', icon: MessageSquare, requiresApplication: true},
        {id: 'results' as Tab, label: 'Résultats', icon: Award, requiresApplication: true},
        {id: 'profile' as Tab, label: 'Mon profil', icon: CircleUserRound},
    ];

    return (
        <div className="candidate-shell min-h-screen bg-[#f7f9fc] text-slate-800">
            <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white text-slate-700 lg:translate-x-0 ${mobileMenu ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
                    <div>
                        <p className="text-lg font-bold tracking-tight text-slate-950">GABConcours<span className="text-[#2A6DF3]">.</span></p>
                        <p className="mt-0.5 text-xs font-medium text-slate-400">Espace candidat</p>
                    </div>
                    <button className="lg:hidden" onClick={() => setMobileMenu(false)}><X className="h-5 w-5"/></button>
                </div>

                <div className="border-b border-slate-200 p-3">
                    <label className="mb-2 block text-xs font-medium text-slate-500">Candidature active</label>
                    {data.candidatures.length > 0 ? (
                        <select
                            value={selectedNupcan}
                            onChange={event => setSelectedNupcan(event.target.value)}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-[#2A6DF3]"
                        >
                            {data.candidatures.map(application => (
                                <option key={application.nupcan} value={application.nupcan}>{application.concours.libcnc}</option>
                            ))}
                        </select>
                    ) : <p className="text-sm text-slate-500">Aucune candidature</p>}
                    <Button className="mt-3 w-full rounded-md" variant="outline" size="sm" onClick={() => navigate('/concours')}>
                        <Plus className="h-4 w-4"/>Nouvelle candidature
                    </Button>
                </div>

                <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
                    {menu.map(item => {
                        const Icon = item.icon;
                        const disabled = item.requiresApplication && !selected;
                        return (
                            <button
                                key={item.id}
                                disabled={disabled}
                                onClick={() => changeTab(item.id)}
                                className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                                    activeTab === item.id ? 'border-blue-100 bg-blue-50 text-[#1746a2]' : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                                }`}
                            >
                                <Icon className="h-4 w-4"/>{item.label}
                            </button>
                        );
                    })}
                </nav>

                <div className="border-t border-slate-200 p-3">
                    <div className="mb-3 flex items-center gap-3 px-2">
                        <Avatar data={data}/>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold">{data.candidat.prncan} {data.candidat.nomcan}</p>
                            <p className="truncate text-xs text-slate-400">{data.candidat.nipcan}</p>
                        </div>
                    </div>
                    <button onClick={() => {localStorage.removeItem('candidat_nipcan'); navigate('/connexion');}} className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-950">
                        <LogOut className="h-4 w-4"/>Déconnexion
                    </button>
                </div>
            </aside>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e1e6fa] bg-white/90 px-4 backdrop-blur-xl lg:px-6">
                    <div className="flex items-center gap-3">
                        <button className="lg:hidden" onClick={() => setMobileMenu(true)}><Menu className="h-5 w-5"/></button>
                        <div>
                            <h1 className="font-semibold text-[#111c59]">{pageTitle(activeTab)}</h1>
                            <p className="hidden text-xs text-slate-400 sm:block">{selected ? `${selected.concours.libcnc} · ${selected.nupcan}` : 'Espace personnel'}</p>
                        </div>
                    </div>
                    <Button className="rounded-md bg-white" variant="outline" size="sm" onClick={loadDashboard}><RefreshCw className="h-4 w-4"/>Actualiser</Button>
                </header>
                <main className="mx-auto w-full max-w-[1500px] p-4 lg:p-6">
                    <DashboardContent tab={activeTab} data={data} selected={selected} navigate={navigate} setTab={changeTab} reload={loadDashboard}/>
                </main>
            </div>
        </div>
    );
};

const DashboardContent = ({tab, data, selected, navigate, setTab, reload}: any) => {
    if (tab === 'documents' && selected) return <DocumentsManager nupcan={selected.nupcan}/>;
    if (tab === 'notifications' && selected) return <NotificationPanel nupcan={selected.nupcan}/>;
    if (tab === 'messages' && selected) return <MessagerieCandidat nupcan={selected.nupcan}/>;
    if (tab === 'results' && selected) return <GradesBulletin nupcan={selected.nupcan} candidat={{nomcan: data.candidat.nomcan, prncan: data.candidat.prncan, concourId: selected.concours.id, libcnc: selected.concours.libcnc}}/>;
    if (tab === 'profile') return <Profile data={data} setTab={setTab} navigate={navigate}/>;
    if (tab === 'applications') return <Applications data={data} selected={selected} setTab={setTab} navigate={navigate}/>;
    return <Overview data={data} selected={selected} setTab={setTab} navigate={navigate}/>;
};

const Overview = ({data, selected, setTab, navigate}: any) => (
    <div className="space-y-5">
        <div className="relative overflow-hidden rounded-md border border-slate-200 bg-white px-6 py-7 sm:px-8 sm:py-9">
            <p className="relative text-sm font-semibold text-[#2A6DF3]">Bonjour {data.candidat.prncan}</p>
            <h2 className="relative mt-2 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] text-slate-950">Suivez votre dossier et réalisez les prochaines étapes.</h2>
            <p className="relative mt-3 max-w-2xl text-sm leading-6 text-slate-500">Toutes les informations utiles de votre candidature sont regroupées ici.</p>
            <div className="mt-4 flex flex-wrap gap-2">
                <Button className="rounded-md bg-[#2A6DF3] hover:bg-[#205fdc]" onClick={() => selected && setTab('documents')} disabled={!selected}><FileText className="h-4 w-4"/>Gérer les documents</Button>
                <Button className="rounded-md" variant="outline" onClick={() => navigate('/concours')}><Plus className="h-4 w-4"/>Nouvelle candidature</Button>
            </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Candidatures" value={data.statistiques.total} icon={GraduationCap}/>
            <Metric label="En cours" value={data.statistiques.en_cours} icon={RefreshCw}/>
            <Metric label="Terminées" value={data.statistiques.completes} icon={CheckCircle2}/>
        </div>
        {selected ? <ApplicationCard application={selected} setTab={setTab} navigate={navigate}/> : <NoApplication navigate={navigate}/>}
    </div>
);

const Applications = ({data, selected, setTab, navigate}: any) => (
    <div className="space-y-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div><h2 className="text-2xl font-semibold tracking-tight">Mes candidatures</h2><p className="mt-1 text-sm text-slate-500">Une personne ne peut déposer qu’une candidature par concours.</p></div>
            <Button onClick={() => navigate('/concours')}><Plus className="h-4 w-4"/>Nouvelle candidature</Button>
        </div>
        {data.candidatures.length ? data.candidatures.map((application: any) => <ApplicationCard key={application.nupcan} application={application} setTab={setTab} navigate={navigate}/>) : <NoApplication navigate={navigate}/>}
    </div>
);

const ApplicationCard = ({application, setTab, navigate}: any) => (
    <div className="overflow-hidden rounded-md border border-slate-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-[#fbfdff] to-white p-5 sm:flex-row sm:items-start sm:justify-between">
            <div><span className="inline-flex bg-blue-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#2A6DF3]">{application.progression === 100 ? 'Dossier transmis' : 'En préparation'}</span><h3 className="mt-3 text-xl font-semibold">{application.concours.libcnc}</h3><p className="mt-1 text-sm text-slate-500">{application.filiere.nomfil} · {application.concours.etablissement}</p></div>
            <span className="rounded-md border border-slate-200 bg-white px-3 py-1.5 font-mono text-xs text-slate-600">{application.nupcan}</span>
        </div>
        <div className="grid gap-3 p-5 sm:grid-cols-3">
            <Info label="Créée le" value={new Date(application.created_at).toLocaleDateString('fr-FR')} icon={CalendarDays}/>
            <Info label="Documents validés" value={`${application.documents_valides}/${application.documents_count}`} icon={FileText}/>
            <Info label="Paiement" value={application.paiement_statut || 'Non payé'} icon={CreditCard}/>
        </div>
        <div className="px-5 pb-5">
            <div className="mb-3 flex justify-between text-xs font-semibold text-slate-500"><span>Progression du dossier</span><span className="text-primary">{application.progression}%</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-primary" style={{width: `${application.progression}%`}}/></div>
            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <ProgressStep done label="Inscription"/>
                <ProgressStep done={application.documents_count > 0 && application.documents_valides === application.documents_count} label="Documents"/>
                <ProgressStep done={application.paiement_statut === 'valide'} label="Paiement"/>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                <Button onClick={() => setTab('documents')}><FileText className="h-4 w-4"/>Documents</Button>
                <Button variant="outline" onClick={() => navigate(`/paiement/${application.nupcan}`)}><CreditCard className="h-4 w-4"/>Paiement</Button>
                <Button variant="ghost" onClick={() => setTab('messages')}>Contacter le support<ChevronRight className="h-4 w-4"/></Button>
            </div>
        </div>
    </div>
);

const ProgressStep = ({done, label}: any) => <div className={`flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold ${done ? 'border-blue-100 bg-blue-50 text-[#2A6DF3]' : 'border-slate-200 bg-slate-50 text-slate-400'}`}><CheckCircle2 className="h-3.5 w-3.5"/>{label}</div>;

const Profile = ({data, setTab, navigate}: any) => {
    const recentApplication = data.candidatures[0];
    const completedApplications = data.candidatures.filter((application: Candidature) => application.progression === 100).length;
    const contactFields = [data.candidat.maican, data.candidat.telcan].filter(Boolean).length;
    const profileCompletion = Math.round((contactFields / 2) * 100);

    return (
        <div className="w-full space-y-4">
            <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
                <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-1">
                            <Avatar data={data} large/>
                        </div>
                        <div>
                            <span className="inline-flex items-center gap-2 border border-blue-100 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#2A6DF3]">
                                <ShieldCheck className="h-3.5 w-3.5"/>Profil candidat actif
                            </span>
                            <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">{data.candidat.prncan} {data.candidat.nomcan}</h2>
                            <p className="mt-1 text-sm text-slate-500">Votre identité et vos candidatures sont regroupées dans cet espace personnel.</p>
                            <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-slate-100 px-3 py-2 font-mono text-xs text-slate-600">
                                <Fingerprint className="h-4 w-4 text-[#2A6DF3]"/>{data.candidat.nipcan}
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-md border border-slate-200 bg-slate-200">
                        <ProfileStat value={data.statistiques.total} label="Dossiers"/>
                        <ProfileStat value={completedApplications} label="Complets"/>
                        <ProfileStat value={`${profileCompletion}%`} label="Profil"/>
                    </div>
                </div>
            </section>

            <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
                <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
                    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2A6DF3]">Informations personnelles</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-950">Coordonnées du candidat</h3>
                            <p className="mt-1 text-sm text-slate-500">Utilisées pour les notifications liées à vos concours.</p>
                        </div>
                        <div className="hidden h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-[#2A6DF3] sm:flex">
                            <CircleUserRound className="h-5 w-5"/>
                        </div>
                    </div>
                    <div className="grid gap-3 p-6 sm:grid-cols-2">
                        <ProfileInfo icon={Mail} label="Adresse email" value={data.candidat.maican} verified/>
                        <ProfileInfo icon={Phone} label="Téléphone" value={data.candidat.telcan} verified/>
                        <ProfileInfo icon={Fingerprint} label="Identifiant candidat" value={data.candidat.nipcan}/>
                        <ProfileInfo icon={ShieldCheck} label="État du compte" value="Compte actif" verified/>
                    </div>
                    <div className="border-t border-slate-100 bg-[#fbfdff] px-6 py-4 text-xs leading-5 text-slate-500">
                        Pour corriger une information personnelle, contactez le support depuis votre messagerie.
                    </div>
                </section>

                <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
                    <div className="border-b border-slate-100 px-6 py-5">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Dossier récent</p>
                        <h3 className="mt-2 text-xl font-semibold text-slate-950">Dernière candidature</h3>
                    </div>
                    {recentApplication ? (
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-50 text-primary">
                                    <GraduationCap className="h-5 w-5"/>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-semibold leading-6 text-slate-950">{recentApplication.concours.libcnc}</h4>
                                    <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                                        <Building2 className="h-3.5 w-3.5"/>{recentApplication.concours.etablissement}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 flex items-center justify-between text-xs font-semibold text-slate-500">
                                <span>Progression du dossier</span><span className="text-primary">{recentApplication.progression}%</span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full bg-primary" style={{width: `${recentApplication.progression}%`}}/>
                            </div>
                            <div className="mt-6 grid grid-cols-2 gap-3">
                                <ProfileMiniStat label="Documents" value={`${recentApplication.documents_valides}/${recentApplication.documents_count}`}/>
                                <ProfileMiniStat label="Paiement" value={recentApplication.paiement_statut || 'Non payé'}/>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-2">
                                <Button onClick={() => setTab('applications')}>Voir le dossier<ChevronRight className="h-4 w-4"/></Button>
                                <Button variant="outline" onClick={() => setTab('messages')}><MessageSquare className="h-4 w-4"/>Support</Button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-8 text-center">
                            <GraduationCap className="mx-auto h-8 w-8 text-slate-300"/>
                            <p className="mt-4 text-sm font-semibold">Aucune candidature enregistrée</p>
                            <Button className="mt-5" onClick={() => navigate('/concours')}>Découvrir les concours</Button>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};
const ProfileStat = ({value, label}: any) => <div className="min-w-[88px] bg-white px-4 py-3 text-center"><p className="text-xl font-bold text-slate-950">{value}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">{label}</p></div>;
const ProfileInfo = ({icon: Icon, label, value, verified = false}: any) => <div className="rounded-md border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-50 text-[#2A6DF3]"><Icon className="h-4 w-4"/></div>{verified && <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[#2A6DF3]"><CheckCircle2 className="h-3 w-3"/>Vérifié</span>}</div><p className="mt-4 text-xs text-slate-500">{label}</p><p className="mt-1 break-all text-sm font-semibold text-slate-800">{value || 'Non renseigné'}</p></div>;
const ProfileMiniStat = ({label, value}: any) => <div className="rounded-lg border border-slate-200 bg-[#fbfdff] p-3"><p className="text-[11px] text-slate-500">{label}</p><p className="mt-1 text-sm font-semibold capitalize text-slate-800">{value}</p></div>;
const Metric = ({label, value, icon: Icon}: any) => <div className="rounded-md border border-slate-200 bg-white p-5"><div className="flex items-center justify-between"><div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{value}</p></div><div className="flex h-11 w-11 items-center justify-center rounded-md bg-blue-50"><Icon className="h-5 w-5 text-[#2A6DF3]"/></div></div></div>;
const Info = ({label, value, icon: Icon}: any) => <div className="flex gap-3 border border-slate-200 bg-[#fbfdff] p-3"><Icon className="mt-0.5 h-4 w-4 text-primary"/><div><p className="text-xs text-slate-500">{label}</p><p className="mt-0.5 text-sm font-semibold text-slate-700">{value}</p></div></div>;
const Avatar = ({data, large = false}: any) => data.candidat.phtcan ? <img src={`http://localhost:8002/uploads/photos/${data.candidat.phtcan}`} className={`${large ? 'h-20 w-20' : 'h-10 w-10'} rounded-md object-cover`} alt="Profil"/> : <div className={`${large ? 'h-20 w-20' : 'h-10 w-10'} flex items-center justify-center rounded-md border border-slate-300 bg-white font-semibold text-slate-700`}>{data.candidat.prncan?.[0]}{data.candidat.nomcan?.[0]}</div>;
const NoApplication = ({navigate}: any) => <div className="rounded-md border border-dashed border-slate-300 bg-white p-12 text-center"><GraduationCap className="mx-auto h-9 w-9 text-slate-300"/><h3 className="mt-4 font-semibold">Aucune candidature</h3><p className="mt-2 text-sm text-slate-500">Consultez les concours ouverts pour commencer.</p><Button className="mt-5" onClick={() => navigate('/concours')}>Voir les concours</Button></div>;
const LoadingScreen = () => <div className="flex min-h-screen items-center justify-center bg-slate-50"><p className="text-xs uppercase tracking-[0.14em] text-slate-500">Chargement du dossier...</p></div>;
const EmptyScreen = ({onLogin}: any) => <div className="flex min-h-screen items-center justify-center bg-slate-50"><div className="rounded-xl border bg-white p-8 text-center"><h2 className="font-semibold">Dashboard indisponible</h2><Button className="mt-5" onClick={onLogin}>Retour à la connexion</Button></div></div>;
const pageTitle = (tab: Tab) => ({overview: 'Tableau de bord', applications: 'Mes candidatures', documents: 'Mes documents', notifications: 'Notifications', messages: 'Messagerie', results: 'Résultats', profile: 'Mon profil'}[tab]);

export default DashboardNipcan;
