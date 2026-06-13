import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Shield } from 'lucide-react';
import { api } from '@/services/api';
import { toast } from '@/hooks/use-toast';

interface Admin {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    etablissement_id: number;
    etablissement_nom?: string;
    statut: string;
}

interface Etablissement {
    id: number;
    nomets: string;
}

const AdminManagement: React.FC = () => {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
    const [formData, setFormData] = useState({
        nom: '',
        prenom: '',
        email: '',
        etablissement_id: '',
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [adminsRes, etablissementsRes] = await Promise.all([
                api.get('/admin/management/admins'),
                api.get('/etablissements'),
            ]);

            if (adminsRes.data.success) {
                setAdmins(adminsRes.data.data);
            }
            if (etablissementsRes.data.success) {
                setEtablissements(etablissementsRes.data.data);
            }
        } catch (error) {
            console.error('Erreur chargement données:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les données',
                variant: 'destructive',
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingAdmin) {
                const response = await api.put(
                    `/admin/management/admins/${editingAdmin.id}`,
                    formData
                );
                if (response.data.success) {
                    toast({
                        title: 'Succès',
                        description: 'Administrateur modifié avec succès',
                    });
                }
            } else {
                const response = await api.post('/admin/management/admins', formData);
                if (response.data.success) {
                    toast({
                        title: 'Succès',
                        description: 'Administrateur créé avec succès. Les identifiants ont été envoyés par email.',
                    });
                }
            }

            setIsDialogOpen(false);
            setFormData({ nom: '', prenom: '', email: '', etablissement_id: '' });
            setEditingAdmin(null);
            loadData();
        } catch (error: any) {
            toast({
                title: 'Erreur',
                description: error.response?.data?.message || 'Une erreur est survenue',
                variant: 'destructive',
            });
        }
    };

    const handleEdit = (admin: Admin) => {
        setEditingAdmin(admin);
        setFormData({
            nom: admin.nom,
            prenom: admin.prenom,
            email: admin.email,
            etablissement_id: admin.etablissement_id.toString(),
        });
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cet administrateur ?')) {
            return;
        }

        try {
            const response = await api.delete(`/admin/management/admins/${id}`);
            if (response.data.success) {
                toast({
                    title: 'Succès',
                    description: 'Administrateur supprimé avec succès',
                });
                loadData();
            }
        } catch (error: any) {
            toast({
                title: 'Erreur',
                description: error.response?.data?.message || 'Une erreur est survenue',
                variant: 'destructive',
            });
        }
    };

    const getRoleBadge = (role: string) => {
        const colors = {
            super_admin: 'bg-red-100 text-red-800',
            admin_etablissement: 'bg-blue-100 text-blue-800',
            admin_concours: 'bg-green-100 text-green-800',
        };
        return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Gestion des Administrateurs
                </CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => {
                                setEditingAdmin(null);
                                setFormData({ nom: '', prenom: '', email: '', etablissement_id: '' });
                            }}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Nouvel Admin
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingAdmin ? 'Modifier' : 'Créer'} un administrateur
                            </DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label htmlFor="nom">Nom</Label>
                                <Input
                                    id="nom"
                                    value={formData.nom}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nom: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="prenom">Prénom</Label>
                                <Input
                                    id="prenom"
                                    value={formData.prenom}
                                    onChange={(e) =>
                                        setFormData({ ...formData, prenom: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="etablissement">Établissement</Label>
                                <Select
                                    value={formData.etablissement_id}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, etablissement_id: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un établissement" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {etablissements.map((etab) => (
                                            <SelectItem key={etab.id} value={etab.id.toString()}>
                                                {etab.nomets}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsDialogOpen(false)}
                                >
                                    Annuler
                                </Button>
                                <Button type="submit">
                                    {editingAdmin ? 'Modifier' : 'Créer'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {admins.map((admin) => (
                        <div
                            key={admin.id}
                            className="flex items-center justify-between p-4 border rounded-lg"
                        >
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">
                                        {admin.prenom} {admin.nom}
                                    </h3>
                                    <span
                                        className={`px-2 py-1 rounded text-xs ${getRoleBadge(
                                            admin.role
                                        )}`}
                                    >
                                        {admin.role === 'super_admin'
                                            ? 'Super Admin'
                                            : admin.role === 'admin_etablissement'
                                            ? 'Admin Établissement'
                                            : 'Admin Concours'}
                                    </span>
                                </div>
                                <p className="text-sm text-muted-foreground">{admin.email}</p>
                                <p className="text-xs text-muted-foreground">
                                    {admin.etablissement_nom}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEdit(admin)}
                                    disabled={admin.role === 'super_admin'}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDelete(admin.id)}
                                    disabled={admin.role === 'super_admin'}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};

export default AdminManagement;
