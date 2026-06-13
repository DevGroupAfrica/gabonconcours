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
import { Plus, Trash2, Save, BookMarked, GraduationCap } from 'lucide-react';
import { apiService } from '@/services/api';

const FiliereMatieresManagement = () => {
    const [filieres, setFilieres] = useState<any[]>([]);
    const [matieres, setMatieres] = useState<any[]>([]);
    const [selectedFiliere, setSelectedFiliere] = useState('');
    const [filiereMatieresExistantes, setFiliereMatieresExistantes] = useState<any[]>([]);
    const [selectedMatieres, setSelectedMatieres] = useState<Set<number>>(new Set());
    const [coefficients, setCoefficients] = useState<Record<number, number>>({});
    const [obligatoires, setObligatoires] = useState<Record<number, boolean>>({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadFilieres();
        loadMatieres();
    }, []);

    useEffect(() => {
        if (selectedFiliere) {
            loadFiliereMatieresExistantes(selectedFiliere);
        }
    }, [selectedFiliere]);

   const loadFilieres = async () => {
  try {
    const response = await apiService.makeRequest<any[]>('/filieres', 'GET');
    const data = response.data || response; 
    if (data && Array.isArray(data)) {
      setFilieres(data);
    }
  } catch (error) {
    console.error('Erreur chargement filières:', error);
  }
};


    const loadMatieres = async () => {
        try {
            const response = await apiService.makeRequest<any[]>('/matieres', 'GET');
            if (response.success && response.data) {
                setMatieres(response.data);
            }
        } catch (error) {
            console.error('Erreur chargement matières:', error);
        }
    };

    const loadFiliereMatieresExistantes = async (filiereId: string) => {
        try {
            const response = await apiService.makeRequest<any[]>(`/filiere-matieres/filiere/${filiereId}`, 'GET');
            if (response.success && response.data) {
                setFiliereMatieresExistantes(response.data);
                
                // Pré-sélectionner les matières existantes
                const existingMatiereIds = new Set(response.data.map((fm: any) => fm.matiere_id));
                setSelectedMatieres(existingMatiereIds);
                
                // Charger les coefficients et obligations
                const coefs: Record<number, number> = {};
                const oblig: Record<number, boolean> = {};
                response.data.forEach((fm: any) => {
                    coefs[fm.matiere_id] = fm.coefficient || 1.0;
                    oblig[fm.matiere_id] = Boolean(fm.obligatoire);
                });
                setCoefficients(coefs);
                setObligatoires(oblig);
            }
        } catch (error) {
            console.error('Erreur chargement matières de la filière:', error);
        }
    };

    const toggleMatiere = (matiereId: number) => {
        const newSelected = new Set(selectedMatieres);
        if (newSelected.has(matiereId)) {
            newSelected.delete(matiereId);
            const newCoefs = { ...coefficients };
            const newOblig = { ...obligatoires };
            delete newCoefs[matiereId];
            delete newOblig[matiereId];
            setCoefficients(newCoefs);
            setObligatoires(newOblig);
        } else {
            newSelected.add(matiereId);
            setCoefficients({ ...coefficients, [matiereId]: 1.0 });
            setObligatoires({ ...obligatoires, [matiereId]: true });
        }
        setSelectedMatieres(newSelected);
    };

    const handleCoefficientChange = (matiereId: number, coefficient: number) => {
        setCoefficients({
            ...coefficients,
            [matiereId]: coefficient
        });
    };

    const toggleObligatoire = (matiereId: number) => {
        setObligatoires({
            ...obligatoires,
            [matiereId]: !obligatoires[matiereId]
        });
    };

    const handleSave = async () => {
        if (!selectedFiliere) {
            toast({
                title: 'Filière requise',
                description: 'Veuillez sélectionner une filière',
                variant: 'destructive'
            });
            return;
        }

        if (selectedMatieres.size === 0) {
            toast({
                title: 'Aucune matière sélectionnée',
                description: 'Veuillez sélectionner au moins une matière',
                variant: 'destructive'
            });
            return;
        }

        setIsLoading(true);

        try {
            const matieresData = Array.from(selectedMatieres).map(matiereId => ({
                matiere_id: matiereId,
                coefficient: coefficients[matiereId] || 1.0,
                obligatoire: obligatoires[matiereId] ? 1 : 0
            }));

            const response = await apiService.makeRequest(
                `/filiere-matieres/filiere/${selectedFiliere}/bulk`,
                'POST',
                { matieres: matieresData }
            );

            if (response.success) {
                toast({
                    title: 'Succès',
                    description: `${matieresData.length} matière(s) associée(s) à la filière`
                });
                loadFiliereMatieresExistantes(selectedFiliere);
            }
        } catch (error: any) {
            console.error('Erreur sauvegarde:', error);
            toast({
                title: 'Erreur',
                description: error.message || 'Impossible de sauvegarder les matières',
                variant: 'destructive'
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer cette association ?')) return;

        try {
            const response = await apiService.makeRequest(`/filiere-matieres/${id}`, 'DELETE');
            if (response.success) {
                toast({
                    title: 'Supprimé',
                    description: 'Association supprimée avec succès'
                });
                loadFiliereMatieresExistantes(selectedFiliere);
            }
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible de supprimer',
                variant: 'destructive'
            });
        }
    };

    const totalCoefficients = Array.from(selectedMatieres).reduce(
        (sum, id) => sum + (parseFloat(coefficients[id]?.toString() || '0') || 0), 0
    );

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap className="h-6 w-6" />
                        Gestion Filières - Matières
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Sélection filière */}
                    <div>
                        <Label>Filière</Label>
                        <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionner une filière" />
                            </SelectTrigger>
                            <SelectContent>
                                {filieres.map((filiere) => (
                                    <SelectItem key={filiere.id} value={filiere.id.toString()}>
                                        {filiere.nomfil} - {filiere.niveau_nomniv || 'Niveau non spécifié'}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Liste des matières disponibles */}
                    {selectedFiliere && (
                        <>
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <Label className="text-lg">Matières disponibles</Label>
                                    <Badge variant="secondary" className="text-base">
                                        Total coefficients: {(typeof totalCoefficients === 'number' && !isNaN(totalCoefficients)) ? totalCoefficients.toFixed(1) : '0.0'}
                                    </Badge>
                                </div>
                                <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto">
                                    {matieres.map((matiere) => (
                                        <div 
                                            key={matiere.id}
                                            className={`p-4 border rounded-lg ${
                                                selectedMatieres.has(matiere.id)
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-muted'
                                            } hover:shadow-md transition-all cursor-pointer`}
                                            onClick={() => toggleMatiere(matiere.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedMatieres.has(matiere.id)}
                                                        onChange={() => {}}
                                                        className="h-4 w-4"
                                                    />
                                                    <div>
                                                        <p className="font-medium">{matiere.nom_matiere}</p>
                                                        {matiere.description && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {matiere.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                {selectedMatieres.has(matiere.id) && (
                                                    <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-sm">Coef:</Label>
                                                            <Input
                                                                type="number"
                                                                min="0.5"
                                                                max="10"
                                                                step="0.5"
                                                                value={coefficients[matiere.id] || 1}
                                                                onChange={(e) => handleCoefficientChange(matiere.id, parseFloat(e.target.value) || 1)}
                                                                className="w-20"
                                                            />
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="checkbox"
                                                                checked={obligatoires[matiere.id] !== false}
                                                                onChange={() => toggleObligatoire(matiere.id)}
                                                                className="h-4 w-4"
                                                            />
                                                            <Label className="text-sm">Obligatoire</Label>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button onClick={handleSave} disabled={isLoading} className="w-full">
                                <Save className="mr-2 h-4 w-4" />
                                {isLoading ? 'Enregistrement...' : 'Enregistrer les matières'}
                            </Button>
                        </>
                    )}

                    {/* Matières déjà associées */}
                    {filiereMatieresExistantes.length > 0 && (
                        <div className="mt-6">
                            <Label className="text-lg mb-4 block">Matières déjà associées</Label>
                            <div className="space-y-2">
                                {filiereMatieresExistantes.map((fm) => (
                                    <div key={fm.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium">{fm.nom_matiere}</p>
                                            <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                                <span>Coefficient: {fm.coefficient}</span>
                                                <span>
                                                    {fm.obligatoire ? (
                                                        <Badge variant="default" className="text-xs">Obligatoire</Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="text-xs">Optionnelle</Badge>
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={() => handleDelete(fm.id)}
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

export default FiliereMatieresManagement;
