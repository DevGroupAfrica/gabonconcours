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
    TableRow,
} from '@/components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { BookOpen, Save, Download } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { gradeService, GradeInput } from '@/services/gradeService';
import { apiService } from '@/services/api';
import { exportService } from '@/services/exportService';
import {adminConcoursService} from "@/services/adminConcoursService.ts";
import {useAdminAuth} from "@/contexts/AdminAuthContext.tsx";
import {adminCandidatureService} from "@/services/adminCandidatureService.ts";

interface GradeManagementProps {
    concoursFilter?: number | null;
}

const GradeManagement: React.FC<GradeManagementProps> = ({ concoursFilter }) => {
    const {admin, token, isLoading} = useAdminAuth();
    const queryClient = useQueryClient();
    const [selectedConcours, setSelectedConcours] = useState<number | null>(concoursFilter || null);
    const [grades, setGrades] = useState<Record<string, string>>({});

    // Récupérer les concours
    const {data: concoursData, isLoading: isLoadingConcours} = useQuery({
        queryKey: ['adminConcours', admin?.etablissement_id],
        queryFn: () => adminConcoursService.getConcoursByEtablissement(admin?.etablissement_id || 0),
        enabled: !!admin?.etablissement_id && !!token,
        retry: 2,
    });



    const {data: candidatures, isLoading: isLoadingCandidatures} = useQuery({
        queryKey: ['adminCandidatures', selectedConcours],
        queryFn: () => adminCandidatureService.getAllCandidaturesByConcours(selectedConcours!),
        enabled: !!selectedConcours && !!token, // Assure que la requête ne se lance que si selectedConcours est défini
        retry: 2,
    });
    
    
    

    // Récupérer les matières du concours
    const { data: matieres } = useQuery({
        queryKey: ['matieres', selectedConcours],
        queryFn: async () => {
            if (!selectedConcours) return [];
            // Récupérer les filières du concours puis les matières
            const response = await apiService.getConcoursFiliere<any[]>(selectedConcours.toString());
            const filieres = response.data || [];
            if (filieres.length > 0) {
                const matResponse = await apiService.getFiliereWithMatieres<any>(filieres[0].filiere_id.toString());
                return matResponse.data?.matieres || [];
            }
            return [];
        },
        enabled: !!selectedConcours,
    });

    // Mutation pour sauvegarder les notes
    const saveGradesMutation = useMutation({
        mutationFn: async () => {
            const admin = JSON.parse(localStorage.getItem('adminUser') || '{}');
            const notesToSave: GradeInput[] = Object.entries(grades).map(([key, note]) => {
                const [nupcan, matiereId] = key.split('-');
                return {
                    nupcan,
                    concours_id: selectedConcours!,
                    matiere_id: parseInt(matiereId),
                    note: parseFloat(note),
                    admin_id: admin.id,
                };
            });

            return await gradeService.saveBatchGrades(notesToSave, admin.id);
        },
        onSuccess: () => {
            toast({
                title: 'Notes enregistrées',
                description: 'Les notes ont été enregistrées avec succès',
            });
            queryClient.invalidateQueries({ queryKey: ['candidatures-notes'] });
            setGrades({});
        },
        onError: (error: any) => {
            toast({
                title: 'Erreur',
                description: error.message || 'Impossible d\'enregistrer les notes',
                variant: 'destructive',
            });
        },
    });

    const handleGradeChange = (nupcan: string, matiereId: number, value: string) => {
        const key = `${nupcan}-${matiereId}`;
        setGrades((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSaveGrades = () => {
        if (Object.keys(grades).length === 0) {
            toast({
                title: 'Aucune note à enregistrer',
                description: 'Veuillez saisir au moins une note',
                variant: 'destructive',
            });
            return;
        }
        saveGradesMutation.mutate();
    };

    const handleExportGrades = async () => {
        if (!selectedConcours) {
            toast({
                title: 'Erreur',
                description: 'Veuillez sélectionner un concours',
                variant: 'destructive',
            });
            return;
        }

        try {
            await exportService.exportGradesExcel(selectedConcours);
            toast({
                title: 'Export réussi',
                description: 'Les notes ont été exportées en Excel',
            });
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible d\'exporter les notes',
                variant: 'destructive',
            });
        }
    };

    if (!selectedConcours) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des Notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-muted-foreground">Sélectionnez un concours pour gérer les notes:</p>
                        <Select
                            value={selectedConcours?.toString() || ''}
                            onValueChange={(value) => setSelectedConcours(parseInt(value))}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Sélectionner un concours" />
                            </SelectTrigger>
                            <SelectContent>
                                {concoursData?.map((concours: any) => (
                                    <SelectItem key={concours.id} value={concours.id.toString()}>
                                        {concours.libcnc} - {concours.sescnc}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="p-12">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4">Chargement des données...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Gestion des Notes
                    </CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleExportGrades}>
                            <Download className="h-4 w-4 mr-2" />
                            Exporter Excel
                        </Button>
                        <Button
                            onClick={handleSaveGrades}
                            disabled={saveGradesMutation.isPending || Object.keys(grades).length === 0}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            Enregistrer les notes
                        </Button>
                    </div>
                </div>
                <Select
                    value={selectedConcours.toString()}
                    onValueChange={(value) => setSelectedConcours(parseInt(value))}
                >
                    <SelectTrigger className="w-full mt-4">
                        <SelectValue placeholder="Sélectionner un concours" />
                    </SelectTrigger>
                    <SelectContent>
                        {concoursData?.map((concours: any) => (
                            <SelectItem key={concours.id} value={concours.id.toString()}>
                                {concours.libcnc} - {concours.sescnc}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </CardHeader>
            <CardContent>
                {candidatures && candidatures.length > 0 && matieres && matieres.length > 0 ? (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>NUPCAN</TableHead>
                                    <TableHead>Nom Complet</TableHead>
                                    {matieres.map((matiere: any) => (
                                        <TableHead key={matiere.id} className="text-center">
                                            {matiere.nommat}
                                            <br />
                                            <span className="text-xs text-muted-foreground">
                                                (Coef. {matiere.coefmat})
                                            </span>
                                        </TableHead>
                                    ))}
                                    <TableHead className="text-center">Moyenne</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {candidatures.map((candidat: any) => {
                                    const candidatGrades = matieres.map((matiere: any) => {
                                        const key = `${candidat.nupcan}-${matiere.id}`;
                                        return parseFloat(grades[key] || '0');
                                    });

                                    const totalPoints = candidatGrades.reduce(
                                        (sum, note, index) => sum + note * matieres[index].coefmat,
                                        0
                                    );
                                    const totalCoef = matieres.reduce((sum: number, m: any) => sum + m.coefmat, 0);
                                    const moyenne = totalCoef > 0 ? (totalPoints / totalCoef).toFixed(2) : '0.00';

                                    return (
                                        <TableRow key={candidat.id}>
                                            <TableCell className="font-medium">{candidat.nupcan}</TableCell>
                                            <TableCell>{candidat.prncan} {candidat.nomcan}</TableCell>
                                            {matieres.map((matiere: any) => {
                                                const key = `${candidat.nupcan}-${matiere.id}`;
                                                return (
                                                    <TableCell key={matiere.id}>
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="20"
                                                            step="0.5"
                                                            value={grades[key] || ''}
                                                            onChange={(e) =>
                                                                handleGradeChange(
                                                                    candidat.nupcan,
                                                                    matiere.id,
                                                                    e.target.value
                                                                )
                                                            }
                                                            className="w-20 text-center"
                                                            placeholder="0"
                                                        />
                                                    </TableCell>
                                                );
                                            })}
                                            <TableCell className="text-center">
                                                <Badge variant={parseFloat(moyenne) >= 10 ? 'default' : 'destructive'}>
                                                    {moyenne}/20
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20" />
                        <p>Aucun candidat ou matière disponible pour ce concours</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default GradeManagement;
