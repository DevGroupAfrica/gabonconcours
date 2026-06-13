import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, BookOpen, School } from 'lucide-react';
import { apiService } from '@/services/api';

const ConcoursFilieresManagement = () => {
    const [concours, setConcours] = useState<any[]>([]);
    const [etablissements, setEtablissements] = useState<any[]>([]);
    const [filieres, setFilieres] = useState<any[]>([]);
    const [selectedEtablissement, setSelectedEtablissement] = useState('');
    const [selectedConcours, setSelectedConcours] = useState('');
    const [concoursFilieresExistantes, setConcoursFilieresExistantes] = useState<any[]>([]);
    const [selectedFilieres, setSelectedFilieres] = useState<Set<number>>(new Set());
    const [placesDisponibles, setPlacesDisponibles] = useState<Record<number, number>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadEtablissements();
        loadFilieres();
    }, []);

    useEffect(() => {
        if (selectedEtablissement) {
            loadConcoursByEtablissement(selectedEtablissement);
        }
    }, [selectedEtablissement]);

    useEffect(() => {
        if (selectedConcours) {
            loadConcoursFilieresExistantes(selectedConcours);
        }
    }, [selectedConcours]);

    const loadEtablissements = async () => {
        try {
            const response = await apiService.makeRequest<any[]>('/etablissements', 'GET');
            const data = response.data || response; // <-- important
            if (data && Array.isArray(data)) {
                setEtablissements(data);
            }
        } catch (error) {
            console.error('Erreur chargement établissements:', error);
        }
    };

   const loadFilieres = async () => {
  try {
    const response = await apiService.makeRequest<any[]>('/filieres', 'GET');
    const data = response.data || response; // <-- important
    if (data && Array.isArray(data)) {
      setFilieres(data);
    }
  } catch (error) {
    console.error('Erreur chargement filières:', error);
  }
};


    const loadConcoursByEtablissement = async (etablissementId: string) => {
        try {
            const response = await apiService.makeRequest<any[]>(`/concours?etablissement_id=${etablissementId}`, 'GET');
            if (response.success && response.data) {
                setConcours(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement concours:', error);
        }
    };

    const loadConcoursFilieresExistantes = async (concoursId: string) => {
        try {
            const response = await apiService.makeRequest<any[]>(`/concours-filieres/concours/${concoursId}`, 'GET');
            if (response.success && response.data) {
                setConcoursFilieresExistantes(response.data);
                
                // Pré-sélectionner les filières existantes
                const existingFiliereIds = new Set(response.data.map((cf: any) => cf.filiere_id));
                setSelectedFilieres(existingFiliereIds);
                
                // Charger les places disponibles
                const places: Record<number, number> = {};
                response.data.forEach((cf: any) => {
                    places[cf.filiere_id] = cf.places_disponibles || 0;
                });
                setPlacesDisponibles(places);
            }
        } catch (error) {
            console.error('Erreur chargement filières du concours:', error);
        }
    };

    const toggleFiliere = (filiereId: number) => {
        const newSelected = new Set(selectedFilieres);
        if (newSelected.has(filiereId)) {
            newSelected.delete(filiereId);
            const newPlaces = { ...placesDisponibles };
            delete newPlaces[filiereId];
            setPlacesDisponibles(newPlaces);
        } else {
            newSelected.add(filiereId);
            setPlacesDisponibles({ ...placesDisponibles, [filiereId]: 0 });
        }
        setSelectedFilieres(newSelected);
    };

    const handlePlacesChange = (filiereId: number, places: number) => {
        setPlacesDisponibles({
            ...placesDisponibles,
            [filiereId]: places
        });
    };

    const handleSave = async () => {
        if (!selectedConcours) {
            toast({
                title: 'Concours requis',
                description: 'Veuillez sélectionner un concours',
                variant: 'destructive'
            });
            return;
        }

        if (selectedFilieres.size === 0) {
            toast({
                title: 'Aucune filière sélectionnée',
                description: 'Veuillez sélectionner au moins une filière',
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(true);

        try {
            const filieresData = Array.from(selectedFilieres).map(filiereId => ({
                filiere_id: filiereId,
                places_disponibles: placesDisponibles[filiereId] || 0
            }));

            const response = await apiService.makeRequest(
                `/concours-filieres/concours/${selectedConcours}/bulk`,
                'POST',
                { filieres: filieresData }
            );

            if (response.success) {
                toast({
                    title: 'Succès',
                    description: `${filieresData.length} filière(s) associée(s) au concours`
                });
                loadConcoursFilieresExistantes(selectedConcours);
            }
        } catch (error: any) {
            console.error('Erreur sauvegarde:', error);
            toast({
                title: 'Erreur',
                description: error.message || 'Impossible de sauvegarder les filières',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette association ?')) return;

        try {
            const response = await apiService.makeRequest(`/concours-filieres/${id}`, 'DELETE');
            if (response.success) {
                toast({
                    title: 'Supprimé',
                    description: 'Association supprimée avec succès'
                });
                loadConcoursFilieresExistantes(selectedConcours);
            }
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible de supprimer',
                variant: 'destructive'
            });
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-6 w-6" />
                        Gestion Concours - Filières
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Sélection établissement et concours */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label>Établissement</Label>
                            <Select value={selectedEtablissement} onValueChange={setSelectedEtablissement}>
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

                        <div>
                            <Label>Concours</Label>
                            <Select 
                                value={selectedConcours} 
                                onValueChange={setSelectedConcours}
                                disabled={!selectedEtablissement}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner un concours" />
                                </SelectTrigger>
                                <SelectContent>
                                    {concours.map((c) => (
                                        <SelectItem key={c.id} value={c.id.toString()}>
                                            {c.libcnc}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Liste des filières disponibles */}
                    {selectedConcours && (
                        <>
                            <div>
                                <Label className="text-lg mb-4 block">Filières disponibles</Label>
                                <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                                    {filieres.map((filiere) => (
                                        <div 
                                            key={filiere.id}
                                            className={`p-4 border rounded-lg ${
                                                selectedFilieres.has(filiere.id)
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-muted'
                                            } hover:shadow-md transition-all cursor-pointer`}
                                            onClick={() => toggleFiliere(filiere.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedFilieres.has(filiere.id)}
                                                        onChange={() => {}}
                                                        className="h-4 w-4"
                                                    />
                                                    <div>
                                                        <p className="font-medium">{filiere.nomfil}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {filiere.niveau_nomniv || 'Niveau non spécifié'}
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedFilieres.has(filiere.id) && (
                                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                        <Label className="text-sm">Places:</Label>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            value={placesDisponibles[filiere.id] || 0}
                                                            onChange={(e) => handlePlacesChange(filiere.id, parseInt(e.target.value) || 0)}
                                                            className="w-24"
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={handleSave} disabled={isLoading} className="w-full">
                                <Save className="mr-2 h-4 w-4" />
                                {isLoading ? 'Enregistrement...' : 'Enregistrer les filières'}
                            </Button>
                        </>
                    )}

                    {/* Filières déjà associées */}
                    {concoursFilieresExistantes.length > 0 && (
                        <div className="mt-6">
                            <Label className="text-lg mb-4 block">Filières déjà associées</Label>
                            <div className="space-y-2">
                                {concoursFilieresExistantes.map((cf) => (
                                    <div key={cf.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <div>
                                            <p className="font-medium">{cf.nomfil}</p>
                                            <p className="text-sm text-muted-foreground">
                                                Places disponibles: {cf.places_disponibles}
                                            </p>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(cf.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ConcoursFilieresManagement;
