import React, {useState} from 'react';
import {useForm} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import {z} from 'zod';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Upload, User, Camera, X, AlertTriangle} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import {Alert, AlertDescription} from '@/components/ui/alert';

const candidatureSchema = z.object({
    nomcan: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    prncan: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    maican: z.string().email('Email invalide'),
    dtncan: z.string().min(1, 'Date de naissance requise'),
    telcan: z.string().min(8, 'Numéro de téléphone invalide'),
    ldncan: z.string().min(2, 'Lieu de naissance requis'),
    niveau_id: z.number().min(1, 'Niveau d\'études requis'),
    proorg: z.number().min(1, 'Province d\'origine requise'),
    proact: z.number().min(1, 'Province actuelle requise'),
    proaff: z.number().min(1, 'Province d\'affectation requise'),
});

type CandidatureFormData = z.infer<typeof candidatureSchema>;

interface CandidatureFormProps {
    concoursData: any;
    niveaux: any[];
    provinces: any[];
    onSubmit: (data: CandidatureFormData & { phtcan?: File }) => void;
    isLoading?: boolean;
}

const CandidatureForm: React.FC<CandidatureFormProps> = ({
                                                             concoursData,
                                                             niveaux,
                                                             provinces,
                                                             onSubmit,
                                                             isLoading = false
                                                         }) => {
    const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [ageError, setAgeError] = useState<string | null>(null);

    const form = useForm<CandidatureFormData>({
        resolver: zodResolver(candidatureSchema),
    });

    const calculateAge = (birthDate: string): number => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    };

    const validateAge = (birthDate: string) => {
        if (!birthDate || !concoursData?.agecnc) {
            setAgeError(null);
            return;
        }

        const age = calculateAge(birthDate);
        const requiredAge = parseInt(concoursData.agecnc);

        if (age < requiredAge) {
            setAgeError(`Vous devez avoir au moins ${requiredAge} ans pour ce concours. Votre âge: ${age} ans`);
        } else {
            setAgeError(null);
        }
    };

    const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
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

        setSelectedPhoto(file);

        // Créer un aperçu avec fond blanc
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Créer un canvas avec fond blanc
                const canvas = window.document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Définir les dimensions (format identité)
                const size = 400;
                canvas.width = size;
                canvas.height = size;

                // Fond blanc
                if (ctx) {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, size, size);

                    // Calculer les dimensions pour centrer l'image
                    const scale = Math.min(size / img.width, size / img.height);
                    const newWidth = img.width * scale;
                    const newHeight = img.height * scale;
                    const x = (size - newWidth) / 2;
                    const y = (size - newHeight) / 2;

                    // Dessiner l'image centrée
                    ctx.drawImage(img, x, y, newWidth, newHeight);

                    // Convertir en blob et créer l'aperçu
                    canvas.toBlob((blob) => {
                        if (blob) {
                            const processedFile = new File([blob], file.name, {type: 'image/jpeg'});
                            setSelectedPhoto(processedFile);
                            setPhotoPreview(canvas.toDataURL());
                        }
                    }, 'image/jpeg', 0.9);
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);

        toast({
            title: "Photo ajoutée",
            description: "Votre photo a été traitée avec fond blanc"
        });
    };

    const removePhoto = () => {
        setSelectedPhoto(null);
        setPhotoPreview(null);
        toast({
            title: "Photo supprimée",
            description: "La photo a été retirée de votre candidature"
        });
    };

    const handleFormSubmit = (data: CandidatureFormData) => {
        // Vérifier l'âge avant soumission
        if (ageError) {
            toast({
                title: "Âge insuffisant",
                description: ageError,
                variant: "destructive"
            });
            return;
        }

        onSubmit({
            ...data,
            phtcan: selectedPhoto || undefined
        });
    };

    const handleDateChange = (date: string) => {
        form.setValue('dtncan', date);
        validateAge(date);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Illustration à gauche */}
            <div className="hidden lg:flex flex-col justify-center items-center p-8">
                <div className="w-full max-w-md">
                    <img
                        src="https://images.unsplash.com/photo-1434030216411-0b793f4b4173?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
                        alt="Candidature"
                        className="w-full h-auto rounded-lg shadow-lg"
                    />
                </div>
                <div className="text-center mt-6">
                    <h3 className="text-2xl font-bold text-primary mb-2">
                        Votre Avenir Commence Ici
                    </h3>
                    <p className="text-muted-foreground">
                        Complétez votre candidature pour accéder aux meilleures opportunités éducatives du Gabon
                    </p>
                </div>
            </div>

            {/* Formulaire à droite */}
            <div className="space-y-8">
                {/* En-tête avec info concours */}
                <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-center">
                            Candidature pour: {concoursData?.libcnc}
                        </CardTitle>
                        <p className="text-center text-muted-foreground">
                            {concoursData?.description}
                        </p>
                        {concoursData?.agecnc && (
                            <p className="text-center text-sm text-amber-600 font-medium">
                                Âge minimum requis: {concoursData.agecnc} ans
                            </p>
                        )}
                    </CardHeader>
                </Card>

                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8">
                    {/* Section Photo */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Camera className="h-5 w-5 text-primary"/>
                                <span>Photo d'identité * (Fond blanc obligatoire)</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center space-y-4">
                                {photoPreview ? (
                                    <div className="relative">
                                        <div
                                            className="w-48 h-48 rounded-lg overflow-hidden border-4 border-primary/20 shadow-lg bg-white">
                                            <img
                                                src={photoPreview}
                                                alt="Photo de candidature sur fond blanc"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={removePhoto}
                                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-lg"
                                        >
                                            <X className="h-4 w-4"/>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handlePhotoSelect}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            required
                                        />
                                        <div
                                            className="w-48 h-48 border-2 border-dashed border-primary/30 rounded-lg flex flex-col items-center justify-center bg-white hover:bg-primary/5 transition-colors cursor-pointer">
                                            <Upload className="h-12 w-12 text-primary/60 mb-3"/>
                                            <p className="text-sm text-primary/60 text-center font-medium">
                                                Cliquer pour ajouter<br/>votre photo d'identité
                                            </p>
                                            <p className="text-xs text-primary/40 mt-2">
                                                Fond blanc requis
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <div className="text-center bg-blue-50 p-3 rounded-lg">
                                    <p className="text-xs text-blue-700 font-medium">
                                        <strong>📋 Exigences photo d'identité :</strong><br/>
                                        • Format : JPEG ou PNG (max 5MB)<br/>
                                        • Fond : Blanc obligatoire (traitement automatique)<br/>
                                        • Qualité : Photo récente et nette<br/>
                                        • Cadrage : Visage centré, épaules visibles
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informations personnelles */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <User className="h-5 w-5 text-primary"/>
                                <span>Informations personnelles</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="nomcan">Nom *</Label>
                                    <Input
                                        id="nomcan"
                                        {...form.register('nomcan')}
                                        placeholder="Votre nom de famille"
                                    />
                                    {form.formState.errors.nomcan && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {form.formState.errors.nomcan.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="prncan">Prénom *</Label>
                                    <Input
                                        id="prncan"
                                        {...form.register('prncan')}
                                        placeholder="Votre prénom"
                                    />
                                    {form.formState.errors.prncan && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {form.formState.errors.prncan.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="maican">Email *</Label>
                                    <Input
                                        id="maican"
                                        type="email"
                                        {...form.register('maican')}
                                        placeholder="votre.email@example.com"
                                    />
                                    {form.formState.errors.maican && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {form.formState.errors.maican.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="telcan">Téléphone *</Label>
                                    <Input
                                        id="telcan"
                                        {...form.register('telcan')}
                                        placeholder="Ex: +241 01 23 45 67"
                                    />
                                    {form.formState.errors.telcan && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {form.formState.errors.telcan.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="dtncan">Date de naissance *</Label>
                                    <Input
                                        id="dtncan"
                                        type="date"
                                        onChange={(e) => handleDateChange(e.target.value)}
                                    />
                                    {form.formState.errors.dtncan && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {form.formState.errors.dtncan.message}
                                        </p>
                                    )}
                                    {ageError && (
                                        <Alert className="mt-2 border-red-200 bg-red-50">
                                            <AlertTriangle className="h-4 w-4 text-red-600"/>
                                            <AlertDescription className="text-red-600">
                                                {ageError}
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="ldncan">Lieu de naissance *</Label>
                                    <Input
                                        id="ldncan"
                                        {...form.register('ldncan')}
                                        placeholder="Ville de naissance"
                                    />
                                    {form.formState.errors.ldncan && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {form.formState.errors.ldncan.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Informations académiques et géographiques */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations complémentaires</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="niveau_id">Niveau d'études *</Label>
                                    <Select
                                        onValueChange={(value) => form.setValue('niveau_id', parseInt(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sélectionner votre niveau"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {niveaux.map((niveau) => (
                                                <SelectItem key={niveau.id} value={niveau.id.toString()}>
                                                    {niveau.libniv}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.niveau_id && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {form.formState.errors.niveau_id.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="proorg">Province d'origine *</Label>
                                    <Select
                                        onValueChange={(value) => form.setValue('proorg', parseInt(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Province d'origine"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {provinces.map((province) => (
                                                <SelectItem key={province.id} value={province.id.toString()}>
                                                    {province.libpro}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.proorg && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {form.formState.errors.proorg.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="proact">Province actuelle *</Label>
                                    <Select
                                        onValueChange={(value) => form.setValue('proact', parseInt(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Province actuelle"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {provinces.map((province) => (
                                                <SelectItem key={province.id} value={province.id.toString()}>
                                                    {province.libpro}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.proact && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {form.formState.errors.proact.message}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="proaff">Province d'affectation souhaitée *</Label>
                                    <Select
                                        onValueChange={(value) => form.setValue('proaff', parseInt(value))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Province souhaitée"/>
                                        </SelectTrigger>
                                        <SelectContent>
                                            {provinces.map((province) => (
                                                <SelectItem key={province.id} value={province.id.toString()}>
                                                    {province.libpro}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {form.formState.errors.proaff && (
                                        <p className="text-red-500 text-sm mt-1">
                                            {form.formState.errors.proaff.message}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-center">
                        <Button
                            type="submit"
                            disabled={isLoading || !!ageError || !selectedPhoto}
                            className="bg-primary hover:bg-primary/90 px-8 py-3"
                            size="lg"
                        >
                            {isLoading ? 'Soumission en cours...' : 'Soumettre ma candidature'}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CandidatureForm;
