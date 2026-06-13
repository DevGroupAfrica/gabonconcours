import React, {useState, useEffect} from 'react';
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from '@/components/ui/dialog';
import {Button} from '@/components/ui/button';
import {X, Download, AlertTriangle, FileText} from 'lucide-react';

interface Document {
    id?: string;
    nupcan?: string; // Gardé pour compatibilité, mais non utilisé ici
    nipcan?: string; // Ajouté pour correspondre à l'API
    nomdoc?: string;
    type?: string;
    chemin?: string;
    nom_fichier?: string;
    taille?: number;
    statut?: string;
    document_statut?: string;
    created_at?: string;
    file_name?: string;
    original_name?: string;
    docdsr?: string; // Ajouté pour le chemin du fichier
}

interface DocumentViewerProps {
    isOpen: boolean;
    onClose: () => void;
    document: Document ;
}




const DocumentViewer: React.FC<DocumentViewerProps> = ({isOpen, onClose, document}) => {
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [pdfError, setPdfError] = useState(false);

    const getDocumentPath = (): string | null => {
        return document?.docdsr || document?.chemin || document?.nom_fichier || document?.file_name || null;
    };

    const getDocumentName = (): string => {
        return document?.nomdoc || document?.original_name || document?.file_name || document?.type || 'Document';
    };

    const documentPath = getDocumentPath();
    const documentName = getDocumentName();

    let documentUrl: string | null = null;
    if (documentPath) {
        documentUrl = `http://localhost:8002/${documentPath.replace(/\\/g, '/')}`;
    }

    useEffect(() => {
   if (documentUrl) {
       console.log('URL du document :', documentUrl);
      } else {
       console.warn('URL du document est null ou indéfinie');
     }
 }, [documentUrl]);

    const isImage = documentPath && /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(documentPath);
    const isPDF = documentPath && /\.pdf$/i.test(documentPath);

    const handleDownload = () => {
        if (!documentUrl) {
            console.error('Aucune URL de document disponible pour le téléchargement');
            return;
        }

        const link = window.document.createElement('a');
        link.href = documentUrl;
        link.download = documentName;
        link.target = '_blank';
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
    };

    const handleImageLoad = () => {
        setIsLoading(false);
        setImageError(false);
    };

    const handleImageError = () => {
        setIsLoading(false);
        setImageError(true);
        console.error('Erreur de chargement de l\'image pour URL :', documentUrl);
    };

    const handlePdfLoad = () => {
        setIsLoading(false);
        setPdfError(false);
    };

    const handlePdfError = () => {
        setIsLoading(false);
        setPdfError(true);
        console.error('Erreur de chargement du PDF pour URL :', documentUrl);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span className="truncate mr-4">{document ? documentName : 'Aucun document'}</span>
                        <div className="flex items-center space-x-2">
                            {documentUrl && (
                                <Button onClick={handleDownload} size="sm" variant="outline">
                                    <Download className="h-4 w-4 mr-2"/>
                                    Télécharger
                                </Button>
                            )}
                            <Button onClick={onClose} size="sm" variant="ghost">
                                <X className="h-4 w-4"/>
                            </Button>
                        </div>
                    </DialogTitle>
                    <DialogDescription>
                        {document?.type && `Type : ${document.type}`}
                        {document?.taille && ` • Taille : ${(document.taille / 1024).toFixed(1)} KB`}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-auto">
                    {!document ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4"/>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Aucun document sélectionné
                            </h3>
                            <p className="text-sm text-gray-600">
                                Veuillez sélectionner un document à afficher.
                            </p>
                        </div>
                    ) : !documentUrl ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <AlertTriangle className="h-12 w-12 text-amber-500 mb-4"/>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Document non accessible
                            </h3>
                            <p className="text-sm text-gray-600">
                                Le fichier de ce document n'est pas disponible ou le chemin est incorrect.
                            </p>
                        </div>
                    ) : isImage ? (
                        <div className="flex justify-center items-center min-h-[400px]">
                            {isLoading && (
                                <div className="flex flex-col items-center">
                                    <div
                                        className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                    <p className="text-sm text-gray-600">Chargement de l'image...</p>
                                </div>
                            )}
                            {imageError ? (
                                <div className="flex flex-col items-center text-center">
                                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4"/>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Impossible de charger l'image
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Le fichier image ne peut pas être affiché.
                                    </p>
                                </div>
                            ) : (
                                <img
                                    src={documentUrl}
                                    alt={documentName}
                                    className="max-w-full max-h-full object-contain"
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                    style={{display: isLoading ? 'none' : 'block'}}
                                />
                            )}
                        </div>
                    ) : isPDF ? (
                        <div className="w-full h-[600px] relative">
                            {isLoading && (
                                <div
                                    className="absolute inset-0 flex justify-center items-center bg-gray-100 bg-opacity-75 z-10">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                                        <p className="text-sm text-gray-600">Chargement du PDF...</p>
                                    </div>
                                </div>
                            )}
                            {pdfError ? (
                                <div className="flex flex-col items-center justify-center h-full text-center">
                                    <AlertTriangle className="h-12 w-12 text-red-500 mb-4"/>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                                        Impossible de charger le PDF
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        Le fichier PDF ne peut pas être affiché. Vérifiez le chemin ou téléchargez-le.
                                    </p>
                                    <Button onClick={handleDownload} variant="outline" className="mt-4">
                                        <Download className="h-4 w-4 mr-2"/>
                                        Télécharger
                                    </Button>
                                </div>
                            ) : (
                                <iframe
                                    src={`${documentUrl}#toolbar=0&view=FitH`}
                                    className="w-full h-full border-0"
                                    title={documentName}
                                    onLoad={handlePdfLoad}
                                    onError={handlePdfError}
                                />
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                            <FileText className="h-12 w-12 text-blue-500 mb-4"/>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Aperçu non disponible
                            </h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Ce type de fichier ne peut pas être prévisualisé directement.
                            </p>
                            <Button onClick={handleDownload} variant="outline">
                                <Download className="h-4 w-4 mr-2"/>
                                Télécharger pour voir le contenu
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DocumentViewer;
