import React, {useState} from 'react';
import {Camera, Upload, X} from 'lucide-react';
import {Button} from '@/components/ui/button';
import {Label} from '@/components/ui/label';
import {toast} from '@/hooks/use-toast';

interface PhotoUploadProps {
    onPhotoSelect: (file: File) => void;
    currentPhoto?: string;
    required?: boolean;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({
                                                     onPhotoSelect,
                                                     currentPhoto,
                                                     required = false
                                                 }) => {
    const [preview, setPreview] = useState<string | null>(currentPhoto || null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Format non supporté",
                description: "Veuillez sélectionner une image (JPEG, PNG, etc.)",
                variant: "destructive"
            });
            return;
        }

        // Vérifier la taille (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "Fichier trop volumineux",
                description: "La photo ne doit pas dépasser 5MB",
                variant: "destructive"
            });
            return;
        }

        // Créer un aperçu
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        onPhotoSelect(file);

        toast({
            title: "Photo ajoutée",
            description: "Votre photo a été sélectionnée avec succès"
        });
    };

    const removePhoto = () => {
        setPreview(null);
        // Reset input
        const input = document.getElementById('photo-input') as HTMLInputElement;
        if (input) input.value = '';

        toast({
            title: "Photo supprimée",
            description: "La photo a été retirée"
        });
    };

    return (
        <div className="space-y-4">
            <Label className="text-sm font-medium">
                Photo d'identité {required && <span className="text-red-500">*</span>}
            </Label>

            <div className="flex flex-col items-center space-y-4">
                {preview ? (
                    <div className="relative">
                        <div className="w-32 h-32 rounded-lg overflow-hidden border-4 border-primary/20 shadow-lg">
                            <img
                                src={preview}
                                alt="Aperçu photo candidat"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={removePhoto}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg"
                        >
                            <X className="h-3 w-3"/>
                        </button>
                    </div>
                ) : (
                    <div className="relative">
                        <input
                            id="photo-input"
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            required={required}
                        />
                        <div
                            className="w-32 h-32 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                            <Camera className="h-8 w-8 text-primary/60 mb-2"/>
                            <p className="text-xs text-primary/60 text-center font-medium">
                                Ajouter<br/>photo
                            </p>
                        </div>
                    </div>
                )}

                <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                        <strong>Format :</strong> JPEG, PNG • <strong>Taille max :</strong> 5MB<br/>
                        <strong>Recommandé :</strong> Photo d'identité récente sur fond clair
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PhotoUpload;
