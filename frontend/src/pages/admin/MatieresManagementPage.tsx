import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { apiService } from '@/services/api';
import { Pencil, Trash2, Plus, BookOpen } from 'lucide-react';

const MatieresManagementPage = () => {
    const queryClient = useQueryClient();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedMatiere, setSelectedMatiere] = useState<any>(null);
    const [searchTerm, setSearchTerm] = useState('');
    
    const [formData, setFormData] = useState({
        nom: '',
        code: '',
        coefficient: 1,
        type: 'ecrit',
        description: ''
    });

    // Récupérer les matières
    const { data: matieres, isLoading } = useQuery({
        queryKey: ['matieres'],
        queryFn: async () => {
            const response = await apiService.makeRequest('/matieres', 'GET');
            return response.data;
        }
    });

    // Créer une matière
    const createMutation = useMutation({
        mutationFn: async (data: any) => {
            return await apiService.makeRequest('/matieres', 'POST', data);
        },
        onSuccess: () => {
            toast({ title: 'Succès', description: 'Matière créée avec succès' });
            queryClient.invalidateQueries({ queryKey: ['matieres'] });
            setIsCreateOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({ 
                title: 'Erreur', 
                description: error.response?.data?.message || 'Impossible de créer la matière',
                variant: 'destructive'
            });
        }
    });

    // Mettre à jour une matière
    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: any) => {
            return await apiService.makeRequest(`/matieres/${id}`, 'PUT', data);
        },
        onSuccess: () => {
            toast({ title: 'Succès', description: 'Matière mise à jour avec succès' });
            queryClient.invalidateQueries({ queryKey: ['matieres'] });
            setIsEditOpen(false);
            resetForm();
        },
        onError: (error: any) => {
            toast({ 
                title: 'Erreur', 
                description: error.response?.data?.message || 'Impossible de mettre à jour la matière',
                variant: 'destructive'
            });
        }
    });

    // Supprimer une matière
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiService.makeRequest(`/matieres/${id}`, 'DELETE');
        },
        onSuccess: () => {
            toast({ title: 'Succès', description: 'Matière supprimée avec succès' });
            queryClient.invalidateQueries({ queryKey: ['matieres'] });
        },
        onError: (error: any) => {
            toast({ 
                title: 'Erreur', 
                description: error.response?.data?.message || 'Impossible de supprimer la matière',
                variant: 'destructive'
            });
        }
    });

    const resetForm = () => {
        setFormData({
            nom: '',
            code: '',
            coefficient: 1,
            type: 'ecrit',
            description: ''
        });
        setSelectedMatiere(null);
    };

    const handleCreate = () => {
        createMutation.mutate(formData);
    };

    const handleUpdate = () => {
        if (selectedMatiere) {
            updateMutation.mutate({ id: selectedMatiere.id, data: formData });
        }
    };

    const handleEdit = (matiere: any) => {
        setSelectedMatiere(matiere);
        setFormData({
            nom: matiere.nom_matiere || matiere.nom,
            code: matiere.code_matiere || matiere.code || '',
            coefficient: matiere.coefficient || 1,
            type: matiere.type || 'ecrit',
            description: matiere.description || ''
        });
        setIsEditOpen(true);
    };

    const handleDelete = (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette matière ?')) {
            deleteMutation.mutate(id);
        }
    };

    const filteredMatieres = matieres?.filter((matiere: any) =>
        (matiere.nom_matiere || matiere.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (matiere.code_matiere || matiere.code || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const FormFields = () => (
        <div className="space-y-4">
            <div>
                <Label htmlFor="nom">Nom de la matière *</Label>
                <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    placeholder="Ex: Mathématiques"
                    required
                />
            </div>
            
            <div>
                <Label htmlFor="code">Code de la matière</Label>
                <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: MATH101"
                />
            </div>

            <div>
                <Label htmlFor="coefficient">Coefficient *</Label>
                <Input
                    id="coefficient"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.coefficient}
                    onChange={(e) => setFormData({ ...formData, coefficient: parseInt(e.target.value) })}
                    required
                />
            </div>

            <div>
                <Label htmlFor="type">Type d'épreuve</Label>
                <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="ecrit">Écrit</SelectItem>
                        <SelectItem value="oral">Oral</SelectItem>
                        <SelectItem value="pratique">Pratique</SelectItem>
                        <SelectItem value="td">TD</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Description de la matière"
                />
            </div>
        </div>
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <BookOpen className="h-8 w-8" />
                        Gestion des Matières
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Gérez les matières pour les concours et filières
                    </p>
                </div>
                
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => resetForm()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Nouvelle Matière
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Créer une Nouvelle Matière</DialogTitle>
                        </DialogHeader>
                        <FormFields />
                        <Button
                            onClick={handleCreate}
                            disabled={createMutation.isPending || !formData.nom}
                            className="w-full"
                        >
                            Créer
                        </Button>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Liste des Matières ({filteredMatieres?.length || 0})</CardTitle>
                        <Input
                            placeholder="Rechercher une matière..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <p>Chargement...</p>
                    ) : filteredMatieres && filteredMatieres.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Coefficient</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredMatieres.map((matiere: any) => (
                                    <TableRow key={matiere.id}>
                                        <TableCell className="font-medium">
                                            {matiere.nom_matiere || matiere.nom}
                                        </TableCell>
                                        <TableCell>{matiere.code_matiere || matiere.code || '-'}</TableCell>
                                        <TableCell>{matiere.coefficient}</TableCell>
                                        <TableCell className="capitalize">{matiere.type || 'écrit'}</TableCell>
                                        <TableCell className="max-w-xs truncate">
                                            {matiere.description || '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(matiere)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(matiere.id)}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <p className="text-center text-muted-foreground py-8">
                            Aucune matière trouvée
                        </p>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Modifier la Matière</DialogTitle>
                    </DialogHeader>
                    <FormFields />
                    <Button
                        onClick={handleUpdate}
                        disabled={updateMutation.isPending || !formData.nom}
                        className="w-full"
                    >
                        Mettre à jour
                    </Button>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default MatieresManagementPage;
