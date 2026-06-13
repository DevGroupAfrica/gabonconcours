import React, {useState} from 'react';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Search, Eye, Users, FileText, CreditCard} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {apiService} from '@/services/api';

const Candidats = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const {data: candidatsData, isLoading} = useQuery({
        queryKey: ['admin-candidats'],
        queryFn: () => apiService.getCandidats(),
    });

    const candidats = candidatsData?.data || [];

    const filteredCandidats = candidats.filter((candidat: any) =>
        candidat.nomcan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidat.prncan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidat.nupcan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidat.maican?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (statut: string) => {
        switch (statut) {
            case 'valide':
                return 'bg-green-100 text-green-800';
            case 'en_attente':
                return 'bg-orange-100 text-orange-800';
            case 'rejete':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const handleViewCandidat = (nupcan: string) => {
        navigate(`/admin/candidats/${nupcan}`);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Gestion des Candidats</h1>
                    <p className="text-muted-foreground">Vue d'ensemble de tous les candidats</p>
                </div>
                <div className="flex space-x-2">
                    <Badge variant="outline" className="bg-blue-50">
                        {candidats.length} candidats au total
                    </Badge>
                </div>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <Users className="h-8 w-8 text-blue-500"/>
                            <div>
                                <p className="text-2xl font-bold">{candidats.length}</p>
                                <p className="text-sm text-muted-foreground">Total candidats</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <FileText className="h-8 w-8 text-green-500"/>
                            <div>
                                <p className="text-2xl font-bold">
                                    {candidats.filter((c: any) => c.documents && c.documents.length > 0).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Avec documents</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <CreditCard className="h-8 w-8 text-purple-500"/>
                            <div>
                                <p className="text-2xl font-bold">
                                    {candidats.filter((c: any) => c.paiement && c.paiement.statut === 'valide').length}
                                </p>
                                <p className="text-sm text-muted-foreground">Paiements validés</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <Users className="h-8 w-8 text-orange-500"/>
                            <div>
                                <p className="text-2xl font-bold">
                                    {candidats.filter((c: any) => c.participations && c.participations.length > 0).length}
                                </p>
                                <p className="text-sm text-muted-foreground">Avec participations</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Liste des Candidats</CardTitle>
                    <div className="flex items-center space-x-2">
                        <Search className="h-4 w-4 text-muted-foreground"/>
                        <Input
                            placeholder="Rechercher un candidat..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="max-w-sm"
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>NUPCAN</TableHead>
                                <TableHead>Nom complet</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Téléphone</TableHead>
                                <TableHead>Participations</TableHead>
                                <TableHead>Documents</TableHead>
                                <TableHead>Paiement</TableHead>
                                <TableHead>Date inscription</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCandidats.map((candidat: any) => (
                                <TableRow key={candidat.id}>
                                    <TableCell className="font-mono font-medium">
                                        {candidat.nupcan}
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        {candidat.prncan} {candidat.nomcan}
                                    </TableCell>
                                    <TableCell>{candidat.maican}</TableCell>
                                    <TableCell>{candidat.telcan}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">
                                            {candidat.participations?.length || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={
                                                candidat.documents && candidat.documents.length > 0
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }
                                        >
                                            {candidat.documents?.length || 0}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={getStatusColor(candidat.paiement?.statut || 'en_attente')}
                                        >
                                            {candidat.paiement?.statut || 'En attente'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(candidat.created_at).toLocaleDateString('fr-FR')}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewCandidat(candidat.nupcan)}
                                        >
                                            <Eye className="h-4 w-4 mr-1"/>
                                            Gérer
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    {filteredCandidats.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            Aucun candidat trouvé
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Candidats;
