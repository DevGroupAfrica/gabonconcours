import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Building, BookOpen, Plus, Trash2, AlertCircle } from 'lucide-react';
import { apiService } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ErrorModal from '@/components/modals/ErrorModal';
import SuccessModal from '@/components/modals/SuccessModal';

const GestionConcoursFilieresPage = () => {
    const queryClient = useQueryClient();
    const { toast } = useToast();
    
    const [selectedEtablissement, setSelectedEtablissement] = useState<string>('');
    const [selectedConcours, setSelectedConcours] = useState<string>('');
    const [selectedFiliere, setSelectedFiliere] = useState<string>('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    // Récupérer les établissements
    const { data: etablissements } = useQuery({
        queryKey: ['etablissements'],
        queryFn: async () => {
            const response = await apiService.makeRequest('/etablissements', 'GET');
            return Array.isArray(response.data) ? response.data : (response.data?.data || []);
        }
    });

    // Récupérer les concours filtrés par établissement
    const { data: concours, refetch: refetchConcours } = useQuery({
        queryKey: ['concours-by-etablissement', selectedEtablissement],
        queryFn: async () => {
            if (!selectedEtablissement) return [];
            const response = await apiService.makeRequest(
                `/concours?etablissement_id=${selectedEtablissement}`, 
                'GET'
            );
            return Array.isArray(response.data) ? response.data : (response.data?.data || []);
        },
        enabled: !!selectedEtablissement
    });

    // Récupérer toutes les filières
    const { data: filieres } = useQuery({
        queryKey: ['filieres'],
        queryFn: async () => {
            const response = await apiService.makeRequest('/filieres', 'GET');
            return response.data;
        }
    });

    // Récupérer les filières associées au concours sélectionné
    const { data: concoursFilieresAssociees, refetch: refetchAssociations } = useQuery({
        queryKey: ['concours-filieres', selectedConcours],
        queryFn: async () => {
            if (!selectedConcours) return [];
            const response = await apiService.makeRequest(
                `/concours-filieres/concours/${selectedConcours}`,
                'GET'
            );
            return response.data;
        },
        enabled: !!selectedConcours
    });

    // Vérifier si l'établissement a des concours
    useEffect(() => {
        if (selectedEtablissement && concours && concours.length === 0) {
            setErrorMessage("Cet établissement n'a pas de concours. Veuillez d'abord lui en attribuer.");
            setShowErrorModal(true);
            setSelectedConcours('');
        }
    }, [concours, selectedEtablissement]);

    // Mutation pour ajouter une association
    const addAssociationMutation = useMutation({
        mutationFn: async () => {
            const response = await apiService.makeRequest('/concours-filieres', 'POST', {
                concours_id: parseInt(selectedConcours),
                filiere_id: parseInt(selectedFiliere)
            });
            return response;
        },
        onSuccess: () => {
            setSuccessMessage('Filière associée au concours avec succès !');
            setShowSuccessModal(true);
            setSelectedFiliere('');
            refetchAssociations();
            queryClient.invalidateQueries({ queryKey: ['concours-filieres'] });
        },
        onError: (error: any) => {
            setErrorMessage(error.response?.data?.message || 'Erreur lors de l\'association');
            setShowErrorModal(true);
        }
    });

    // Mutation pour supprimer une association
    const deleteAssociationMutation = useMutation({
        mutationFn: async (associationId: number) => {
            await apiService.makeRequest(`/concours-filieres/${associationId}`, 'DELETE');
        },
        onSuccess: () => {
            setSuccessMessage('Association supprimée avec succès');
            setShowSuccessModal(true);
            refetchAssociations();
            queryClient.invalidateQueries({ queryKey: ['concours-filieres'] });
        },
        onError: () => {
            setErrorMessage('Erreur lors de la suppression');
            setShowErrorModal(true);
        }
    });

    const handleAddAssociation = () => {
        if (!selectedConcours || !selectedFiliere) {
            setErrorMessage('Veuillez sélectionner un concours et une filière');
            setShowErrorModal(true);
            return;
        }
        addAssociationMutation.mutate();
    };

    const handleDeleteAssociation = (id: number) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette association ?')) {
            deleteAssociationMutation.mutate(id);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <BookOpen className="h-8 w-8 text-primary" />
                    Gestion Concours - Filières
                </h1>
                <p className="text-muted-foreground mt-2">
                    Associez les filières aux concours de chaque établissement
                </p>
            </div>

            {/* Sélection établissement et concours */}
            <Card className="animate-fade-in">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Sélection du Concours
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Établissement</label>
                            <Select 
                                value={selectedEtablissement} 
                                onValueChange={(value) => {
                                    setSelectedEtablissement(value);
                                    setSelectedConcours('');
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un établissement" />
                                </SelectTrigger>
                                <SelectContent>
                                    {etablissements?.map((etab: any) => (
                                        <SelectItem key={etab.id} value={etab.id.toString()}>
                                            {etab.nom}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Concours</label>
                            <Select 
                                value={selectedConcours} 
                                onValueChange={setSelectedConcours}
                                disabled={!selectedEtablissement || !concours || concours.length === 0}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un concours" />
                                </SelectTrigger>
                                <SelectContent>
                                    {concours?.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.nom}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {selectedEtablissement && concours && concours.length === 0 && (
                        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
                            <AlertCircle className="h-5 w-5" />
                            <p className="text-sm">Cet établissement n'a pas encore de concours</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Ajout de filière */}
            {selectedConcours && (
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Plus className="h-5 w-5" />
                            Ajouter une Filière au Concours
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <Select 
                                value={selectedFiliere} 
                                onValueChange={setSelectedFiliere}
                                className="flex-1"
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner une filière" />
                                </SelectTrigger>
                                <SelectContent>
                                    {filieres?.filter((f: any) => 
                                        !concoursFilieresAssociees?.some((cf: any) => cf.filiere_id === f.id)
                                    ).map((filiere: any) => (
                                        <SelectItem key={filiere.id} value={filiere.id.toString()}>
                                            {filiere.nom}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button 
                                onClick={handleAddAssociation}
                                disabled={!selectedFiliere || addAssociationMutation.isPending}
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Ajouter
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Liste des filières associées */}
            {selectedConcours && (
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle>
                            Filières Associées ({concoursFilieresAssociees?.length || 0})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {concoursFilieresAssociees && concoursFilieresAssociees.length > 0 ? (
                            <div className="space-y-3">
                                {concoursFilieresAssociees.map((association: any) => (
                                    <div
                                        key={association.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline">{association.filiere_nom}</Badge>
                                            <span className="text-sm text-muted-foreground">
                                                {association.filiere_code}
                                            </span>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDeleteAssociation(association.id)}
                                            disabled={deleteAssociationMutation.isPending}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">
                                    Aucune filière associée à ce concours
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Modales */}
            <ErrorModal
                isOpen={showErrorModal}
                onClose={() => setShowErrorModal(false)}
                message={errorMessage}
            />
            <SuccessModal
                isOpen={showSuccessModal}
                onClose={() => setShowSuccessModal(false)}
                message={successMessage}
            />
        </div>
    );
};

export default GestionConcoursFilieresPage;
