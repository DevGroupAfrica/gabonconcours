import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {toast} from '@/hooks/use-toast';
import {User, Mail, Lock, Eye, EyeOff, Save} from 'lucide-react';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {apiService} from '@/services/api';

interface AdminProfileProps {
    admin?: { role: string; id: number; etablissement_nom: string; nom: string; prenom: string; email: string }
}


const AdminProfile: React.FC = ({admin}: AdminProfileProps) => {

    const [loading, setLoading] = useState(false);
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const [profileData, setProfileData] = useState({
        nom: admin?.nom || '',
        prenom: admin?.prenom || '',
        email: admin?.email || ''
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    function refreshAdmin() {

    }

    const handleUpdateProfile = async () => {
        try {
            setLoading(true);

            const response = await apiService.makeRequest(`/administrateurs/${admin?.id}`, 'PUT', profileData);

            if (response.success) {
                toast({
                    title: 'Succès',
                    description: 'Profil mis à jour avec succès'
                });
                if (admin) refreshAdmin();
            } else {
                toast({
                    title: 'Erreur',
                    description: response.message || 'Erreur lors de la mise à jour',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Erreur mise à jour profil:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de mettre à jour le profil',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast({
                title: 'Erreur',
                description: 'Les mots de passe ne correspondent pas',
                variant: 'destructive'
            });
            return;
        }

        if (passwordData.newPassword.length < 8) {
            toast({
                title: 'Erreur',
                description: 'Le mot de passe doit contenir au moins 8 caractères',
                variant: 'destructive'
            });
            return;
        }

        try {
            setLoading(true);

            const response = await apiService.makeRequest(`/administrateurs/${admin?.id}/password`, 'PUT', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            if (response.success) {
                toast({
                    title: 'Succès',
                    description: 'Mot de passe changé avec succès'
                });
                setPasswordData({currentPassword: '', newPassword: '', confirmPassword: ''});
            } else {
                toast({
                    title: 'Erreur',
                    description: response.message || 'Erreur lors du changement de mot de passe',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Erreur changement mot de passe:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de changer le mot de passe',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
        setShowPasswords(prev => ({...prev, [field]: !prev[field]}));
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold">Profil Administrateur</h1>
                <p className="text-muted-foreground">Gérez vos informations personnelles</p>
            </div>

            {/* Informations du profil */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5"/>
                        Informations du profil
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="nom">Nom</Label>
                            <Input
                                id="nom"
                                value={profileData.nom}
                                onChange={(e) => setProfileData({...profileData, nom: e.target.value})}
                            />
                        </div>
                        <div>
                            <Label htmlFor="prenom">Prénom</Label>
                            <Input
                                id="prenom"
                                value={profileData.prenom}
                                onChange={(e) => setProfileData({...profileData, prenom: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground"/>
                            <Input
                                id="email"
                                type="email"
                                value={profileData.email}
                                onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <Label>Rôle</Label>
                        <Input value={admin?.role || ''} disabled className="bg-muted"/>
                    </div>
                    <div>
                        <Label>Établissement</Label>
                        <Input value={admin?.etablissement_nom || ''} disabled className="bg-muted"/>
                    </div>
                    <Button onClick={handleUpdateProfile} disabled={loading} className="w-full">
                        <Save className="h-4 w-4 mr-2"/>
                        Mettre à jour le profil
                    </Button>
                </CardContent>
            </Card>

            {/* Changer le mot de passe */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5"/>
                        Changer le mot de passe
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="currentPassword"
                                type={showPasswords.current ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePasswordVisibility('current')}
                            >
                                {showPasswords.current ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="newPassword"
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})}
                                placeholder="Min. 8 caractères"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePasswordVisibility('new')}
                            >
                                {showPasswords.new ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                            </Button>
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="confirmPassword"
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => togglePasswordVisibility('confirm')}
                            >
                                {showPasswords.confirm ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                            </Button>
                        </div>
                    </div>
                    <Button onClick={handleChangePassword} disabled={loading} className="w-full">
                        <Lock className="h-4 w-4 mr-2"/>
                        Changer le mot de passe
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default AdminProfile;