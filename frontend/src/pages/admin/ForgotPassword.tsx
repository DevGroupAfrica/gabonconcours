import React, {useState} from 'react';
import {ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck} from 'lucide-react';
import {Link} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        const response = await fetch('http://localhost:8002/api/admin/auth/forgot-password', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({email}),
        });
        const data = await response.json();
        setMessage(data.message);
        setLoading(false);
    };

    return (
        <AuthShell eyebrow="Récupération sécurisée" title="Retrouvez l’accès à votre espace"
                   text="Saisissez l’adresse associée à votre compte administrateur.">
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <Label htmlFor="email" className="mb-2 block">Adresse email</Label>
                    <Input id="email" type="email" value={email} onChange={event => setEmail(event.target.value)}
                           required className="h-11 bg-slate-50"/>
                </div>
                <Button className="h-11 w-full bg-[#246bfd] font-semibold hover:bg-[#1558db]" disabled={loading}>
                    <Mail className="mr-2 h-4 w-4"/>{loading ? 'Envoi...' : 'Recevoir le lien'}
                </Button>
                {message && <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm leading-6 text-blue-800">{message}</p>}
                <Link to="/admin/login" className="flex items-center justify-center gap-2 text-sm font-medium text-slate-500 hover:text-[#246bfd]">
                    <ArrowLeft className="h-4 w-4"/>Retour à la connexion
                </Link>
            </form>
        </AuthShell>
    );
};

export const AuthShell = ({eyebrow, title, text, children}: any) => (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f6f2] px-4 py-6 sm:px-6 md:flex md:items-center md:py-10">
        <div className="absolute inset-x-0 top-0 flex h-1">
            <span className="flex-1 bg-[#009e60]"/>
            <span className="flex-1 bg-[#fcd116]"/>
            <span className="flex-1 bg-[#246bfd]"/>
        </div>

        <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)] md:min-h-[600px] md:grid-cols-[0.88fr_1.12fr]">
            <aside className="relative overflow-hidden bg-[#172033] p-8 text-white sm:p-10 md:p-12">
                <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full border border-white/10"/>
                <div className="absolute -bottom-28 -left-20 h-64 w-64 rounded-full border border-white/10"/>
                <div className="relative flex h-full flex-col">
                    <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#246bfd]">
                            <ShieldCheck className="h-5 w-5"/>
                        </span>
                        <div>
                            <p className="font-bold">GABConcours</p>
                            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Administration</p>
                        </div>
                    </div>

                    <div className="my-12 md:my-auto md:py-10">
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300">
                            <KeyRound className="h-3.5 w-3.5 text-[#63d29a]"/>
                            Récupération sécurisée
                        </span>
                        <h2 className="mt-6 text-3xl font-bold leading-tight">Un accès perdu ne doit pas bloquer votre travail.</h2>
                        <p className="mt-4 text-sm leading-6 text-slate-300">
                            La récupération est rapide, vérifiée et limitée dans le temps.
                        </p>

                        <div className="mt-8 space-y-4">
                            {['Saisissez votre adresse email', 'Recevez un lien personnel', 'Choisissez un nouveau mot de passe'].map((step, index) => (
                                <div key={step} className="flex items-center gap-3 text-sm text-slate-200">
                                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-[10px] font-bold text-[#63d29a]">
                                        {index + 1}
                                    </span>
                                    <span>{step}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p className="flex items-center gap-2 text-xs text-slate-500">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#63d29a]"/>
                        Assistance sécurisée GABConcours
                    </p>
                </div>
            </aside>

            <main className="flex items-center p-7 sm:p-10 md:p-12 lg:p-14">
                <div className="mx-auto w-full max-w-md">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#246bfd]">{eyebrow}</p>
                    <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
                    <p className="mb-8 mt-3 text-sm leading-6 text-slate-500">{text}</p>
                    {children}
                    <div className="mt-8 flex items-start gap-3 border-t border-slate-100 pt-6 text-xs leading-5 text-slate-500">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#009e60]"/>
                        <p>Le lien envoyé est personnel et expire automatiquement après une courte durée.</p>
                    </div>
                </div>
            </main>
        </div>
    </div>
);

export default ForgotPassword;

