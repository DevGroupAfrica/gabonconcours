import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {
    ArrowRight,
    Bell,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronRight,
    CircleUserRound,
    FileCheck2,
    FileText,
    GraduationCap,
    HelpCircle,
    LayoutDashboard,
    Search,
    ShieldCheck,
    WalletCards,
} from 'lucide-react';
import Layout from '@/components/Layout';
import {Button} from '@/components/ui/button';
import {apiService} from '@/services/api';

interface ApiResponse<T> {
    success: boolean;
    data?: T;
}

interface StatisticsResponse {
    candidats?: {total: number};
}

const NewHomePage = () => {
    const navigate = useNavigate();

    const {data: concoursApi} = useQuery<ApiResponse<any[]>>({
        queryKey: ['concours'],
        queryFn: () => apiService.getConcours<any[]>(),
    });
    const {data: statsApi} = useQuery<ApiResponse<StatisticsResponse>>({
        queryKey: ['statistics'],
        queryFn: () => apiService.getStatistics<StatisticsResponse>(),
    });

    const concours = concoursApi?.data || [];
    const concoursActifs = concours.filter((item: any) =>
        item.stacnc === '1' || item.statut === 'actif' || item.actif === true
    );
    const featuredContests = concoursActifs.slice(0, 3);
    const candidatsTotal = statsApi?.data?.candidats?.total || 0;

    return (
        <Layout>
            <div className="border-b border-slate-200 bg-white">
                <section className="site-container relative min-h-[650px] overflow-hidden py-14 lg:py-20">
                    <div className="relative z-10 grid gap-14 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
                        <div className="max-w-xl">
                            <span className="inline-flex items-center gap-2 border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-[#2A6DF3]">
                                <span className="h-2 w-2 rounded-full bg-[#2A6DF3]"/>
                                Plateforme nationale des concours
                            </span>
                            <h1 className="mt-7 text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-slate-950 sm:text-6xl lg:text-[72px]">
                                Vos concours.
                                <span className="block text-[#2A6DF3]">Un seul espace.</span>
                            </h1>
                            <p className="mt-7 max-w-lg text-base leading-7 text-[#7180a6] sm:text-lg">
                                Trouvez une formation, déposez vos documents et suivez votre candidature
                                jusqu'aux résultats.
                            </p>
                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <Button size="lg" className="h-14 rounded-md bg-[#2A6DF3] px-7 shadow-none hover:bg-[#205fdc]" onClick={() => navigate('/concours')}>
                                    Découvrir les concours <ArrowRight/>
                                </Button>
                                <Button size="lg" className="h-14 rounded-md border border-slate-300 bg-white px-7 text-slate-800 shadow-none hover:bg-slate-50" onClick={() => navigate('/connexion')}>
                                    Suivre mon dossier
                                </Button>
                            </div>
                            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-xs font-medium text-[#7b88aa]">
                                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#2A6DF3]"/> Candidature en ligne</span>
                                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#2A6DF3]"/> Données sécurisées</span>
                            </div>
                        </div>

                        <ProductPreview/>
                    </div>
                </section>
            </div>

            <section className="bg-white py-20 lg:py-24">
                <div className="site-container">
                    <div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-end">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6479dd]">Disponible maintenant</p>
                            <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.055em] text-[#111c59] sm:text-5xl">
                                Trouvez votre prochain concours.
                            </h2>
                        </div>
                        <div className="lg:justify-self-end">
                            <p className="max-w-lg leading-7 text-slate-500">
                                Les informations essentielles, les échéances et l'accès à la candidature,
                                sans parcourir plusieurs plateformes.
                            </p>
                            <Button variant="outline" className="mt-5 rounded-md" onClick={() => navigate('/concours')}>
                                Voir tous les concours <ArrowRight/>
                            </Button>
                        </div>
                    </div>

                    <div className="mt-12 grid gap-5 lg:grid-cols-3">
                        {featuredContests.length > 0 ? featuredContests.map((contest: any, index: number) => (
                            <ContestCard key={contest.id} contest={contest} index={index} onOpen={() => navigate(`/concours/${contest.id}`)}/>
                        )) : (
                            <div className="col-span-full rounded-md border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                                <GraduationCap className="mx-auto h-8 w-8 text-slate-400"/>
                                <p className="mt-4 font-semibold text-slate-700">Aucun concours ouvert actuellement</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="border-y border-slate-200 bg-white py-20 lg:py-24">
                <div className="site-container grid gap-12 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
                    <ApplicationPreview/>
                    <div className="max-w-lg">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6479dd]">Pensé pour les candidats</p>
                        <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.055em] text-[#111c59] sm:text-5xl">
                            Votre dossier reste simple à suivre.
                        </h2>
                        <p className="mt-6 leading-7 text-slate-500">
                            Chaque étape est visible depuis votre espace personnel. Vous savez ce qui est validé,
                            ce qu'il reste à fournir et quand agir.
                        </p>
                        <div className="mt-8 space-y-4">
                            <Feature icon={FileText} title="Documents centralisés" text="Ajoutez et consultez toutes vos pièces au même endroit."/>
                            <Feature icon={Bell} title="Notifications utiles" text="Recevez les informations importantes sur votre dossier."/>
                            <Feature icon={ShieldCheck} title="Suivi sécurisé" text="Accédez à votre candidature avec votre identifiant personnel."/>
                        </div>
                    </div>
                </div>
            </section>

            <section className="bg-white py-20 lg:py-24">
                <div className="site-container">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#6479dd]">Tout au même endroit</p>
                        <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.055em] text-[#111c59] sm:text-5xl">
                            Une plateforme, tous les services utiles.
                        </h2>
                        <p className="mt-5 leading-7 text-slate-500">De la recherche du concours à la publication des résultats, chaque démarche reste accessible depuis votre espace.</p>
                    </div>
                    <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                        <ServiceCard icon={Search} title="Explorer" text="Consultez les concours, filières, conditions et dates importantes."/>
                        <ServiceCard icon={FileText} title="Candidater" text="Complétez votre dossier et transmettez vos justificatifs en ligne."/>
                        <ServiceCard icon={WalletCards} title="Payer" text="Réglez les frais demandés et conservez votre reçu de paiement."/>
                        <ServiceCard icon={GraduationCap} title="Consulter" text="Suivez votre statut, vos notifications, vos notes et résultats."/>
                    </div>
                </div>
            </section>

            <section className="border-y border-blue-100 bg-blue-50 py-20 lg:py-24">
                <div className="site-container grid gap-14 lg:grid-cols-[.7fr_1.3fr] lg:items-start">
                    <div className="max-w-md">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A6DF3]">Comment ça marche ?</p>
                        <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.055em] text-slate-950 sm:text-5xl">Quatre étapes, sans détour.</h2>
                        <p className="mt-5 leading-7 text-slate-600">Votre tableau de bord vous indique toujours la prochaine action à réaliser.</p>
                        <Button className="mt-8 rounded-md bg-[#2A6DF3] hover:bg-[#205fdc]" onClick={() => navigate('/concours')}>Commencer <ArrowRight/></Button>
                    </div>
                    <div className="grid gap-px overflow-hidden border border-blue-100 bg-blue-100 sm:grid-cols-2">
                        <ProcessStep number="01" title="Choisissez votre concours" text="Comparez les sessions et vérifiez les conditions d'admission."/>
                        <ProcessStep number="02" title="Créez votre candidature" text="Renseignez vos informations et sélectionnez votre filière."/>
                        <ProcessStep number="03" title="Finalisez le dossier" text="Ajoutez les documents et effectuez le paiement demandé."/>
                        <ProcessStep number="04" title="Suivez les résultats" text="Consultez les validations, notifications et décisions finales."/>
                    </div>
                </div>
            </section>

            <section className="bg-white py-20 lg:py-24">
                <div className="site-container grid gap-12 lg:grid-cols-[.85fr_1.15fr]">
                    <div>
                        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-[#2A6DF3]"><HelpCircle className="h-6 w-6"/></span>
                        <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#6479dd]">Besoin d’aide ?</p>
                        <h2 className="mt-4 text-4xl font-semibold leading-[1.05] tracking-[-0.055em] text-[#111c59]">Les réponses avant de commencer.</h2>
                        <p className="mt-5 max-w-md leading-7 text-slate-500">Le support reste disponible lorsque votre question nécessite un accompagnement personnalisé.</p>
                        <Button variant="outline" className="mt-7 rounded-md bg-white" onClick={() => navigate('/support')}>Contacter le support <ArrowRight/></Button>
                    </div>
                    <div className="space-y-3">
                        <Faq title="Puis-je déposer plusieurs candidatures ?" text="Oui, vous pouvez candidater à plusieurs concours, dans la limite d'une candidature par concours."/>
                        <Faq title="Comment suivre la validation de mes documents ?" text="Le statut de chaque pièce est affiché directement dans votre espace candidat."/>
                        <Faq title="Où retrouver mon reçu et mes résultats ?" text="Les paiements, reçus, notifications et résultats sont centralisés dans votre tableau de bord."/>
                        <Faq title="Quels établissements sont présents ?" text="Les établissements et concours actuellement référencés sont consultables depuis la page Concours."/>
                    </div>
                </div>
            </section>

            <section className="bg-white py-20">
                <div className="site-container bg-[#2A6DF3] px-7 py-12 text-white sm:px-12 lg:flex lg:items-center lg:justify-between">
                    <div>
                        <p className="text-sm font-medium text-[#aebbf2]">{candidatsTotal.toLocaleString('fr-FR')} candidats utilisent déjà la plateforme</p>
                        <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Votre candidature peut commencer aujourd'hui.</h2>
                    </div>
                    <Button size="lg" className="mt-7 rounded-md bg-white text-[#2A6DF3] hover:bg-blue-50 lg:mt-0" onClick={() => navigate('/concours')}>
                        Voir les concours ouverts <ArrowRight/>
                    </Button>
                </div>
            </section>
        </Layout>
    );
};

const ProductPreview = () => (
    <div className="relative mx-auto min-h-[470px] w-full max-w-[690px]">
        <div className="absolute left-[7%] top-[8%] hidden h-[385px] w-[245px] -rotate-3 rounded-lg border border-slate-200 bg-white shadow-lg sm:block">
            <div className="h-full overflow-hidden rounded-lg bg-white p-4">
                <PreviewHeader/>
                <p className="mt-6 text-xs font-bold text-[#111c59]">Mon dossier</p>
                <div className="mt-3 rounded-md bg-blue-50 p-4">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-[#2A6DF3]">Progression</span>
                        <span className="text-lg font-bold text-[#111c59]">75%</span>
                    </div>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full w-3/4 rounded-full bg-[#2A6DF3]"/></div>
                </div>
                <div className="mt-4 space-y-2">
                    <MiniStatus label="Informations" done/>
                    <MiniStatus label="Documents" done/>
                    <MiniStatus label="Paiement"/>
                </div>
            </div>
        </div>

        <div className="absolute right-[3%] top-[2%] h-[430px] w-[280px] rotate-1 rounded-lg border border-slate-200 bg-white shadow-xl sm:right-[12%]">
            <div className="h-full overflow-hidden rounded-lg bg-white p-4">
                <PreviewHeader/>
                <p className="mt-6 text-[10px] font-medium text-[#8290ae]">Bonjour, candidat</p>
                <h3 className="mt-1 text-lg font-bold text-[#111c59]">Votre candidature</h3>
                <div className="mt-4 rounded-md bg-[#2A6DF3] p-4 text-white">
                    <div className="flex items-center justify-between">
                        <GraduationCap className="h-6 w-6"/>
                        <span className="rounded-full bg-white/15 px-2 py-1 text-[9px]">En cours</span>
                    </div>
                    <p className="mt-7 text-[10px] text-white/70">Session {new Date().getFullYear()}</p>
                    <p className="mt-1 text-sm font-bold">Concours national</p>
                </div>
                <p className="mt-5 text-xs font-bold text-[#111c59]">Prochaines étapes</p>
                <div className="mt-3 space-y-2">
                    <MiniStatus label="Dossier enregistré" done/>
                    <MiniStatus label="Pièces en vérification"/>
                    <MiniStatus label="Résultats à venir"/>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3 text-center text-[8px] text-slate-400">
                    <span className="text-[#2A6DF3]"><LayoutDashboard className="mx-auto mb-1 h-4 w-4"/>Accueil</span>
                    <span><FileText className="mx-auto mb-1 h-4 w-4"/>Dossier</span>
                    <span><CircleUserRound className="mx-auto mb-1 h-4 w-4"/>Profil</span>
                </div>
            </div>
        </div>
    </div>
);

const PreviewHeader = () => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#2A6DF3] text-white"><GraduationCap className="h-3.5 w-3.5"/></span>
            <span className="text-[10px] font-bold text-slate-950">GABConcours</span>
        </div>
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-50"><CircleUserRound className="h-3.5 w-3.5 text-[#2A6DF3]"/></span>
    </div>
);

const MiniStatus = ({label, done = false}: {label: string; done?: boolean}) => (
    <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2.5">
        <span className={`flex h-4 w-4 items-center justify-center rounded-full ${done ? 'bg-emerald-50 text-emerald-500' : 'bg-amber-50 text-amber-500'}`}>
            {done ? <Check className="h-2.5 w-2.5"/> : <span className="h-1.5 w-1.5 rounded-full bg-current"/>}
        </span>
        <span className="text-[9px] font-medium text-slate-500">{label}</span>
    </div>
);

const ContestCard = ({contest, index, onOpen}: {contest: any; index: number; onOpen: () => void}) => {
    return (
        <button onClick={onOpen} className="group flex min-h-[270px] flex-col rounded-md border border-slate-200 bg-white p-6 text-left transition-colors hover:border-[#2A6DF3]">
            <div className="flex items-start justify-between">
                <span className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-[#2A6DF3]"><GraduationCap className="h-6 w-6"/></span>
                <span className="bg-blue-50 px-3 py-1 text-[10px] font-bold text-[#2A6DF3]">Ouvert</span>
            </div>
            <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{contest.etablissement_nomets || 'Établissement partenaire'}</p>
            <h3 className="mt-2 line-clamp-2 text-lg font-bold leading-6 text-[#111c59]">{contest.libcnc}</h3>
            <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4"/> {formatDate(contest.fincnc)}</span>
                <ChevronRight className="h-4 w-4 text-[#2A6DF3] transition-transform group-hover:translate-x-1"/>
            </div>
        </button>
    );
};

const ApplicationPreview = () => (
    <div className="relative border border-blue-100 bg-blue-50 p-4 sm:p-7">
        <div className="overflow-hidden rounded-md border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <PreviewHeader/>
                <Bell className="h-4 w-4 text-slate-400"/>
            </div>
            <div className="grid sm:grid-cols-[140px_1fr]">
                <div className="hidden border-r border-slate-100 bg-[#fbfcff] p-4 sm:block">
                    {['Vue d’ensemble', 'Mon dossier', 'Documents', 'Paiement'].map((label, index) => (
                        <div key={label} className={`mb-2 flex items-center gap-2 rounded-md px-3 py-2 text-[10px] ${index === 0 ? 'bg-blue-50 font-bold text-[#2A6DF3]' : 'text-slate-400'}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current"/>{label}
                        </div>
                    ))}
                </div>
                <div className="p-5 sm:p-7">
                    <p className="text-xs text-slate-400">Vue d'ensemble</p>
                    <h3 className="mt-1 text-xl font-bold text-[#111c59]">Suivi de candidature</h3>
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                        <DashboardStat icon={FileCheck2} label="Dossier" value="Complet"/>
                        <DashboardStat icon={WalletCards} label="Paiement" value="Confirmé"/>
                        <DashboardStat icon={GraduationCap} label="Résultat" value="À venir"/>
                    </div>
                    <div className="mt-5 rounded-xl border border-slate-100 p-4">
                        <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-slate-950">Progression du dossier</span><span className="font-bold text-[#2A6DF3]">75%</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-50"><div className="h-full w-3/4 rounded-full bg-[#2A6DF3]"/></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const DashboardStat = ({icon: Icon, label, value}: {icon: any; label: string; value: string}) => (
    <div className="rounded-md border border-slate-200 p-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-50 text-[#2A6DF3]"><Icon className="h-4 w-4"/></span>
        <p className="mt-4 text-[9px] text-slate-400">{label}</p>
        <p className="mt-0.5 text-xs font-bold text-[#111c59]">{value}</p>
    </div>
);

const Feature = ({icon: Icon, title, text}: {icon: any; title: string; text: string}) => (
    <div className="flex gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#2A6DF3]"><Icon className="h-5 w-5"/></span>
        <div><h3 className="font-bold text-[#111c59]">{title}</h3><p className="mt-1 text-sm leading-6 text-slate-500">{text}</p></div>
    </div>
);

const ServiceCard = ({icon: Icon, title, text}: {icon: any; title: string; text: string}) => (
    <div className="rounded-md border border-slate-200 bg-white p-6">
        <span className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-[#2A6DF3]"><Icon className="h-6 w-6"/></span>
        <h3 className="mt-7 text-lg font-bold text-[#111c59]">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </div>
);

const ProcessStep = ({number, title, text}: {number: string; title: string; text: string}) => (
    <div className="bg-white p-7 sm:p-8">
        <span className="text-xs font-bold tracking-[0.18em] text-[#2A6DF3]">{number}</span>
        <h3 className="mt-8 text-xl font-bold text-slate-950">{title}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
    </div>
);

const Faq = ({title, text}: {title: string; text: string}) => (
    <details className="group rounded-md border border-slate-200 bg-white px-5 py-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-[#111c59]">
            {title}<span className="text-xl font-light text-[#2A6DF3] group-open:rotate-45">+</span>
        </summary>
        <p className="mt-3 pr-8 text-sm leading-6 text-slate-500">{text}</p>
    </details>
);

const formatDate = (value?: string) => {
    if (!value) return 'À confirmer';
    return new Date(value).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'});
};

export default NewHomePage;
