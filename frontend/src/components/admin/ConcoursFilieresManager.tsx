import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Trash2, Users, Save } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';

interface ConcoursFiliere {
    id: number;
    concours_id: number;
    filiere_id: number;
    places_disponibles: number;
    nomfil: string;
    niveau_nom?: string;
}

interface Filiere {
    id: number;
    nomfil: string;
    niveau_id: number;
    niveau_nomniv?: string;
}

interface ConcoursFilieresManagerProps {
    concoursId: number;
    concoursLibelle: string;
}

const ConcoursFilieresManager: React.FC<ConcoursFilieresManagerProps> = ({
    concoursId,
    concoursLibelle
}) => {
    const queryClient = useQueryClient();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [selectedFiliere, setSelectedFiliere] = useState<number | null>(null);
    const [placesDisponibles, setPlacesDisponibles] = useState<number>(0);

    // Récupérer les filières du concours
    const { data: concoursFilieresData, isLoading: loadingFilières } = useQuery({
        queryKey: ['concours-filieres', concoursId],
        queryFn: async () => {
            const response = await apiService.makeRequest(
                `/concours-filieres/concours/${concoursId}`,
                'GET'
            );
            return response.data || [];
        }
    });

    // Récupérer toutes les filières disponibles
    const { data: allFilieresData } = useQuery({
        queryKey: ['filieres-all'],
        queryFn: async () => {
            const response = await apiService.makeRequest('/filieres', 'GET');
            return response.data || [];
        }
    });

    // Mutation pour ajouter une filière
    const addFiliereMutation = useMutation({
        mutationFn: async (data: { filiere_id: number; places_disponibles: number }) => {
            return await apiService.makeRequest('/concours-filieres', 'POST', {
                concours_id: concoursId,
                ...data
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['concours-filieres', concoursId] });
            toast({
                title: 'Succès',
                description: 'Filière ajoutée au concours',
            });
            setIsAddDialogOpen(false);
            setSelectedFiliere(null);
            setPlacesDisponibles(0);
        },
        onError: (error: any) => {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: error.message || 'Erreur lors de l\'ajout de la filière',
            });
        }
    });

    // Mutation pour supprimer une filière
    const deleteFiliereMutation = useMutation({
        mutationFn: async (id: number) => {
            return await apiService.makeRequest(`/concours-filieres/${id}`, 'DELETE');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['concours-filieres', concoursId] });
            toast({
                title: 'Succès',
                description: 'Filière retirée du concours',
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

    // Mutation pour mettre à jour les places
    const updatePlacesMutation = useMutation({
        mutationFn: async ({ id, places }: { id: number; places: number }) => {
            return await apiService.makeRequest(`/concours-filieres/${id}`, 'PUT', {
                places_disponibles: places
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['concours-filieres', concoursId] });
            toast({
                title: 'Succès',
                description: 'Places disponibles mises à jour',
            });
        }
    });

    const handleAddFiliere = () => {
        if (!selectedFiliere) {
            toast({
                variant: 'destructive',
                title: 'Erreur',
                description: 'Veuillez sélectionner une filière',
            });
            return;
        }

        addFiliereMutation.mutate({
            filiere_id: selectedFiliere,
            places_disponibles: placesDisponibles
        });
    };

    const filieresDejAjoutees = concoursFilieresData?.map((cf: ConcoursFiliere) => cf.filiere_id) || [];
    const filieresDisponibles = allFilieresData?.filter(
        (f: Filiere) => !filieresDejAjoutees.includes(f.id)
    ) || [];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Filières du concours - {concoursLibelle}</CardTitle>
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter une filière
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ajouter une filière au concours</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                            <div>
                                <label className="text-sm font-medium">Filière</label>
                                <select
                                    className="w-full mt-1 p-2 border rounded-md"
                                    value={selectedFiliere || ''}
                                    onChange={(e) => setSelectedFiliere(Number(e.target.value))}
                                >
                                    <option value="">Sélectionner une filière</option>
                                    {filieresDisponibles.map((filiere: Filiere) => (
                                        <option key={filiere.id} value={filiere.id}>
                                            {filiere.nomfil} {filiere.niveau_nomniv ? `(${filiere.niveau_nomniv})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Places disponibles</label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={placesDisponibles}
                                    onChange={(e) => setPlacesDisponibles(Number(e.target.value))}
                                    placeholder="Nombre de places"
                                />
                            </div>
                            <Button
                                onClick={handleAddFiliere}
                                disabled={addFiliereMutation.isPending}
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
                {loadingFilières ? (
                    <div className="text-center py-8">Chargement...</div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Filière</TableHead>
                                <TableHead>Niveau</TableHead>
                                <TableHead>Places disponibles</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {concoursFilieresData && concoursFilieresData.length > 0 ? (
                                concoursFilieresData.map((cf: ConcoursFiliere) => (
                                    <TableRow key={cf.id}>
                                        <TableCell className="font-medium">{cf.nomfil}</TableCell>
                                        <TableCell>
                                            {cf.niveau_nom && (
                                                <Badge variant="outline">{cf.niveau_nom}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    defaultValue={cf.places_disponibles}
                                                    className="w-24"
                                                    onBlur={(e) => {
                                                        const newValue = Number(e.target.value);
                                                        if (newValue !== cf.places_disponibles) {
                                                            updatePlacesMutation.mutate({
                                                                id: cf.id,
                                                                places: newValue
                                                            });
                                                        }
                                                    }}
                                                />
                                                <Users className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => deleteFiliereMutation.mutate(cf.id)}
                                                disabled={deleteFiliereMutation.isPending}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                                        Aucune filière associée à ce concours
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

export default ConcoursFilieresManager;
