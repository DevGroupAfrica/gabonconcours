import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Lock } from 'lucide-react';
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
        <div className="space-y-6">
            {/* Profil */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" /> Informations du profil
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
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
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" /> Changer le mot de passe
                    </CardTitle>
                </CardHeader>
                <CardContent>
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
    );
};

export default AdminProfileSettings;
