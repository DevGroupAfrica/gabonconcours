// @ts-nocheck - Legacy API compatibility
import React, {useState, useEffect} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Textarea} from '@/components/ui/textarea';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Badge} from '@/components/ui/badge';
import {toast} from '@/hooks/use-toast';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog';
import {
    FileText,
    Download,
    Eye,
    CheckCircle,
    XCircle,
    Clock,
    User,
    Mail,
    Phone,
    Calendar,
    AlertTriangle,
    Send
} from 'lucide-react';
import {adminApiService} from '@/services/adminApi';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import CandidatPhotoCard from './CandidatPhotoCard';

interface Document {
    id: number;
    nom_document: string;
    chemin_fichier: string;
    type_document: string;
    taille_fichier: number;
    statut_validation: 'en_attente' | 'valide' | 'rejete';
    date_upload: string;
    motif_rejet?: string;
}

interface Candidat {
    nupcan: string;
    nomcan: string;
    prncan: string;
    telcan: string;
    maican: string;
    dtncan: string;
    phtcan?: string;
    documents: Document[];
}

interface DocumentValidationInterfaceProps {
    candidat: Candidat;
    onValidationComplete: () => void;
    onClose: () => void;
}

const DocumentValidationInterface: React.FC<DocumentValidationInterfaceProps> = ({
                                                                                     candidat,
                                                                                     onValidationComplete,
                                                                                     onClose
                                                                                 }) => {
    const {admin} = useAdminAuth();
    const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
    const [validationStatus, setValidationStatus] = useState<'valide' | 'rejete' | null>(null);
    const [validationComment, setValidationComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showViewer, setShowViewer] = useState(false);
    const [sendNotification, setSendNotification] = useState(true);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'valide':
                return 'text-green-600 bg-green-100';
            case 'rejete':
                return 'text-red-600 bg-red-100';
            case 'en_attente':
                return 'text-orange-600 bg-orange-100';
            default:
                return 'text-gray-600 bg-gray-100';
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'valide':
                return <CheckCircle className="h-4 w-4"/>;
            case 'rejete':
                return <XCircle className="h-4 w-4"/>;
            case 'en_attente':
                return <Clock className="h-4 w-4"/>;
            default:
                return <AlertTriangle className="h-4 w-4"/>;
        }
    };

    const handleValidateDocument = async () => {
        if (!selectedDocument || !validationStatus) {
            toast({
                title: "Erreur",
                description: "Veuillez sélectionner un statut de validation",
                variant: "destructive",
            });
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await adminApiService.validateDocument(
                selectedDocument.id,
                validationStatus,
                validationComment
            );

            if (response.success) {
                // Envoyer notification par email si demandé
                if (sendNotification) {
                    await sendValidationNotification();
                }

                toast({
                    title: "Succès",
                    description: `Document ${validationStatus === 'valide' ? 'validé' : 'rejeté'} avec succès`,
                });

                onValidationComplete();
                setSelectedDocument(null);
                setValidationStatus(null);
                setValidationComment('');
            } else {
                throw new Error(response.message || "Erreur lors de la validation");
            }
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "Erreur lors de la validation du document",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const sendValidationNotification = async () => {
        try {
            const emailData = {
                to: candidat.maican,
                subject: `Validation de votre document - ${selectedDocument?.nom_document}`,
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Validation de document</h2>
            <p>Bonjour ${candidat.prncan} ${candidat.nomcan},</p>

            <div style="background-color: ${validationStatus === 'valide' ? '#d4edda' : '#f8d7da'};
                        border: 1px solid ${validationStatus === 'valide' ? '#c3e6cb' : '#f5c6cb'};
                        padding: 15px; margin: 20px 0; border-radius: 5px;">
              <h3 style="margin: 0; color: ${validationStatus === 'valide' ? '#155724' : '#721c24'};">
                Document ${validationStatus === 'valide' ? 'VALIDÉ' : 'REJETÉ'}
              </h3>
              <p style="margin: 10px 0 0 0;"><strong>Document:</strong> ${selectedDocument?.nom_document}</p>
              ${validationComment ? `<p style="margin: 10px 0 0 0;"><strong>Commentaire:</strong> ${validationComment}</p>` : ''}
            </div>

            <p>Numéro de candidature: <strong>${candidat.nupcan}</strong></p>
            <p>Validé par: <strong>${admin?.prenom} ${admin?.nom}</strong></p>
            <p>Établissement: <strong>${admin?.etablissement_nom}</strong></p>

            ${validationStatus === 'rejete' ?
                    '<p style="color: #721c24;"><strong>Action requise:</strong> Veuillez soumettre un nouveau document corrigé.</p>' :
                    '<p style="color: #155724;">Votre dossier progresse bien. Vous serez informé des prochaines étapes.</p>'
                }

            <hr style="margin: 30px 0;" />
            <p style="color: #666; font-size: 12px;">
              Ce message a été envoyé automatiquement depuis le système de gestion des candidatures.
              Ne pas répondre à ce message.
            </p>
          </div>
        `
            };

            await fetch('http://localhost:8002/api/email/send', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${adminApiService.getToken()}`
                },
                body: JSON.stringify(emailData)
            });
        } catch (error) {
            console.error('Erreur envoi notification:', error);
            // Ne pas faire échouer la validation si l'email ne marche pas
        }
    };

    const downloadDocument = async (document: Document) => {
        try {
            const response = await fetch(`http://localhost:8002/uploads/documents/${document.chemin_fichier}`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = document.nom_document;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "Téléchargement",
                description: "Document téléchargé avec succès",
            });
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de télécharger le document",
                variant: "destructive",
            });
        }
    };

    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5"/>
                        Validation des documents - {candidat.prncan} {candidat.nomcan}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Informations candidat */}
                    <div className="space-y-4">
                        <CandidatPhotoCard candidat={candidat}/>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm">Informations personnelles</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground"/>
                                    <span>{candidat.prncan} {candidat.nomcan}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground"/>
                                    <span>{candidat.maican}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground"/>
                                    <span>{candidat.telcan}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground"/>
                                    <span>{candidat.dtncan}</span>
                                </div>
                                <div>
                                    <strong>N° Candidature:</strong> {candidat.nupcan}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Liste des documents */}
                    <div className="lg:col-span-2 space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Documents soumis ({candidat.documents?.length || 0})</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {candidat.documents?.map((doc) => (
                                        <div key={doc.id} className="border rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3">
                                                    <FileText className="h-5 w-5 text-blue-500 mt-1"/>
                                                    <div className="flex-1">
                                                        <h4 className="font-medium">{doc.nom_document}</h4>
                                                        <div
                                                            className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                                            <span>{(doc.taille_fichier / 1024 / 1024).toFixed(2)} MB</span>
                                                            <span>{new Date(doc.date_upload).toLocaleDateString('fr-FR')}</span>
                                                        </div>
                                                        {doc.motif_rejet && (
                                                            <div
                                                                className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                                                                <p className="text-sm text-red-700">
                                                                    <strong>Motif de rejet:</strong> {doc.motif_rejet}
                                                                </p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <Badge
                                                        className={`${getStatusColor(doc.statut_validation)} border-0`}>
                                                        <div className="flex items-center gap-1">
                                                            {getStatusIcon(doc.statut_validation)}
                                                            <span
                                                                className="capitalize">{doc.statut_validation.replace('_', ' ')}</span>
                                                        </div>
                                                    </Badge>

                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedDocument(doc);
                                                                setShowViewer(true);
                                                            }}
                                                        >
                                                            <Eye className="h-4 w-4"/>
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => downloadDocument(doc)}
                                                        >
                                                            <Download className="h-4 w-4"/>
                                                        </Button>
                                                        {doc.statut_validation === 'en_attente' && (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => setSelectedDocument(doc)}
                                                            >
                                                                Valider
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {(!candidat.documents || candidat.documents.length === 0) && (
                                        <div className="text-center py-8 text-muted-foreground">
                                            Aucun document soumis pour ce candidat
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Viewer de document */}
                {showViewer && selectedDocument && (
                    <Dialog open={showViewer} onOpenChange={setShowViewer}>
                        <DialogContent className="max-w-4xl max-h-[90vh]">
                            <DialogHeader>
                                <DialogTitle>{selectedDocument.nom_document}</DialogTitle>
                            </DialogHeader>
                            <div className="flex-1 overflow-hidden">
                                <iframe
                                    src={`http://localhost:8002/uploads/documents/${selectedDocument.chemin_fichier}`}
                                    className="w-full h-[70vh]"
                                    title={selectedDocument.nom_document}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Dialog de validation */}
                {selectedDocument && !showViewer && (
                    <Dialog open={!!selectedDocument} onOpenChange={() => setSelectedDocument(null)}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Valider le document</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label>Document: <strong>{selectedDocument.nom_document}</strong></Label>
                                </div>
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
                                            <SelectItem value="valide">✅ Valider</SelectItem>
                                            <SelectItem value="rejete">❌ Rejeter</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="validationComment">
                                        {validationStatus === 'rejete' ? 'Motif de rejet (obligatoire)' : 'Commentaire (optionnel)'}
                                    </Label>
                                    <Textarea
                                        value={validationComment}
                                        onChange={(e) => setValidationComment(e.target.value)}
                                        placeholder={
                                            validationStatus === 'rejete'
                                                ? "Expliquez pourquoi ce document est rejeté..."
                                                : "Ajouter un commentaire..."
                                        }
                                        required={validationStatus === 'rejete'}
                                    />
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="sendNotification"
                                        checked={sendNotification}
                                        onChange={(e) => setSendNotification(e.target.checked)}
                                        className="rounded"
                                    />
                                    <Label htmlFor="sendNotification" className="flex items-center gap-2">
                                        <Send className="h-4 w-4"/>
                                        Notifier le candidat par email
                                    </Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => setSelectedDocument(null)}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    onClick={handleValidateDocument}
                                    disabled={isSubmitting || (validationStatus === 'rejete' && !validationComment)}
                                >
                                    {isSubmitting ? 'Validation...' : 'Confirmer'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default DocumentValidationInterface;
