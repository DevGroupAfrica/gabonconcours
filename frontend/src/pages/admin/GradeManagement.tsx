import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { GraduationCap, Save, Send, Trash2, Download } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Note {
  id?: number;
  candidat_id: number;
  concours_id: number;
  matiere_id: number;
  note: number;
  coefficient: number;
  nom_matiere?: string;
}

interface Candidat {
  id: number;
  nupcan: string;
  nomcan: string;
  prncan: string;
  maican: string;
  concours_id: number;
}

interface Matiere {
  id: number;
  nom_matiere: string;
  coefficient: number;
}

const GradeManagement = () => {
  const [concours, setConcours] = useState<any[]>([]);
  const [candidats, setCandidats] = useState<Candidat[]>([]);
  const [matieres, setMatieres] = useState<Matiere[]>([]);
  const [selectedConcours, setSelectedConcours] = useState<string>('');
  const [selectedCandidat, setSelectedCandidat] = useState<string>('');
  const [notes, setNotes] = useState<Note[]>([]);
  const [moyenne, setMoyenne] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadConcours();
    loadMatieres();
  }, []);

  useEffect(() => {
    if (selectedConcours) {
      loadCandidatsByConcours(selectedConcours);
    }
  }, [selectedConcours]);

  useEffect(() => {
    if (selectedCandidat && selectedConcours) {
      loadNotes(selectedCandidat, selectedConcours);
    }
  }, [selectedCandidat, selectedConcours]);

  const loadConcours = async () => {
    try {
      const response = await apiService.getConcours();
      if (response.success && response.data) {
        setConcours(response.data as any);
      }
    } catch (error) {
      console.error('Erreur chargement concours:', error);
    }
  };

  const loadMatieres = async () => {
    try {
      const response = await apiService.makeRequest('/matieres', 'GET');
      if (response.success && response.data) {
        setMatieres(response.data as Matiere[]);
      }
    } catch (error) {
      console.error('Erreur chargement matières:', error);
    }
  };

  const loadCandidatsByConcours = async (concoursId: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.makeRequest(`/candidats?concours_id=${concoursId}`, 'GET');
      if (response.success && response.data) {
        setCandidats(response.data as Candidat[]);
      }
    } catch (error) {
      console.error('Erreur chargement candidats:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les candidats',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotes = async (candidatId: string, concoursId: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.makeRequest(
        `/notes/candidat/${candidatId}/concours/${concoursId}`,
        'GET'
      );
      
      if (response.success && response.data) {
        const data = response.data as any;
        setNotes(data.notes || []);
        setMoyenne(data.moyenne ? parseFloat(data.moyenne) : null);
      } else {
        // Initialiser avec les matières disponibles
        const initialNotes = matieres.map(matiere => ({
          candidat_id: parseInt(candidatId),
          concours_id: parseInt(concoursId),
          matiere_id: matiere.id,
          note: 0,
          coefficient: matiere.coefficient,
          nom_matiere: matiere.nom_matiere,
        }));
        setNotes(initialNotes);
        setMoyenne(null);
      }
    } catch (error) {
      console.error('Erreur chargement notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNoteChange = (matiereId: number, value: string) => {
    const noteValue = parseFloat(value);
    if (isNaN(noteValue) || noteValue < 0 || noteValue > 20) {
      return;
    }

    setNotes(prevNotes => {
      const existingIndex = prevNotes.findIndex(n => n.matiere_id === matiereId);
      if (existingIndex >= 0) {
        const updated = [...prevNotes];
        updated[existingIndex] = { ...updated[existingIndex], note: noteValue };
        return updated;
      } else {
        const matiere = matieres.find(m => m.id === matiereId);
        return [
          ...prevNotes,
          {
            candidat_id: parseInt(selectedCandidat),
            concours_id: parseInt(selectedConcours),
            matiere_id: matiereId,
            note: noteValue,
            coefficient: matiere?.coefficient || 1,
            nom_matiere: matiere?.nom_matiere,
          },
        ];
      }
    });
  };

  const calculateMoyenne = () => {
    if (notes.length === 0) return 0;
    
    const totalPoints = notes.reduce((sum, n) => sum + (n.note * n.coefficient), 0);
    const totalCoef = notes.reduce((sum, n) => sum + n.coefficient, 0);
    
    return totalCoef > 0 ? totalPoints / totalCoef : 0;
  };

  const saveNotes = async () => {
    if (!selectedCandidat || !selectedConcours) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un candidat et un concours',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      for (const note of notes) {
        await apiService.makeRequest('/notes', 'POST', {
          candidat_id: note.candidat_id,
          concours_id: note.concours_id,
          matiere_id: note.matiere_id,
          note: note.note,
          coefficient: note.coefficient,
        });
      }

      toast({
        title: 'Succès',
        description: 'Notes enregistrées avec succès',
      });

      // Recharger les notes pour avoir les IDs
      await loadNotes(selectedCandidat, selectedConcours);
    } catch (error) {
      console.error('Erreur sauvegarde notes:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'enregistrement des notes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sendResultsByEmail = async () => {
    if (!selectedCandidat || !selectedConcours) return;

    try {
      await apiService.makeRequest('/notes/envoyer-resultats', 'POST', {
        candidat_id: parseInt(selectedCandidat),
        concours_id: parseInt(selectedConcours),
      });

      toast({
        title: 'Succès',
        description: 'Résultats envoyés par email au candidat',
      });
    } catch (error) {
      console.error('Erreur envoi email:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'envoi de l\'email',
        variant: 'destructive',
      });
    }
  };

  const selectedCandidatData = candidats.find(c => c.id.toString() === selectedCandidat);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <GraduationCap className="h-6 w-6 text-primary" />
              <CardTitle>Gestion des notes</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Concours</Label>
              <Select value={selectedConcours} onValueChange={setSelectedConcours}>
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

            <div className="space-y-2">
              <Label>Candidat</Label>
              <Select
                value={selectedCandidat}
                onValueChange={setSelectedCandidat}
                disabled={!selectedConcours}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un candidat" />
                </SelectTrigger>
                <SelectContent>
                  {candidats.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nupcan} - {c.nomcan} {c.prncan}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCandidat && selectedConcours && (
            <>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matière</TableHead>
                      <TableHead>Coefficient</TableHead>
                      <TableHead>Note (/20)</TableHead>
                      <TableHead>Note pondérée</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matieres.map((matiere) => {
                      const note = notes.find(n => n.matiere_id === matiere.id);
                      const noteValue = note?.note || 0;
                      const notePonderee = noteValue * matiere.coefficient;

                      return (
                        <TableRow key={matiere.id}>
                          <TableCell className="font-medium">{matiere.nom_matiere}</TableCell>
                          <TableCell>{matiere.coefficient}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="20"
                              step="0.25"
                              value={noteValue}
                              onChange={(e) => handleNoteChange(matiere.id, e.target.value)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            <span className="font-semibold">{notePonderee.toFixed(2)}</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    <TableRow className="bg-muted/50 font-bold">
                      <TableCell colSpan={2}>Moyenne générale</TableCell>
                      <TableCell colSpan={2}>
                        <span className="text-primary text-lg">
                          {calculateMoyenne().toFixed(2)} / 20
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={saveNotes}
                  disabled={isSaving || isLoading}
                  className="flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les notes'}</span>
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" className="flex items-center space-x-2">
                      <Send className="h-4 w-4" />
                      <span>Envoyer par email</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Envoyer les résultats</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir envoyer les résultats à{' '}
                        <strong>
                          {selectedCandidatData?.nomcan} {selectedCandidatData?.prncan}
                        </strong>{' '}
                        ({selectedCandidatData?.maican}) ?
                        <br />
                        <br />
                        Moyenne: <strong>{calculateMoyenne().toFixed(2)} / 20</strong>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction onClick={sendResultsByEmail}>
                        Confirmer l'envoi
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GradeManagement;