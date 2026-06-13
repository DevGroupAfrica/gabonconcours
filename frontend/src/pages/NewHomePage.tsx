import {useEffect, useRef, useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {motion, useInView} from 'framer-motion';
import {
    ArrowRight,
    ArrowUpRight,
    CalendarDays,
    CheckCircle2,
    FileText,
    GraduationCap,
    Landmark,
    Map,
    WalletCards,
} from 'lucide-react';
import Layout from '@/components/Layout';
import {Button} from '@/components/ui/button';
import {apiService} from '@/services/api';

/* ------------------------------------------------------------------ */
/*  Identité conservée : bleu #2A6DF3 = couleur de marque principale,  */
/*  vert #159a62 et or #f2c94c en accents secondaires (drapeau).        */
/*  Police par défaut (Inter via Tailwind) — aucune nouvelle police.    */
/* ------------------------------------------------------------------ */

interface ApiResponse<T> {
    success: boolean;
    data?: T;
}

interface StatisticsResponse {
    candidats?: { total: number };
}

/* ------------------------------------------------------------------ */
/*  Reveal — léger glissement au scroll                                 */
/* ------------------------------------------------------------------ */

const Reveal = ({children, className, delay = 0}: {children: React.ReactNode; className?: string; delay?: number}) => {
    const ref = useRef(null);
    const inView = useInView(ref, {once: true, margin: '-60px'});
    return (
        <motion.div
            ref={ref}
            initial={{opacity: 0, y: 16}}
            animate={inView ? {opacity: 1, y: 0} : {}}
            transition={{duration: 0.5, ease: [0.22, 1, 0.36, 1], delay}}
            className={className}
        >
            {children}
        </motion.div>
    );
};

/* ------------------------------------------------------------------ */
/*  Compteur                                                             */
/* ------------------------------------------------------------------ */

const CountUp = ({value, duration = 1.1}: {value: number; duration?: number}) => {
    const [display, setDisplay] = useState(0);
    const ref = useRef(null);
    const inView = useInView(ref, {once: true});

    useEffect(() => {
        if (!inView) return;
        let start: number | null = null;
        const step = (timestamp: number) => {
            if (start === null) start = timestamp;
            const progress = Math.min((timestamp - start) / (duration * 1000), 1);
            setDisplay(Math.floor(progress * value));
            if (progress < 1) requestAnimationFrame(step);
            else setDisplay(value);
        };
        requestAnimationFrame(step);
    }, [inView, value, duration]);

    return <span ref={ref}>{display.toLocaleString('fr-FR')}</span>;
};

/* ------------------------------------------------------------------ */
/*  Page                                                                */
/* ------------------------------------------------------------------ */

const NewHomePage = () => {
    const navigate = useNavigate();

    const {data: concoursApi} = useQuery<ApiResponse<any[]>>({
        queryKey: ['concours'],
        queryFn: () => apiService.getConcours<any[]>(),
    });
    const {data: etablissementsApi} = useQuery<ApiResponse<any[]>>({
        queryKey: ['etablissements'],
        queryFn: () => apiService.getEtablissements<any[]>(),
    });
    const {data: statsApi} = useQuery<ApiResponse<StatisticsResponse>>({
        queryKey: ['statistics'],
        queryFn: () => apiService.getStatistics<StatisticsResponse>(),
    });

    const concours = concoursApi?.data || [];
    const concoursActifs = concours.filter((item: any) => item.stacnc === '1');
    const featuredContests = concoursActifs.slice(0, 4);
    const candidatsTotal = statsApi?.data?.candidats?.total || 0;
    const etablissementsCount = etablissementsApi?.data?.length || 0;

    return (
        <Layout>
            {/* ===================================================== HERO === */}
            <section className="relative overflow-hidden border-b border-slate-200 bg-[#fbfaf6]">
                <div className="absolute left-0 top-0 h-1 w-1/3 bg-[#159a62]"/>
                <div className="absolute left-1/3 top-0 h-1 w-1/3 bg-[#f2c94c]"/>
                <div className="absolute right-0 top-0 h-1 w-1/3 bg-[#2A6DF3]"/>
                <motion.div
                    className="absolute -left-32 top-24 h-72 w-72 rounded-full bg-blue-100/45 blur-3xl"
                    animate={{scale: [1, 1.12, 1]}}
                    transition={{duration: 8, repeat: Infinity, ease: 'easeInOut'}}
                />

                <div className="site-container relative grid min-h-[600px] items-center gap-14 py-16 lg:grid-cols-[1fr_1fr] lg:py-24">
                    <motion.div
                        initial={{opacity: 0, y: 16}}
                        animate={{opacity: 1, y: 0}}
                        transition={{duration: 0.5}}
                        className="max-w-2xl"
                    >
                        <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-[#2A6DF3]">
                            <motion.span
                                className="h-2 w-2 rounded-full bg-[#2A6DF3]"
                                animate={{opacity: [1, 0.3, 1]}}
                                transition={{duration: 2, repeat: Infinity}}
                            />
                            Concours nationaux du Gabon
                        </p>
                        <h1 className="text-4xl font-semibold leading-[1.06] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-[68px]">
                            Trouvez la formation qui ouvre votre <span className="text-[#2A6DF3]">prochaine voie</span>.
                        </h1>
                        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-600">
                            Explorez les concours, comprenez les cursus et déposez votre candidature
                            depuis un espace unique.
                        </p>
                        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                            <motion.div whileHover={{scale: 1.02}} whileTap={{scale: 0.98}}>
                                <Button size="lg" className="bg-[#2A6DF3] hover:bg-[#1e54c4]" onClick={() => navigate('/concours')}>
                                    Explorer les concours
                                    <ArrowRight className="h-4 w-4"/>
                                </Button>
                            </motion.div>
                            <motion.div whileHover={{scale: 1.02}} whileTap={{scale: 0.98}}>
                                <Button size="lg" variant="outline" className="border-[#2A6DF3]/30 bg-white text-[#2A6DF3] hover:bg-blue-50" onClick={() => navigate('/connexion')}>
                                    Suivre mon dossier
                                </Button>
                            </motion.div>
                        </div>
                        <div className="mt-12 grid max-w-lg grid-cols-3 border-t border-slate-200 pt-6">
                            <HeroMetric value={concoursActifs.length} label="Concours ouverts"/>
                            <HeroMetric value={etablissementsCount} label="Établissements"/>
                            <HeroMetric value={candidatsTotal} label="Candidats"/>
                        </div>
                    </motion.div>

                    {/* Carte "convocation" — élément signature, en bleu */}
                    <Reveal delay={0.15} className="relative">
                        <div className="relative mx-auto max-w-md rounded-2xl bg-[#2A6DF3] p-1 shadow-[0_24px_60px_-24px_rgba(42,109,243,0.55)]">
                            <div className="rounded-[14px] bg-white p-7">
                                <div className="flex items-center justify-between border-b border-dashed border-slate-200 pb-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A6DF3]">Convocation</p>
                                        <p className="mt-1 text-lg font-semibold text-slate-950">Session {new Date().getFullYear()}</p>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#2A6DF3]">
                                        <GraduationCap className="h-6 w-6"/>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3">
                                    {[
                                        {label: 'Inscription enregistrée', done: true},
                                        {label: 'Pièces du dossier validées', done: true},
                                        {label: 'Paiement confirmé', done: true},
                                    ].map((item, i) => (
                                        <motion.div
                                            key={item.label}
                                            initial={{opacity: 0, x: -12}}
                                            whileInView={{opacity: 1, x: 0}}
                                            viewport={{once: true}}
                                            transition={{delay: 0.2 + i * 0.12, duration: 0.4}}
                                            className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                                        >
                                            <CheckCircle2 className="h-4 w-4 text-[#159a62]"/>
                                            {item.label}
                                        </motion.div>
                                    ))}
                                </div>

                                <div className="mt-5 flex items-center justify-between rounded-lg bg-blue-50 px-4 py-3">
                                    <div>
                                        <p className="text-xs font-semibold text-[#2A6DF3]">Prochaine étape</p>
                                        <p className="mt-0.5 text-xs text-slate-500">Publication des résultats</p>
                                    </div>
                                    <ArrowUpRight className="h-4 w-4 text-[#2A6DF3]"/>
                                </div>
                            </div>
                        </div>

                        {/* Pastille flottante */}
                        <motion.div
                            animate={{y: [0, -8, 0]}}
                            transition={{duration: 4, repeat: Infinity, ease: 'easeInOut'}}
                            className="absolute -right-4 -top-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#f2c94c] text-slate-900 shadow-lg"
                        >
                            <span className="text-xl font-bold">100%</span>
                        </motion.div>
                    </Reveal>
                </div>
            </section>

            {/* --------------------------------------------------- QUICK LINKS */}
            <section className="relative z-10 border-b bg-white">
                <Reveal className="site-container grid md:grid-cols-3">
                    <QuickLink
                        icon={GraduationCap}
                        title="Voir les concours"
                        text="Découvrez les inscriptions ouvertes"
                        onClick={() => navigate('/concours')}
                    />
                    <QuickLink
                        icon={FileText}
                        title="Suivre ma candidature"
                        text="Consultez l'état de votre dossier"
                        onClick={() => navigate('/connexion')}
                    />
                    <QuickLink
                        icon={WalletCards}
                        title="Paiement & frais"
                        text="Tout savoir sur les frais de concours"
                        onClick={() => navigate('/support')}
                    />
                </Reveal>
            </section>

            {/* ============================================ TICKETS CONCOURS === */}
            <section className="site-container py-20">
                <Reveal>
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                        <div className="max-w-2xl">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A6DF3]">Candidatures en cours</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">Concours ouverts</h2>
                            <p className="mt-4 max-w-xl leading-7 text-slate-600">
                                Consultez les dernières opportunités et préparez votre dossier avant la date limite.
                            </p>
                        </div>
                        <Button variant="outline" className="border-[#2A6DF3]/30 text-[#2A6DF3] hover:bg-blue-50" onClick={() => navigate('/concours')}>
                            Tous les concours
                            <ArrowRight className="h-4 w-4"/>
                        </Button>
                    </div>
                </Reveal>

                <div className="mt-10 grid gap-5 sm:grid-cols-2">
                    {featuredContests.length > 0 ? featuredContests.map((contest: any, index: number) => (
                        <Reveal key={contest.id} delay={index * 0.06}>
                            <ConcoursTicket contest={contest} onOpen={() => navigate(`/concours/${contest.id}`)}/>
                        </Reveal>
                    )) : (
                        <Reveal className="sm:col-span-2">
                            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-6 py-14 text-center">
                                <GraduationCap className="mx-auto h-8 w-8 text-slate-400"/>
                                <p className="mt-4 font-medium text-slate-700">Aucun concours ouvert actuellement</p>
                                <p className="mt-1 text-sm text-slate-500">Revenez prochainement pour consulter les nouvelles sessions.</p>
                            </div>
                        </Reveal>
                    )}
                </div>
            </section>

            {/* ===================================================== PARCOURS === */}
            <section className="border-y border-slate-200 bg-[#f6f9fd] py-20">
                <Reveal className="site-container grid items-center gap-14 lg:grid-cols-[0.88fr_1.12fr]">
                    <div className="max-w-2xl">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2A6DF3]">Comprendre son parcours</p>
                        <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-slate-950 sm:text-4xl">
                            Du cursus au concours, chaque choix doit rester lisible.
                        </h2>
                        <p className="mt-4 max-w-xl leading-7 text-slate-600">
                            GABConcours rassemble les concours nationaux et aide chaque candidat à relier
                            niveau d'étude, filière et établissement.
                        </p>
                    </div>
                    <div className="grid overflow-hidden rounded-xl border border-slate-200 bg-white sm:grid-cols-3">
                        <Journey icon={Map} number="01" title="Choisir un cursus" text="Repérez les niveaux et filières qui correspondent à votre projet."/>
                        <Journey icon={Landmark} number="02" title="Identifier le concours" text="Consultez les conditions des établissements publics et partenaires."/>
                        <Journey icon={GraduationCap} number="03" title="Construire la suite" text="Suivez les résultats et préparez votre prochaine étape académique."/>
                    </div>
                </Reveal>
            </section>
        </Layout>
    );
};

/* ------------------------------------------------------------------ */
/*  Concours ticket — élément signature, bleu                          */
/* ------------------------------------------------------------------ */

const ConcoursTicket = ({contest, onOpen}: {contest: any; onOpen: () => void}) => {
    const ref = String(contest.id ?? '').padStart(5, '0');

    return (
        <motion.button
            onClick={onOpen}
            whileHover={{y: -4}}
            transition={{type: 'spring', stiffness: 280, damping: 22}}
            className="group flex w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-left shadow-sm transition-shadow hover:border-[#2A6DF3] hover:shadow-lg"
        >
            <div className="flex-1 p-6">
                <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#159a62]"/>
                        Ouvert
                    </span>
                    <span className="text-xs font-medium text-slate-400">Réf. {ref}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold leading-7 tracking-tight text-slate-950">
                    {contest.libcnc}
                </h3>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                    {contest.etablissement_nomets || 'Établissement public partenaire'}
                </p>
            </div>

            {/* Souche détachable */}
            <div className="relative flex w-28 flex-col items-center justify-between border-l border-dashed border-slate-200 bg-blue-50/60 px-3 py-5 text-center">
                <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.06)]"/>
                <CalendarDays className="h-4 w-4 text-[#2A6DF3]"/>
                <div>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-slate-400">Limite</p>
                    <p className="mt-1 text-sm font-semibold text-slate-800">{formatDate(contest.fincnc)}</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-[#2A6DF3] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"/>
                <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-white shadow-[0_0_0_1px_rgba(15,23,42,0.06)]"/>
            </div>
        </motion.button>
    );
};

/* ------------------------------------------------------------------ */
/*  Small components                                                    */
/* ------------------------------------------------------------------ */

const QuickLink = ({icon: Icon, title, text, onClick}: {icon: any; title: string; text: string; onClick: () => void}) => (
    <motion.button
        whileHover={{backgroundColor: 'rgba(248,250,252,1)'}}
        onClick={onClick}
        className="group flex items-center gap-4 border-b border-slate-200 px-5 py-6 text-left transition-colors md:border-b-0 md:border-r md:last:border-r-0"
    >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[#2A6DF3] transition-transform group-hover:scale-105">
            <Icon className="h-5 w-5"/>
        </div>
        <div className="min-w-0 flex-1">
            <p className="font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-sm text-slate-500">{text}</p>
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-[#2A6DF3]"/>
    </motion.button>
);

const HeroMetric = ({value, label}: {value: number; label: string}) => (
    <div>
        <p className="text-2xl font-semibold text-slate-950"><CountUp value={value}/></p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{label}</p>
    </div>
);

const Journey = ({icon: Icon, number, title, text}: {icon: any; number: string; title: string; text: string}) => (
    <motion.div
        whileHover={{backgroundColor: 'rgba(248,250,252,1)'}}
        className="border-b border-slate-200 p-6 transition-colors last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
    >
        <div className="flex items-center justify-between">
            <Icon className="h-5 w-5 text-[#2A6DF3]"/>
            <span className="font-mono text-xs text-slate-300">{number}</span>
        </div>
        <h3 className="mt-10 font-semibold text-slate-950">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
    </motion.div>
);

const formatDate = (value?: string) => {
    if (!value) return 'À confirmer';
    return new Date(value).toLocaleDateString('fr-FR', {day: '2-digit', month: 'short', year: 'numeric'});
};

export default NewHomePage;