import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { BookOpen, Send, Calculator, Loader2 } from 'lucide-react';
import { apiService } from '@/services/api';
import { useQuery } from "@tanstack/react-query";
import { candidatureService } from "@/services/candidatureService.ts";
import { useParams } from "react-router-dom";

interface NotesManagerProps {
    candidatId: number;
    candidatNom: string;
    candidatPrenom: string;
    concoursId: number;
}

interface Note {
    id: number;
    matiere_id: number;
    nom_matiere: string;
    note: number;
    coefficient: number;
}

interface Matiere {
    id: number;
    nom_matiere: string;
    coefficient: number;
}

interface Filiere {
    id: number;
    nomfil: string;
    description?: string;
    matieres: Matiere[];
    filiere_id?: number;
}

const NotesManager: React.FC<NotesManagerProps> = ({
                                                       candidatId,
                                                       candidatNom,
                                                       candidatPrenom,
                                                       concoursId
                                                   }) => {
    const { nupcan } = useParams<{ nupcan: string }>();
    const [notes, setNotes] = useState<Note[]>([]);
    const [matieres, setMatieres] = useState<Matiere[]>([]);
    const [moyenne, setMoyenne] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [sending, setSending] = useState(false);

    // ✅ Query avec gestion d'erreur et loading
    const {
        data: candidatureData,
        isLoading: candidatureLoading,
        error: candidatureError
    } = useQuery({
        queryKey: ['candidature-complete', nupcan],
        queryFn: () => candidatureService.getCandidatureByNupcan(nupcan!),
        enabled: !!nupcan,
        retry: 2,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // ✅ SÉCURITÉ : Vérifications avant déstructuration
    const filiere = candidatureData?.filiere;
    const isCandidatureReady = !!candidatureData && !!filiere;

    // ✅ Loading global
    const globalLoading = loading || candidatureLoading;

    // ✅ useMemo pour éviter re-renders inutiles
    const safeMatieres = useMemo(() => {
        if (!isCandidatureReady || !filiere.matieres) return [];
        return Array.isArray(filiere.matieres) ? filiere.matieres : [];
    }, [isCandidatureReady, filiere]);

    // Gestion erreur candidature
    useEffect(() => {
        if (candidatureError) {
            console.error('Erreur chargement candidature:', candidatureError);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les informations de candidature',
                variant: 'destructive'
            });
        }
    }, [candidatureError]);

    const fetchData = async () => {
        if (!isCandidatureReady) {
            console.log('⏳ Attente candidature data...');
            return;
        }

        try {
            setLoading(true);
            console.log('📥 Chargement données notes pour candidat:', candidatId);

            // Récupérer les notes existantes
            const notesResponse = await apiService.makeRequest(
                `/notes/candidat/${candidatId}/concours/${concoursId}`,
                'GET'
            );

            if (notesResponse.success && notesResponse.data) {
                const data = notesResponse.data as any;
                setNotes(Array.isArray(data.notes) ? data.notes : []);
                setMoyenne(data.moyenne || null);
            } else {
                setNotes([]);
                setMoyenne(null);
            }

            // Utiliser les matières de la filière si disponibles
            if (safeMatieres.length > 0) {
                setMatieres(safeMatieres);
            } else {
                // Fallback : récupérer toutes les matières
                const matieresResponse = await apiService.makeRequest('/matieres', 'GET');
                if (matieresResponse.success && Array.isArray(matieresResponse.data)) {
                    setMatieres(matieresResponse.data);
                }
            }

        } catch (error) {
            console.error('Erreur chargement données notes:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger les notes et matières',
                variant: 'destructive'
            });
            setNotes([]);
            setMatieres([]);
        } finally {
            setLoading(false);
        }
    };

    // ✅ Recharger quand candidatureData change
    useEffect(() => {
        fetchData();
    }, [isCandidatureReady, candidatId, concoursId]);

    // Calculer la moyenne en temps réel
    const calculateLiveMoyenne = (currentNotes: Note[]) => {
        const validNotes = currentNotes.filter(n => n.note && n.note > 0);
        if (validNotes.length === 0) return null;
        
        const totalPoints = validNotes.reduce((sum, n) => sum + (n.note * n.coefficient), 0);
        const totalCoef = validNotes.reduce((sum, n) => sum + n.coefficient, 0);
        return totalCoef > 0 ? (totalPoints / totalCoef).toFixed(2) : null;
    };

    const handleNoteChange = (matiere_id: number, value: string) => {
        const noteValue = parseFloat(value) || 0;

        if (value === '' || (noteValue >= 0 && noteValue <= 20)) {
            const existingNoteIndex = notes.findIndex(n => n.matiere_id === matiere_id);
            const matiere = matieres.find(m => m.id === matiere_id);

            let newNotes;
            if (existingNoteIndex >= 0) {
                newNotes = [...notes];
                newNotes[existingNoteIndex] = {
                    ...newNotes[existingNoteIndex],
                    note: noteValue
                };
            } else if (matiere) {
                newNotes = [...notes, {
                    id: 0,
                    matiere_id,
                    nom_matiere: matiere.nom_matiere,
                    note: noteValue,
                    coefficient: matiere.coefficient
                }];
            } else {
                return;
            }
            
            setNotes(newNotes);
            // Actualiser la moyenne en temps réel
            const newMoyenne = calculateLiveMoyenne(newNotes);
            setMoyenne(newMoyenne);
        }
    };

    // Enregistrer toutes les notes en base
    const saveAllNotes = async () => {
        try {
            setSaving(true);

            const validNotes = notes.filter(n => n.note && n.note > 0);
            if (validNotes.length === 0) {
                toast({
                    title: 'Erreur',
                    description: 'Aucune note à enregistrer',
                    variant: 'destructive'
                });
                return;
            }

            // Enregistrer toutes les notes
            const promises = validNotes.map(note =>
                apiService.makeRequest('/notes', 'POST', {
                    candidat_id: candidatId,
                    concours_id: concoursId,
                    matiere_id: note.matiere_id,
                    note: note.note,
                    coefficient: note.coefficient
                })
            );

            await Promise.all(promises);

            toast({
                title: 'Succès',
                description: 'Toutes les notes ont été enregistrées'
            });
            await fetchData(); // Refresh
        } catch (error) {
            console.error('Erreur enregistrement notes:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible d\'enregistrer les notes',
                variant: 'destructive'
            });
        } finally {
            setSaving(false);
        }
    };

    const sendResults = async () => {
        try {
            setSending(true);

            // Vérifier qu'il y a des notes
            const validNotes = notes.filter(n => n.note && n.note > 0);
            if (validNotes.length === 0) {
                toast({
                    title: 'Erreur',
                    description: 'Aucune note valide à envoyer',
                    variant: 'destructive'
                });
                return;
            }

            const response = await apiService.makeRequest('/notes/envoyer-resultats', 'POST', {
                candidat_id: candidatId,
                concours_id: concoursId
            });

            if (response.success) {
                toast({
                    title: 'Succès',
                    description: 'Résultats envoyés par email au candidat'
                });
            } else {
                toast({
                    title: 'Erreur',
                    description: response.message || 'Erreur lors de l\'envoi',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Erreur envoi résultats:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible d\'envoyer les résultats',
                variant: 'destructive'
            });
        } finally {
            setSending(false);
        }
    };

    // ✅ ÉCRAN DE CHARGEMENT
    if (globalLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        Gestion des notes - {candidatPrenom} {candidatNom}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center h-32 space-y-4">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="text-muted-foreground">Chargement des informations...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // ✅ ERREUR CANDIDATURE
    if (candidatureError || !isCandidatureReady) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Gestion des notes</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <p className="text-destructive mb-4">
                            Impossible de charger les informations de candidature
                        </p>
                        <Button onClick={() => window.location.reload()}>
                            Recharger la page
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        <span>Gestion des notes - {candidatPrenom} {candidatNom}</span>

                        {/* ✅ Filière SÉCURISÉE */}
                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <h3 className="font-semibold text-blue-800">
                                {filiere.nomfil || 'Filière non définie'}
                            </h3>
                            {filiere.description && (
                                <p className="text-blue-700 text-sm mt-1">{filiere.description}</p>
                            )}
                        </div>
                    </div>

                    {/* ✅ Moyenne sécurisée */}
                    {moyenne && (
                        <Badge variant="outline" className="text-lg px-4 py-2">
                            <Calculator className="h-4 w-4 mr-2" />
                            Moyenne: {moyenne}/20
                        </Badge>
                    )}
                </CardTitle>
            </CardHeader>

            <CardContent>
                <div className="space-y-4">
                    {/* ✅ Vérification matières sécurisée */}
                    {safeMatieres.length === 0 ? (
                        <div className="text-center py-8 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <p className="text-yellow-800">
                                Aucune matière disponible pour cette filière
                            </p>
                            <p className="text-yellow-700 text-sm mt-2">
                                Vérifiez la configuration de la filière {filiere.nomfil}
                            </p>
                        </div>
                    ) : (
                        <>
                            {safeMatieres.map((matiere) => {
                                const note = notes.find(n => n.matiere_id === matiere.id);

                                return (
                                    <div key={matiere.id} className="p-4 border rounded-lg bg-gray-50">
                                        <Label htmlFor={`note-${matiere.id}`} className="font-medium">
                                            {matiere.nom_matiere}
                                            <Badge variant="secondary" className="ml-2">
                                                Coef. {matiere.coefficient}
                                            </Badge>
                                        </Label>
                                        <Input
                                            id={`note-${matiere.id}`}
                                            type="number"
                                            min="0"
                                            max="20"
                                            step="0.5"
                                            value={note?.note ?? ''}
                                            onChange={(e) => handleNoteChange(matiere.id, e.target.value)}
                                            placeholder="Note sur 20"
                                            className="mt-2"
                                        />
                                    </div>
                                );
                            })}

                            {/* Boutons d'action */}
                            {notes.filter(n => n.note && n.note > 0).length > 0 && (
                                <div className="flex justify-end gap-4 pt-4 border-t">
                                    <Button
                                        onClick={saveAllNotes}
                                        disabled={saving}
                                        variant="default"
                                        className="gap-2"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Enregistrement...
                                            </>
                                        ) : (
                                            'Enregistrer en base'
                                        )}
                                    </Button>
                                    <Button
                                        onClick={sendResults}
                                        disabled={sending || saving}
                                        className="gap-2 bg-green-600 hover:bg-green-700"
                                    >
                                        {sending ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Envoi en cours...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4" />
                                                Envoyer les résultats par email
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default NotesManager;