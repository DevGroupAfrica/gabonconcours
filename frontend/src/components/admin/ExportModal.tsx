// src/components/admin/ExportModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { exportService } from '@/services/exportService';
import { Loader2, AlertCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '@/services/api';

// Typage
interface Concours {
  id: number;
  libcnc: string;
  sescnc: string;
}

interface Filiere {
  id: number;
  nomfil: string;
  niveau_nom?: string;
}

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  concoursList: Concours[];
}

const ExportModal: React.FC<ExportModalProps> = ({ open, onClose, concoursList }) => {
  const [selectedConcours, setSelectedConcours] = useState<number | null>(null);
  const [selectedFiliere, setSelectedFiliere] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [exportType, setExportType] = useState<'excel' | 'pdf'>('excel');

  // Réinitialiser la filière quand le concours change
  useEffect(() => {
    setSelectedFiliere(null);
  }, [selectedConcours]);

  // Récupérer les filières du concours sélectionné
  const {
    data: filieresData = [],
    isLoading: loadingFilieres,
    error: filieresError,
  } = useQuery<Filiere[], Error>({
    queryKey: ['concours-filieres', selectedConcours],
    queryFn: async (): Promise<Filiere[]> => {
      if (!selectedConcours) return [];
      const response = await apiService.makeRequest(
        `/concours-filieres/concours/${selectedConcours}`,
        'GET'
      );
      return (response.data as Filiere[]) || [];
    },
    enabled: !!selectedConcours,
  });

  const handleExport = async () => {
    if (!selectedConcours) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un concours.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      if (exportType === 'excel') {
        await exportService.exportCandidatesExcel(selectedConcours);
      } else {
        await exportService.exportCandidatesPDF(
          selectedConcours,
          selectedFiliere || undefined
        );
      }

      toast({
        title: 'Export réussi',
        description: `Fichier ${exportType.toUpperCase()} généré avec succès.`,
      });
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Erreur',
        description: `Échec de l'export ${exportType.toUpperCase()}. Veuillez réessayer.`,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            Exporter les candidats
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-4">
          {/* Format */}
          <div>
            <label htmlFor="format" className="block text-sm font-medium text-foreground mb-2">
              Format d'export
            </label>
            <Select
              value={exportType}
              onValueChange={(value: 'excel' | 'pdf') => setExportType(value)}
            >
              <SelectTrigger id="format">
                <SelectValue placeholder="Choisir un format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                <SelectItem value="pdf">PDF (.pdf)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Concours */}
          <div>
            <label htmlFor="concours" className="block text-sm font-medium text-foreground mb-2">
              Concours <span className="text-red-500">*</span>
            </label>
            <Select
              value={selectedConcours?.toString() || ''}
              onValueChange={(value: string) => setSelectedConcours(Number(value))}
            >
              <SelectTrigger id="concours">
                <SelectValue placeholder="Sélectionner un concours" />
              </SelectTrigger>
              <SelectContent>
                {concoursList.length > 0 ? (
                  concoursList.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.libcnc} ({c.sesccnc})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    Aucun concours disponible
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Filière (seulement si PDF et concours sélectionné) */}
          {exportType === 'pdf' && selectedConcours && (
            <div>
              <label htmlFor="filiere" className="block text-sm font-medium text-foreground mb-2">
                Filière (optionnel)
              </label>

              {loadingFilieres ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement des filières...
                </div>
              ) : filieresError ? (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  Erreur de chargement
                </div>
              ) : filieresData.length > 0 ? (
                <Select
                  value={selectedFiliere?.toString() || ''}
                  onValueChange={(value: string) =>
                    setSelectedFiliere(value ? Number(value) : null)
                  }
                >
                  <SelectTrigger id="filiere">
                    <SelectValue placeholder="Toutes les filières" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Toutes les filières</SelectItem>
                    {filieresData.map((f) => (
                      <SelectItem key={f.id} value={f.id.toString()}>
                        {f.nomfil}
                        {f.niveau_nom && ` (${f.niveau_nom})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Aucune filière disponible pour ce concours
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 sm:gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button
            onClick={handleExport}
            disabled={isLoading || !selectedConcours}
            className="min-w-[100px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Export...
              </>
            ) : (
              'Exporter'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportModal;