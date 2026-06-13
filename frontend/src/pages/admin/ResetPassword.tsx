import React, {useState} from 'react';
import {CheckCircle2, KeyRound} from 'lucide-react';
import {Link, useParams} from 'react-router-dom';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {AuthShell} from './ForgotPassword';

const ResetPassword = () => {
    const {token} = useParams();
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [message, setMessage] = useState('');
    const [success, setSuccess] = useState(false);

    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (password !== confirmation) return setMessage('Les mots de passe ne correspondent pas.');
        const response = await fetch('http://localhost:8002/api/admin/auth/reset-password', {
            method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({token, new_password: password}),
        });
        const data = await response.json();
        setMessage(data.message);
        setSuccess(response.ok);
    };

    return <AuthShell eyebrow="Nouveau mot de passe" title="Sécurisez votre compte" text="Choisissez un mot de passe d’au moins 8 caractères.">
        <form onSubmit={submit} className="space-y-5">
            <div><Label className="mb-2 block">Nouveau mot de passe</Label><Input className="h-11 bg-slate-50" type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required/></div>
            <div><Label className="mb-2 block">Confirmer le mot de passe</Label><Input className="h-11 bg-slate-50" type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} minLength={8} required/></div>
            <Button className="h-11 w-full bg-[#246bfd] font-semibold hover:bg-[#1558db]"><KeyRound className="h-4 w-4"/>Mettre à jour</Button>
            {message && <p className={`rounded-md border p-3 text-sm ${success ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : 'border-red-100 bg-red-50 text-red-700'}`}>{message}</p>}
            {success && <Link to="/admin/login" className="flex items-center justify-center gap-2 text-sm font-semibold text-primary"><CheckCircle2 className="h-4 w-4"/>Se connecter</Link>}
        </form>
    </AuthShell>;
};

export default ResetPassword;

