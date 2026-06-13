// @ts-nocheck - Legacy API compatibility
import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Progress} from '@/components/ui/progress';
import {Upload, FileText, X, CheckCircle, ArrowLeft, AlertCircle} from 'lucide-react';
import Layout from '@/components/Layout';
import {candidatureStateManager} from '@/services/candidatureStateManager';
import {routeManager} from '@/services/routeManager';
import {apiService} from '@/services/api';
import {toast} from '@/hooks/use-toast';
import {DocumentOption} from '@/types/entities';

const DocumentsContinue = () => {
    const {nupcan} = useParams<{ nupcan: string }>();
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [candidatureState, setCandidatureState] = useState<any>(null);
    const [selectedDocumentType, setSelectedDocumentType] = useState('');
    const [uploadedDocuments, setUploadedDocuments] = useState<{ [key: string]: File }>({});

    const decodedNupcan = decodeURIComponent(nupcan || '');

    const documentOptions: DocumentOption[] = [
        {value: 'cni', label: 'Carte Nationale d\'Identité', required: true},
        {value: 'diplome', label: 'Diplôme ou Attestation', required: true},
        {value: 'photo', label: 'Photo d\'identité', required: true},
        {value: 'acte_naissance', label: 'Acte de naissance', required: true},
        {value: 'autres', label: 'Autres documents', required: false},
    ];

    // Vérifier si des documents existent déjà
    const {data: existingDocuments, isLoading: documentsLoading} = useQuery({
        queryKey: ['candidat-documents', candidatureState?.candidatData?.id],
        queryFn: () => candidatureState?.candidatData?.id
            ? apiService.getDocumentsByCandidat(candidatureState.candidatData.id)
            : null,
        enabled: !!candidatureState?.candidatData?.id,
    });

    useEffect(() => {
        const initializePage = async () => {
            if (!decodedNupcan) {
                navigate('/connexion');
                return;
            }

            try {
                const state = await candidatureStateManager.initializeContinueCandidature(decodedNupcan);
                setCandidatureState(state);
            } catch (error) {
                console.error('Erreur lors de l\'initialisation:', error);
                toast({
                    title: "Erreur",
                    description: "Impossible de charger votre candidature",
                    variant: "destructive",
                });
                navigate('/connexion');
            } finally {
                setIsLoading(false);
            }
        };

        initializePage();
    }, [decodedNupcan, navigate]);

    const uploadMutation = useMutation({
        mutationFn: async ({files, concoursId, nupcan}: {
            files: { [key: string]: File };
            concoursId: string;
            nupcan: string;
        }) => {
            const formData = new FormData();
            formData.append('concours_id', concoursId);
            formData.append('nupcan', nupcan);
            Object.entries(files).forEach(([type, file]) => {
                formData.append('documents', file, `${type}_${file.name}`);
            });
            return apiService.createDossier(formData);
        },
        onSuccess: (response) => {
            if (response.data?.existing) {
                toast({
                    title: "Documents déjà présents",
                    description: "Vos documents ont déjà été envoyés précédemment",
                });
            } else {
                candidatureStateManager.updateProgression(decodedNupcan, 'documents');
                toast({
                    title: "Documents uploadés !",
                    description: "Vos documents ont été envoyés avec succès",
                });
            }

            setTimeout(() => {
                const paiementUrl = routeManager.getPaiementUrl({nupcan: decodedNupcan});
                navigate(paiementUrl);
            }, 2000);
        },
        onError: (error) => {
            console.error('Upload error:', error);
            toast({
                title: "Erreur d'upload",
                description: error.message || "Une erreur est survenue lors de l'envoi des documents",
                variant: "destructive",
            });
        },
    });

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !selectedDocumentType) return;

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast({
                title: "Fichier trop volumineux",
                description: "Le fichier ne doit pas dépasser 5MB",
                variant: "destructive"
            });
            return;
        }

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            toast({
                title: "Format non supporté",
                description: "Seuls les fichiers PDF, JPEG et PNG sont acceptés",
                variant: "destructive"
            });
            return;
        }

        setUploadedDocuments(prev => ({
            ...prev,
            [selectedDocumentType]: file,
        }));

        toast({
            title: "Document ajouté",
            description: `${getDocumentLabel(selectedDocumentType)} ajouté avec succès`,
        });

        setSelectedDocumentType('');
    };

    const removeDocument = (documentType: string) => {
        setUploadedDocuments(prev => {
            const newDocs = {...prev};
            delete newDocs[documentType];
            return newDocs;
        });

        toast({
            title: "Document supprimé",
            description: "Le document a été retiré de votre dossier",
        });
    };

    const getDocumentLabel = (type: string) => {
        return documentOptions.find(opt => opt.value === type)?.label || type;
    };

    const isDocumentRequired = (type: string) => {
        return documentOptions.find(opt => opt.value === type)?.required || false;
    };

    const availableDocumentTypes = documentOptions.filter(
        opt => !uploadedDocuments[opt.value],
    );

    const requiredDocuments = documentOptions.filter(opt => opt.required);
    const uploadedRequiredCount = requiredDocuments.filter(doc => uploadedDocuments[doc.value]).length;
    const completionPercentage = Math.round((uploadedRequiredCount / requiredDocuments.length) * 100);

    const handleRetourStatut = () => {
        const statutUrl = routeManager.getStatutUrl(decodedNupcan);
        navigate(statutUrl);
    };

    const handleContinuer = () => {
        // Si des documents existent déjà, passer directement au paiement
        if (existingDocuments?.data && existingDocuments.data.length > 0) {
            candidatureStateManager.updateProgression(decodedNupcan, 'documents');
            const paiementUrl = routeManager.getPaiementUrl({nupcan: decodedNupcan});
            navigate(paiementUrl);
            return;
        }

        const requiredTypes = documentOptions.filter(opt => opt.required).map(opt => opt.value);
        const uploadedTypes = Object.keys(uploadedDocuments);
        const missingRequired = requiredTypes.filter(type => !uploadedTypes.includes(type));

        if (missingRequired.length > 0) {
            const missingLabels = missingRequired.map(type => getDocumentLabel(type)).join(', ');
            toast({
                title: "Documents manquants",
                description: `Documents obligatoires manquants: ${missingLabels}`,
                variant: "destructive",
            });
            return;
        }

        if (Object.keys(uploadedDocuments).length === 0) {
            toast({
                title: "Aucun document",
                description: "Veuillez ajouter au moins un document",
                variant: "destructive",
            });
            return;
        }

        uploadMutation.mutate({
            files: uploadedDocuments,
            concoursId: candidatureState?.candidatData?.concours_id || '1',
            nupcan: decodedNupcan,
        });
    };

    if (isLoading || documentsLoading) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Chargement de votre candidature...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // Si des documents existent déjà, afficher un message informatif
    if (existingDocuments?.data && existingDocuments.data.length > 0) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2">Documents déjà soumis</h1>
                        <p className="text-muted-foreground">Candidature: {decodedNupcan}</p>
                    </div>

                    <Card className="mb-8 border-blue-200 bg-blue-50">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <CheckCircle className="h-12 w-12 text-blue-500 mx-auto mb-4"/>
                                <h3 className="text-xl font-bold text-blue-700 mb-2">
                                    Documents déjà envoyés !
                                </h3>
                                <p className="text-blue-600 mb-4">
                                    Vous avez déjà soumis {existingDocuments.data.length} document(s) pour cette
                                    candidature.
                                </p>
                                <div className="space-y-2 mb-6">
                                    {existingDocuments.data.map((doc: any, index: number) => (
                                        <div key={index}
                                             className="flex items-center justify-between p-2 bg-white rounded border">
                                            <span className="font-medium">{doc.nomdoc}</span>
                                            <span className={`px-2 py-1 rounded text-sm ${
                                                doc.document_statut === 'valide' ? 'bg-green-100 text-green-800' :
                                                    doc.document_statut === 'rejete' ? 'bg-red-100 text-red-800' :
                                                        'bg-orange-100 text-orange-800'
                                            }`}>
                        {doc.document_statut === 'valide' ? 'Validé' :
                            doc.document_statut === 'rejete' ? 'Rejeté' : 'En attente'}
                      </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-between">
                        <Button variant="outline"
                                onClick={() => navigate(`/dashboard/${encodeURIComponent(decodedNupcan)}`)}
                                className="flex items-center space-x-2">
                            <ArrowLeft className="h-4 w-4"/>
                            <span>Retour au dashboard</span>
                        </Button>
                        <Button
                            onClick={handleContinuer}
                            className="bg-primary hover:bg-primary/90"
                        >
                            Continuer vers le paiement
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">Dépôt des Documents</h1>
                    <p className="text-muted-foreground">Candidature: {decodedNupcan}</p>
                    {candidatureState?.candidatData && (
                        <p className="text-sm text-muted-foreground">
                            {candidatureState.candidatData.prncan} {candidatureState.candidatData.nomcan}
                        </p>
                    )}
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Progression du dossier</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Documents requis uploadés</span>
                                <span>{uploadedRequiredCount}/{requiredDocuments.length}</span>
                            </div>
                            <Progress value={completionPercentage} className="w-full"/>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Ajouter vos documents</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                            <div>
                                <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choisir le type de document"/>
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableDocumentTypes.map(opt => (
                                            <SelectItem key={opt.value} value={opt.value}>
                                                {opt.label} {opt.required && <span className="text-red-500">*</span>}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        onChange={handleFileSelect}
                                        disabled={!selectedDocumentType}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                    <div className={`border-2 border-dashed rounded-lg p-4 text-center ${
                                        selectedDocumentType
                                            ? 'border-primary bg-primary/5 hover:bg-primary/10'
                                            : 'border-gray-300 bg-gray-50'
                                    } transition-colors`}>
                                        <Upload className={`h-6 w-6 mx-auto mb-2 ${
                                            selectedDocumentType ? 'text-primary' : 'text-gray-400'
                                        }`}/>
                                        <p className={`text-sm ${
                                            selectedDocumentType ? 'text-primary' : 'text-gray-500'
                                        }`}>
                                            {selectedDocumentType
                                                ? 'Cliquez pour sélectionner un fichier'
                                                : 'Sélectionnez d\'abord un type de document'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">PDF, JPEG, PNG - Max 5MB</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {Object.keys(uploadedDocuments).length > 0 && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle>Documents sélectionnés ({Object.keys(uploadedDocuments).length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {Object.entries(uploadedDocuments).map(([type, file]) => (
                                    <div key={type} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <FileText className="h-5 w-5 text-primary"/>
                                            <div>
                                                <p className="font-medium">
                                                    {getDocumentLabel(type)}
                                                    {isDocumentRequired(type) &&
                                                        <span className="text-red-500 ml-1">*</span>}
                                                </p>
                                                <p className="text-sm text-muted-foreground">{file.name}</p>
                                                <div className="flex items-center space-x-2 mt-1">
                                                    <CheckCircle className="h-4 w-4 text-green-500"/>
                                                    <span className="text-xs text-green-600">Prêt à envoyer</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => removeDocument(type)}>
                                            <X className="h-4 w-4"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Instructions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <p>• Les documents marqués d'un astérisque (*) sont obligatoires</p>
                            <p>• Choisissez les documents selon les exigences du concours</p>
                            <p>• Formats acceptés: PDF, JPEG, PNG</p>
                            <p>• Taille maximale par fichier: 5MB</p>
                            <p>• Assurez-vous que vos documents sont lisibles et de bonne qualité</p>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-between">
                    <Button variant="outline" onClick={handleRetourStatut} className="flex items-center space-x-2">
                        <ArrowLeft className="h-4 w-4"/>
                        <span>Retour au statut</span>
                    </Button>
                    <Button
                        onClick={handleContinuer}
                        className="bg-primary hover:bg-primary/90"
                        disabled={uploadMutation.isPending || completionPercentage < 100}
                    >
                        {uploadMutation.isPending ? 'Envoi en cours...' : 'Continuer vers le paiement'}
                    </Button>
                </div>
            </div>
        </Layout>
    );
};

export default DocumentsContinue;
