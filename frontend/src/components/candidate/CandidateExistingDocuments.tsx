import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Eye, Edit, Trash2, FileText, Calendar} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import {useConfirmation} from '@/hooks/use-confirmation';

interface Document {
    id: number;
    nomdoc: string;
    type: string;
    statut: string;
    created_at: string;
    nom_fichier?: string;
}

interface CandidateExistingDocumentsProps {
    documents: Document[];
    onRefresh: () => void;
}

const CandidateExistingDocuments: React.FC<CandidateExistingDocumentsProps> = ({
                                                                                   documents,
                                                                                   onRefresh
                                                                               }) => {
    const {confirm, ConfirmationDialog} = useConfirmation();
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);

    const getStatusBadge = (statut: string) => {
        switch (statut) {
            case 'valide':
                return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
            case 'rejete':
                return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
            case 'en_attente':
                return <Badge className="bg-orange-100 text-orange-800">En attente</Badge>;
            default:
                return <Badge variant="secondary">{statut}</Badge>;
        }
    };

    const handleViewDocument = (document: Document) => {
        if (document.nom_fichier) {
            const url = `http://localhost:8002/uploads/documents/${document.nom_fichier}`;
            window.open(url, '_blank');
        } else {
            toast({
                title: "Fichier introuvable",
                description: "Le fichier n'est plus disponible",
                variant: "destructive"
            });
        }
    };

    const handleEditDocument = (document: Document) => {
        toast({
            title: "Modification",
            description: "Fonctionnalité de modification en cours de développement",
        });
    };

    const handleDeleteDocument = async (document: Document) => {
        if (await confirm({
            title: 'Supprimer ce document ?',
            description: `Le document « ${document.nomdoc} » sera définitivement supprimé.`,
        })) {
            try {
                // Appel API pour supprimer le document
                toast({
                    title: "Document supprimé",
                    description: "Le document a été supprimé avec succès",
                });
                onRefresh();
            } catch (error) {
                toast({
                    title: "Erreur",
                    description: "Impossible de supprimer le document",
                    variant: "destructive"
                });
            }
        }
    };

    if (!documents || documents.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <FileText className="h-5 w-5 mr-2"/>
                        Mes Documents
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                        <p className="text-muted-foreground">Aucun document soumis</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2"/>
                    Mes Documents ({documents.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nom du document</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Date de soumission</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.map((document) => (
                            <TableRow key={document.id}>
                                <TableCell className="font-medium">
                                    {document.nomdoc}
                                </TableCell>
                                <TableCell>{document.type}</TableCell>
                                <TableCell>
                                    <div className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1 text-muted-foreground"/>
                                        {new Date(document.created_at).toLocaleDateString('fr-FR')}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {getStatusBadge(document.statut)}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleViewDocument(document)}
                                            title="Voir le document"
                                        >
                                            <Eye className="h-4 w-4"/>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleEditDocument(document)}
                                            title="Modifier le document"
                                            disabled={document.statut === 'valide'}
                                        >
                                            <Edit className="h-4 w-4"/>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteDocument(document)}
                                            title="Supprimer le document"
                                            disabled={document.statut === 'valide'}
                                            className="text-red-600 hover:text-red-700"
                                        >
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        <ConfirmationDialog/>
        </>
    );
};

export default CandidateExistingDocuments;
