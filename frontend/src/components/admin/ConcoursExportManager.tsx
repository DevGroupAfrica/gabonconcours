import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileSpreadsheet, Users, Trophy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import * as XLSX from 'xlsx';

const ConcoursExportManager: React.FC = () => {
  const { admin } = useAdminAuth();
  const [selectedConcours, setSelectedConcours] = useState<string>('');
  const [selectedFiliere, setSelectedFiliere] = useState<string>('');

  // Récupérer les concours de l'établissement
  const { data: concoursData } = useQuery({
    queryKey: ['concours-etablissement', admin?.etablissement_id],
    queryFn: async () => {
      const response = await apiService.makeRequest('/concours', 'GET');
      return response.data.filter((c: any) => c.etablissement_id === admin?.etablissement_id);
    },
    enabled: !!admin?.etablissement_id
  });

  // Récupérer les filières
  const { data: filieresData } = useQuery({
    queryKey: ['filieres'],
    queryFn: async () => {
      const response = await apiService.makeRequest('/filieres', 'GET');
      return response.data;
    }
  });

  // Récupérer les candidatures
  const { data: candidaturesData, refetch } = useQuery({
    queryKey: ['candidatures-export', selectedConcours, selectedFiliere],
    queryFn: async () => {
      let url = `/candidats/export?etablissement_id=${admin?.etablissement_id}`;
      if (selectedConcours) url += `&concours_id=${selectedConcours}`;
      if (selectedFiliere) url += `&filiere_id=${selectedFiliere}`;
      
      const response = await apiService.makeRequest(url, 'GET');
      return response.data;
    },
    enabled: false
  });

  const handleExportExcel = async () => {
    try {
      await refetch();
      
      if (!candidaturesData || candidaturesData.length === 0) {
        toast({
          title: 'Aucune donnée',
          description: 'Aucune candidature trouvée avec ces filtres',
          variant: 'destructive'
        });
        return;
      }

      // Préparer les données pour Excel
      const exportData = candidaturesData.map((c: any) => ({
        'NUPCAN': c.nupcan,
        'Nom': c.nomcan,
        'Prénom': c.prncan,
        'Email': c.maican,
        'Téléphone': c.telcan,
        'Date de naissance': c.dtncan ? new Date(c.dtncan).toLocaleDateString('fr-FR') : '',
        'Lieu de naissance': c.ldncan,
        'Concours': c.libcnc,
        'Filière': c.nomfil,
        'Statut': c.statut || 'En attente',
        'Date candidature': c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '',
        'Documents validés': c.documents_valides || 0,
        'Paiement': c.paiement_statut || 'Non payé',
        'Moyenne': c.moyenne || 'N/A'
      }));

      // Créer le fichier Excel
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Candidatures');

      // Télécharger
      const fileName = `candidatures_${selectedConcours || 'tous'}_${selectedFiliere || 'toutes'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: 'Export réussi',
        description: `${exportData.length} candidature(s) exportée(s)`
      });
    } catch (error) {
      console.error('Erreur export:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter les données',
        variant: 'destructive'
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Exporter les Candidatures
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Concours</label>
            <Select value={selectedConcours} onValueChange={setSelectedConcours}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les concours" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les concours</SelectItem>
                {concoursData?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4" />
                      {c.libcnc}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Filière</label>
            <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les filières" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les filières</SelectItem>
                {filieresData?.map((f: any) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.nomfil}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="pt-4">
          <Button onClick={handleExportExcel} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Exporter en Excel
          </Button>
        </div>

        {candidaturesData && candidaturesData.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4" />
              <span className="font-medium">{candidaturesData.length} candidature(s) trouvée(s)</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConcoursExportManager;