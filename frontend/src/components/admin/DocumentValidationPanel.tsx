import React, {useState, useEffect} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {toast} from '@/hooks/use-toast';
import {
    FileText,
    Download,
    Eye,
    CheckCircle,
    XCircle
} from 'lucide-react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog';
import {apiService} from '@/services/api';
import {candidatureService} from '@/services/candidatureService';

interface Document {
    id: number;
    nom_document: string;
    chemin_fichier: string;
    type_document: string;
    taille_fichier: number;
    statut_validation: 'en_attente' | 'valide' | 'rejete';
    date_upload: string;
}

interface DocumentViewerProps {
    documents: Document[];
    onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({documents, onClose}) => {
    const document = documents[0];

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{document?.nom_document}</DialogTitle>
                </DialogHeader>
                {document && (
                    <div className="flex-1 overflow-hidden">
                        <iframe
                            src={`http://localhost:8002/uploads/documents/${document.chemin_fichier}`}
                            className="w-full h-[70vh]"
                            title={document.nom_document}
                        />
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};

interface DocumentValidationPanelProps {
    candidatNupcan: string;
    onValidationComplete: () => void;
}

const DocumentValidationPanel: React.FC<DocumentValidationPanelProps> = ({
                                                                             candidatNupcan,
                                                                             onValidationComplete
                                                                         }) => {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [validationStatus, setValidationStatus] = useState<'valide' | 'rejete' | null>(null);
    const [validationComment, setValidationComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchDocuments();
    }, [candidatNupcan]);

    const fetchDocuments = async () => {
        try {
            const response = await apiService.getDocumentsByCandidat(candidatNupcan);
            if (response.success) {
                setDocuments(response.data as Document[]);
            } else {
                toast({
                    title: "Erreur",
                    description: "Impossible de charger les documents",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Erreur de connexion au serveur",
                variant: "destructive",
            });
        }
    };

    const handleValidate = async () => {
        if (!selectedDocument || !validationStatus) {
            toast({
                title: "Erreur",
                description: "Veuillez sélectionner un document et un statut de validation",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await apiService.validateDocument(
                selectedDocument.id.toString(),
                validationStatus,
                validationComment
            );

            if (response.success) {
                toast({
                    title: "Succès",
                    description: "Document validé avec succès",
                });
                fetchDocuments(); // Refresh documents
                setSelectedDocument(null);
                onValidationComplete();
            } else {
                toast({
                    title: "Erreur",
                    description: response.message || "Impossible de valider le document",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Erreur de connexion au serveur",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Validation des Documents</CardTitle>
            </CardHeader>
            <CardContent>
                {documents.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                        Aucun document à valider pour ce candidat.
                    </p>
                ) : (
                    <div className="grid gap-4">
                        {documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="flex items-center gap-3">
                                    <FileText className="h-5 w-5 text-blue-500"/>
                                    <div>
                                        <p className="font-medium">{doc.nom_document}</p>
                                        <p className="text-sm text-muted-foreground">
                                            {(doc.taille_fichier / 1024 / 1024).toFixed(2)} MB
                                            • {new Date(doc.date_upload).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedDocument(doc)}
                                        disabled={selectedDocument !== null}
                                    >
                                        Valider
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {selectedDocument && (
                    <DocumentViewer
                        documents={[{
                            id: selectedDocument.id,
                            nom_document: selectedDocument.nom_document,
                            chemin_fichier: selectedDocument.chemin_fichier,
                            type_document: selectedDocument.type_document,
                            taille_fichier: selectedDocument.taille_fichier,
                            statut_validation: selectedDocument.statut_validation,
                            date_upload: selectedDocument.date_upload
                        }]}
                        onClose={() => setSelectedDocument(null)}
                    />
                )}

                {selectedDocument && (
                    <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Validation du document</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="validationStatus">Statut de validation</Label>
                                    <Select
                                        value={validationStatus || ''}
                                        onValueChange={(value) => setValidationStatus(value as 'valide' | 'rejete')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner un statut"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="valide">Valider</SelectItem>
                                            <SelectItem value="rejete">Rejeter</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="validationComment">Commentaire (optionnel)</Label>
                                    <Textarea
                                        value={validationComment}
                                        onChange={(e) => setValidationComment(e.target.value)}
                                        placeholder="Ajouter un commentaire..."
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="secondary" onClick={() => setSelectedDocument(null)}>
                                    Annuler
                                </Button>
                                <Button onClick={handleValidate} disabled={isSubmitting}>
                                    {isSubmitting ? 'Validation...' : 'Valider'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </CardContent>
        </Card>
    );
};

export default DocumentValidationPanel;
