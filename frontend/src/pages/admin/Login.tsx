import React, {useState} from 'react';
import {ArrowLeft, CheckCircle2, GraduationCap, LogIn, ShieldCheck} from 'lucide-react';
import {Link, useNavigate} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {toast} from '@/hooks/use-toast';

const capabilities = [
    'Suivre les candidatures et les paiements',
    'Contrôler les pièces justificatives',
    'Piloter les concours et les résultats',
];

const AdminLogin = () => {
    const navigate = useNavigate();
    const {login} = useAdminAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (event: React.FormEvent) => {
        event.preventDefault();
        setIsLoading(true);

        try {
            const success = await login(email, password);
            if (success) {
                toast({
                    title: 'Connexion réussie',
                    description: "Bienvenue dans l'interface d'administration",
                });
                navigate('/admin');
            } else {
                toast({
                    title: 'Erreur de connexion',
                    description: 'Email ou mot de passe incorrect',
                    variant: 'destructive',
                });
            }
        } catch (error: any) {
            console.error('Erreur de connexion:', error);
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
        <div className="relative min-h-screen overflow-hidden bg-[#f4f6f2] px-4 py-6 sm:px-6 md:flex md:items-center md:py-10">
            <div className="absolute inset-x-0 top-0 flex h-1">
                <span className="flex-1 bg-[#009e60]"/>
                <span className="flex-1 bg-[#fcd116]"/>
                <span className="flex-1 bg-[#246bfd]"/>
            </div>

            <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)] md:min-h-[620px] md:grid-cols-[0.88fr_1.12fr]">
                <aside className="relative overflow-hidden bg-[#172033] p-8 text-white sm:p-10 md:p-12">
                    <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10"/>
                    <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full border border-white/10"/>

                    <div className="relative flex h-full flex-col">
                        <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#246bfd]">
                                <GraduationCap className="h-5 w-5"/>
                            </span>
                            <div>
                                <p className="font-bold">GABConcours</p>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Administration</p>
                            </div>
                        </div>

                        <div className="my-12 md:my-auto md:py-10">
                            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
                                <ShieldCheck className="h-3.5 w-3.5 text-[#63d29a]"/>
                                Espace sécurisé
                            </span>
                            <h1 className="mt-6 text-3xl font-bold leading-tight sm:text-4xl">
                                L’essentiel pour piloter chaque concours.
                            </h1>
                            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">
                                Retrouvez les dossiers, les validations et les décisions dans un espace de travail unique.
                            </p>

                            <div className="mt-8 space-y-4">
                                {capabilities.map(capability => (
                                    <div key={capability} className="flex items-center gap-3 text-sm text-slate-200">
                                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#63d29a]"/>
                                        <span>{capability}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <p className="text-xs text-slate-500">République Gabonaise · Service public numérique</p>
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
                            <div>
                                <Label htmlFor="email" className="mb-2 block">Adresse email</Label>
                                <Input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)}
                                       placeholder="admin@gabconcours.ga" required className="h-11 bg-slate-50"/>
                            </div>
                            <div>
                                <div className="mb-2 flex items-center justify-between gap-4">
                                    <Label htmlFor="password">Mot de passe</Label>
                                    <Link to="/admin/forgot-password" className="text-xs font-semibold text-[#246bfd] hover:underline">
                                        Mot de passe oublié ?
                                    </Link>
                                </div>
                                <Input id="password" type="password" value={password} onChange={event => setPassword(event.target.value)}
                                       placeholder="Votre mot de passe" required className="h-11 bg-slate-50"/>
                            </div>
                            <Button type="submit" className="h-11 w-full bg-[#246bfd] font-semibold hover:bg-[#1558db]" disabled={isLoading}>
                                <LogIn className="mr-2 h-4 w-4"/>
                                {isLoading ? 'Connexion...' : 'Se connecter'}
                            </Button>
                        </form>

                        <div className="mt-8 flex items-start gap-3 border-t border-slate-100 pt-6 text-xs leading-5 text-slate-500">
                            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#009e60]"/>
                            <p>Vos accès sont personnels. Toute activité sensible est enregistrée pour protéger la plateforme.</p>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLogin;
