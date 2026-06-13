import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Upload, Loader2, FileText } from 'lucide-react';
import { apiService } from '@/services/api';

interface AddDocumentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nupcan: string;
    onSuccess?: () => void;
    currentTotal: number;
}

interface UploadedDoc {
    file: File;
    nomdoc: string;
    type: 'pdf' | 'image';
}

const AddDocumentDialog: React.FC<AddDocumentDialogProps> = ({
    open,
    onOpenChange,
    nupcan,
    onSuccess,
    currentTotal
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [nomdoc, setNomdoc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const remainingSlots = 6 - currentTotal;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const selectedFile = e.target.files[0];
            // Validation type et taille
            const maxSize = 10 * 1024 * 1024; // 10MB
            const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
            if (!allowedTypes.includes(selectedFile.type)) {
                toast({
                    title: 'Format non supporté',
                    description: 'Seuls les fichiers PDF, JPG, JPEG et PNG sont acceptés',
                    variant: 'destructive'
                });
                return;
            }
            if (selectedFile.size > maxSize) {
                toast({
                    title: 'Fichier trop volumineux',
                    description: 'Le fichier ne doit pas dépasser 10MB',
                    variant: 'destructive'
                });
                return;
            }

            setFile(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!file || !nomdoc) {
            toast({
                title: 'Champs requis',
                description: 'Veuillez remplir tous les champs',
                variant: 'destructive'
            });
            return;
        }

        if (remainingSlots <= 0) {
            toast({
                title: 'Limite atteinte',
                description: 'Vous avez déjà uploadé le maximum de 6 documents',
                variant: 'destructive'
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('nupcan', nupcan);
            formData.append('nomdoc', nomdoc);
            formData.append('file', file);
            formData.append('type', file.type.includes('pdf') ? 'pdf' : 'image');

            const response = await apiService.makeFormDataRequest(
                '/documents/candidate/add',
                'POST',
                formData
            );

            if (response.success) {
                toast({
                    title: 'Document ajouté',
                    description: 'Votre document a été ajouté avec succès et est en attente de validation'
                });

                setFile(null);
                setNomdoc('');
                onOpenChange(false);

                if (onSuccess) onSuccess();
            } else {
                throw new Error(response.message || 'Erreur lors de l\'ajout');
            }
        } catch (error: any) {
            console.error('Erreur ajout document:', error);
            toast({
                title: 'Erreur',
                description: error.message || 'Impossible d\'ajouter le document',
                variant: 'destructive'
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Ajouter un document</DialogTitle>
                    <DialogDescription>
                        Vous pouvez ajouter jusqu'à 6 documents au total. 
                        {remainingSlots > 0 ? (
                            <span className="text-green-600 font-medium">
                                {' '}Il vous reste {remainingSlots} emplacement{remainingSlots > 1 ? 's' : ''}.
                            </span>
                        ) : (
                            <span className="text-red-600 font-medium">
                                {' '}Vous avez atteint la limite.
                            </span>
                        )}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="nomdoc">Nom du document *</Label>
                        <Input
                            id="nomdoc"
                            value={nomdoc}
                            onChange={(e) => setNomdoc(e.target.value)}
                            placeholder="Ex: Attestation de stage, Certificat médical..."
                            required
                        />
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
                            <p className="text-sm text-muted-foreground mt-2 flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                {file.name} ({(file.size / 1024).toFixed(2)} KB)
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                            Formats acceptés: PDF, JPG, JPEG, PNG (max 10MB)
                        </p>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isSubmitting || remainingSlots <= 0}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Ajout en cours...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Ajouter
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AddDocumentDialog;
