import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  FileSpreadsheet, 
  Filter, 
  Users, 
  GraduationCap,
  Download 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import * as XLSX from 'xlsx';

interface Candidature {
  id: number;
  nupcan: string;
  nomcan: string;
  prncan: string;
  maican: string;
  telcan: string;
  statut: string;
  libcnc: string;
  nomfil: string;
  created_at: string;
}

interface Concours {
  id: number;
  libcnc: string;
}

interface Filiere {
  id: number;
  nomfil: string;
}

const FiliereConcoursFilter: React.FC = () => {
  const adminData = JSON.parse(localStorage.getItem('adminData') || '{}');
  const [selectedEtablissement, setSelectedEtablissement] = useState<string>(adminData.etablissement_id?.toString() || '');
  const [selectedConcours, setSelectedConcours] = useState<string>('');
  const [selectedFiliere, setSelectedFiliere] = useState<string>('');

  // Récupérer les établissements (pour super admin)
  const { data: etablissements = [] } = useQuery({
    queryKey: ['etablissements'],
    queryFn: async () => {
      const response = await apiService.getEtablissements();
      return response.data || [];
    },
  });

  // Récupérer les concours filtrés par établissement
  const { data: concours = [] } = useQuery<Concours[]>({
    queryKey: ['concours-etablissement', selectedEtablissement],
    queryFn: async () => {
      if (!selectedEtablissement || selectedEtablissement === 'all') return [];
      
      const response = await apiService.makeRequest<Concours[]>(
        `/concours`,
        'GET'
      );
      
      // Filter concours by etablissement
      const allConcours = response.data || [];
      return allConcours.filter((c: any) => c.etablissement_id === parseInt(selectedEtablissement));
    },
    enabled: !!selectedEtablissement && selectedEtablissement !== 'all',
  });

  // Récupérer les filières
  const { data: filieres = [] } = useQuery<Filiere[]>({
    queryKey: ['filieres'],
    queryFn: async () => {
      const response = await apiService.makeRequest<Filiere[]>('/filieres', 'GET');
      return response.data || [];
    },
  });

  // Récupérer les candidatures filtrées
  const { data: candidatures = [], isLoading, refetch } = useQuery<Candidature[]>({
    queryKey: ['candidatures-filtrees', selectedConcours, selectedFiliere, adminData.etablissement_id],
    queryFn: async () => {
      let url = `/candidats/export?etablissement_id=${adminData.etablissement_id}`;
      
      if (selectedConcours) {
        url += `&concours_id=${selectedConcours}`;
      }
      if (selectedFiliere) {
        url += `&filiere_id=${selectedFiliere}`;
      }

      const response = await apiService.makeRequest<Candidature[]>(url, 'GET');
      return response.data || [];
    },
    enabled: !!adminData.etablissement_id,
  });

  const handleExportExcel = () => {
    if (candidatures.length === 0) {
      toast({
        title: 'Aucune donnée',
        description: 'Il n\'y a pas de candidatures à exporter',
        variant: 'destructive',
      });
      return;
    }

    const exportData = candidatures.map(c => ({
      'NUPCAN': c.nupcan,
      'Nom': c.nomcan,
      'Prénom': c.prncan,
      'Email': c.maican,
      'Téléphone': c.telcan,
      'Concours': c.libcnc,
      'Filière': c.nomfil,
      'Statut': c.statut,
      'Date candidature': new Date(c.created_at).toLocaleDateString('fr-FR'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidatures');

    const fileName = `candidatures_${selectedConcours ? 'concours_' + selectedConcours : 'toutes'}_${selectedFiliere ? 'filiere_' + selectedFiliere : ''}_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    XLSX.writeFile(workbook, fileName);
    
    toast({
      title: 'Export réussi',
      description: `${candidatures.length} candidatures exportées`,
    });
  };

  const getStatusBadge = (statut: string) => {
    const configs = {
      valide: 'bg-green-100 text-green-800',
      en_attente: 'bg-orange-100 text-orange-800',
      rejete: 'bg-red-100 text-red-800',
    };
    return configs[statut as keyof typeof configs] || configs.en_attente;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Candidatures par Filière et Concours
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Établissement</label>
            <Select value={selectedEtablissement} onValueChange={(value) => {
              setSelectedEtablissement(value);
              setSelectedConcours(''); // Reset concours when etablissement changes
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un établissement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les établissements</SelectItem>
                {etablissements.map((e: any) => (
                  <SelectItem key={e.id} value={e.id.toString()}>
                    {e.nomets}
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
              disabled={!selectedEtablissement || selectedEtablissement === 'all' || concours.length === 0}
            >
              <SelectTrigger className={!selectedEtablissement || selectedEtablissement === 'all' || concours.length === 0 ? 'opacity-50' : ''}>
                <SelectValue placeholder={
                  !selectedEtablissement || selectedEtablissement === 'all' 
                    ? "Sélectionner d'abord un établissement" 
                    : concours.length === 0 
                    ? "Aucun concours disponible"
                    : "Sélectionner un concours"
                } />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les concours</SelectItem>
                {concours.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.libcnc}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Filière</label>
            <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
              <SelectTrigger>
                <SelectValue placeholder="Toutes les filières" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les filières</SelectItem>
                {filieres.map((f) => (
                  <SelectItem key={f.id} value={f.id.toString()}>
                    {f.nomfil}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end gap-2">
            <Button onClick={() => refetch()} className="flex-1">
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
            <Button 
              onClick={handleExportExcel} 
              variant="outline"
              disabled={candidatures.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{candidatures.length}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Validés</p>
                  <p className="text-2xl font-bold text-green-600">
                    {candidatures.filter(c => c.statut === 'valide').length}
                  </p>
                </div>
                <GraduationCap className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">En attente</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {candidatures.filter(c => c.statut === 'en_attente').length}
                  </p>
                </div>
                <FileSpreadsheet className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tableau des résultats */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>NUPCAN</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Prénom</TableHead>
                <TableHead>Concours</TableHead>
                <TableHead>Filière</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : candidatures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune candidature trouvée
                  </TableCell>
                </TableRow>
              ) : (
                candidatures.map((candidature) => (
                  <TableRow key={candidature.id}>
                    <TableCell className="font-medium">{candidature.nupcan}</TableCell>
                    <TableCell>{candidature.nomcan}</TableCell>
                    <TableCell>{candidature.prncan}</TableCell>
                    <TableCell>{candidature.libcnc}</TableCell>
                    <TableCell>{candidature.nomfil}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(candidature.statut)}>
                        {candidature.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(candidature.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default FiliereConcoursFilter;
