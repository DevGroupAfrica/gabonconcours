import React, {useState, useEffect, useRef, useMemo} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useMutation, useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Progress} from '@/components/ui/progress';
import {Upload, FileText, X, CheckCircle, AlertCircle, ArrowLeft} from 'lucide-react';
import Layout from '@/components/Layout';
import {apiService} from '@/services/api';
import {toast} from '@/hooks/use-toast';
import {DocumentOption, Concours} from '@/types/entities';
import {useCandidature} from '@/hooks/useCandidature';

// Définition du type étendu pour les documents (pour inclure les personnalisés)
interface UploadedDoc extends DocumentOption {
    file: File;
    isCustom?: boolean;
}

const Documents = () => {
    const {numeroCandidature} = useParams<{ numeroCandidature: string }>();
    const navigate = useNavigate();
    const {candidatureData, loadCandidature} = useCandidature();

    // Utiliser un Map pour stocker les documents et leurs métadonnées
    const [uploadedDocuments, setUploadedDocuments] = useState<Map<string, UploadedDoc>>(new Map());

    const [uploadSuccess, setUploadSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentUploadType, setCurrentUploadType] = useState('');

    // Logique de chargement de candidature
    useEffect(() => {
        if (numeroCandidature && !candidatureData) {
            loadCandidature(numeroCandidature).catch((err) => {
                console.error("Erreur lors du chargement de la candidature:", err);
                toast({
                    title: "Erreur",
                    description: "Impossible de charger les informations de candidature",
                    variant: "destructive",
                });
                navigate('/');
            });
        }
    }, [numeroCandidature, candidatureData, loadCandidature, navigate]);

    const concoursId = candidatureData?.concours?.id?.toString();

    // Récupérer le concours avec ses documents requis
    const { data: concoursData } = useQuery<Concours | null>({
        queryKey: ['concours', concoursId],
        queryFn: async () => {
            if (!concoursId) return null;
            const response = await apiService.getConcoursById<Concours>(concoursId);
            return response.data;
        },
        enabled: !!concoursId
    });

    const concours = concoursData;
    
    // Parse documents_requis (peut être string JSON ou array)
    const documentsRequis = useMemo(() => {
        if (!concours?.documents_requis) return [];
        
        if (typeof concours.documents_requis === 'string') {
            try {
                return JSON.parse(concours.documents_requis);
            } catch (e) {
                console.error('Error parsing documents_requis:', e);
                return [];
            }
        }
        
        return concours.documents_requis;
    }, [concours]);

    // Créer les options de documents à partir des données du concours
    const documentOptions: DocumentOption[] = useMemo(() => {
        if (!documentsRequis || documentsRequis.length === 0) {
            return [];
        }
        
        return documentsRequis.map((doc: { nom: string; obligatoire: boolean; description?: string }) => ({
            value: doc.nom.toLowerCase().replace(/['\s]+/g, '_'),
            label: doc.nom,
            required: doc.obligatoire,
            description: doc.description || ''
        }));
    }, [documentsRequis]);

    // Séparer documents obligatoires et optionnels
    const requiredDocs = useMemo(() => 
        documentOptions.filter(doc => doc.required), 
        [documentOptions]
    );

    const optionalDocs = useMemo(() => 
        documentOptions.filter(doc => !doc.required), 
        [documentOptions]
    );

    // Calculer la progression sur les obligatoires uniquement
    const uploadedRequiredDocs = useMemo(() => 
        Array.from(uploadedDocuments.values()).filter(doc => doc.required),
        [uploadedDocuments]
    );

    const progress = requiredDocs.length > 0 
        ? (uploadedRequiredDocs.length / requiredDocs.length) * 100 
        : 0;

    // Fonction d'upload (légèrement modifiée pour accepter le Map)
    const uploadMutation = useMutation({
        mutationFn: async ({filesMap, concoursId, nupcan}: {
            filesMap: Map<string, UploadedDoc>;
            concoursId: string;
            nupcan: string
        }) => {
            if (!nupcan) throw new Error('NUPCAN est requis pour l\'upload des documents');
            if (!concoursId) throw new Error('ID du concours manquant');

            const formData = new FormData();
            formData.append('concours_id', concoursId);
            formData.append('nupcan', nupcan);

            // Filtrer et envoyer uniquement les documents avec fichiers
            let fileCount = 0;
            const documentNames: string[] = [];
            filesMap.forEach((doc, key) => {
                // Vérifier que le document a bien un fichier avant de l'ajouter
                if (doc.file && doc.file instanceof File) {
                    formData.append('documents', doc.file);
                    documentNames.push(doc.label);
                    fileCount++;
                    console.log('📎 Ajout fichier:', doc.file.name, 'pour', doc.label);
                }
            });

            console.log('📤 Envoi de', fileCount, 'fichier(s) au serveur');

            if (fileCount === 0) {
                throw new Error('Aucun fichier valide à envoyer');
            }
            formData.append('document_names', JSON.stringify(documentNames));

            return apiService.createDossier(formData);
        },
        onSuccess: (response) => {
            setUploadSuccess(true);
            toast({
                title: 'Documents enregistrés !',
                description: `Les documents ont été uploadés avec succès.`,
            });
            
            // Recharger les données de la candidature avant la redirection
            if (numeroCandidature) {
                loadCandidature(numeroCandidature).then(() => {
                    setTimeout(() => {
                        // Redirection vers le dashboard avec un paramètre pour forcer le rechargement
                        navigate(`/dashboard/${encodeURIComponent(numeroCandidature)}?refresh=true`);
                    }, 1500);
                }).catch((err) => {
                    console.error('Erreur rechargement candidature:', err);
                    // Rediriger quand même
                    setTimeout(() => {
                        navigate(`/dashboard/${encodeURIComponent(numeroCandidature)}?refresh=true`);
                    }, 1500);
                });
            }
        },
        onError: (error) => {
            console.error('Erreur d\'upload:', error);
            setUploadSuccess(false);
            toast({
                title: 'Erreur d\'upload',
                description: 'Une erreur est survenue lors de l\'envoi des documents. Veuillez réessayer.',
                variant: 'destructive',
            });
        },
    });

    const fileValidation = (file: File): boolean => {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

        if (file.size > maxSize) {
            toast({
                title: '❌ Fichier trop volumineux',
                description: (
                    <div className="mt-2 space-y-1">
                        <p className="font-semibold">Le fichier ne doit pas dépasser 5MB</p>
                        <p className="text-xs opacity-80">Taille actuelle: {(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    </div>
                ),
                variant: 'destructive',
                duration: 5000,
            });
            return false; 
        }

        if (!allowedTypes.includes(file.type)) {
            toast({
                title: '❌ Format non supporté',
                description: (
                    <div className="mt-2 space-y-1">
                        <p className="font-semibold">Seuls les fichiers PDF, JPEG et PNG sont acceptés</p>
                        <p className="text-xs opacity-80">Format détecté: {file.type || 'inconnu'}</p>
                    </div>
                ),
                variant: 'destructive',
                duration: 5000,
            });
            return false;
        }
        return true;
    };


    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUploadType) return;

        if (!fileValidation(file)) {
            // Réinitialiser l'input après l'échec de validation
            if (fileInputRef.current) fileInputRef.current.value = '';
            setCurrentUploadType('');
            return;
        }

        // 1. Gérer les documents obligatoires
        const docOption = documentOptions.find(opt => opt.value === currentUploadType);
        if (docOption) {
            setUploadedDocuments(prev => new Map(prev).set(currentUploadType, {
                ...docOption,
                file: file,
            }));
            
            toast({
                title: '✅ Document ajouté',
                description: (
                    <div className="mt-1 space-y-1">
                        <p className="font-semibold">{docOption.label}</p>
                        <p className="text-xs opacity-80">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
                    </div>
                ),
                duration: 3000,
            });
        }

        // 2. Gérer les documents personnalisés
        else if (currentUploadType.startsWith('custom_')) {
            const docKey = currentUploadType; 
            const currentDoc = uploadedDocuments.get(docKey);

            if (currentDoc) {
                setUploadedDocuments(prev => new Map(prev).set(docKey, {
                    ...currentDoc,
                    file: file,
                    label: currentDoc.label, 
                    required: false,
                    value: docKey,
                }));

                toast({
                    title: '✅ Document personnalisé ajouté',
                    description: (
                        <div className="mt-1 space-y-1">
                            <p className="font-semibold">{currentDoc.label}</p>
                            <p className="text-xs opacity-80">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>
                        </div>
                    ),
                    duration: 3000,
                });
            }
        }

        // Nettoyage après succès
        if (fileInputRef.current) fileInputRef.current.value = '';
        setCurrentUploadType('');
    };

    // Déclenche l'ouverture de l'input file
    const triggerFileInput = (docType: string) => {
        setCurrentUploadType(docType);
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const removeDocument = (key: string) => {
        const doc = uploadedDocuments.get(key);
        
        setUploadedDocuments((prev) => {
            const newDocs = new Map(prev);
            newDocs.delete(key);
            return newDocs;
        });

        if (doc) {
            toast({
                title: '🗑️ Document supprimé',
                description: (
                    <div className="mt-1">
                        <p className="font-semibold">{doc.label}</p>
                        <p className="text-xs opacity-80">Le document a été retiré de votre dossier</p>
                    </div>
                ),
                duration: 3000,
            });
        }
    };

    const handleContinuer = () => {
        const requiredTypes = documentOptions.filter((opt) => opt.required).map((opt) => opt.value);
        const uploadedKeys = Array.from(uploadedDocuments.keys());

        const missingRequired = requiredTypes.filter((type) => !uploadedKeys.includes(type));

        if (missingRequired.length > 0) {
            const missingLabels = missingRequired.map((type) => documentOptions.find(opt => opt.value === type)?.label || type).join(', ');
            toast({
                title: '⚠️ Documents manquants',
                description: (
                    <div className="mt-2 space-y-2">
                        <p className="font-semibold">Veuillez téléverser tous les documents obligatoires</p>
                        <div className="bg-red-100 rounded-md p-2 text-xs">
                            <p className="font-medium mb-1">Documents manquants:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                {missingRequired.map((type) => {
                                    const doc = documentOptions.find(opt => opt.value === type);
                                    return <li key={type}>{doc?.label}</li>;
                                })}
                            </ul>
                        </div>
                    </div>
                ),
                variant: 'destructive',
                duration: 7000,
            });
            return;
        }

        // Vérifier que tous les documents uploadés ont bien un fichier
        const documentsWithFiles = Array.from(uploadedDocuments.values()).filter(doc => doc.file && doc.file instanceof File);
        
        if (documentsWithFiles.length === 0) {
            toast({
                title: '⚠️ Aucun document valide',
                description: 'Veuillez ajouter au moins un document avec un fichier',
                variant: 'destructive',
                duration: 5000,
            });
            return;
        }

        // Vérifier que tous les documents obligatoires ont un fichier
        const requiredDocsWithFiles = documentsWithFiles.filter(doc => doc.required);
        if (requiredDocsWithFiles.length < requiredDocs.length) {
            toast({
                title: '⚠️ Documents obligatoires incomplets',
                description: 'Tous les documents obligatoires doivent avoir un fichier uploadé',
                variant: 'destructive',
                duration: 5000,
            });
            return;
        }

        if (!concoursId || !numeroCandidature) {
            toast({
                title: '❌ Erreur système',
                description: 'Informations de candidature/concours manquantes. Veuillez contacter le support.',
                variant: 'destructive',
                duration: 5000,
            });
            return;
        }

        console.log('🚀 Lancement upload de', documentsWithFiles.length, 'document(s)');
        uploadMutation.mutate({
            filesMap: uploadedDocuments,
            concoursId: concoursId,
            nupcan: numeroCandidature,
        });
    };  

    // Calculer les statistiques pour l'affichage
    const uploadedRequiredCount = uploadedRequiredDocs.length;
    const completionPercentage = Math.round(progress);

    const documentsList = Array.from(uploadedDocuments.values());
    const mandatoryDocsList = documentsList.filter(doc => !doc.isCustom);

    if (!candidatureData) {
        // ... (Code de chargement/erreur de candidature)
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 py-3">

                {/* Champ File Input caché */}
                <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{display: 'none'}}
                />

                {/* En-tête ultra-compact */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" onClick={() => navigate(-1)} size="sm" className="h-8">
                            <ArrowLeft className="h-4 w-4 mr-1"/>
                            Retour
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">Dépôt des Documents</h1>
                            {concours?.libcnc && (
                                <p className="text-xs text-muted-foreground">{concours.libcnc}</p>
                            )}
                        </div>
                    </div>
                    
                    {/* Progression inline */}
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                                {uploadedRequiredCount}/{requiredDocs.length}
                            </div>
                            <p className="text-[10px] text-muted-foreground">Requis</p>
                        </div>
                        <Progress value={completionPercentage} className="w-24 h-1.5"/>
                    </div>
                </div>

                {/* Messages de statut - Design moderne avec animation */}
                {(uploadMutation.isPending || uploadSuccess || uploadMutation.isError) && (
                    <div className={`mb-3 p-4 rounded-xl flex items-start gap-3 shadow-lg border-2 animate-in slide-in-from-top-2 duration-300 ${
                        uploadSuccess 
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-800' 
                            : uploadMutation.isPending 
                                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200 text-blue-800' 
                                : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200 text-red-800'
                    }`}>
                        <div className="flex-shrink-0 mt-0.5">
                            {uploadSuccess ? (
                                <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center">
                                    <CheckCircle className="h-4 w-4 text-white"/>
                                </div>
                            ) : uploadMutation.isPending ? (
                                <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                </div>
                            ) : (
                                <div className="h-6 w-6 rounded-full bg-red-500 flex items-center justify-center">
                                    <AlertCircle className="h-4 w-4 text-white"/>
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-sm mb-0.5">
                                {uploadSuccess ? 'Succès !' : 
                                 uploadMutation.isPending ? 'Envoi en cours...' : 
                                 'Erreur'}
                            </p>
                            <p className="text-xs opacity-90">
                                {uploadSuccess ? 'Documents enregistrés avec succès. Redirection vers votre tableau de bord...' : 
                                 uploadMutation.isPending ? 'Veuillez patienter pendant l\'envoi de vos documents.' : 
                                 'Une erreur est survenue lors de l\'enregistrement. Veuillez réessayer.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Layout en 2 colonnes: Documents à gauche (70%), Consignes à droite (30%) */}
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-4">

                    {/* COLONNE PRINCIPALE: Documents (70%) */}
                    <div className="lg:col-span-7 space-y-3">

                        {/* 1. Documents Obligatoires - Format compact en grille */}
                        {requiredDocs.length > 0 && (
                            <Card className="border-red-200">
                                <CardHeader className="pb-2 pt-3 px-4">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                        Documents Obligatoires ({uploadedRequiredDocs.length}/{requiredDocs.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {requiredDocs.map((doc) => {
                                            const uploadedDoc = uploadedDocuments.get(doc.value);
                                            const isUploaded = !!uploadedDoc?.file;

                                            return (
                                                <div key={doc.value}
                                                     className={`p-2 border rounded-md transition-all text-sm ${isUploaded ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'}`}>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <FileText className={`h-3.5 w-3.5 flex-shrink-0 ${isUploaded ? 'text-green-600' : 'text-gray-400'}`} />
                                                                <p className="font-medium text-xs truncate">
                                                                    {doc.label}
                                                                    <span className="text-red-500 ml-0.5">*</span>
                                                                </p>
                                                            </div>
                                                            {doc.description && (
                                                                <p className="text-[10px] text-muted-foreground ml-5 mt-0.5 line-clamp-1">
                                                                    {doc.description}
                                                                </p>
                                                            )}
                                                            {isUploaded && (
                                                                <p className="text-[10px] text-green-600 flex items-center gap-1 ml-5 mt-0.5 truncate">
                                                                    <CheckCircle className="h-2.5 w-2.5"/> {uploadedDoc.file.name}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Boutons d'action */}
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            {isUploaded ? (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeDocument(doc.value)}
                                                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                                    >
                                                                        <X className="h-3 w-3"/>
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Button
                                                                    onClick={() => triggerFileInput(doc.value)}
                                                                    size="sm"
                                                                    className="h-6 text-xs px-2"
                                                                >
                                                                    <Upload className="h-3 w-3 mr-1"/> Upload
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* 2. Documents Optionnels - Format compact en grille */}
                        {optionalDocs.length > 0 && (
                            <Card className="border-blue-200">
                                <CardHeader className="pb-2 pt-3 px-4">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-blue-500" />
                                        Documents Optionnels
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 pb-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                        {optionalDocs.map((doc) => {
                                            const uploadedDoc = uploadedDocuments.get(doc.value);
                                            const isUploaded = !!uploadedDoc?.file;

                                            return (
                                                <div key={doc.value}
                                                     className={`p-2 border rounded-md transition-all text-sm ${isUploaded ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'}`}>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5">
                                                                <FileText className={`h-3.5 w-3.5 flex-shrink-0 ${isUploaded ? 'text-blue-600' : 'text-gray-400'}`} />
                                                                <p className="font-medium text-xs truncate">
                                                                    {doc.label}
                                                                    <span className="text-blue-500 ml-1 text-[10px]">Opt.</span>
                                                                </p>
                                                            </div>
                                                            {doc.description && (
                                                                <p className="text-[10px] text-muted-foreground ml-5 mt-0.5 line-clamp-1">
                                                                    {doc.description}
                                                                </p>
                                                            )}
                                                            {isUploaded && (
                                                                <p className="text-[10px] text-blue-600 flex items-center gap-1 ml-5 mt-0.5 truncate">
                                                                    <CheckCircle className="h-2.5 w-2.5"/> {uploadedDoc.file.name}
                                                                </p>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            {isUploaded ? (
                                                                <>
                                                                    <CheckCircle className="h-4 w-4 text-blue-500" />
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => removeDocument(doc.value)}
                                                                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                                                    >
                                                                        <X className="h-3 w-3"/>
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <Button
                                                                    onClick={() => triggerFileInput(doc.value)}
                                                                    size="sm"
                                                                    variant="outline"
                                                                    className="h-6 text-xs px-2"
                                                                >
                                                                    <Upload className="h-3 w-3 mr-1"/> Upload
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Boutons d'Action Principaux */}
                        <div className="flex justify-between pt-2">
                            <Button variant="outline" onClick={() => navigate(-1)} disabled={uploadMutation.isPending} size="sm" className="h-8">
                                <ArrowLeft className="h-3 w-3 mr-1"/> Retour
                            </Button>
                            <Button
                                onClick={handleContinuer}
                                className="bg-primary hover:bg-primary/90 shadow-lg h-8 text-xs"
                                disabled={uploadMutation.isPending || completionPercentage < 100 || uploadSuccess}
                            >
                                {uploadMutation.isPending
                                    ? 'Enregistrement...'
                                    : uploadSuccess
                                        ? 'Redirection...'
                                        : 'Enregistrer et continuer'}
                            </Button>
                        </div>

                    </div>

                    {/* COLONNE DROITE: INSTRUCTIONS ET RAPPEL (30%) */}
                    <div className="lg:col-span-3 space-y-3">

                        {/* Instructions compactes */}
                        <Card className="border-primary/20">
                            <CardHeader className="pb-2 pt-3 px-4">
                                <CardTitle className="text-sm font-semibold text-primary">Consignes d'Upload</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-3">
                                <ul className="space-y-1.5 text-xs text-muted-foreground">
                                    <li className="flex items-start gap-1.5">
                                        <span className="text-red-500 font-bold mt-0.5">*</span>
                                        <span>Documents obligatoires requis</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Formats: PDF, JPEG, PNG</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Taille max: 5 Mo par fichier</span>
                                    </li>
                                    <li className="flex items-start gap-1.5">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>Documents lisibles et de bonne qualité</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        {/* Rappel Candidature compact */}
                        <Card className="bg-gray-50 border-gray-200">
                            <CardHeader className="pb-2 pt-3 px-4">
                                <CardTitle className="text-sm font-semibold">Rappel</CardTitle>
                            </CardHeader>
                            <CardContent className="px-4 pb-3 space-y-1 text-xs">
                                <p className="font-medium text-primary">NUPCAN: {numeroCandidature}</p>
                                <p className="text-muted-foreground truncate">Concours: {candidatureData?.concours?.libcnc}</p>
                            </CardContent>
                        </Card>

                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Documents;
