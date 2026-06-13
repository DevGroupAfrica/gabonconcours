// @ts-nocheck - Legacy API compatibility
import React, {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Progress} from '@/components/ui/progress';
import {Avatar, AvatarImage, AvatarFallback} from '@/components/ui/avatar';
import {Upload, User, Mail, Phone, MapPin, Calendar, GraduationCap, Camera} from 'lucide-react';
import Layout from '@/components/Layout';
import {toast} from '@/hooks/use-toast';
import {apiService} from '@/services/api';
import {candidatureStateManager, CandidatureFormData} from '@/services/candidatureStateManager';

const CandidatureComplete = () => {
    const {concoursId} = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    const [formData, setFormData] = useState<CandidatureFormData>({
        nomcan: '',
        prncan: '',
        maican: '',
        dtncan: '',
        telcan: '',
        ldncan: '',
        niveau_id: 0,
        nipcan: '',
        proorg: 0,
        proact: 0,
        proaff: 0,
        concours_id: parseInt(concoursId || '0')
    });
    const [niveaux, setNiveaux] = useState([]);
    const [provinces, setProvinces] = useState([]);
    const [etablissements, setEtablissements] = useState([]);
    const [concours, setConcours] = useState<any>(null);
    const [candidatureState, setCandidatureState] = useState<any>(null);

    useEffect(() => {
        loadData();
    }, [concoursId]);

    const loadData = async () => {
        try {
            // Initialiser l'état de candidature avec le concoursId
            if (concoursId) {
                const state = await candidatureStateManager.initializeNewCandidature(concoursId);
                setCandidatureState(state);
                setConcours(state.concoursData);

                // Mettre à jour formData avec l'ID du concours
                setFormData(prev => ({
                    ...prev,
                    concours_id: parseInt(concoursId)
                }));
            }

            // Charger les données de référence
            const [niveauxRes, provincesRes, etablissementsRes] = await Promise.all([
                apiService.getNiveaux(),
                apiService.getProvinces(),
                apiService.getEtablissements()
            ]);

            setNiveaux(niveauxRes.data || []);
            setProvinces(provincesRes.data || []);
            setEtablissements(etablissementsRes.data || []);

        } catch (error) {
            console.error('Erreur lors du chargement des données:', error);
            toast({
                title: "Erreur",
                description: "Impossible de charger les données du formulaire",
                variant: "destructive",
            });
        }
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB max
                toast({
                    title: "Fichier trop volumineux",
                    description: "La photo ne doit pas dépasser 5MB",
                    variant: "destructive",
                });
                return;
            }

            const reader = new FileReader();
            reader.onload = () => {
                setPhotoPreview(reader.result as string);
            };
            reader.readAsDataURL(file);

            setFormData(prev => ({...prev, photo: file}));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Validation des champs requis
            if (!formData.nomcan || !formData.prncan || !formData.maican || !formData.telcan) {
                toast({
                    title: "Champs requis",
                    description: "Veuillez remplir tous les champs obligatoires",
                    variant: "destructive",
                });
                return;
            }

            // Créer FormData pour inclure la photo
            const submitData = new FormData();

            // Ajouter tous les champs du formulaire
            Object.entries(formData).forEach(([key, value]) => {
                if (key === 'photo' && value instanceof File) {
                    submitData.append('photo', value);
                } else if (value !== undefined && value !== null) {
                    submitData.append(key, value.toString());
                }
            });

            console.log('Envoi des données:', Object.fromEntries(submitData));

            // Créer l'étudiant avec photo
            const response = await apiService.createEtudiant(submitData);

            if (response.success) {
                toast({
                    title: "Inscription réussie !",
                    description: `Votre numéro de candidature est : ${response.data.nupcan}`,
                });

                // Mettre à jour l'état de la candidature
                const candidatureId = `temp_${concoursId}_${Date.now()}`;
                await candidatureStateManager.finalizeInscription(candidatureId, formData);

                // Rediriger vers les documents avec le NUPCAN
                navigate(`/documents/continue/${encodeURIComponent(response.data.nupcan)}`);
            } else {
                throw new Error(response.message || 'Erreur lors de l\'inscription');
            }
        } catch (error) {
            console.error('Erreur lors de l\'inscription:', error);
            toast({
                title: "Erreur d'inscription",
                description: error instanceof Error ? error.message : "Une erreur est survenue lors de l'inscription",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-8">
                {/* En-tête avec progression */}
                <div className="mb-8">
                    <div className="text-center mb-6">
                        <h1 className="text-3xl font-bold text-primary mb-2">
                            Inscription au Concours
                        </h1>
                        {concours && (
                            <p className="text-lg text-muted-foreground">
                                {concours.libcnc} - {concours.etablissement_nomets}
                            </p>
                        )}
                    </div>

                    <div className="max-w-md mx-auto">
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="text-sm font-medium">Étape 1 sur 3</span>
                        </div>
                        <Progress value={33} className="h-2"/>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Inscription</span>
                            <span>Documents</span>
                            <span>Paiement</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Photo de profil */}
                        <div className="lg:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <Camera className="h-5 w-5"/>
                                        <span>Photo d'identité</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="text-center">
                                    <div className="mb-4">
                                        <Avatar className="w-32 h-32 mx-auto">
                                            <AvatarImage src={photoPreview || undefined}/>
                                            <AvatarFallback>
                                                <User className="h-16 w-16 text-muted-foreground"/>
                                            </AvatarFallback>
                                        </Avatar>
                                    </div>

                                    <Label htmlFor="photo" className="cursor-pointer">
                                        <div
                                            className="flex items-center justify-center space-x-2 bg-primary/10 hover:bg-primary/20 transition-colors p-3 rounded-lg">
                                            <Upload className="h-4 w-4"/>
                                            <span>Télécharger une photo</span>
                                        </div>
                                    </Label>
                                    <Input
                                        id="photo"
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />

                                    <p className="text-xs text-muted-foreground mt-2">
                                        Format: JPG, PNG (max 5MB)
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Formulaire principal */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informations personnelles</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    {/* Informations de base */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="nomcan">Nom <span className="text-red-500">*</span></Label>
                                            <Input
                                                id="nomcan"
                                                value={formData.nomcan}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    nomcan: e.target.value.toUpperCase()
                                                }))}
                                                placeholder="Votre nom"
                                                required
                                            />
                                        </div>

                                        <div>
                                            <Label htmlFor="prncan">Prénom <span
                                                className="text-red-500">*</span></Label>
                                            <Input
                                                id="prncan"
                                                value={formData.prncan}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    prncan: e.target.value
                                                }))}
                                                placeholder="Votre prénom"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Contact */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="maican">Email <span
                                                className="text-red-500">*</span></Label>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                                <Input
                                                    id="maican"
                                                    type="email"
                                                    value={formData.maican}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        maican: e.target.value
                                                    }))}
                                                    placeholder="votre@email.com"
                                                    className="pl-10"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="telcan">Téléphone <span
                                                className="text-red-500">*</span></Label>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                                <Input
                                                    id="telcan"
                                                    value={formData.telcan}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        telcan: e.target.value
                                                    }))}
                                                    placeholder="+241 XX XX XX XX"
                                                    className="pl-10"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date et lieu */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="dtncan">Date de naissance <span
                                                className="text-red-500">*</span></Label>
                                            <div className="relative">
                                                <Calendar
                                                    className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                                <Input
                                                    id="dtncan"
                                                    type="date"
                                                    value={formData.dtncan}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        dtncan: e.target.value
                                                    }))}
                                                    className="pl-10"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <Label htmlFor="ldncan">Lieu de naissance <span
                                                className="text-red-500">*</span></Label>
                                            <div className="relative">
                                                <MapPin
                                                    className="absolute left-3 top-3 h-4 w-4 text-muted-foreground"/>
                                                <Input
                                                    id="ldncan"
                                                    value={formData.ldncan}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        ldncan: e.target.value
                                                    }))}
                                                    placeholder="Ville de naissance"
                                                    className="pl-10"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Informations académiques */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label htmlFor="niveau_id">Niveau d'études <span
                                                className="text-red-500">*</span></Label>
                                            <Select value={formData.niveau_id.toString()}
                                                    onValueChange={(value) => setFormData(prev => ({
                                                        ...prev,
                                                        niveau_id: parseInt(value)
                                                    }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Sélectionner un niveau"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {niveaux.map((niveau: any) => (
                                                        <SelectItem key={niveau.id} value={niveau.id.toString()}>
                                                            {niveau.nomniv}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="nipcan">NIP (Numéro d'Identité Personnel)</Label>
                                            <Input
                                                id="nipcan"
                                                value={formData.nipcan}
                                                onChange={(e) => setFormData(prev => ({
                                                    ...prev,
                                                    nipcan: e.target.value
                                                }))}
                                                placeholder="Optionnel"
                                            />
                                        </div>
                                    </div>

                                    {/* Provinces */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <Label htmlFor="proorg">Province d'origine <span
                                                className="text-red-500">*</span></Label>
                                            <Select value={formData.proorg.toString()}
                                                    onValueChange={(value) => setFormData(prev => ({
                                                        ...prev,
                                                        proorg: parseInt(value)
                                                    }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Province d'origine"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {provinces.map((province: any) => (
                                                        <SelectItem key={province.id} value={province.id.toString()}>
                                                            {province.nompro}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="proact">Province actuelle <span
                                                className="text-red-500">*</span></Label>
                                            <Select value={formData.proact.toString()}
                                                    onValueChange={(value) => setFormData(prev => ({
                                                        ...prev,
                                                        proact: parseInt(value)
                                                    }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Province actuelle"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {provinces.map((province: any) => (
                                                        <SelectItem key={province.id} value={province.id.toString()}>
                                                            {province.nompro}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        <div>
                                            <Label htmlFor="proaff">Province d'affectation <span
                                                className="text-red-500">*</span></Label>
                                            <Select value={formData.proaff.toString()}
                                                    onValueChange={(value) => setFormData(prev => ({
                                                        ...prev,
                                                        proaff: parseInt(value)
                                                    }))}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Province d'affectation"/>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {provinces.map((province: any) => (
                                                        <SelectItem key={province.id} value={province.id.toString()}>
                                                            {province.nompro}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Bouton de soumission */}
                    <div className="mt-8 text-center">
                        <Button
                            type="submit"
                            disabled={loading}
                            className="px-8 py-3 bg-primary hover:bg-primary/90 text-white font-medium"
                            size="lg"
                        >
                            {loading ? 'Inscription en cours...' : 'Continuer vers les documents'}
                        </Button>
                    </div>
                </form>
            </div>
        </Layout>
    );
};

export default CandidatureComplete;
