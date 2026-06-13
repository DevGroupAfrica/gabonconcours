import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {
    FileText,
    Eye,
    Download,
    CheckCircle,
    XCircle,
    Clock,
    Trash2,
    AlertTriangle
} from 'lucide-react';
import DocumentViewer from './DocumentViewer';

interface Document {
    id?: string;
    nupcan?: string;
    nomdoc?: string;
    type?: string;
    chemin?: string;
    nom_fichier?: string;
    taille?: number;
    statut?: string;
    document_statut?: string;
    created_at?: string;
    updated_at?: string;
    file_size?: number;
    file_name?: string;
    original_name?: string;
}

interface DocumentVisualizationProps {
    documents: Document[];
    onRefresh?: () => void;
    onDocumentAdd?: () => void;
    showActions?: boolean;
}

interface DocumentVisualizationProps {
    document?: any
}

const DocumentVisualization: React.FC<DocumentVisualizationProps> = ({
                                                                         documents = [],
                                                                         onRefresh,
                                                                         onDocumentAdd,
                                                                         showActions = true,
                                                                         document
                                                                     }) => {
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);

    const getStatusBadge = (statut: string) => {
        switch (statut) {
            case 'valide':
            case 'approuve':
                return <Badge className="bg-green-100 text-green-800 border-green-300"><CheckCircle
                    className="h-3 w-3 mr-1"/>Validé</Badge>;
            case 'rejete':
            case 'refuse':
                return <Badge className="bg-red-100 text-red-800 border-red-300"><XCircle className="h-3 w-3 mr-1"/>Rejeté</Badge>;
            case 'en_attente':
            case 'pending':
            default:
                return <Badge className="bg-orange-100 text-orange-800 border-orange-300"><Clock
                    className="h-3 w-3 mr-1"/>En attente</Badge>;
        }
    };

    const getDocumentName = (doc: Document): string => {
        return doc.nomdoc ||
            doc.original_name ||
            doc.nom_fichier ||
            doc.file_name ||
            doc.type ||
            'Document sans nom';
    };

    const getDocumentPath = (doc: Document): string | null => {
        return doc.chemin || doc.nom_fichier || doc.file_name || null;
    };

    const getDocumentSize = (doc: Document): string => {
        const size = doc.taille || doc.file_size;
        if (!size || isNaN(Number(size))) return 'Taille inconnue';

        const numSize = Number(size);
        if (numSize < 1024) return `${numSize} B`;
        if (numSize < 1024 * 1024) return `${(numSize / 1024).toFixed(1)} KB`;
        return `${(numSize / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getDocumentDate = (doc: Document): string => {
        const date = doc.created_at || doc.updated_at;
        if (!date) return 'Date inconnue';

        try {
            return new Date(date).toLocaleDateString('fr-FR');
        } catch {
            return 'Date invalide';
        }
    };

    const handleViewDocument = (doc: Document) => {
        setSelectedDocument(doc);
        setIsViewerOpen(true);
    };

    const handleDownloadDocument = (doc: Document) => {
        const documentPath = getDocumentPath(doc);
        if (!documentPath) {
            console.error('Chemin du document manquant');
            return;
        }

        // Use the API endpoint for document download to ensure proper file serving
        const downloadUrl = `http://localhost:8002/api/documents/${doc.id}/download`;

        const link = window.document.createElement('a');
        link.href = downloadUrl;
        link.download = getDocumentName(doc);
        link.target = '_blank'; // Open in new tab to handle potential errors
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
    };

    if (!documents || documents.length === 0) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4"/>
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                        Aucun document
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Aucun document n'a encore été téléchargé pour cette candidature.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc, index) => {
                    const documentName = getDocumentName(doc);
                    const documentPath = getDocumentPath(doc);
                    const documentSize = getDocumentSize(doc);
                    const documentDate = getDocumentDate(doc);
                    const statut = doc.statut || doc.document_statut || 'en_attente';

                    return (
                        <Card key={doc.id || index} className="hover:shadow-md transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-2">
                                        <FileText className="h-5 w-5 text-blue-600"/>
                                        <CardTitle className="text-sm font-medium truncate" title={documentName}>
                                            {documentName}
                                        </CardTitle>
                                    </div>
                                    {getStatusBadge(statut)}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3">
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <div className="flex justify-between">
                                        <span>Taille:</span>
                                        <span>{documentSize}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Ajouté le:</span>
                                        <span>{documentDate}</span>
                                    </div>
                                    {doc.type && (
                                        <div className="flex justify-between">
                                            <span>Type:</span>
                                            <span className="truncate ml-2">{doc.type}</span>
                                        </div>
                                    )}
                                </div>

                                {showActions && (
                                    <div className="flex space-x-2 pt-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleViewDocument(doc)}
                                            className="flex-1"
                                            disabled={!documentPath}
                                        >
                                            <Eye className="h-3 w-3 mr-1"/>
                                            Voir
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownloadDocument(doc)}
                                            className="flex-1"
                                            disabled={!documentPath || !doc.id}
                                        >
                                            <Download className="h-3 w-3 mr-1"/>
                                            Télécharger
                                        </Button>
                                    </div>
                                )}

                                {!documentPath && (
                                    <div
                                        className="flex items-center space-x-1 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                        <AlertTriangle className="h-3 w-3"/>
                                        <span>Fichier non accessible</span>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {selectedDocument && (
                <DocumentViewer
                    isOpen={isViewerOpen}
                    onClose={() => {
                        setIsViewerOpen(false);
                        setSelectedDocument(null);
                    }}
                    document={selectedDocument}
                />
            )}
        </>
    );
};

export default DocumentVisualization;
