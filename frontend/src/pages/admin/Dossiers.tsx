import React, {useState} from 'react';
import {useQuery, useMutation, useQueryClient} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Search, Eye, CheckCircle, XCircle, Clock, Download, FileText, User} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import {toast} from '@/hooks/use-toast';
import {apiService} from '@/services/api';
import DocumentValidationModal from '@/components/admin/DocumentValidationModal';
import DocumentViewer from "@/components/DocumentViewer.tsx";
import DocumentVisualization from "@/components/DocumentVisualization.tsx";

const Dossiers = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDocument, setSelectedDocument] = useState<any>(null);
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const queryClient = useQueryClient();

    // Récupérer les dossiers depuis l'API avec jointure complète
    const {data: dossiersData, isLoading} = useQuery({
        queryKey: ['admin-dossiers'],
        queryFn: async () => {
            try {
                const response = await apiService.makeRequest('/dossiers/admin/all', 'GET');
                return response;

            } catch (error) {
                console.error('Erreur récupération dossiers admin:', error);
                return {success: false, data: []};
            }

        },

    });

    const dossiers = dossiersData?.data || [];

    const filteredDossiers = dossiers.filter((d: any) => {
        const matchesSearch = d.nomcan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.nupcan?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.nomdoc?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.libcnc?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || d.statut === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'valide':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle
                    className="h-3 w-3 mr-1"/>Validé</Badge>;
            case 'rejete':
                return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1"/>Rejeté</Badge>;
            case 'en_attente':
                return <Badge className="bg-orange-100 text-orange-800"><Clock className="h-3 w-3 mr-1"/>En
                    attente</Badge>;
            default:
                return <Badge variant="secondary">Inconnu</Badge>;
        }
    };

    const validateDocumentMutation = useMutation({
        mutationFn: ({documentId, statut, commentaire}: {
            documentId: number;
            statut: 'valide' | 'rejete';
            commentaire?: string
        }) =>
            apiService.validateDocument(documentId.toString(), statut, commentaire),
        onSuccess: () => {
            queryClient.invalidateQueries({queryKey: ['admin-dossiers']});
            toast({
                title: "Document validé",
                description: "Le candidat a été automatiquement notifié",
            });
        },
        onError: (error) => {
            console.error('Erreur validation:', error);
            toast({
                title: "Erreur",
                description: "Impossible de valider le document",
                variant: "destructive",
            });
        },
    });

    const handleOpenValidationModal = (dossier: any) => {
        setSelectedDocument(dossier);
        setIsValidationModalOpen(true);
    };

    const handleValidateDocument = async (documentId: number, statut: 'valide' | 'rejete', commentaire?: string) => {
        await validateDocumentMutation.mutateAsync({documentId, statut, commentaire});
    };

    const handleDownloadDocument = (document: any) => {
        if (document.nom_fichier) {
            const url = `http://localhost:8002/uploads/documents/${document.nom_fichier}`;
            window.open(url, '_blank');
        }
    };

    const statsData = {
        total: dossiers.length,
        en_attente: dossiers.filter((d: any) => d.statut === 'en_attente').length,
        valide: dossiers.filter((d: any) => d.statut === 'valide').length,
        rejete: dossiers.filter((d: any) => d.statut === 'rejete').length,
    };

    if (isLoading) {
        return (
            <AdminProtectedRoute>
                <AdminLayout>
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                    </div>
                </AdminLayout>
            </AdminProtectedRoute>
        );
    }

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-foreground">Validation des Documents</h1>
                            <p className="text-muted-foreground">Gérer et valider les documents des candidats</p>
                        </div>
                    </div>

                    {/* Statistiques */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <FileText className="h-8 w-8 text-blue-500"/>
                                    <div>
                                        <p className="text-2xl font-bold">{statsData.total}</p>
                                        <p className="text-sm text-muted-foreground">Total documents</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <Clock className="h-8 w-8 text-orange-500"/>
                                    <div>
                                        <p className="text-2xl font-bold">{statsData.en_attente}</p>
                                        <p className="text-sm text-muted-foreground">En attente</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <CheckCircle className="h-8 w-8 text-green-500"/>
                                    <div>
                                        <p className="text-2xl font-bold">{statsData.valide}</p>
                                        <p className="text-sm text-muted-foreground">Validés</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <XCircle className="h-8 w-8 text-red-500"/>
                                    <div>
                                        <p className="text-2xl font-bold">{statsData.rejete}</p>
                                        <p className="text-sm text-muted-foreground">Rejetés</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filtres et recherche */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Documents à valider</CardTitle>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <Search className="h-4 w-4 text-muted-foreground"/>
                                    <Input
                                        placeholder="Rechercher..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="max-w-sm"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="px-3 py-2 border rounded-md"
                                >
                                    <option value="all">Tous les statuts</option>
                                    <option value="en_attente">En attente</option>
                                    <option value="valide">Validés</option>
                                    <option value="rejete">Rejetés</option>
                                </select>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Candidat</TableHead>
                                        <TableHead>NUPCAN</TableHead>
                                        <TableHead>Document</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Concours</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredDossiers.map((dossier: any) => (
                                        <TableRow key={dossier.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-4 w-4"/>
                                                    <span>{dossier.prncan} {dossier.nomcan}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono">{dossier.nupcan}</TableCell>
                                            <TableCell className="max-w-xs truncate">{dossier.nomdoc}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{dossier.type}</Badge>
                                            </TableCell>
                                            <TableCell className="max-w-xs truncate">{dossier.libcnc}</TableCell>
                                            <TableCell>
                                                {new Date(dossier.created_at).toLocaleDateString('fr-FR')}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(dossier.statut)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenValidationModal(dossier)}
                                                    >
                                                        <Eye className="h-4 w-4"/>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDownloadDocument(dossier)}
                                                    >
                                                        <Download className="h-4 w-4"/>
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {filteredDossiers.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    Aucun document trouvé
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Modal de validation */}
                <DocumentViewer
                    document={selectedDocument}
                    isOpen={isValidationModalOpen}
                    onClose={() => {
                        setIsValidationModalOpen(false);
                        setSelectedDocument(null);
                    }}

                />
            </AdminLayout>
        </AdminProtectedRoute>
    );
};

export default Dossiers;
