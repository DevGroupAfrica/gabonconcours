import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Upload, Plus, X, FileText} from 'lucide-react';
import {toast} from '@/hooks/use-toast';

interface CustomDocument {
    name: string;
    file: File;
    type: string;
}

interface CustomDocumentUploadProps {
    onDocumentsAdd: (documents: CustomDocument[]) => void;
}

const CustomDocumentUpload: React.FC<CustomDocumentUploadProps> = ({onDocumentsAdd}) => {
    const [customDocuments, setCustomDocuments] = useState<CustomDocument[]>([]);
    const [documentName, setDocumentName] = useState('');
    const [documentType, setDocumentType] = useState('');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const documentTypes = [
        {value: 'carte_identite', label: 'Carte Nationale d\'Identité'},
        {value: 'diplome', label: 'Diplôme ou Attestation'},
        {value: 'photo_identite', label: 'Photo d\'identité'},
        {value: 'acte_naissance', label: 'Acte de naissance'},
        {value: 'certificat_medical', label: 'Certificat médical'},
        {value: 'attestation_scolarite', label: 'Attestation de scolarité'},
        {value: 'lettre_motivation', label: 'Lettre de motivation'},
        {value: 'autres', label: 'Autres documents'}
    ];

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            toast({
                title: 'Fichier trop volumineux',
                description: 'Le fichier ne doit pas dépasser 5MB',
                variant: 'destructive',
            });
            return;
        }

        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            toast({
                title: 'Format non supporté',
                description: 'Seuls les fichiers PDF, JPEG et PNG sont acceptés',
                variant: 'destructive',
            });
            return;
        }

        setSelectedFile(file);
    };

    const addCustomDocument = () => {
        if (!documentName.trim() || !documentType || !selectedFile) {
            toast({
                title: 'Informations manquantes',
                description: 'Veuillez remplir tous les champs et sélectionner un fichier',
                variant: 'destructive',
            });
            return;
        }

        const newDocument: CustomDocument = {
            name: documentName.trim(),
            file: selectedFile,
            type: documentType
        };

        const updatedDocuments = [...customDocuments, newDocument];
        setCustomDocuments(updatedDocuments);

        // Reset form
        setDocumentName('');
        setDocumentType('');
        setSelectedFile(null);
        const fileInput = document.getElementById('custom-file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        toast({
            title: 'Document ajouté',
            description: 'Le document a été ajouté à votre liste',
        });
    };

    const removeCustomDocument = (index: number) => {
        const updatedDocuments = customDocuments.filter((_, i) => i !== index);
        setCustomDocuments(updatedDocuments);
        toast({
            title: 'Document supprimé',
            description: 'Le document a été retiré de votre liste',
        });
    };

    const handleSubmitAll = () => {
        if (customDocuments.length === 0) {
            toast({
                title: 'Aucun document',
                description: 'Veuillez ajouter au moins un document',
                variant: 'destructive',
            });
            return;
        }

        onDocumentsAdd(customDocuments);
        setCustomDocuments([]);
    };

    return (
        <div className="space-y-6">
            {/* Formulaire d'ajout de document personnalisé */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <Plus className="h-5 w-5 mr-2"/>
                        Ajouter un document personnalisé
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="document-type">Type de document</Label>
                            <Select value={documentType} onValueChange={setDocumentType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choisir le type"/>
                                </SelectTrigger>
                                <SelectContent>
                                    {documentTypes.map((type) => (
                                        <SelectItem key={type.value} value={type.value}>
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="document-name">Nom du document</Label>
                            <Input
                                id="document-name"
                                value={documentName}
                                onChange={(e) => setDocumentName(e.target.value)}
                                placeholder="Ex: Certificat de scolarité 2024"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="custom-file-input">Fichier</Label>
                        <div className="relative">
                            <input
                                id="custom-file-input"
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileSelect}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <div
                                className="border-2 border-dashed rounded-lg p-4 text-center hover:bg-muted/50 transition-colors">
                                <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground"/>
                                <p className="text-sm text-muted-foreground">
                                    {selectedFile ? selectedFile.name : 'Cliquez pour sélectionner un fichier'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">PDF, JPEG, PNG - Max 5MB</p>
                            </div>
                        </div>
                    </div>

                    <Button onClick={addCustomDocument} className="w-full">
                        <Plus className="h-4 w-4 mr-2"/>
                        Ajouter ce document
                    </Button>
                </CardContent>
            </Card>

            {/* Liste des documents ajoutés */}
            {customDocuments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Documents à soumettre ({customDocuments.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {customDocuments.map((doc, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <FileText className="h-5 w-5 text-blue-500"/>
                                        <div>
                                            <p className="font-medium">{doc.name}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {documentTypes.find(t => t.value === doc.type)?.label} • {doc.file.name}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeCustomDocument(index)}
                                    >
                                        <X className="h-4 w-4"/>
                                    </Button>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4">
                            <Button onClick={handleSubmitAll} className="w-full">
                                Soumettre tous les documents ({customDocuments.length})
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default CustomDocumentUpload;
