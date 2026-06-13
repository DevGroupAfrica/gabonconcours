import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Badge} from '@/components/ui/badge';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Plus, Upload, X, FileText, AlertCircle} from 'lucide-react';
import {toast} from '@/hooks/use-toast';

interface DocumentUploadFormProps {
    onDocumentsAdd: (documents: { name: string; file: File }[]) => void;
    existingDocuments?: any[];
    maxSupplementaryDocs?: number;
}

interface SupplementaryDocument {
    id: string;
    name: string;
    file: File | null;
}

const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
                                                                   onDocumentsAdd,
                                                                   existingDocuments = [],
                                                                   maxSupplementaryDocs = 3
                                                               }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [supplementaryDocs, setSupplementaryDocs] = useState<SupplementaryDocument[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    // Documents obligatoires par défaut
    const requiredDocuments = [
        {name: 'Acte de naissance', required: true},
        {name: 'Diplôme du BAC', required: true},
        {name: 'Certificat de nationalité', required: true},
    ];

    const addSupplementaryDoc = () => {
        if (supplementaryDocs.length >= maxSupplementaryDocs) {
            toast({
                title: "Limite atteinte",
                description: `Vous ne pouvez ajouter que ${maxSupplementaryDocs} documents supplémentaires maximum.`,
                variant: "destructive",
            });
            return;
        }

        const newDoc: SupplementaryDocument = {
            id: Date.now().toString(),
            name: '',
            file: null,
        };

        setSupplementaryDocs([...supplementaryDocs, newDoc]);
    };

    const removeSupplementaryDoc = (id: string) => {
        setSupplementaryDocs(supplementaryDocs.filter(doc => doc.id !== id));
    };

    const updateSupplementaryDoc = (id: string, field: 'name' | 'file', value: string | File) => {
        setSupplementaryDocs(supplementaryDocs.map(doc =>
            doc.id === id ? {...doc, [field]: value} : doc
        ));
    };

    const handleUpload = async () => {
        // Validation des documents supplémentaires
        const validDocs = supplementaryDocs.filter(doc => doc.name.trim() && doc.file);

        if (validDocs.length === 0) {
            toast({
                title: "Aucun document",
                description: "Veuillez ajouter au moins un document avec un nom et un fichier.",
                variant: "destructive",
            });
            return;
        }

        // Vérification des noms de documents
        const invalidDocs = validDocs.filter(doc => doc.name.trim().length < 3);
        if (invalidDocs.length > 0) {
            toast({
                title: "Noms invalides",
                description: "Les noms de documents doivent contenir au moins 3 caractères.",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);
        try {
            const documentsToUpload = validDocs.map(doc => ({
                name: doc.name.trim(),
                file: doc.file!
            }));

            onDocumentsAdd(documentsToUpload);

            toast({
                title: "Documents ajoutés",
                description: `${documentsToUpload.length} document(s) ajouté(s) avec succès.`,
            });

            // Reset form
            setSupplementaryDocs([]);
            setIsOpen(false);
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible d'ajouter les documents.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    const getExistingDocCount = () => {
        return existingDocuments?.length || 0;
    };

    const canAddMoreDocs = () => {
        return supplementaryDocs.length < maxSupplementaryDocs;
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center space-x-2">
                    <Plus className="h-4 w-4"/>
                    <span>Ajouter documents</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Gestion des Documents</DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Informations sur les documents existants */}
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex items-center space-x-2">
                            <FileText className="h-5 w-5 text-blue-600"/>
                            <span className="font-medium text-blue-800">
                Documents actuels: {getExistingDocCount()}
              </span>
                        </div>
                        <p className="text-sm text-blue-700 mt-1">
                            Vous pouvez ajouter jusqu'à {maxSupplementaryDocs} documents supplémentaires.
                        </p>
                    </div>

                    {/* Documents obligatoires (informatif) */}
                    <div>
                        <h3 className="font-medium mb-3">Documents obligatoires</h3>
                        <div className="space-y-2">
                            {requiredDocuments.map((doc, index) => (
                                <div key={index}
                                     className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <span className="font-medium">{doc.name}</span>
                                    <Badge variant="destructive" className="text-xs">
                                        Obligatoire
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Documents supplémentaires */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-medium">Documents supplémentaires</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={addSupplementaryDoc}
                                disabled={!canAddMoreDocs()}
                                className="flex items-center space-x-1"
                            >
                                <Plus className="h-4 w-4"/>
                                <span>Ajouter</span>
                            </Button>
                        </div>

                        {!canAddMoreDocs() && (
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 mb-4">
                                <div className="flex items-center space-x-2">
                                    <AlertCircle className="h-4 w-4 text-orange-600"/>
                                    <span className="text-sm text-orange-800">
                    Limite de {maxSupplementaryDocs} documents supplémentaires atteinte.
                  </span>
                                </div>
                            </div>
                        )}

                        <div className="space-y-4">
                            {supplementaryDocs.map((doc) => (
                                <Card key={doc.id} className="p-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor={`doc-name-${doc.id}`}>Nom du document</Label>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeSupplementaryDoc(doc.id)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                <X className="h-4 w-4"/>
                                            </Button>
                                        </div>

                                        <Input
                                            id={`doc-name-${doc.id}`}
                                            placeholder="Ex: Relevé de notes du BAC, Certificat médical..."
                                            value={doc.name}
                                            onChange={(e) => updateSupplementaryDoc(doc.id, 'name', e.target.value)}
                                            className="w-full"
                                        />

                                        <div>
                                            <Label htmlFor={`doc-file-${doc.id}`}>Fichier</Label>
                                            <Input
                                                id={`doc-file-${doc.id}`}
                                                type="file"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        updateSupplementaryDoc(doc.id, 'file', file);
                                                    }
                                                }}
                                                className="w-full"
                                            />
                                        </div>

                                        {doc.file && (
                                            <div className="text-sm text-green-600">
                                                ✓ Fichier sélectionné: {doc.file.name}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}

                            {supplementaryDocs.length === 0 && (
                                <div className="text-center py-6 text-muted-foreground">
                                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-30"/>
                                    <p>Aucun document supplémentaire ajouté</p>
                                    <p className="text-sm">Cliquez sur "Ajouter" pour commencer</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Boutons d'action */}
                    {supplementaryDocs.length > 0 && (
                        <div className="flex justify-end space-x-2 pt-4 border-t">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setSupplementaryDocs([]);
                                    setIsOpen(false);
                                }}
                                disabled={isUploading}
                            >
                                Annuler
                            </Button>
                            <Button
                                onClick={handleUpload}
                                disabled={isUploading}
                                className="flex items-center space-x-2"
                            >
                                <Upload className="h-4 w-4"/>
                                <span>{isUploading ? 'Upload...' : 'Ajouter les documents'}</span>
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default DocumentUploadForm;
