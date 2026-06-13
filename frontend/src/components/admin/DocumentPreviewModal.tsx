import React from 'react';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {documentService} from '@/services/documentService';

interface DocumentPreviewModalProps {
    document: any;
    isOpen: boolean;
    onClose: () => void;
}

const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
                                                                       document,
                                                                       isOpen,
                                                                       onClose
                                                                   }) => {
    if (!document) return null;

    const getPreviewContent = () => {
        const fileExtension = document.nom_fichier?.split('.').pop()?.toLowerCase();
        const previewUrl = documentService.getDocumentPreviewUrl(document.nom_fichier);

        switch (fileExtension) {
            case 'pdf':
                return (
                    <iframe
                        src={previewUrl}
                        className="w-full h-[70vh] border rounded"
                        title={document.nomdoc}
                    />
                );
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return (
                    <img
                        src={previewUrl}
                        alt={document.nomdoc}
                        className="w-full h-auto max-h-[70vh] object-contain border rounded"
                    />
                );
            default:
                return (
                    <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
                        <div className="text-center">
                            <p className="text-gray-500 mb-2">Aperçu non disponible</p>
                            <p className="text-sm text-gray-400">
                                Type de fichier: {fileExtension?.toUpperCase() || 'Inconnu'}
                            </p>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    const link = document.createElement('a');
                                    link.href = previewUrl;
                                    link.download = document.nomdoc;
                                    link.click();
                                }}
                                className="mt-2"
                            >
                                Télécharger le fichier
                            </Button>
                        </div>
                    </div>
                );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Prévisualisation - {document.nomdoc}</DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-hidden">
                    {getPreviewContent()}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Fermer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default DocumentPreviewModal;
