        import React, { useState } from 'react';
        import { useParams, useNavigate } from 'react-router-dom';
        import { useQuery } from '@tanstack/react-query';
        import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
        import { Button } from '@/components/ui/button';
        import { Badge } from '@/components/ui/badge';
        import { Progress } from '@/components/ui/progress';
        import DocumentEditForm from '../components/DocumentEditForm.tsx';
        import {
            User,
            Trophy,
            FileText,
            CreditCard,
            CheckCircle,
            Clock,
            Download,
            Eye,
            BookOpen,
            GraduationCap,
            Mail,
            Phone,
            Calendar,
            MapPin,
            School,
            FileCheck,
            Send,
            Image as ImageIcon,
            Trash2,
            Edit,
            ArrowRight,
            ArrowLeft,
        } from 'lucide-react';



        import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
        import Layout from '@/components/Layout';
        import { candidatureService } from '@/services/candidatureService';
        import BeautifulHorizontalReceipt from '@/components/BeautifulHorizontalReceipt';
        import DocumentViewer from '@/components/DocumentViewer';
        import DocumentUploadForm from '@/components/DocumentUploadForm';
        import NotificationPanel from '@/components/candidate/NotificationPanel';
        import CandidatePhotoDisplay from '@/components/CandidatePhotoDisplay';
        import { receiptService } from '@/services/receiptService';
        import { receiptImageService } from '@/services/receiptImageService';
        import { toast } from '@/hooks/use-toast';
        import { documentService } from "@/services/documentService.ts";
        import MessagerieCandidat from '@/components/MessagerieCandidat';
        import { ProgressBar } from '@/components/ProgressBar';
        import GradesView from '@/pages/candidate/GradesView';
        import DocumentReplaceDialog from '@/components/documents/DocumentReplaceDialog';
        import GradesBulletinPDF from "@/components/candidat/GradesBulletinPDF.tsx";
        import GradesBulletin from "@/components/candidat/GradesBulletin.tsx";
        import CandidatDashboard from "./CandidatDashboard";
    import  {Modal,ModalContent} from "@/components/ui/modal";
import AddDocumentDialog from '@/components/candidat/AddDocumentDialog.tsx';

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { className: string; label: string }> = {
    valide: { className: 'bg-emerald-100 text-emerald-800 border-emerald-200', label: 'Validé' },
    rejete: { className: 'bg-rose-100 text-rose-800 border-rose-200', label: 'Rejeté' },
    en_attente: { className: 'bg-amber-100 text-amber-800 border-amber-200', label: 'En attente' },
    soumis: { className: 'bg-blue-100 text-blue-800 border-blue-200', label: 'Soumis' },
  };

  const { className, label } = config[status] || config.en_attente;

  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
};
        const DashboardCandidat = () => {
            const { nupcan } = useParams<{ nupcan: string }>();
            const navigate = useNavigate();
            const [isDownloading, setIsDownloading] = useState(false);
            const [isSendingEmail, setIsSendingEmail] = useState(false);
            const [isDownloadingPNG, setIsDownloadingPNG] = useState(false);
            const [selectedDocumentToView, setSelectedDocumentToView] = useState<any | null>(null);
            const [selectedDocumentToEdit, setSelectedDocumentToEdit] = useState<any | null>(null);
const [showAlert, setShowAlert] = useState(false);
            const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'messages' | 'notes'>('overview');
            const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
            const [documentToReplace, setDocumentToReplace] = useState<any | null>(null);
const [isAddDocOpen, setIsAddDocOpen] = useState(false);

            const handleReplaceDocument = (doc: any) => {
                setDocumentToReplace(doc);
                setReplaceDialogOpen(true);
            };

            const { data: candidatureData, isLoading, error, refetch } = useQuery({
                queryKey: ['candidature-complete', nupcan],
                queryFn: () => candidatureService.getCandidatureByNupcan(nupcan!),
                enabled: !!nupcan,
                refetchInterval: 20000,
            });

            const handleContinuerVersDocuments = () => {
                navigate(`/document/${encodeURIComponent(nupcan)}`);
            };

       

            const TelechargerRecuPNG = async () => {
                if (!candidatureData) return;
                try {
                    setIsDownloadingPNG(true);
                    const recuData = {
                        candidat: {
                            ...candidatureData.candidat,
                            ldncan: candidatureData.candidat.ldncan || 'Libreville',
                            phtcan: typeof candidatureData.candidat.phtcan === 'string' ? candidatureData.candidat.phtcan : undefined,
                        },
                        concours: {
                            ...candidatureData.concours,
                            fracnc: candidatureData.concours.fracnc || 0,
                            sescnc: candidatureData.concours.sescnc || '',
                        },
                        filiere: candidatureData.filiere,
                        paiement: candidatureData.paiement || {
                            reference: 'N/A',
                            montant: parseFloat(candidatureData.concours.fracnc || '0'),
                            date: new Date().toISOString(),
                            statut: parseFloat(candidatureData.concours.fracnc || '0') === 0 ? 'gratuit' : 'en_attente',
                            methode: 'N/A',
                        },
                        documents: candidatureData.documents || [],
                    };
                    await receiptImageService.downloadReceiptImage(recuData);
                    receiptImageService.sendReceiptImageByEmail(recuData, candidatureData.candidat.maican);
                    toast({
                        title: 'Téléchargement et envoi réussis',
                        description: 'Votre reçu PNG a été téléchargé et envoyé par email'
                    });
                } catch (error) {
                    toast({ title: 'Erreur', description: 'Impossible de télécharger le reçu PNG', variant: 'destructive' });
                } finally {
                    setIsDownloadingPNG(false);
                }
            };

         const handleEmailReceipt = async () => {
    if (!candidatureData) return;
    try {
        setIsSendingEmail(true);
        const recuData = {
            candidat: {
                ...candidatureData.candidat,
                ldncan: candidatureData.candidat.ldncan || 'Libreville',
                phtcan: typeof candidatureData.candidat.phtcan === 'string' ? candidatureData.candidat.phtcan : undefined,
            },
            concours: {
                ...candidatureData.concours,
                fracnc: candidatureData.concours.fracnc || 0,
                sescnc: candidatureData.concours.sescnc || '',
            },
            filiere: candidatureData.filiere,
            paiement: candidatureData.paiement || {
                reference: 'N/A',
                montant: parseFloat(candidatureData.concours.fracnc || '0'),
                date: new Date().toISOString(),
                statut: parseFloat(candidatureData.concours.fracnc || '0') === 0 ? 'gratuit' : 'en_attente',
                methode: 'N/A',
            },
            documents: candidatureData.documents || [],
        };
        await receiptService.generateAndSendReceiptEmail(recuData, candidatureData.candidat.maican);
        toast({ title: 'Reçu envoyé', description: 'Le reçu a été envoyé à votre adresse email avec succès' });
    } catch (error) {
        toast({ title: 'Erreur d\'envoi', description: 'Impossible d\'envoyer le reçu par email', variant: 'destructive' });
    } finally {
        setIsSendingEmail(false);
    }
};

const TelechargerRecu = async () => {
    if (!candidatureData) return;
    try {
        setIsDownloading(true);
        const recuData = {
            candidat: {
                ...candidatureData.candidat,
                ldncan: candidatureData.candidat.ldncan || 'Libreville',
                phtcan: typeof candidatureData.candidat.phtcan === 'string' ? candidatureData.candidat.phtcan : undefined,
            },
            concours: {
                ...candidatureData.concours,
                fracnc: candidatureData.concours.fracnc || 0,
                sescnc: candidatureData.concours.sescnc || '',
            },
            filiere: candidatureData.filiere,
            paiement: candidatureData.paiement || {
                reference: 'N/A',
                montant: parseFloat(candidatureData.concours.fracnc || '0'),
                date: new Date().toISOString(),
                statut: parseFloat(candidatureData.concours.fracnc || '0') === 0 ? 'gratuit' : 'en_attente',
                methode: 'N/A',
            },
            documents: candidatureData.documents || [],
        };
        await receiptService.downloadReceiptPDF(recuData);
        toast({ title: 'Téléchargement réussi', description: 'Votre reçu PDF a été téléchargé avec succès' });
    } catch (error) {
        toast({ title: 'Erreur de téléchargement', description: 'Impossible de télécharger le reçu PDF', variant: 'destructive' });
    } finally {
        setIsDownloading(false);
    }
};


            const handleDocumentAdd = async (documents: { name: string; file: File }[]) => {
                if (!nupcan) return;
                try {
                    console.log('Ajout de documents:', documents);
                    toast({ title: 'Documents ajoutés', description: `${documents.length} document(s) ajouté(s) avec succès` });
                    await refetch();
                } catch (error) {
                    toast({ title: 'Erreur', description: 'Impossible d\'ajouter les documents', variant: 'destructive' });
                }
            };

            const handleContinueApplication = () => {
                if (progression?.etapeActuelle === 'documents') {
                    navigate(`/documents/${nupcan}`);
                } else if (progression?.etapeActuelle === 'paiement') {
    if (!allDocumentsValidated) {
      setShowAlert(true);
      return;
    }
    navigate(`/paiement/${nupcan}`);
  }
};


            const handlePostuler = (nupcan: string) => {
                navigate(`/documentPage/${nupcan}`);
            };

            const handleDeleteDocument = async (doc: any) => {
                if (!doc || !doc.id) {
                    toast({
                        title: 'Erreur',
                        description: 'Document invalide',
                        variant: 'destructive'
                    });
                    return;
                }

                if (doc.statut === 'valide') {
                    toast({
                        title: 'Action interdite',
                        description: 'Impossible de supprimer un document validé',
                        variant: 'destructive'
                    });
                    return;
                }

                try {
                    await documentService.deleteDocument(nupcan!, doc.id.toString());
                    toast({ title: 'Document supprimé', description: 'Le document a été supprimé avec succès' });
                    await refetch();
                } catch (error) {
                    toast({ title: 'Erreur', description: 'Impossible de supprimer le document', variant: 'destructive' });
                }
            };



           
            const fileInputRef = React.useRef<HTMLInputElement | null>(null);
            const [currentDocId, setCurrentDocId] = useState<string | null>(null);

        // Fonction pour déclencher l'input file
            const triggerFileInput = (docId: string) => {
                setCurrentDocId(docId);
                fileInputRef.current?.click();
            };

        // Fonction pour gérer le fichier sélectionné
            const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
                if (!e.target.files || e.target.files.length === 0 || !currentDocId) return;

                const file = e.target.files[0];

                try {
                    // Appel au service pour modifier le document
                    await documentService.updateDocument(currentDocId, file);
                    toast({ title: 'Document modifié', description: 'Votre document a été mis à jour avec succès' });
                    await refetch(); // Recharger les documents
                } catch (error) {
                    toast({ title: 'Erreur', description: 'Impossible de modifier le document', variant: 'destructive' });
                } finally {
                    e.target.value = ''; // Reset de l'input
                    setCurrentDocId(null);
                }
            };


            if (isLoading) {
                return (
                    <Layout>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                                <p>Chargement de votre tableau de bord...</p>
                            </div>
                        </div>
                    </Layout>
                );
            }

            if (error || !candidatureData) {
                return (
                    <Layout>
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                            <div className="text-center">
                                <h1 className="text-2xl font-bold text-red-600 mb-4">
                                    {error ? 'Erreur de chargement' : 'Candidature introuvable'}
                                </h1>
                                <Button onClick={() => navigate('/connexion')}>Retour à la connexion</Button>
                            </div>
                        </div>
                    </Layout>
                );
            }

            const { candidat, concours, filiere, documents, paiement, progression } = candidatureData;
            const isApplicationComplete = progression?.pourcentage === 100;
            const nextStepNeeded = !isApplicationComplete;
            const isGratuit = parseFloat(concours?.fracnc || '0') === 0;
            const photoPath = typeof candidat?.phtcan === 'string' ? candidat.phtcan : null;
        // Vérifier si tous les documents du candidat sont validés
            const allDocumentsValidated =
                documents &&
                documents.length > 0 &&
                documents.every((doc: any) => doc.document_statut === 'valide');



            // Déterminer l'étape actuelle et les étapes complétées
            const getCurrentStep = (): 'inscription' | 'documents' | 'paiement' | 'termine' => {
                if (!paiement || paiement.statut === 'en_attente') return 'paiement';
                if (!documents || documents.length === 0) return 'documents';
                return 'termine';
            };

            const getCompletedSteps = () => {
                const steps = ['inscription'];
                if (documents && documents.length > 0) steps.push('documents');
                if (paiement && paiement.statut === 'valide') steps.push('paiement');
                return steps;
            };

            return (
                <Layout>
                    <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Documents non validés</AlertDialogTitle>
      <AlertDialogDescription>
        Vous ne pouvez pas encore procéder au paiement. <br />
        Tous vos documents doivent d’abord être validés par l’administration.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogAction onClick={() => setShowAlert(false)}>
        Compris
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {/* Barre de progression */}
                        <div className="mb-6">
                            <ProgressBar
                                currentStep={getCurrentStep()}
                            />
                        </div>

                        <div className="mb-8">
                            <Button variant="ghost" onClick={() => navigate('/connexion')} className="mb-6">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Retour
                            </Button>
                            <div className="bg-gradient-to-r from-primary/10 to-blue-50 rounded-xl p-8 mb-8">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-6">
                                        <CandidatePhotoDisplay
                                            photoPath={photoPath}
                                            candidateName={`${candidat?.prncan} ${candidat?.nomcan}`}
                                            size="lg"
                                        />
                                        <div>
                                            <h1 className="text-4xl font-bold text-foreground mb-2">Tableau de Bord Candidat</h1>
                                            <p className="text-xl text-muted-foreground mb-1">
                                                Bienvenue, {candidat?.prncan} {candidat?.nomcan}
                                            </p>
                                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                                <div className="flex items-center">
                                                    <Mail className="h-4 w-4 mr-1" />
                                                    {candidat?.maican}
                                                </div>
                                                <div className="flex items-center">
                                                    <Phone className="h-4 w-4 mr-1" />
                                                    {candidat?.telcan}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <Badge variant="outline" className="text-lg px-4 py-2 mb-2">
                                            NUPCAN: {candidat?.nupcan}
                                        </Badge>
                                        <p className="text-sm text-muted-foreground">
                                            Inscrit le{' '}
                                            {candidat?.created_at
                                                ? new Date(candidat.created_at).toLocaleDateString('fr-FR')
                                                : 'N/A'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                            <div className="lg:col-span-2">
                                <Card className="h-full">
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="flex items-center">
                                                <Trophy className="h-6 w-6 mr-2 text-primary" />
                                                Progression de votre candidature
                                            </CardTitle>
                                            {nextStepNeeded && (
                                                <Button onClick={handleContinueApplication} size="sm">
                                                    <ArrowRight className="h-4 w-4 mr-2" />
                                                    Continuer
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center">
                                                <span className="text-lg font-medium">Progression globale</span>
                                                <span className="text-2xl font-bold text-primary">
                              {progression?.pourcentage || 0}%
                            </span>
                                            </div>
                                            <Progress value={progression?.pourcentage || 0} className="h-3" />
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 border border-green-200">
                                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                                    <div>
                                                        <p className="font-medium text-green-800">Inscription</p>
                                                        <p className="text-sm text-green-600">Terminée</p>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                                                        documents && documents.length > 0
                                                            ? 'bg-green-50 border-green-200'
                                                            : 'bg-orange-50 border-orange-200'
                                                    }`}
                                                >
                                                    <FileText
                                                        className={`h-5 w-5 ${
                                                            documents && documents.length > 0 ? 'text-green-600' : 'text-orange-600'
                                                        }`}
                                                    />
                                                    <div>
                                                        <p
                                                            className={`font-medium ${
                                                                documents && documents.length > 0 ? 'text-green-800' : 'text-orange-800'
                                                            }`}
                                                        >
                                                            Documents
                                                        </p>
                                                        <p
                                                            className={`text-sm ${
                                                                documents && documents.length > 0 ? 'text-green-600' : 'text-orange-600'
                                                            }`}
                                                        >
                                                            {documents && documents.length > 0 ? 'Soumis' : 'En attente'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div
                                                    className={`flex items-center space-x-3 p-3 rounded-lg ${
                                                        isGratuit
                                                            ? 'bg-green-50 border-green-200'
                                                            : allDocumentsValidated
                                                                ? paiement
                                                                    ? 'bg-green-50 border-green-200'
                                                                    : 'bg-yellow-50 border-yellow-200'
                                                                : 'bg-orange-50 border-orange-200'
                                                    }`}
                                                >
                                                    <CreditCard
                                                        className={`h-5 w-5 ${
                                                            isGratuit
                                                                ? 'text-green-600'
                                                                : allDocumentsValidated
                                                                    ? paiement
                                                                        ? 'text-green-600'
                                                                        : 'text-yellow-600'
                                                                    : 'text-orange-600'
                                                        }`}
                                                    />
                                                    <div>
                                                        <p
                                                            className={`font-medium ${
                                                                isGratuit
                                                                    ? 'text-green-800'
                                                                    : allDocumentsValidated
                                                                        ? paiement
                                                                            ? 'text-green-800'
                                                                            : 'text-yellow-800'
                                                                        : 'text-orange-800'
                                                            }`}
                                                        >
                                                            Paiement
                                                        </p>
                                                        <p
                                                            className={`text-sm ${
                                                                isGratuit
                                                                    ? 'text-green-600'
                                                                    : allDocumentsValidated
                                                                        ? paiement
                                                                            ? 'text-green-600'
                                                                            : 'text-yellow-600'
                                                                        : 'text-orange-600'
                                                            }`}
                                                        >
                                                            {isGratuit
                                                                ? 'Gratuit'
                                                                : paiement
                                                                    ? 'Payé'
                                                                    : allDocumentsValidated
                                                                        ? 'Autorisé (documents validés)'
                                                                        : 'En attente de validation des documents'}
                                                        </p>
                                                    </div>
                                                </div>

                                            </div>
                                            {nextStepNeeded && (
                                                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                    <div className="flex items-center space-x-2">
                                                        <Clock className="h-5 w-5 text-blue-600" />
                                                        <span className="font-medium text-blue-800">Prochaine étape :</span>
                                                        <span className="text-blue-700">
                                  {progression?.etapeActuelle === 'documents'
                                      ? 'Télécharger vos documents'
                                      : progression?.etapeActuelle === 'paiement'
                                          ? 'Effectuer le paiement'
                                          : 'Finaliser votre candidature'}
                                </span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="lg:col-span-1">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg">Actions rapides</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <Button
                                            onClick={TelechargerRecu}
                                            className="w-full justify-start"
                                            variant="outline"
                                            disabled={isDownloading}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            {isDownloading ? 'Téléchargement...' : 'Télécharger le reçu PDF'}
                                        </Button>
                                        <Button
                                            onClick={TelechargerRecuPNG}
                                            className="w-full justify-start"
                                            variant="outline"
                                            disabled={isDownloadingPNG}
                                        >
                                            <ImageIcon className="h-4 w-4 mr-2" />
                                            {isDownloadingPNG ? 'Téléchargement...' : 'Télécharger le reçu PNG'}
                                        </Button>
                                        <Button
                                            onClick={handleEmailReceipt}
                                            className="w-full justify-start"
                                            variant="outline"
                                            disabled={isSendingEmail}
                                        >
                                            <Send className="h-4 w-4 mr-2" />
                                            {isSendingEmail ? 'Envoi en cours...' : 'Envoyer le reçu par email'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {candidat?.nupcan && (
                            <div className="mb-8">
                                <NotificationPanel nupcan={candidat.nupcan} />
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <User className="h-5 w-5 mr-2" />
                                        Profil Candidat
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-start space-x-6">
                                        <CandidatePhotoDisplay
                                            photoPath={photoPath}
                                            candidateName={`${candidat?.prncan} ${candidat?.nomcan}`}
                                            size="md"
                                        />
                                        <div className="flex-1 space-y-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <span className="text-sm font-medium text-muted-foreground">Nom</span>
                                                    <p className="font-medium">{candidat?.nomcan}</p>
                                                </div>
                                                <div>
                                                    <span className="text-sm font-medium text-muted-foreground">Prénom</span>
                                                    <p className="font-medium">{candidat?.prncan}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex items-center space-x-2">
                                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">{candidat?.maican}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                                    <span className="text-sm">{candidat?.telcan}</span>
                                                </div>
                                                {candidat?.dtncan && (
                                                    <div className="flex items-center space-x-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">
                                  {new Date(candidat.dtncan).toLocaleDateString('fr-FR')}
                                </span>
                                                    </div>
                                                )}
                                                {candidat?.ldncan && (
                                                    <div className="flex items-center space-x-2">
                                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                                        <span className="text-sm">{candidat.ldncan}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <School className="h-5 w-5 mr-2" />
                                        Concours Sélectionné
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                                        <h3 className="font-semibold text-lg mb-2">{concours?.libcnc || 'Non défini'}</h3>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-muted-foreground">Établissement:</span>
                                                <p>{concours?.etablissement_nomets || 'Non défini'}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium text-muted-foreground">Session:</span>
                                                <p>{concours?.sescnc || 'Non définie'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                                        <span className="font-medium">Frais d'inscription:</span>
                                        <div className="text-right">
                                            {isGratuit ? (
                                                <Badge className="bg-green-100 text-green-800 border-green-300">
                                                    GRATUIT (NGORI)
                                                </Badge>
                                            ) : (
                                                <span className="text-lg font-bold text-green-700">
                              {parseFloat(concours?.fracnc || '0').toLocaleString()} FCFA
                            </span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {filiere && Object.keys(filiere).length > 0 && (
                            <Card className="mb-8">
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <GraduationCap className="h-5 w-5 mr-2" />
                                        Filière d'Études
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-6">
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <h3 className="font-semibold text-lg text-blue-800">{filiere.nomfil || 'Non définie'}</h3>
                                            {filiere.description && <p className="text-blue-700 mt-2">{filiere.description}</p>}
                                        </div>
                                        {filiere.matieres && filiere.matieres.length > 0 && (
                                            <div>
                                                <h4 className="font-medium mb-4 flex items-center">
                                                    <BookOpen className="h-4 w-4 mr-2" />
                                                    Matières d'étude ({filiere.matieres.length})
                                                </h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {filiere.matieres.map((matiere: any, index: number) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border"
                                                        >
                                                            <div className="flex items-center space-x-3">
                                                                <BookOpen className="h-4 w-4 text-primary" />
                                                                <div>
                                                                    <h5 className="font-medium">{matiere.nom_matiere}</h5>
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Coefficient: {matiere.coefficient}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                            {matiere.obligatoire && (
                                                                <Badge variant="destructive" className="text-xs">
                                                                    Obligatoire
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Partie "Mes Documents" */}
                        {/* ======================= MES DOCUMENTS ======================= */}
                        <Card className="mb-8">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="flex items-center">
                                        <FileCheck className="h-5 w-5 mr-2" />
                                        Mes Documents ({documents?.length || 0})
                                    </CardTitle>
                              
                                </div>
                            </CardHeader>

                            <CardContent>
                                {documents && documents.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {documents.map((doc: any) => {
                                            const canModify = doc.document_statut === 'rejete';

                                            return (
                                                <Card key={doc.id} className="relative border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                                    <CardContent className="p-4">
                                                        {/* Nom et statut */}
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-medium truncate">{doc.nomdoc || 'Sans nom'}</span>
                                                        <StatusBadge status={doc.document_statut} />
                                                        </div>

                                                        {/* Type et infos */}
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            Type : {doc.type || 'Non spécifié'}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mb-4">
                                                            {doc.taille && `Taille : ${(doc.taille / 1024).toFixed(1)} KB`}
                                                        </p>

                                                        {/* Boutons d'action */}
                                                        <div className="flex space-x-2">
                                                            {/* Voir */}
                                                         {/* Voir */}
<Button variant="outline" size="sm" onClick={() => setSelectedDocumentToView(doc)}>
    <Eye className="h-4 w-4 mr-2" /> Voir
</Button>

{/* Modifier */}
<Button
    variant="default"
    size="sm"
    onClick={() => setSelectedDocumentToEdit(doc)}
    disabled={!canModify}
>
    <Edit className="h-4 w-4 mr-2" /> Modifier
</Button>

                                                            {/* Supprimer */}
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleDeleteDocument(doc)}
                                                                disabled={!canModify}
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                                                            </Button>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}

                                        {/* ---- Modal d’édition ---- */}

                                       {selectedDocumentToEdit && (
    <DocumentReplaceDialog
        open={true}
        document={selectedDocumentToEdit}
          nupcan={documents.nupcan} 
        onClose={() => setSelectedDocumentToEdit(null)}
        onUpdated={async () => {
            await refetch();
            setSelectedDocumentToEdit(null);
            toast({
                title: 'Document mis à jour',
                description: 'Le document a été remplacé avec succès.'
            });
        }}
    />
)}

                                      {/* Carte “+ Ajouter un document” */}
<Card
    className="flex items-center justify-center p-4 border-dashed border-2 border-primary cursor-pointer hover:bg-primary/5"
    onClick={() => setIsAddDocOpen(true)}
>
    <p className="text-primary font-medium">+ Ajouter un document</p>
</Card>

<AddDocumentDialog
    open={isAddDocOpen}
    onOpenChange={setIsAddDocOpen}
    nupcan={nupcan!}       // Assure-toi que nupcan est défini
    currentTotal={documents.length}
    onSuccess={async () => {
        toast({
            title: 'Documents ajoutés',
            description: 'Votre document a été ajouté avec succès',
        });
        await refetch();  // Rafraîchit la liste des documents
    }}
/>

                                    </div>
                                ) : (
                                    // Aucun document
                                    <div className="text-center py-8">
                                        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                        <p className="text-muted-foreground">Aucun document téléchargé</p>
                                        <DocumentUploadForm onDocumentsAdd={handleDocumentAdd} existingDocuments={[]} />
                                    </div>
                                )}
                            </CardContent>

                            {/* Input caché pour modification de fichier directe (optionnel) */}
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileChange}
                            />
                        </Card>

                       
                {/* Viewer pour prévisualiser un document */}
            <DocumentViewer
    isOpen={!!selectedDocumentToView}
    onClose={() => setSelectedDocumentToView(null)}
    document={selectedDocumentToView || null}
/>



                        {/* Messagerie */}
                        <div className="mb-8">
                            <MessagerieCandidat nupcan={nupcan!} />
                        </div>


                        {/*<div className="mb-8">*/}
                        {/*    <GradesBulletinPDF candidat={{*/}
                        {/*        nomcan: '',*/}
                        {/*        prncan: '',*/}
                        {/*        nupcan: ''*/}
                        {/*    }} notes={[]} moyenneGenerale={0}  />*/}
                        {/*</div>*/}

                        <div className="mb-8">
                            <GradesBulletin nupcan={nupcan!} candidat={{
                                nomcan:candidat.nomcan,
                                prncan: candidat.prncan,
                                concourId : candidat.concours_id,
                                libcnc : concours?.libcnc
                            }}   />
                        </div>




                        {/* Onglet Notes */}
                        <div className={activeTab === 'notes' ? 'block' : 'hidden'}>
                            <GradesView nupcan={nupcan!} />
                        </div>

                        <div className={activeTab === 'overview' ? 'block mb-8' : 'hidden'}>
                            <h2 className="text-2xl font-bold mb-6 text-center">Votre Reçu de Candidature</h2>
                            <BeautifulHorizontalReceipt
                                candidatureData={{
                                    candidat,
                                    concours,
                                    filiere,
                                    documents: documents || [],
                                    paiement,
                                    nupcan: candidat?.nupcan,
                                }}
                                onEmailSend={handleEmailReceipt}
                            />
                        </div>
                    </div>
                </Layout>
            );
        };

        export default DashboardCandidat;