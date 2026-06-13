import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

interface CrudManagerProps {
    entity: 'concours' | 'etablissements' | 'filieres' | 'matieres';
    title: string;
}

const CrudManager: React.FC<CrudManagerProps> = ({ entity, title }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});
    const queryClient = useQueryClient();

    // Récupérer les données
    const { data, isLoading } = useQuery({
        queryKey: [entity],
        queryFn: async () => {
            const response = await apiService.makeRequest(`/super-admin/${entity}`, 'GET');
            return response.data;
        },
    });

    // Mutation création
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return apiService.makeRequest(`/super-admin/${entity}`, 'POST', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [entity] });
            toast({ title: 'Créé avec succès' });
            setIsOpen(false);
            setFormData({});
        },
        onError: (error: any) => {
            toast({
                title: 'Erreur',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation mise à jour
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            return apiService.makeRequest(`/super-admin/${entity}/${id}`, 'PUT', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [entity] });
            toast({ title: 'Mis à jour avec succès' });
            setIsOpen(false);
            setEditingItem(null);
            setFormData({});
        },
        onError: (error: any) => {
            toast({
                title: 'Erreur',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    // Mutation suppression
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return apiService.makeRequest(`/super-admin/${entity}/${id}`, 'DELETE');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: [entity] });
            toast({ title: 'Supprimé avec succès' });
        },
        onError: (error: any) => {
            toast({
                title: 'Erreur',
                description: error.message,
                variant: 'destructive',
            });
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            updateMutation.mutate({ id: editingItem.id, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (item: any) => {
        setEditingItem(item);
        setFormData(item);
        setIsOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
            deleteMutation.mutate(id);
        }
    };

    const renderForm = () => {
        switch (entity) {
            case 'matieres':
                return (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="nom_matiere">Nom de la matière</Label>
                            <Input
                                id="nom_matiere"
                                value={formData.nom_matiere || ''}
                                onChange={(e) => setFormData({ ...formData, nom_matiere: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="coefficient">Coefficient</Label>
                            <Input
                                id="coefficient"
                                type="number"
                                value={formData.coefficient || 1}
                                onChange={(e) => setFormData({ ...formData, coefficient: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="duree">Durée (heures)</Label>
                            <Input
                                id="duree"
                                type="number"
                                value={formData.duree || 2}
                                onChange={(e) => setFormData({ ...formData, duree: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </>
                );
            // Ajouter d'autres cas pour concours, établissements, filières
            default:
                return <p>Formulaire non disponible pour cette entité</p>;
        }
    };

    const renderTable = () => {
        if (!data || data.length === 0) {
            return <p className="text-center text-muted-foreground">Aucune donnée disponible</p>;
        }

        const items = data;

        return (
            <div className="space-y-2">
                {items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                            <p className="font-semibold">
                                {item.nom_matiere || item.nomfil || item.nomets || item.libcnc}
                            </p>
                            {item.description && (
                                <p className="text-sm text-muted-foreground">{item.description}</p>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleEdit(item)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleDelete(item.id)}
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    if (isLoading) {
        return <div className="animate-pulse">Chargement...</div>;
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>{title}</CardTitle>
                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger asChild>
                            <Button onClick={() => { setEditingItem(null); setFormData({}); }}>
                                <Plus className="h-4 w-4 mr-2" />
                                Ajouter
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>
                                    {editingItem ? 'Modifier' : 'Ajouter'} {title}
                                </DialogTitle>
                            </DialogHeader>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {renderForm()}
                                <div className="flex justify-end gap-2">
                                    <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                                        Annuler
                                    </Button>
                                    <Button type="submit">
                                        {editingItem ? 'Mettre à jour' : 'Créer'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>{renderTable()}</CardContent>
        </Card>
    );
};

export default CrudManager;
