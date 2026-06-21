import React, {useState} from 'react';
import {
    ArrowLeft,
    Eye,
    EyeOff,
    FileCheck2,
    GraduationCap,
    Loader2,
    LockKeyhole,
    LogIn,
    MessageSquareText,
    ShieldCheck,
    Users,
} from 'lucide-react';
import {Link, useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {toast} from '@/hooks/use-toast';

const AdminLogin = () => {
    const navigate = useNavigate();
    const {login} = useAdminAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);
        setLoginError('');

        try {
            const success = await login(email.trim(), password);
            if (success) {
                toast({
                    title: 'Connexion réussie',
                    description: "Bienvenue dans l'interface d'administration",
                });
                navigate('/admin');
            } else {
                setLoginError('Email ou mot de passe incorrect. Vérifiez vos identifiants.');
                toast({
                    title: 'Erreur de connexion',
                    description: 'Email ou mot de passe incorrect',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            console.error('Erreur de connexion:', error);
            setLoginError(error.message || 'Impossible de vous connecter pour le moment.');
            toast({
                title: 'Erreur',
                description: error.message || 'Une erreur est survenue lors de la connexion',
                variant: 'destructive',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen overflow-hidden bg-[#f4f7fb] px-4 py-6 sm:px-6 md:flex md:items-center md:py-10">
            <div className="absolute -left-32 top-24 h-80 w-80 rounded-full bg-blue-100/70 blur-3xl"/>
            <div className="absolute -right-32 bottom-10 h-80 w-80 rounded-full bg-emerald-100/60 blur-3xl"/>
            <div className="absolute inset-x-0 top-0 flex h-1">
                <span className="flex-1 bg-[#009e60]"/>
                <span className="flex-1 bg-[#fcd116]"/>
                <span className="flex-1 bg-[#246bfd]"/>
            </div>

            <div className="relative mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white bg-white shadow-[0_28px_80px_rgba(15,23,42,0.14)] md:min-h-[640px] md:grid-cols-[0.92fr_1.08fr]">
                <aside className="relative overflow-hidden bg-[#13264f] p-7 text-white sm:p-9 md:p-10">
                    <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-white/10"/>
                    <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#246bfd]/20 blur-2xl"/>
                    <div className="relative flex h-full flex-col">
                        <div className="flex items-center gap-3">
                            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#246bfd]">
                                <GraduationCap className="h-5 w-5"/>
                            </span>
                            <div>
                                <p className="font-bold text-white">GABConcours</p>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Administration</p>
                            </div>
                        </div>

                        <div className="my-10 md:my-auto md:py-7">
                            <div className="mb-6">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">Votre espace de travail</p>
                                <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">Pilotez chaque concours simplement.</h1>
                                <p className="mt-3 text-sm leading-6 text-slate-300">
                                    Un accès sécurisé aux candidatures, validations et échanges de votre établissement.
                                </p>
                            </div>

                            <div className="grid gap-3">
                                <LoginFeature icon={Users} title="Candidatures centralisées" description="Consultez les dossiers liés à votre établissement."/>
                                <LoginFeature icon={FileCheck2} title="Validations simplifiées" description="Traitez les documents et suivez leur statut."/>
                                <LoginFeature icon={MessageSquareText} title="Échanges organisés" description="Répondez aux candidats depuis un espace unique."/>
                            </div>
                        </div>

                        <p className="text-xs text-slate-400">République Gabonaise · Service public numérique</p>
                    </div>
                </aside>

                <main className="flex items-center p-7 sm:p-10 md:p-12 lg:p-14">
                    <div className="mx-auto w-full max-w-md">
                        <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-[#246bfd]">
                            <ArrowLeft className="h-4 w-4"/>
                            Retour au site
                        </Link>

                        <div className="mb-8">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#246bfd]">Accès administrateur</p>
                            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">Connexion à votre espace</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-500">
                                Connectez-vous avec les identifiants associés à votre établissement.
                            </p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-5">
                            {loginError && (
                                <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-700">
                                    <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0"/>
                                    <span>{loginError}</span>
                                </div>
                            )}
                            <div>
                                <Label htmlFor="email" className="mb-2 block">Adresse email</Label>
                                <Input id="email" name="email" type="email" value={email} onChange={event => {
                                    setEmail(event.target.value);
                                    setLoginError('');
                                }}
                                       placeholder="admin@gabconcours.ga" required autoComplete="username" autoFocus
                                       aria-invalid={Boolean(loginError)} className="h-12 bg-slate-50"/>
                            </div>
                            <div>
                                <div className="mb-2 flex items-center justify-between gap-4">
                                    <Label htmlFor="password">Mot de passe</Label>
                                    <Link to="/admin/forgot-password" className="text-xs font-semibold text-[#246bfd] hover:underline">
                                        Mot de passe oublié ?
                                    </Link>
                                </div>
                                <div className="relative">
                                    <Input id="password" name="password" type={showPassword ? 'text' : 'password'} value={password}
                                           onChange={event => {
                                               setPassword(event.target.value);
                                               setLoginError('');
                                           }}
                                           placeholder="Votre mot de passe" required autoComplete="current-password"
                                           aria-invalid={Boolean(loginError)} className="h-12 bg-slate-50 pr-11"/>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(value => !value)}
                                        className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 hover:bg-white hover:text-slate-700"
                                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                    </button>
                                </div>
                            </div>
                            <Button type="submit" className="h-12 w-full bg-[#246bfd] font-semibold shadow-lg shadow-blue-600/15 hover:bg-[#1558db]" disabled={isLoading || !email.trim() || !password}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <LogIn className="mr-2 h-4 w-4"/>}
                                {isLoading ? 'Connexion...' : 'Se connecter'}
                            </Button>
                        </form>

                        <div className="mt-8 flex items-start gap-3 border-t border-slate-100 pt-6 text-xs leading-5 text-slate-500">
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#246bfd]"/>
                            <p>Vos accès sont personnels. Toute activité sensible est enregistrée pour protéger la plateforme.</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLogin;

const LoginFeature = ({icon: Icon, title, description}: {icon: any; title: string; description: string}) => (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-blue-200">
            <Icon className="h-4 w-4"/>
        </span>
        <div>
            <p className="text-sm font-semibold text-white">{title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">{description}</p>
        </div>
    </div>
);
