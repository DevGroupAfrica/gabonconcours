import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Upload, Loader2, FileText } from 'lucide-react';
import { api } from '@/services/api';

interface AddDocumentModalProps {
    isOpen: boolean;
    onClose: () => void;
    nupcan: string;
    onDocumentAdded?: () => void;
}

const AddDocumentModal: React.FC<AddDocumentModalProps> = ({
    isOpen,
    onClose,
    nupcan,
    onDocumentAdded
}) => {
    const [nomdoc, setNomdoc] = useState('');
    const [type, setType] = useState('autre');
    const [file, setFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nomdoc.trim()) {
            toast({
                title: 'Nom requis',
                description: 'Veuillez entrer un nom pour le document.',
                variant: 'destructive'
            });
            return;
        }

        if (!file) {
            toast({
                title: 'Fichier requis',
                description: 'Veuillez sélectionner un fichier.',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('nomdoc', nomdoc);
            formData.append('type', type);
            formData.append('file', file);
            formData.append('nupcan', nupcan);

            const response = await api.post('/dossiers/add-document', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.success) {
                toast({
                    title: 'Succès',
                    description: 'Document ajouté avec succès'
                });
                setNomdoc('');
                setType('autre');
                setFile(null);
                onClose();
                if (onDocumentAdded) onDocumentAdded();
            }
        } catch (error: any) {
            console.error('Erreur ajout document:', error);
            toast({
                title: 'Erreur',
                description: error.response?.data?.message || 'Impossible d\'ajouter le document',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Ajouter un document supplémentaire
                    </DialogTitle>
                    <DialogDescription>
                        Vous pouvez ajouter jusqu'à 3 documents supplémentaires à votre dossier.
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="nomdoc">Nom du document *</Label>
                        <Input
                            id="nomdoc"
                            value={nomdoc}
                            onChange={(e) => setNomdoc(e.target.value)}
                            placeholder="Ex: Certificat de travail, Attestation..."
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="type">Type de document *</Label>
                        <Select value={type} onValueChange={setType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="diplome">Diplôme</SelectItem>
                                <SelectItem value="certificat">Certificat</SelectItem>
                                <SelectItem value="attestation">Attestation</SelectItem>
                                <SelectItem value="justificatif">Justificatif</SelectItem>
                                <SelectItem value="autre">Autre</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label htmlFor="file">Fichier *</Label>
                        <Input
                            id="file"
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            required
                        />
                        {file && (
                            <p className="text-sm text-muted-foreground mt-2">
                                ✅ {file.name}
                            </p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Ajout en cours...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Ajouter le document
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddDocumentModal;
