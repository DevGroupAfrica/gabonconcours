import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock, Mail, ShieldCheck } from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

const AdminProfileSettings: React.FC = () => {
    const { admin, setAdmin } = useAdminAuth(); // ✅ contexte

    // ✅ Les hooks sont définis avant toute condition
    const [profileData, setProfileData] = useState({
        nom: admin?.nom || '',
        prenom: admin?.prenom || '',
        email: admin?.email || '',
    });

    const [passwordData, setPasswordData] = useState({
        current_password: '',
        new_password: '',
        confirm_password: '',
    });

    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

    if (!admin) {
        return <p className="text-center text-red-500">Aucun administrateur connecté.</p>;
    }

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdatingProfile(true);
        try {
            const response = await apiService.makeRequest(
                `/admin/management/admins/${admin.id}`,
                'PUT',
                profileData
            );

            if (response.success) {
                toast({ title: 'Succès', description: 'Profil mis à jour avec succès' });
                // @ts-ignore
                setAdmin(response.data);
            } else throw new Error(response.message);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erreur inconnue';
            toast({
                title: 'Erreur',
                description: message,
                variant: 'destructive',
            });
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (passwordData.new_password !== passwordData.confirm_password) {
            return toast({
                title: 'Erreur',
                description: 'Les mots de passe ne correspondent pas',
                variant: 'destructive',
            });
        }

        setIsUpdatingPassword(true);

        try {
            const response = await apiService.updateAdminPassword(admin.id, {
                current_password: passwordData.current_password,
                new_password: passwordData.new_password,
            });

            if (response.success) {
                toast({ title: 'Succès', description: 'Mot de passe modifié avec succès' });
                setPasswordData({ current_password: '', new_password: '', confirm_password: '' });
            } else throw new Error(response.message);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Erreur inconnue';
            toast({ title: 'Erreur', description: message, variant: 'destructive' });
        } finally {
            setIsUpdatingPassword(false);
        }
    };

    return (
        <div className="space-y-5">
            <section className="flex flex-col justify-between gap-5 rounded-md border border-slate-200 bg-white p-6 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-md bg-blue-50 text-xl font-bold text-[#2A6DF3]">{admin.prenom?.[0]}{admin.nom?.[0]}</span>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2A6DF3]">Profil administrateur</p>
                        <h1 className="mt-1 text-2xl font-bold text-slate-950">{admin.prenom} {admin.nom}</h1>
                        <p className="mt-1 flex items-center gap-2 text-sm text-slate-500"><Mail className="h-4 w-4"/>{admin.email}</p>
                    </div>
                </div>
                <span className="inline-flex items-center gap-2 self-start border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-[#2A6DF3] sm:self-auto">
                    <ShieldCheck className="h-4 w-4"/>Compte actif · {admin.role}
                </span>
            </section>

            <div className="grid gap-5 lg:grid-cols-2">
            <Card className="rounded-md border-slate-200 shadow-none">
                <CardHeader className="border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <User className="h-5 w-5 text-[#2A6DF3]" /> Informations du profil
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="nom">Nom</Label>
                                <Input
                                    id="nom"
                                    value={profileData.nom}
                                    onChange={(e) => setProfileData({ ...profileData, nom: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="prenom">Prénom</Label>
                                <Input
                                    id="prenom"
                                    value={profileData.prenom}
                                    onChange={(e) => setProfileData({ ...profileData, prenom: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                required
                            />
                        </div>
                        <Button type="submit" disabled={isUpdatingProfile}>
                            {isUpdatingProfile ? 'Mise à jour...' : 'Mettre à jour le profil'}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Mot de passe */}
            <Card className="rounded-md border-slate-200 shadow-none">
                <CardHeader className="border-b border-slate-100">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Lock className="h-5 w-5 text-[#2A6DF3]" /> Changer le mot de passe
                    </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                        <Label>Mot de passe actuel</Label>
                        <Input
                            type="password"
                            value={passwordData.current_password}
                            onChange={(e) =>
                                setPasswordData({ ...passwordData, current_password: e.target.value })
                            }
                            required
                        />
                        <Label>Nouveau mot de passe</Label>
                        <Input
                            type="password"
                            value={passwordData.new_password}
                            onChange={(e) =>
                                setPasswordData({ ...passwordData, new_password: e.target.value })
                            }
                            required
                        />
                        <Label>Confirmer le mot de passe</Label>
                        <Input
                            type="password"
                            value={passwordData.confirm_password}
                            onChange={(e) =>
                                setPasswordData({ ...passwordData, confirm_password: e.target.value })
                            }
                            required
                        />
                        <Button type="submit" disabled={isUpdatingPassword}>
                            {isUpdatingPassword ? 'Modification...' : 'Changer le mot de passe'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
            </div>
        </div>
    );
};

export default AdminProfileSettings;
