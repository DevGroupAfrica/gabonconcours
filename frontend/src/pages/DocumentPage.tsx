import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Upload, X, CheckCircle, AlertCircle, ArrowLeft, PlusCircle, Trash2, Edit, Eye } from 'lucide-react';
import Layout from '@/components/Layout';
import { toast } from '@/hooks/use-toast';
import { useCandidature } from '@/hooks/useCandidature';
import { documentService } from '@/services/documentService.ts';
import DocumentViewer from '@/components/DocumentViewer';

interface DocumentOption {
    value: string;
    label: string;
    required: boolean;
}

interface Document {
    id: string;
    type?: string;
    nomdoc: string;
    document_statut: 'valide' | 'rejete' | 'en_attente';
    url: string;
    taille?: number;
}

interface UploadedDoc extends DocumentOption {
    id?: string;
    file?: File;
    statut?: 'valide' | 'rejete' | 'en_attente';
    isCustom: boolean;
    url?: string;
    taille?: number;
    nomdoc?: string;
    document_statut?: 'valide' | 'rejete' | 'en_attente';
}

const documentOptions: DocumentOption[] = [
    { value: 'cni', label: "Carte Nationale d'Identité", required: true },
    { value: 'diplome', label: 'Diplôme ou Attestation', required: true },
    { value: 'photo', label: "Photo d'identité (format identité)", required: true },
    { value: 'acte_naissance', label: 'Acte de naissance', required: true },
];

const DocumentPage = () => {
    const { nupcan } = useParams<{ nupcan: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { candidatureData, loadCandidature } = useCandidature();
    const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDoc[]>([]);
    const [customDocsCounter, setCustomDocsCounter] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [currentUploadType, setCurrentUploadType] = useState<string>('');
    const [selectedDocument, setSelectedDocument] = useState<Document | UploadedDoc | null>(null);

    useEffect(() => {
        if (nupcan && !candidatureData) {
            loadCandidature(nupcan).catch((err) => {
                console.error('Erreur lors du chargement de la candidature:', err);
                toast({
                    title: 'Erreur',
                    description: 'Impossible de charger les informations de candidature',
                    variant: 'destructive',
                });
                navigate('/');
            });
        }
    }, [nupcan, candidatureData, loadCandidature, navigate]);

    const concoursId = candidatureData?.concours?.id?.toString();

    const { data: existingDocuments, isLoading: isFetchingDocuments, error } = useQuery<Document[]>({
        queryKey: ['documents', nupcan],
        queryFn: () => documentService.getDocumentsByCandidat(nupcan!),
        enabled: !!nupcan,
    });

    useEffect(() => {
        if (Array.isArray(existingDocuments)) {
            const mapped: UploadedDoc[] = existingDocuments.map((doc) => ({
                id: doc.id,
                value: doc.type || `custom_${doc.id}`,
                label: doc.nomdoc,
                required: documentOptions.some((opt) => opt.value === doc.type),
                statut: doc.document_statut,
                isCustom: !documentOptions.some((opt) => opt.value === doc.type),
                url: doc.url,
                taille: doc.taille,
            }));
            setUploadedDocuments(mapped);
            setCustomDocsCounter(mapped.filter((d) => d.isCustom).length);
        } else {
            setUploadedDocuments([]);
            setCustomDocsCounter(0);
        }
    }, [existingDocuments]);

    const uploadMutation = useMutation({
        mutationFn: async (doc: UploadedDoc) => {
            if (!doc.file) throw new Error('Aucun fichier à uploader');
            const formData = new FormData();
            formData.append('document', doc.file);
            formData.append('nupcan', nupcan!);
            formData.append('concours_id', concoursId!);
            formData.append('type', doc.value);
            if (doc.isCustom && doc.label) formData.append('nomdoc', doc.label);
            return documentService.uploadDocument(formData);
        },
        onSuccess: () => {
            toast({ title: 'Succès', description: 'Document uploadé avec succès' });
            queryClient.invalidateQueries({ queryKey: ['documents', nupcan] });
        },
        onError: () => {
            toast({ title: 'Erreur', description: "Erreur lors de l'upload du document", variant: 'destructive' });
        },
    });

    const replaceMutation = useMutation({
        mutationFn: async (doc: UploadedDoc) => {
            if (!doc.id || !doc.file) throw new Error('ID ou fichier manquant pour le remplacement');
            const formData = new FormData();
            formData.append('document', doc.file);
            formData.append('nupcan', nupcan!);
            formData.append('concours_id', concoursId!);
            return documentService.replaceDocument(doc.id, formData);
        },
        onSuccess: () => {
            toast({ title: 'Succès', description: 'Document remplacé avec succès' });
            queryClient.invalidateQueries({ queryKey: ['documents', nupcan] });
        },
        onError: () => {
            toast({ title: 'Erreur', description: 'Erreur lors du remplacement du document', variant: 'destructive' });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => documentService.deleteDocument(nupcan!, id),
        onSuccess: () => {
            toast({ title: 'Succès', description: 'Document supprimé avec succès' });
            queryClient.invalidateQueries({ queryKey: ['documents', nupcan] });
        },
        onError: () => {
            toast({ title: 'Erreur', description: 'Erreur lors de la suppression du document', variant: 'destructive' });
        },
    });

    const fileValidation = (file: File): boolean => {
        const maxSize = 5 * 1024 * 1024;
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

        if (file.size > maxSize) {
            toast({ title: 'Fichier trop volumineux', description: 'Le fichier ne doit pas dépasser 5MB', variant: 'destructive' });
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            toast({ title: 'Format non supporté', description: 'Seuls les fichiers PDF, JPEG et PNG sont acceptés', variant: 'destructive' });
            return false;
        }
        return true;
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentUploadType) return;

        if (!fileValidation(file)) {
            if (fileInputRef.current) fileInputRef.current.value = '';
            setCurrentUploadType('');
            return;
        }

        setUploadedDocuments((prev) =>
            prev.map((d) => (d.value === currentUploadType ? { ...d, file } : d))
        );

        if (fileInputRef.current) fileInputRef.current.value = '';
        setCurrentUploadType('');
    };

    const triggerFileInput = (type: string) => {
        setCurrentUploadType(type);
        fileInputRef.current?.click();
    };

    const removeDocument = (value: string) => {
        const doc = uploadedDocuments.find((d) => d.value === value);
        if (!doc) return;
        if (doc.id && doc.statut !== 'rejete') {
            toast({ title: 'Action interdite', description: 'Seuls les documents rejetés peuvent être supprimés', variant: 'destructive' });
            return;
        }
        if (doc.id) {
            deleteMutation.mutate(doc.id);
        } else {
            setUploadedDocuments((prev) => prev.filter((d) => d.value !== value));
        }
    };

    const addCustomDocumentField = () => {
        const newValue = `custom_${Date.now()}_${customDocsCounter}`;
        setCustomDocsCounter((prev) => prev + 1);
        setUploadedDocuments((prev) => [
            ...prev,
            {
                value: newValue,
                label: '',
                required: false,
                isCustom: true,
            },
        ]);
    };

    const updateCustomDocumentLabel = (value: string, label: string) => {
        setUploadedDocuments((prev) => prev.map((d) => (d.value === value ? { ...d, label } : d)));
    };

    const handleContinuer = async () => {
        if (!concoursId || !nupcan) {
            toast({ title: 'Erreur', description: 'Informations de candidature manquantes', variant: 'destructive' });
            return;
        }

        // ➤ On n’impose plus la validation des documents obligatoires
        const docsToProcess = uploadedDocuments.filter((d) => d.file);

        try {
            await Promise.all(docsToProcess.map((doc) => (doc.id ? replaceMutation.mutateAsync(doc) : uploadMutation.mutateAsync(doc))));
            navigate(`/paiement/${encodeURIComponent(nupcan)}`);
        } catch (error) {
            console.error(error);
            toast({ title: 'Erreur', description: 'Erreur lors du traitement des documents', variant: 'destructive' });
        }
    };

    const getStatusBadge = (statut?: string) => {
        if (!statut) return <Badge variant="outline">Non déposé</Badge>;
        const variants = {
            valide: 'default',
            rejete: 'destructive',
            en_attente: 'secondary',
        } as const;
        return <Badge variant={variants[statut] || 'outline'}>{statut}</Badge>;
    };

    const mandatoryDocs = documentOptions;
    const customDocs = uploadedDocuments.filter((d) => d.isCustom);
    const uploadedMandatoryCount = mandatoryDocs.filter((opt) =>
        uploadedDocuments.some((d) => d.value === opt.value && (d.id || d.file))
    ).length;
    const completionPercentage = Math.round((uploadedMandatoryCount / mandatoryDocs.length) * 100);

    if (isFetchingDocuments) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Chargement des documents...</p>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p className="text-lg font-semibold text-red-600 mb-2">Erreur lors du chargement des documents</p>
                    <p className="text-muted-foreground mb-4">Veuillez réessayer plus tard.</p>
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <input type="file" accept=".pdf,.jpeg,.png" ref={fileInputRef} onChange={handleFileSelect} style={{ display: 'none' }} />

                <div className="mb-8 flex flex-col md:flex-row md:justify-between md:items-start">
                    <div>
                        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                        </Button>
                        <h1 className="text-3xl font-bold mb-2">Gestion des Documents du Candidat</h1>
                        <p className="text-muted-foreground">
                            Visualisez, gérez et téléversez vos documents. Seuls les documents rejetés peuvent être modifiés ou supprimés.
                        </p>
                    </div>
                    <Card className="mt-4 md:mt-0 w-full md:w-1/3 bg-primary/5">
                        <CardContent className="p-4">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm font-semibold">
                                    <span>Progression des Documents Obligatoires</span>
                                    <span>{uploadedMandatoryCount}/{mandatoryDocs.length}</span>
                                </div>
                                <Progress value={completionPercentage} className="h-2" />
                                <p className="text-xs text-right">{completionPercentage}% complété</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {(uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending) && (
                    <Card className="mb-6 border-blue-300 bg-blue-50">
                        <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                <p className="text-sm font-medium text-blue-700">Opération en cours...</p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8">
                    <div className="space-y-8">
                        {/*<Card>*/}
                        {/*    <CardHeader>*/}
                        {/*        <CardTitle>Documents Obligatoires ({uploadedMandatoryCount}/{mandatoryDocs.length})</CardTitle>*/}
                        {/*    </CardHeader>*/}
                        {/*    <CardContent>*/}
                        {/*        <div className="space-y-4">*/}
                        {/*            {mandatoryDocs.map((opt) => {*/}
                        {/*                const doc = uploadedDocuments.find((d) => d.value === opt.value) || {*/}
                        {/*                    value: opt.value,*/}
                        {/*                    label: opt.label,*/}
                        {/*                    required: true,*/}
                        {/*                    isCustom: false,*/}
                        {/*                };*/}
                        {/*                const isDeposited = !!doc.id || !!doc.file;*/}
                        {/*                const canModify = !doc.id || doc.statut === 'rejete';*/}

                        {/*                return (*/}
                        {/*                    <div key={opt.value} className="grid grid-cols-3 items-center p-3 border rounded-lg">*/}
                        {/*                        <div className="col-span-2 flex flex-col">*/}
                        {/*                            <p className="font-medium">*/}
                        {/*                                {opt.label} {opt.required && <span className="text-red-500">*</span>}*/}
                        {/*                            </p>*/}
                        {/*                            {doc.file && (*/}
                        {/*                                <p className="text-xs text-green-600">*/}
                        {/*                                    <CheckCircle className="h-3 w-3 inline mr-1" /> {doc.file.name}*/}
                        {/*                                </p>*/}
                        {/*                            )}*/}
                        {/*                            {doc.taille && (*/}
                        {/*                                <p className="text-xs text-muted-foreground">Taille: {(doc.taille / 1024).toFixed(1)} KB</p>*/}
                        {/*                            )}*/}
                        {/*                            {getStatusBadge(doc.statut)}*/}
                        {/*                        </div>*/}
                        {/*                        <div className="col-span-1 flex justify-end space-x-2">*/}
                        {/*                            {doc.id && doc.url && (*/}
                        {/*                                <Button variant="outline" size="sm" onClick={() => setSelectedDocument(doc)}>*/}
                        {/*                                    <Eye className="h-4 w-4" />*/}
                        {/*                                </Button>*/}
                        {/*                            )}*/}
                        {/*                            {isDeposited ? (*/}
                        {/*                                canModify ? (*/}
                        {/*                                    <>*/}
                        {/*                                        <Button variant="outline" size="sm" onClick={() => triggerFileInput(opt.value)}>*/}
                        {/*                                            <Edit className="h-4 w-4" />*/}
                        {/*                                        </Button>*/}
                        {/*                                        <Button*/}
                        {/*                                            variant="destructive"*/}
                        {/*                                            size="sm"*/}
                        {/*                                            onClick={() => removeDocument(opt.value)}*/}
                        {/*                                        >*/}
                        {/*                                            <Trash2 className="h-4 w-4" />*/}
                        {/*                                        </Button>*/}
                        {/*                                    </>*/}
                        {/*                                ) : (*/}
                        {/*                                    <Badge>Non modifiable</Badge>*/}
                        {/*                                )*/}
                        {/*                            ) : (*/}
                        {/*                                <Button onClick={() => triggerFileInput(opt.value)}>*/}
                        {/*                                    <Upload className="h-4 w-4 mr-2" /> Téléverser*/}
                        {/*                                </Button>*/}
                        {/*                            )}*/}
                        {/*                        </div>*/}
                        {/*                    </div>*/}
                        {/*                );*/}
                        {/*            })}*/}
                        {/*        </div>*/}
                        {/*    </CardContent>*/}
                        {/*</Card>*/}

                        <Card>
                            <CardHeader>
                                <CardTitle>Documents Personnalisés (Optionnel)</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {customDocs.map((doc, index) => {
                                    const canModify = !doc.id || doc.statut === 'rejete';
                                    const canEditLabel = !doc.id;

                                    return (
                                        <div key={`custom-doc-${doc.id || doc.value}-${index}`} className="grid grid-cols-4 gap-3 items-center p-3 border rounded-lg">
                                            <div className="col-span-2">
                                                <Input
                                                    placeholder="Nom du document"
                                                    value={doc.label}
                                                    onChange={(e) => updateCustomDocumentLabel(doc.value, e.target.value)}
                                                    disabled={!canEditLabel}
                                                />
                                            </div>
                                            <div className="col-span-1 flex flex-col gap-1">
                                                {doc.file ? (
                                                    <p className="text-xs text-green-600">
                                                        <CheckCircle className="h-3 w-3 inline mr-1" /> {doc.file.name}
                                                    </p>
                                                ) : doc.id ? (
                                                    <p className="text-xs text-muted-foreground">Déposé</p>
                                                ) : (
                                                    <Button
                                                        variant="secondary"
                                                        className="w-full text-xs h-8"
                                                        onClick={() => triggerFileInput(doc.value)}
                                                        disabled={!doc.label || !canModify}
                                                    >
                                                        <Upload className="h-3 w-3 mr-1" /> Téléverser
                                                    </Button>
                                                )}
                                                {getStatusBadge(doc.statut)}
                                                {doc.taille && (
                                                    <p className="text-xs text-muted-foreground">Taille: {(doc.taille / 1024).toFixed(1)} KB</p>
                                                )}
                                            </div>
                                            <div className="col-span-1 flex justify-end space-x-2">
                                                {doc.id && doc.url && (
                                                    <Button variant="outline" size="sm" onClick={() => setSelectedDocument(doc)}>
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {canModify && (
                                                    <Button variant="outline" size="sm" onClick={() => triggerFileInput(doc.value)}>
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => removeDocument(doc.value)}
                                                    disabled={!canModify}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                                <Button
                                    onClick={addCustomDocumentField}
                                    variant="outline"
                                    className="w-full border-dashed border-primary/50 text-primary hover:bg-primary/5 mt-4"
                                >
                                    <PlusCircle className="h-4 w-4 mr-2" /> Ajouter un document personnalisé
                                </Button>
                            </CardContent>
                        </Card>

                        <div className="flex justify-between pt-4">
                            <Button
                                variant="outline"
                                onClick={() => navigate(-1)}
                                disabled={uploadMutation.isPending || replaceMutation.isPending || deleteMutation.isPending}
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                            </Button>
                            <Button
                                onClick={handleContinuer}
                                className="bg-primary hover:bg-primary/90 shadow-lg"
                                disabled={
                                    uploadMutation.isPending ||
                                    replaceMutation.isPending ||
                                    deleteMutation.isPending

                                }
                                size="lg"
                            >
                                Enregistrer et continuer vers le paiement
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg font-semibold text-primary">Consignes d'Upload</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-sm text-muted-foreground list-disc list-inside">
                                    <li>Les documents marqués d'un astérisque (<span className="text-red-500 font-bold">*</span>) sont obligatoires.</li>
                                    <li>Formats acceptés : PDF, JPEG, PNG.</li>
                                    <li>Taille maximale par fichier : 5 Mo.</li>
                                    <li>Seuls les documents rejetés peuvent être modifiés ou supprimés.</li>
                                    <li>Les documents validés sont en lecture seule.</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-gray-50 border-gray-200">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg font-semibold">Rappel Candidature</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-1 text-sm pt-4">
                                <p className="font-medium text-primary">NUPCAN: {nupcan}</p>
                                <p className="text-muted-foreground">Concours: {candidatureData?.concours?.libcnc || 'Non défini'}</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <DocumentViewer
                    isOpen={!!selectedDocument}
                    onClose={() => setSelectedDocument(null)}
                    document={selectedDocument || null}
                />
            </div>
        </Layout>
    );
};

export default DocumentPage;