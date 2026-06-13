import React, {useState} from 'react';
import {useMutation, useQuery} from '@tanstack/react-query';
import {CheckCircle2, Clock3, Eye, FileText, RefreshCw, ShieldCheck, Trash2, Upload, X, XCircle} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Modal, ModalContent} from '@/components/ui/modal';
import {documentService} from '@/services/documentService';
import {toast} from '@/hooks/use-toast';

const DOCUMENT_TYPES = [
    'Acte de naissance',
    'Carte nationale d’identité',
    'Diplôme ou attestation de réussite',
    'Bulletin de notes',
    'Certificat médical',
    'Autre document'
];

const DocumentsManager = ({nupcan}: {nupcan: string}) => {
    const [uploadOpen, setUploadOpen] = useState(false);
    const [replaceDocument, setReplaceDocument] = useState<any>(null);
    const [previewDocument, setPreviewDocument] = useState<any>(null);
    const [deleteDocument, setDeleteDocument] = useState<any>(null);
    const [documentName, setDocumentName] = useState('');
    const [file, setFile] = useState<File | null>(null);

    const {data: documents = [], isLoading, refetch} = useQuery({
        queryKey: ['documents', nupcan],
        queryFn: () => documentService.getDocumentsByNupcan(nupcan),
    });

    const resetForm = () => {
        setDocumentName('');
        setFile(null);
        setUploadOpen(false);
        setReplaceDocument(null);
    };

    const uploadMutation = useMutation({
        mutationFn: (formData: FormData) => documentService.uploadDocument(formData),
        onSuccess: () => {
            resetForm();
            refetch();
            toast({title: 'Document ajouté', description: 'La pièce a été envoyée pour validation.'});
        },
        onError: (error: any) => showError(error.message || 'Impossible d’ajouter le document.')
    });

    const replaceMutation = useMutation({
        mutationFn: ({id, formData}: {id: string; formData: FormData}) => documentService.replaceDocument(id, formData),
        onSuccess: () => {
            resetForm();
            setPreviewDocument(null);
            refetch();
            toast({title: 'Document remplacé', description: 'La nouvelle pièce a été envoyée pour validation.'});
        },
        onError: (error: any) => showError(error.message || 'Impossible de remplacer le document.')
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => documentService.deleteDocument(nupcan, id),
        onSuccess: () => {
            setDeleteDocument(null);
            refetch();
            toast({title: 'Document supprimé', description: 'La pièce a été retirée du dossier.'});
        },
        onError: (error: any) => showError(error.message || 'Impossible de supprimer le document.')
    });

    const showError = (message: string) => toast({variant: 'destructive', title: 'Action impossible', description: message});

    const startReplace = (document: any) => {
        setPreviewDocument(null);
        setReplaceDocument(document);
        setDocumentName(document.nomdoc);
        setFile(null);
    };

    const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
        const selected = event.target.files?.[0];
        if (!selected) return;
        const extension = selected.name.split('.').pop()?.toLowerCase();
        if (!extension || !['pdf', 'jpg', 'jpeg', 'png'].includes(extension)) {
            showError('Formats acceptés : PDF, JPG et PNG.');
            return;
        }
        if (selected.size > 10 * 1024 * 1024) {
            showError('Le fichier ne doit pas dépasser 10 Mo.');
            return;
        }
        setFile(selected);
    };

    const submitUpload = () => {
        if (!file || !documentName) {
            showError('Sélectionnez le type de document et le fichier.');
            return;
        }
        if (documents.some(doc => doc.nomdoc.toLowerCase() === documentName.toLowerCase())) {
            showError('Ce type de document a déjà été ajouté. Vous pouvez remplacer la pièce existante.');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        formData.append('nomdoc', documentName);
        formData.append('nupcan', nupcan);
        formData.append('type', file.type.includes('pdf') ? 'pdf' : 'image');
        uploadMutation.mutate(formData);
    };

    const submitReplace = () => {
        if (!file || !replaceDocument) return;
        const formData = new FormData();
        formData.append('file', file);
        formData.append('nomdoc', replaceDocument.nomdoc);
        replaceMutation.mutate({id: replaceDocument.id, formData});
    };

    const counts = documents.reduce((acc: Record<string, number>, document: any) => {
        acc[document.document_statut] = (acc[document.document_statut] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-4">
            <div className="grid overflow-hidden rounded-md border border-[#dbe7f6] bg-white sm:grid-cols-3 sm:divide-x sm:divide-slate-200">
                <DocumentStat label="Validés" value={counts.valide || 0}/>
                <DocumentStat label="En attente" value={counts.en_attente || 0}/>
                <DocumentStat label="Rejetés" value={counts.rejete || 0}/>
            </div>

            <div className="overflow-hidden rounded-md border border-slate-300 bg-white">
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-950">Pièces du dossier</h3>
                        <p className="mt-1 text-sm text-slate-500">Ajoutez uniquement les pièces demandées pour cette candidature.</p>
                    </div>
                    <Button onClick={() => setUploadOpen(true)} disabled={documents.length >= 6}>
                        <Upload className="h-4 w-4"/>
                        Ajouter une pièce
                    </Button>
                </div>
                <div className="flex gap-3 border-b border-[#e4edf8] bg-[#f7faff] px-4 py-3 text-xs leading-5 text-slate-600">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary"/>
                    <p><span className="font-semibold">Contrôlez vos pièces avant validation.</span> Vous pouvez visualiser et remplacer un document en attente ou rejeté.</p>
                </div>

                {isLoading ? (
                    <div className="p-7 text-center text-sm text-slate-500">Chargement des documents…</div>
                ) : documents.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-500">
                            <FileText className="h-6 w-6"/>
                        </div>
                        <h4 className="mt-4 font-semibold text-slate-900">Aucune pièce ajoutée</h4>
                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Commencez par ajouter les documents exigés dans l’avis du concours.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {documents.map((document: any) => (
                            <div key={document.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#dbe7f6] bg-[#f5f9ff] text-primary">
                                    <FileText className="h-5 w-5"/>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="text-sm font-semibold text-slate-900">{document.nomdoc}</h4>
                                        <StatusBadge status={document.document_statut}/>
                                    </div>
                                    <p className="mt-0.5 truncate text-xs text-slate-400">{document.type || 'Document'}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => setPreviewDocument(document)}>
                                        <Eye className="h-4 w-4"/>
                                        Voir
                                    </Button>
                                    {document.document_statut !== 'valide' && (
                                        <Button variant="outline" size="sm" onClick={() => startReplace(document)}>
                                            <RefreshCw className="h-4 w-4"/>
                                            Remplacer
                                        </Button>
                                    )}
                                    {document.document_statut !== 'valide' && (
                                        <Button variant="ghost" size="icon" className="text-slate-400 hover:bg-slate-100 hover:text-red-700" onClick={() => setDeleteDocument(document)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <DocumentModal
                open={uploadOpen || Boolean(replaceDocument)}
                replace={Boolean(replaceDocument)}
                documentName={documentName}
                file={file}
                pending={uploadMutation.isPending || replaceMutation.isPending}
                onClose={resetForm}
                onNameChange={setDocumentName}
                onFileChange={selectFile}
                onSubmit={replaceDocument ? submitReplace : submitUpload}
            />
            <PreviewModal document={previewDocument} onClose={() => setPreviewDocument(null)} onReplace={startReplace}/>
            <DeleteModal
                document={deleteDocument}
                pending={deleteMutation.isPending}
                onClose={() => setDeleteDocument(null)}
                onConfirm={() => deleteDocument && deleteMutation.mutate(deleteDocument.id)}
            />
        </div>
    );
};

const DocumentModal = ({open, replace, documentName, file, pending, onClose, onNameChange, onFileChange, onSubmit}: any) => (
    <Modal open={open} onOpenChange={(value) => !value && onClose()}>
        <ModalContent>
            <div className="space-y-6 p-6">
                <div>
                    <h2 className="text-xl font-semibold text-slate-950">{replace ? 'Remplacer la pièce' : 'Ajouter une pièce'}</h2>
                    <p className="mt-1 text-sm text-slate-500">PDF, JPG ou PNG, 10 Mo maximum.</p>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Type de document</label>
                        <select
                            className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                            value={documentName}
                            disabled={replace}
                            onChange={(event) => onNameChange(event.target.value)}
                        >
                            <option value="">Sélectionner une pièce</option>
                            {DOCUMENT_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-slate-700">Fichier</label>
                        <Input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={onFileChange}/>
                        {file && <p className="mt-2 text-xs text-slate-500">{file.name}</p>}
                    </div>
                </div>
                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button onClick={onSubmit} disabled={!file || !documentName || pending}>
                        {pending ? 'Envoi…' : replace ? 'Remplacer' : 'Ajouter'}
                    </Button>
                </div>
            </div>
        </ModalContent>
    </Modal>
);

const PreviewModal = ({document, onClose, onReplace}: any) => (
    <Modal open={Boolean(document)} onOpenChange={(value) => !value && onClose()}>
        <ModalContent className="flex h-[88vh] max-w-5xl flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-lg font-semibold text-slate-950">{document?.nomdoc}</h2>
                        {document && <StatusBadge status={document.document_statut}/>}
                    </div>
                    <p className="mt-1 text-sm text-slate-500">Prévisualisation de la pièce déposée</p>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer"><X/></Button>
            </div>
            {document && (
                <iframe
                    className="min-h-0 flex-1 bg-slate-100"
                    src={documentService.getDocumentPreviewUrl(document.id)}
                    title={`Prévisualisation de ${document.nomdoc}`}
                />
            )}
            <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-5 py-4">
                <Button variant="outline" onClick={onClose}>Fermer</Button>
                {document?.document_statut !== 'valide' && (
                    <Button onClick={() => onReplace(document)}><RefreshCw/>Remplacer cette pièce</Button>
                )}
            </div>
        </ModalContent>
    </Modal>
);

const DeleteModal = ({document, pending, onClose, onConfirm}: any) => (
    <Modal open={Boolean(document)} onOpenChange={(value) => !value && onClose()}>
        <ModalContent>
            <div className="p-6">
                <div className="flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 bg-slate-50 text-slate-600"><Trash2/></div>
                <h2 className="mt-5 text-xl font-semibold text-slate-950">Supprimer cette pièce ?</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    <span className="font-medium text-slate-900">{document?.nomdoc}</span> sera retiré du dossier. Cette action est définitive.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <Button variant="outline" onClick={onClose}>Annuler</Button>
                    <Button variant="destructive" onClick={onConfirm} disabled={pending}>{pending ? 'Suppression…' : 'Supprimer'}</Button>
                </div>
            </div>
        </ModalContent>
    </Modal>
);

const DocumentStat = ({label, value}: {label: string; value: number}) => (
    <div className="px-4 py-3">
        <p className="text-xl font-semibold text-[#29415f]">{value}</p>
        <p className="mt-0.5 text-xs font-medium text-slate-500">{label}</p>
    </div>
);

const StatusBadge = ({status}: {status: string}) => {
    if (status === 'valide') return <span className="inline-flex items-center gap-1 border border-slate-300 px-2 py-1 text-[10px] font-medium text-emerald-700"><CheckCircle2 className="h-3 w-3"/>Validé</span>;
    if (status === 'rejete') return <span className="inline-flex items-center gap-1 border border-slate-300 px-2 py-1 text-[10px] font-medium text-red-700"><XCircle className="h-3 w-3"/>Rejeté</span>;
    return <span className="inline-flex items-center gap-1 border border-slate-300 px-2 py-1 text-[10px] font-medium text-slate-600"><Clock3 className="h-3 w-3"/>En attente</span>;
};

export default DocumentsManager;
