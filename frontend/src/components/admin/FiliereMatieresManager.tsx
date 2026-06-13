import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog';
import { Plus, Trash2, Save, TrendingUp } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

interface FiliereMatiere {
    id: number;
    filiere_id: number;
    matiere_id: number;
    coefficient: number;
    obligatoire: boolean;
    nom_matiere: string;
    duree?: string;
}

interface Matiere {
    id: number;
    nom_matiere: string;
    duree?: string;
    description?: string;
}

interface FiliereMatieresManagerProps {
    filiereId: number;
    filiereNom: string;
}

const FiliereMatieresManager: React.FC<FiliereMatieresManagerProps> = ({
    filiereId,
    filiereNom
}) => {
    const queryClient = useQueryClient();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedMatiere, setSelectedMatiere] = useState<number | null>(null);
    const [coefficient, setCoefficient] = useState<number>(1);
    const [obligatoire, setObligatoire] = useState<boolean>(true);

    // Récupérer les matières de la filière
    const { data: filiereMatieresData, isLoading } = useQuery({
        queryKey: ['filiere-matieres', filiereId],
        queryFn: async () => {
            const response = await apiService.makeRequest(
                `/filiere-matieres/filiere/${filiereId}`,
                'GET'
            );
            return response.data || [];
        }
    });

    // Récupérer toutes les matières disponibles
    const { data: allMatieresData } = useQuery({
        queryKey: ['matieres-all'],
        queryFn: async () => {
            const response = await apiService.makeRequest('/matieres', 'GET');
            return response.data || [];
        }
    });

    // Récupérer le total des coefficients
    const { data: coefficientsData } = useQuery({
        queryKey: ['filiere-coefficients', filiereId],
        queryFn: async () => {
            const response = await apiService.makeRequest(
                `/filiere-matieres/coefficients/${filiereId}`,
                'GET'
            );
            return response.data || {};
        }
    });

    // Mutation pour ajouter une matière
    const addMatiereMutation = useMutation({
        mutationFn: async (data: {
            matiere_id: number;
            coefficient: number;
            obligatoire: boolean;
        }) => {
            return await apiService.makeRequest('/filiere-matieres', 'POST', {
                filiere_id: filiereId,
                ...data
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['filiere-matieres', filiereId] });
            queryClient.invalidateQueries({ queryKey: ['filiere-coefficients', filiereId] });
            toast({
                title: 'Succès',
                description: 'Matière ajoutée à la filière',
            });
            setIsAddDialogOpen(false);
            setSelectedMatiere(null);
            setCoefficient(1);
            setObligatoire(true);
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: error.message || 'Erreur lors de l\'ajout de la matière',
            });
        }
    });

    // Mutation pour supprimer une matière
    const deleteMatiereMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiService.makeRequest(`/filiere-matieres/${id}`, 'DELETE');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['filiere-matieres', filiereId] });
            queryClient.invalidateQueries({ queryKey: ['filiere-coefficients', filiereId] });
            toast({
                title: 'Succès',
                description: 'Matière retirée de la filière',
            });
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: error.message || 'Erreur lors de la suppression',
            });
        }
    });

    // Mutation pour mettre à jour une matière
    const updateMatiereMutation = useMutation({
        mutationFn: async ({ id, data }: { id: number; data: any }) => {
            return await apiService.makeRequest(`/filiere-matieres/${id}`, 'PUT', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['filiere-matieres', filiereId] });
            queryClient.invalidateQueries({ queryKey: ['filiere-coefficients', filiereId] });
            toast({
                title: 'Succès',
                description: 'Matière mise à jour',
            });
        }
    });

    const handleAddMatiere = () => {
        if (!selectedMatiere) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Veuillez sélectionner une matière',
            });
            return;
        }

        addMatiereMutation.mutate({
            matiere_id: selectedMatiere,
            coefficient,
            obligatoire
        });
    };

    const matieresDejAjoutees = filiereMatieresData?.map((fm: FiliereMatiere) => fm.matiere_id) || [];
    const matieresDisponibles = allMatieresData?.filter(
        (m: Matiere) => !matieresDejAjoutees.includes(m.id)
    ) || [];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Matières de la filière - {filiereNom}</CardTitle>
                    {coefficientsData && (
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                Total coefficients: <strong>{coefficientsData.total_coefficients || 0}</strong>
                            </span>
                            <span>
                                Matières: <strong>{coefficientsData.nombre_matieres || 0}</strong>
                            </span>
                            <span>
                                Obligatoires: <strong>{coefficientsData.matieres_obligatoires || 0}</strong>
                            </span>
                        </div>
                    )}
                </div>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter une matière
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ajouter une matière à la filière</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium">Matière</label>
                                <select
                                    className="w-full mt-1 p-2 border rounded-md"
                                    value={selectedMatiere || ''}
                                    onChange={(e) => setSelectedMatiere(Number(e.target.value))}
                                >
                                    <option value="">Sélectionner une matière</option>
                                    {matieresDisponibles.map((matiere: Matiere) => (
                                        <option key={matiere.id} value={matiere.id}>
                                            {matiere.nom_matiere} {matiere.duree ? `(${matiere.duree})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Coefficient</label>
                                <Input
                                    type="number"
                                    min="0.5"
                                    max="10"
                                    step="0.5"
                                    value={coefficient}
                                    onChange={(e) => setCoefficient(Number(e.target.value))}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="obligatoire"
                                    checked={obligatoire}
                                    onCheckedChange={(checked) => setObligatoire(checked as boolean)}
                                />
                                <label
                                    htmlFor="obligatoire"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                    Matière obligatoire
                                </label>
                            </div>
                            <Button
                                onClick={handleAddMatiere}
                                disabled={addMatiereMutation.isPending}
                                className="w-full"
                            >
                                <Save className="w-4 h-4 mr-2" />
                                Enregistrer
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-center py-8">Chargement...</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Matière</TableHead>
                                <TableHead>Durée</TableHead>
                                <TableHead>Coefficient</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filiereMatieresData && filiereMatieresData.length > 0 ? (
                                filiereMatieresData.map((fm: FiliereMatiere) => (
                                    <TableRow key={fm.id}>
                                        <TableCell className="font-medium">{fm.nom_matiere}</TableCell>
                                        <TableCell>{fm.duree || '-'}</TableCell>
                                        <TableCell>
                                            <Input
                                                type="number"
                                                min="0.5"
                                                max="10"
                                                step="0.5"
                                                defaultValue={fm.coefficient}
                                                className="w-20"
                                                onBlur={(e) => {
                                                    const newValue = Number(e.target.value);
                                                    if (newValue !== fm.coefficient) {
                                                        updateMatiereMutation.mutate({
                                                            id: fm.id,
                                                            data: { coefficient: newValue }
                                                        });
                                                    }
                                                }}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={fm.obligatoire ? 'default' : 'secondary'}>
                                                {fm.obligatoire ? 'Obligatoire' : 'Optionnelle'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => deleteMatiereMutation.mutate(fm.id)}
                                                disabled={deleteMatiereMutation.isPending}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                                        Aucune matière associée à cette filière
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
        </Card>
    );
};

export default FiliereMatieresManager;
