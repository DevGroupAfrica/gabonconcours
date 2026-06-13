import React, {useState, useEffect} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Badge} from '@/components/ui/badge';
import {GraduationCap, BookOpen} from 'lucide-react';
import {apiService} from '@/services/api';

interface FiliereWithMatieres {
    id: number;
    nomfil: string;
    description?: string;
    niveau_nomniv?: string;
    matieres?: Array<{
        id: number;
        nom_matiere: string;
        coefficient: number;
        obligatoire?: boolean;
    }>;
}

interface FiliereSelectorProps {
    selectedFiliereId?: number;
    onFiliereChange: (filiereId: number, filiere: FiliereWithMatieres) => void;
    disabled?: boolean;
}

const FiliereSelector: React.FC<FiliereSelectorProps> = ({
                                                             selectedFiliereId,
                                                             onFiliereChange,
                                                             disabled = false
                                                         }) => {
    const [filieres, setFilieres] = useState<FiliereWithMatieres[]>([]);
    const [selectedFiliere, setSelectedFiliere] = useState<FiliereWithMatieres | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadFilieres();
    }, []);

    useEffect(() => {
        if (selectedFiliereId && filieres.length > 0) {
            loadFiliereWithMatieres(selectedFiliereId);
        }
    }, [selectedFiliereId, filieres]);

    const loadFilieres = async () => {
        try {
            const response = await apiService.getFilieres();
            if (response.success && response.data) {
                setFilieres(response.data as FiliereWithMatieres[]);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des filières:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const loadFiliereWithMatieres = async (filiereId: number) => {
        try {
            const response = await apiService.getFiliereWithMatieres(filiereId.toString());
            if (response.success && response.data) {
                setSelectedFiliere(response.data as FiliereWithMatieres);
            }
        } catch (error) {
            console.error('Erreur lors du chargement des matières:', error);
        }
    };

    const handleFiliereChange = async (filiereId: string) => {
        const id = parseInt(filiereId);
        await loadFiliereWithMatieres(id);

        const filiere = filieres.find(f => f.id === id);
        if (filiere && selectedFiliere) {
            const filiereWithMatieres = {...filiere, matieres: selectedFiliere.matieres};
            onFiliereChange(id, filiereWithMatieres);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <GraduationCap className="h-5 w-5 mr-2"/>
                        Choix de la filière
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select
                        value={selectedFiliereId?.toString() || ''}
                        onValueChange={handleFiliereChange}
                        disabled={disabled}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une filière"/>
                        </SelectTrigger>
                        <SelectContent>
                            {filieres.map((filiere) => (
                                <SelectItem key={filiere.id} value={filiere.id.toString()}>
                                    <div>
                                        <div className="font-medium">{filiere.nomfil}</div>
                                        {filiere.niveau_nomniv && (
                                            <div className="text-sm text-muted-foreground">
                                                Niveau: {filiere.niveau_nomniv}
                                            </div>
                                        )}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedFiliere && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <BookOpen className="h-5 w-5 mr-2"/>
                            Matières de la filière
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-lg">{selectedFiliere.nomfil}</h4>
                                {selectedFiliere.description && (
                                    <p className="text-muted-foreground mt-1">{selectedFiliere.description}</p>
                                )}
                            </div>

                            {selectedFiliere.matieres && selectedFiliere.matieres.length > 0 ? (
                                <div className="space-y-2">
                                    <h5 className="font-medium">Matières ({selectedFiliere.matieres.length}):</h5>
                                    <div className="grid grid-cols-1 gap-2">
                                        {selectedFiliere.matieres.map((matiere) => (
                                            <div
                                                key={matiere.id}
                                                className="flex items-center justify-between p-3 border rounded-lg bg-muted/20"
                                            >
                                                <div>
                                                    <span className="font-medium">{matiere.nom_matiere}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        Coef. {matiere.coefficient}
                                                    </Badge>
                                                    {matiere.obligatoire && (
                                                        <Badge className="text-xs bg-red-500">
                                                            Obligatoire
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-muted-foreground">Aucune matière définie pour cette filière.</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default FiliereSelector;
