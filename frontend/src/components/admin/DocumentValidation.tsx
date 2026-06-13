import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Textarea} from '@/components/ui/textarea';
import {Label} from '@/components/ui/label';
import {
    CheckCircle,
    XCircle,
    Eye,
    MessageSquare,
    FileText,
    Download,
    Calendar
} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import {apiService} from '@/services/api';

interface Document {
    id: number;
    type: string;
    nom_fichier: string;
    statut: string;
    nomdoc?: string;
    created_at: string;
    candidat_nomcan?: string;
    candidat_prncan?: string;
    candidat_nupcan?: string;
}

interface DocumentValidationProps {
    documents: Document[];
    onRefresh: () => void;
}

const DocumentValidation: React.FC<DocumentValidationProps> = ({
                                                                   documents,
                                                                   onRefresh
                                                               }) => {
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [validationDialog, setValidationDialog] = useState(false);
     const [validationType, setValidationType] = useState<'valide' | 'rejete'>('valide');
   const [comment, setComment] = useState('');
    const [validating, setValidating] = useState(false);

    const getStatusBadge = (statut: string) => {
        switch (statut) {
            case 'valide':
                return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
            case 'rejete':
                return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
            default:
                return <Badge className="bg-orange-100 text-orange-800">En attente</Badge>;
        }
    };

    const handleValidation = async (document: Document, statut: 'valide' | 'rejete') => {
        setSelectedDocument(document);
        setValidationType(statut);
        setValidationDialog(true);
    };

    const confirmValidation = async () => {
        if (!selectedDocument) return;

        try {
            setValidating(true);
            await apiService.updateDocumentStatus(selectedDocument.id.toString(), validationType);

            toast({
                title: "Document validé",
                description: `Le document a été ${validationType}`,
            });

            setValidationDialog(false);
            setComment('');
            onRefresh();
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de valider le document",
                variant: "destructive",
            });
        } finally {
            setValidating(false);
        }
    };

    const handleDownload = (document: Document) => {
        apiService.downloadDocument(document.id.toString());
    };

    if (!documents || documents.length === 0) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center">
                        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                        <h3 className="text-lg font-semibold mb-2">Aucun document à valider</h3>
                        <p className="text-muted-foreground">
                            Tous les documents ont été traités
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {documents.map((document) => (
                    <Card key={document.id}>
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <FileText className="h-4 w-4 text-muted-foreground"/>
                                        <h4 className="font-medium">{document.type || document.nomdoc}</h4>
                                        {getStatusBadge(document.statut)}
                                    </div>

                                    <p className="text-sm text-muted-foreground mb-1">
                                        Fichier: {document.nom_fichier}
                                    </p>

                                    {document.candidat_nupcan && (
                                        <p className="text-sm text-muted-foreground mb-1">
                                            Candidat: {document.candidat_prncan} {document.candidat_nomcan}
                                            ({document.candidat_nupcan})
                                        </p>
                                    )}

                                    <p className="text-xs text-muted-foreground flex items-center">
                                        <Calendar className="h-3 w-3 mr-1"/>
                                        Soumis le {new Date(document.created_at).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDownload(document)}
                                    >
                                        <Eye className="h-4 w-4"/>
                                    </Button>

                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDownload(document)}
                                    >
                                        <Download className="h-4 w-4"/>
                                    </Button>

                                    {document.statut === 'en_attente' && (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={() => handleValidation(document, 'valide')}
                                                className="bg-green-600 hover:bg-green-700"
                                            >
                                                <CheckCircle className="h-4 w-4"/>
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleValidation(document, 'rejete')}
                                            >
                                                <XCircle className="h-4 w-4"/>
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Dialog de validation */}
            <Dialog open={validationDialog} onOpenChange={setValidationDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {validationType === 'valide' ? 'Valider' : 'Rejeter'} le document
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <p className="font-medium">{selectedDocument?.type || selectedDocument?.nomdoc}</p>
                            <p className="text-sm text-muted-foreground">
                                {selectedDocument?.nom_fichier}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="comment">
                                Commentaire {validationType === 'rejete' ? '(requis)' : '(optionnel)'}
                            </Label>
                            <Textarea
                                id="comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder={`Ajoutez un commentaire pour ${validationType === 'valide' ? 'la validation' : 'le rejet'}...`}
                                rows={3}
                            />
                        </div>

                        <div className="flex space-x-2">
                            <Button
                                onClick={confirmValidation}
                                disabled={validating || (validationType === 'rejete' && !comment.trim())}
                                className={validationType === 'valide' ? 'bg-green-600 hover:bg-green-700' : ''}
                                variant={validationType === 'rejete' ? 'destructive' : 'default'}
                            >
                                {validating ? 'Traitement...' : `Confirmer ${validationType === 'valide' ? 'la validation' : 'le rejet'}`}
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => setValidationDialog(false)}
                                disabled={validating}
                            >
                                Annuler
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default DocumentValidation;
