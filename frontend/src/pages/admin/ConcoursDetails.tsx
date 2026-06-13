import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    Users,
    FileText,
    Calendar,
    Building,
    Trophy,
    Download,
    Filter,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface Candidat {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    statut: 'en_attente' | 'valide' | 'rejete';
    filiere_nom: string;
    created_at: string;
    documents_valides: number;
    documents_total: number;
    paiement_statut: string;
}

const ConcoursDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [selectedFiliere, setSelectedFiliere] = useState<string>('all');
    const [selectedStatut, setSelectedStatut] = useState<string>('all');

    // Récupérer les détails du concours
    const { data: concoursData, isLoading: loadingConcours } = useQuery({
        queryKey: ['concours-details', id],
        queryFn: async () => {
            const response = await apiService.getConcoursById(id!);
            return response.data;
        },
        enabled: !!id,
    });

    // Récupérer les candidatures du concours
    const { data: candidaturesData, isLoading: loadingCandidatures } = useQuery({
        queryKey: ['concours-candidatures', id],
        queryFn: async () => {
            const response = await apiService.makeRequest(
                `/admin/concours/${id}/candidatures`,
                'GET'
            );
            return response.data;
        },
        enabled: !!id,
    });

    // Récupérer les filières du concours
    const { data: filieresData } = useQuery({
        queryKey: ['concours-filieres', id],
        queryFn: async () => {
            const response = await apiService.makeRequest(
                `/concours/${id}/filieres`,
                'GET'
            );
            return response.data;
        },
        enabled: !!id,
    });

    const concours = concoursData || {};
    const candidatures: Candidat[] = candidaturesData || [];
    const filieres = filieresData || [];

    // Filtrer les candidatures
    const candidaturesFiltrees = candidatures.filter((candidat) => {
        const filiereMatch = selectedFiliere === 'all' || candidat.filiere_nom === selectedFiliere;
        const statutMatch = selectedStatut === 'all' || candidat.statut === selectedStatut;
        return filiereMatch && statutMatch;
    });

    // Statistiques
    const stats = {
        total: candidatures.length,
        valides: candidatures.filter((c) => c.statut === 'valide').length,
        en_attente: candidatures.filter((c) => c.statut === 'en_attente').length,
        rejetes: candidatures.filter((c) => c.statut === 'rejete').length,
    };

    // Export Excel
    const handleExportExcel = () => {
        try {
            const dataToExport = candidaturesFiltrees.map((candidat) => ({
                Nom: candidat.nom,
                Prénom: candidat.prenom,
                Email: candidat.email,
                Téléphone: candidat.telephone,
                Filière: candidat.filiere_nom,
                Statut: candidat.statut,
                'Documents validés': `${candidat.documents_valides}/${candidat.documents_total}`,
                'Statut paiement': candidat.paiement_statut,
                'Date candidature': new Date(candidat.created_at).toLocaleDateString('fr-FR'),
            }));

            const ws = XLSX.utils.json_to_sheet(dataToExport);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Candidatures');

            const fileName = `candidatures_${concours.libcnc}_${selectedFiliere !== 'all' ? selectedFiliere : 'toutes-filieres'}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);

            toast({
                title: 'Export réussi',
                description: `${candidaturesFiltrees.length} candidatures exportées`,
            });
        } catch (error) {
            console.error('Erreur export:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible d\'exporter les données',
                variant: 'destructive',
            });
        }
    };

    const getStatutBadge = (statut: string) => {
        const variants = {
            valide: 'default',
            en_attente: 'secondary',
            rejete: 'destructive',
        };
        const colors = {
            valide: 'text-green-600',
            en_attente: 'text-orange-600',
            rejete: 'text-red-600',
        };
        return (
            <Badge variant={variants[statut as keyof typeof variants] as any} className={colors[statut as keyof typeof colors]}>
                {statut === 'valide' && <CheckCircle className="h-3 w-3 mr-1" />}
                {statut === 'en_attente' && <Clock className="h-3 w-3 mr-1" />}
                {statut === 'rejete' && <XCircle className="h-3 w-3 mr-1" />}
                {statut.replace('_', ' ')}
            </Badge>
        );
    };

    if (loadingConcours || loadingCandidatures) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{concours.libcnc}</h1>
                        <p className="text-muted-foreground flex items-center gap-2 mt-1">
                            <Building className="h-4 w-4" />
                            {concours.etablissement_nomets}
                        </p>
                    </div>
                </div>
                <Button onClick={handleExportExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporter Excel
                </Button>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Validés</p>
                                <p className="text-2xl font-bold text-green-600">{stats.valides}</p>
                            </div>
                            <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">En attente</p>
                                <p className="text-2xl font-bold text-orange-600">{stats.en_attente}</p>
                            </div>
                            <Clock className="h-8 w-8 text-orange-500" />
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Rejetés</p>
                                <p className="text-2xl font-bold text-red-600">{stats.rejetes}</p>
                            </div>
                            <XCircle className="h-8 w-8 text-red-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtres */}
            <Card>
                <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                        <Filter className="h-5 w-5 text-muted-foreground" />
                        <div className="flex-1 flex gap-4">
                            <select
                                value={selectedFiliere}
                                onChange={(e) => setSelectedFiliere(e.target.value)}
                                className="px-4 py-2 border rounded-md"
                            >
                                <option value="all">Toutes les filières</option>
                                {filieres.map((filiere: any) => (
                                    <option key={filiere.id} value={filiere.nomfil}>
                                        {filiere.nomfil}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={selectedStatut}
                                onChange={(e) => setSelectedStatut(e.target.value)}
                                className="px-4 py-2 border rounded-md"
                            >
                                <option value="all">Tous les statuts</option>
                                <option value="valide">Validés</option>
                                <option value="en_attente">En attente</option>
                                <option value="rejete">Rejetés</option>
                            </select>
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {candidaturesFiltrees.length} candidature(s)
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Liste des candidatures */}
            <Card>
                <CardHeader>
                    <CardTitle>Liste des candidats</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {candidaturesFiltrees.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                Aucune candidature trouvée
                            </p>
                        ) : (
                            candidaturesFiltrees.map((candidat) => (
                                <div
                                    key={candidat.id}
                                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer"
                                    onClick={() => navigate(`/admin/candidatures/${candidat.id}`)}
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold">
                                            {candidat.nom} {candidat.prenom}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {candidat.email} • {candidat.telephone}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            <Trophy className="h-3 w-3 inline mr-1" />
                                            {candidat.filiere_nom}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Documents</p>
                                            <p className="text-sm font-medium">
                                                {candidat.documents_valides}/{candidat.documents_total}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-muted-foreground">Paiement</p>
                                            <Badge variant={candidat.paiement_statut === 'valide' ? 'default' : 'secondary'}>
                                                {candidat.paiement_statut}
                                            </Badge>
                                        </div>
                                        {getStatutBadge(candidat.statut)}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ConcoursDetails;
