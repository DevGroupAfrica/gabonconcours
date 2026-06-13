import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
    ChevronLeft, ChevronRight, Check, FileText, Users, Calendar, 
    Target, Info, Plus, X, School, Award 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiService } from '@/services/api';
import { useQuery } from '@tanstack/react-query';

interface ConcoursFormData {
    // Étape 1: Informations de base
    libcnc: string;
    etablissement_id: string;
    niveau_id: string;
    sescnc: string;
    type_concours: string;
    description_concours: string;
    
    // Étape 2: Dates et conditions
    debcnc: string;
    fincnc: string;
    agecnc: number;
    fracnc: number;
    nombre_places_total: number;
    duree_formation: string;
    diplome_delivre: string;
    date_publication_resultats: string;
    date_debut_cours: string;
    
    // Étape 3: Séries du bac (si première année)
    series_bac_acceptees: string[];
    
    // Étape 4: Documents requis
    documents_requis: Array<{
        nom: string;
        obligatoire: boolean;
        description: string;
    }>;
    
    // Étape 5: Critères de sélection
    criteres_selection: Array<{
        critere: string;
        poids: number;
        description: string;
    }>;
    
    // Étape 6: Modalités et contacts
    modalites_inscription: Array<{
        etape: number;
        titre: string;
        description: string;
    }>;
    conditions_eligibilite: Array<{
        condition: string;
        obligatoire: boolean;
    }>;
    contact_email: string;
    contact_telephone: string;
    lieu_examen: string;
    informations_complementaires: string;
}

const STEPS = [
    { id: 1, title: 'Informations de base', icon: Info },
    { id: 2, title: 'Dates et conditions', icon: Calendar },
    { id: 3, title: 'Séries du Bac', icon: Award },
    { id: 4, title: 'Documents requis', icon: FileText },
    { id: 5, title: 'Critères de sélection', icon: Target },
    { id: 6, title: 'Modalités et contacts', icon: Users },
];

const SERIES_BAC = ['Série A', 'Série C', 'Série D', 'Série G', 'Série E', 'Série F'];

const DOCUMENTS_DEFAULT = [
    { nom: 'Acte de naissance', obligatoire: true, description: 'Acte de naissance original ou copie certifiée' },
    { nom: 'Certificat de nationalité', obligatoire: true, description: 'Certificat de nationalité gabonaise' },
    { nom: 'Diplôme du Baccalauréat', obligatoire: true, description: 'Diplôme du Baccalauréat ou équivalent' },
    { nom: 'Relevé de notes du Baccalauréat', obligatoire: true, description: 'Relevé de notes complet' },
    { nom: 'Photo d\'identité', obligatoire: true, description: 'Photo d\'identité récente (format 4x4)' },
    { nom: 'Certificat médical', obligatoire: true, description: 'Certificat médical de moins de 3 mois' },
    { nom: 'Casier judiciaire', obligatoire: true, description: 'Bulletin n°3 du casier judiciaire' },
];

interface CreateConcoursMultiStepProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateConcoursMultiStep: React.FC<CreateConcoursMultiStepProps> = ({ onClose, onSuccess }) => {
    const { toast } = useToast();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState<ConcoursFormData>({
        libcnc: '',
        etablissement_id: '',
        niveau_id: '',
        sescnc: new Date().getFullYear().toString(),
        type_concours: 'autre',
        description_concours: '',
        debcnc: '',
        fincnc: '',
        agecnc: 35,
        fracnc: 0,
        nombre_places_total: 0,
        duree_formation: '',
        diplome_delivre: '',
        date_publication_resultats: '',
        date_debut_cours: '',
        series_bac_acceptees: [],
        documents_requis: [...DOCUMENTS_DEFAULT],
        criteres_selection: [
            { critere: 'Moyenne générale au Baccalauréat', poids: 40, description: 'Note minimale requise: 12/20' },
            { critere: 'Notes dans les matières principales', poids: 30, description: 'Mathématiques, Français, etc.' },
            { critere: 'Âge du candidat', poids: 10, description: 'Respect de la limite d\'âge' },
            { critere: 'Ordre d\'arrivée des dossiers', poids: 20, description: 'Date de soumission du dossier' },
        ],
        modalites_inscription: [
            { etape: 1, titre: 'Inscription en ligne', description: 'Créer un compte et remplir le formulaire' },
            { etape: 2, titre: 'Paiement des frais', description: 'Payer les frais d\'inscription' },
            { etape: 3, titre: 'Téléchargement des documents', description: 'Scanner et télécharger tous les documents requis' },
            { etape: 4, titre: 'Validation du dossier', description: 'Attendre la validation par l\'administration' },
            { etape: 5, titre: 'Récépissé d\'inscription', description: 'Télécharger et imprimer le récépissé' },
        ],
        conditions_eligibilite: [
            { condition: 'Nationalité gabonaise', obligatoire: true },
            { condition: 'Âge maximum respecté', obligatoire: true },
            { condition: 'Diplôme requis obtenu', obligatoire: true },
        ],
        contact_email: '',
        contact_telephone: '',
        lieu_examen: '',
        informations_complementaires: '',
    });

    const isPremiereAnnee = formData.type_concours === 'premiere_annee';

    const handleNext = () => {
        // Skip step 3 if not première année
        if (currentStep === 2 && !isPremiereAnnee) {
            setCurrentStep(4);
        } else if (currentStep < STEPS.length) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrevious = () => {
        // Skip step 3 if not première année
        if (currentStep === 4 && !isPremiereAnnee) {
            setCurrentStep(2);
        } else if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                stacnc: '1', // Ouvert par défaut
                series_bac_acceptees: isPremiereAnnee ? JSON.stringify(formData.series_bac_acceptees) : null,
                documents_requis: JSON.stringify(formData.documents_requis),
                criteres_selection: JSON.stringify(formData.criteres_selection),
                modalites_inscription: JSON.stringify(formData.modalites_inscription),
                conditions_eligibilite: JSON.stringify(formData.conditions_eligibilite),
            };

            await apiService.makeRequest('/concours', 'POST', payload);
            
            toast({
                title: 'Succès',
                description: 'Le concours a été créé avec succès',
            });
            
            onSuccess();
            onClose();
        } catch (error: any) {
            toast({
                title: 'Erreur',
                description: error.message || 'Erreur lors de la création du concours',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const addDocument = () => {
        setFormData({
            ...formData,
            documents_requis: [
                ...formData.documents_requis,
                { nom: '', obligatoire: true, description: '' }
            ]
        });
    };

    const removeDocument = (index: number) => {
        setFormData({
            ...formData,
            documents_requis: formData.documents_requis.filter((_, i) => i !== index)
        });
    };

    const addCritere = () => {
        setFormData({
            ...formData,
            criteres_selection: [
                ...formData.criteres_selection,
                { critere: '', poids: 0, description: '' }
            ]
        });
    };

    const removeCritere = (index: number) => {
        setFormData({
            ...formData,
            criteres_selection: formData.criteres_selection.filter((_, i) => i !== index)
        });
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return <Step1InformationsBase formData={formData} setFormData={setFormData} />;
            case 2:
                return <Step2DatesConditions formData={formData} setFormData={setFormData} />;
            case 3:
                return isPremiereAnnee ? <Step3SeriesBac formData={formData} setFormData={setFormData} /> : null;
            case 4:
                return <Step4Documents formData={formData} setFormData={setFormData} addDocument={addDocument} removeDocument={removeDocument} />;
            case 5:
                return <Step5Criteres formData={formData} setFormData={setFormData} addCritere={addCritere} removeCritere={removeCritere} />;
            case 6:
                return <Step6ModalitesContacts formData={formData} setFormData={setFormData} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6">
            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
                {STEPS.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id;
                    const isCompleted = currentStep > step.id;
                    const shouldShow = step.id !== 3 || isPremiereAnnee;
                    
                    if (!shouldShow) return null;
                    
                    return (
                        <div key={step.id} className="flex items-center flex-1">
                            <div className="flex flex-col items-center flex-1">
                                <div className={`
                                    w-12 h-12 rounded-full flex items-center justify-center
                                    ${isActive ? 'bg-primary text-white' : 
                                      isCompleted ? 'bg-green-500 text-white' : 
                                      'bg-gray-200 text-gray-500'}
                                    transition-all duration-300
                                `}>
                                    {isCompleted ? <Check className="h-6 w-6" /> : <Icon className="h-6 w-6" />}
                                </div>
                                <p className={`text-xs mt-2 text-center ${isActive ? 'font-semibold' : ''}`}>
                                    {step.title}
                                </p>
                            </div>
                            {index < STEPS.length - 1 && shouldShow && (
                                <div className={`h-1 flex-1 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Step Content */}
            <Card>
                <CardHeader>
                    <CardTitle>
                        {STEPS.find(s => s.id === currentStep)?.title}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {renderStepContent()}
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex justify-between">
                <Button
                    variant="outline"
                    onClick={currentStep === 1 ? onClose : handlePrevious}
                    disabled={isSubmitting}
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    {currentStep === 1 ? 'Annuler' : 'Précédent'}
                </Button>
                
                {currentStep < STEPS.length ? (
                    <Button onClick={handleNext} disabled={isSubmitting}>
                        Suivant
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? 'Création...' : 'Créer le concours'}
                        <Check className="h-4 w-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    );
};

// Step 1: Informations de base
const Step1InformationsBase: React.FC<{
    formData: ConcoursFormData;
    setFormData: (data: ConcoursFormData) => void;
}> = ({ formData, setFormData }) => {
    const { data: etablissementsData } = useQuery({
        queryKey: ['etablissements'],
        queryFn: async () => {
            return await apiService.getEtablissements();
        }
    });

    const { data: niveauxData } = useQuery({
        queryKey: ['niveaux'],
        queryFn: async () => {
            return await apiService.getNiveaux();
        }
    });

    const etablissements = etablissementsData?.data || [];
    const niveaux = niveauxData?.data || [];

    return (
        <div className="space-y-4">
            <div>
                <Label htmlFor="libcnc">Nom du concours *</Label>
                <Input
                    id="libcnc"
                    value={formData.libcnc}
                    onChange={(e) => setFormData({ ...formData, libcnc: e.target.value })}
                    placeholder="Ex: Concours d'entrée à l'USS"
                    required
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="etablissement_id">Établissement *</Label>
                    <Select
                        value={formData.etablissement_id}
                        onValueChange={(value) => setFormData({ ...formData, etablissement_id: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un établissement" />
                        </SelectTrigger>
                        <SelectContent>
                            {etablissements.length === 0 ? (
                                <SelectItem value="none" disabled>Aucun établissement disponible</SelectItem>
                            ) : (
                                etablissements.map((etab: any) => (
                                    <SelectItem key={etab.id} value={etab.id.toString()}>
                                        {etab.nomets}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>

                <div>
                    <Label htmlFor="niveau_id">Niveau d'études *</Label>
                    <Select
                        value={formData.niveau_id}
                        onValueChange={(value) => setFormData({ ...formData, niveau_id: value })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un niveau" />
                        </SelectTrigger>
                        <SelectContent>
                            {niveaux.length === 0 ? (
                                <SelectItem value="none" disabled>Aucun niveau disponible</SelectItem>
                            ) : (
                                niveaux.map((niveau: any) => (
                                    <SelectItem key={niveau.id} value={niveau.id.toString()}>
                                        {niveau.nomniv}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="sescnc">Session *</Label>
                    <Input
                        id="sescnc"
                        value={formData.sescnc}
                        onChange={(e) => setFormData({ ...formData, sescnc: e.target.value })}
                        placeholder="Ex: 2025-2026"
                    />
                </div>

                <div>
                    <Label htmlFor="type_concours">Type de concours *</Label>
                    <Select
                        value={formData.type_concours}
                        onValueChange={(value) => setFormData({ ...formData, type_concours: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="premiere_annee">Première année</SelectItem>
                            <SelectItem value="master">Master</SelectItem>
                            <SelectItem value="doctorat">Doctorat</SelectItem>
                            <SelectItem value="autre">Autre</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div>
                <Label htmlFor="description_concours">Description du concours</Label>
                <Textarea
                    id="description_concours"
                    value={formData.description_concours}
                    onChange={(e) => setFormData({ ...formData, description_concours: e.target.value })}
                    placeholder="Décrivez le concours..."
                    rows={4}
                />
            </div>
        </div>
    );
};

// Step 2: Dates et conditions
const Step2DatesConditions: React.FC<{
    formData: ConcoursFormData;
    setFormData: (data: ConcoursFormData) => void;
}> = ({ formData, setFormData }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="debcnc">Date de début des inscriptions *</Label>
                    <Input
                        id="debcnc"
                        type="date"
                        value={formData.debcnc}
                        onChange={(e) => setFormData({ ...formData, debcnc: e.target.value })}
                    />
                </div>

                <div>
                    <Label htmlFor="fincnc">Date de fin des inscriptions *</Label>
                    <Input
                        id="fincnc"
                        type="date"
                        value={formData.fincnc}
                        onChange={(e) => setFormData({ ...formData, fincnc: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="date_publication_resultats">Date de publication des résultats</Label>
                    <Input
                        id="date_publication_resultats"
                        type="date"
                        value={formData.date_publication_resultats}
                        onChange={(e) => setFormData({ ...formData, date_publication_resultats: e.target.value })}
                    />
                </div>

                <div>
                    <Label htmlFor="date_debut_cours">Date de début des cours</Label>
                    <Input
                        id="date_debut_cours"
                        type="date"
                        value={formData.date_debut_cours}
                        onChange={(e) => setFormData({ ...formData, date_debut_cours: e.target.value })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div>
                    <Label htmlFor="agecnc">Âge limite *</Label>
                    <Input
                        id="agecnc"
                        type="number"
                        value={formData.agecnc}
                        onChange={(e) => setFormData({ ...formData, agecnc: parseInt(e.target.value) })}
                    />
                </div>

                <div>
                    <Label htmlFor="fracnc">Frais d'inscription (FCFA) *</Label>
                    <Input
                        id="fracnc"
                        type="number"
                        value={formData.fracnc}
                        onChange={(e) => setFormData({ ...formData, fracnc: parseInt(e.target.value) })}
                        placeholder="0 pour gratuit"
                    />
                </div>

                <div>
                    <Label htmlFor="nombre_places_total">Nombre de places total</Label>
                    <Input
                        id="nombre_places_total"
                        type="number"
                        value={formData.nombre_places_total}
                        onChange={(e) => setFormData({ ...formData, nombre_places_total: parseInt(e.target.value) })}
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="duree_formation">Durée de la formation</Label>
                    <Input
                        id="duree_formation"
                        value={formData.duree_formation}
                        onChange={(e) => setFormData({ ...formData, duree_formation: e.target.value })}
                        placeholder="Ex: 3 ans"
                    />
                </div>

                <div>
                    <Label htmlFor="diplome_delivre">Diplôme délivré</Label>
                    <Input
                        id="diplome_delivre"
                        value={formData.diplome_delivre}
                        onChange={(e) => setFormData({ ...formData, diplome_delivre: e.target.value })}
                        placeholder="Ex: Licence"
                    />
                </div>
            </div>
        </div>
    );
};

// Step 3: Séries du Bac
const Step3SeriesBac: React.FC<{
    formData: ConcoursFormData;
    setFormData: (data: ConcoursFormData) => void;
}> = ({ formData, setFormData }) => {
    const toggleSerie = (serie: string) => {
        const newSeries = formData.series_bac_acceptees.includes(serie)
            ? formData.series_bac_acceptees.filter(s => s !== serie)
            : [...formData.series_bac_acceptees, serie];
        setFormData({ ...formData, series_bac_acceptees: newSeries });
    };

    return (
        <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
                Sélectionnez les séries du Baccalauréat acceptées pour ce concours de première année
            </p>
            <div className="grid grid-cols-2 gap-4">
                {SERIES_BAC.map((serie) => (
                    <div key={serie} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                         onClick={() => toggleSerie(serie)}>
                        <Checkbox
                            checked={formData.series_bac_acceptees.includes(serie)}
                            onCheckedChange={() => toggleSerie(serie)}
                        />
                        <Label className="cursor-pointer flex-1">{serie}</Label>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Step 4: Documents requis
const Step4Documents: React.FC<{
    formData: ConcoursFormData;
    setFormData: (data: ConcoursFormData) => void;
    addDocument: () => void;
    removeDocument: (index: number) => void;
}> = ({ formData, setFormData, addDocument, removeDocument }) => {
    const updateDocument = (index: number, field: string, value: any) => {
        const newDocs = [...formData.documents_requis];
        newDocs[index] = { ...newDocs[index], [field]: value };
        setFormData({ ...formData, documents_requis: newDocs });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    Documents requis pour l'inscription
                </p>
                <Button type="button" variant="outline" size="sm" onClick={addDocument}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                </Button>
            </div>

            <div className="space-y-3">
                {formData.documents_requis.map((doc, index) => (
                    <Card key={index}>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nom du document"
                                        value={doc.nom}
                                        onChange={(e) => updateDocument(index, 'nom', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => removeDocument(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Input
                                    placeholder="Description"
                                    value={doc.description}
                                    onChange={(e) => updateDocument(index, 'description', e.target.value)}
                                />
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        checked={doc.obligatoire}
                                        onCheckedChange={(checked) => updateDocument(index, 'obligatoire', checked)}
                                    />
                                    <Label>Document obligatoire</Label>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// Step 5: Critères de sélection
const Step5Criteres: React.FC<{
    formData: ConcoursFormData;
    setFormData: (data: ConcoursFormData) => void;
    addCritere: () => void;
    removeCritere: (index: number) => void;
}> = ({ formData, setFormData, addCritere, removeCritere }) => {
    const updateCritere = (index: number, field: string, value: any) => {
        const newCriteres = [...formData.criteres_selection];
        newCriteres[index] = { ...newCriteres[index], [field]: value };
        setFormData({ ...formData, criteres_selection: newCriteres });
    };

    const totalPoids = formData.criteres_selection.reduce((sum, c) => sum + c.poids, 0);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-muted-foreground">
                        Critères de sélection des candidats
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Total des poids: {totalPoids}% {totalPoids !== 100 && <span className="text-amber-600">(devrait être 100%)</span>}
                    </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addCritere}>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                </Button>
            </div>

            <div className="space-y-3">
                {formData.criteres_selection.map((critere, index) => (
                    <Card key={index}>
                        <CardContent className="pt-4">
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Nom du critère"
                                        value={critere.critere}
                                        onChange={(e) => updateCritere(index, 'critere', e.target.value)}
                                        className="flex-1"
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Poids %"
                                        value={critere.poids}
                                        onChange={(e) => updateCritere(index, 'poids', parseInt(e.target.value) || 0)}
                                        className="w-24"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        onClick={() => removeCritere(index)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                <Input
                                    placeholder="Description"
                                    value={critere.description}
                                    onChange={(e) => updateCritere(index, 'description', e.target.value)}
                                />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

// Step 6: Modalités et contacts
const Step6ModalitesContacts: React.FC<{
    formData: ConcoursFormData;
    setFormData: (data: ConcoursFormData) => void;
}> = ({ formData, setFormData }) => {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="contact_email">Email de contact</Label>
                    <Input
                        id="contact_email"
                        type="email"
                        value={formData.contact_email}
                        onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                        placeholder="contact@etablissement.ga"
                    />
                </div>

                <div>
                    <Label htmlFor="contact_telephone">Téléphone de contact</Label>
                    <Input
                        id="contact_telephone"
                        value={formData.contact_telephone}
                        onChange={(e) => setFormData({ ...formData, contact_telephone: e.target.value })}
                        placeholder="+241 XX XX XX XX"
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="lieu_examen">Lieu de l'examen</Label>
                <Input
                    id="lieu_examen"
                    value={formData.lieu_examen}
                    onChange={(e) => setFormData({ ...formData, lieu_examen: e.target.value })}
                    placeholder="Ex: Campus principal"
                />
            </div>

            <div>
                <Label htmlFor="informations_complementaires">Informations complémentaires</Label>
                <Textarea
                    id="informations_complementaires"
                    value={formData.informations_complementaires}
                    onChange={(e) => setFormData({ ...formData, informations_complementaires: e.target.value })}
                    placeholder="Toute information supplémentaire utile..."
                    rows={4}
                />
            </div>
        </div>
    );
};

export default CreateConcoursMultiStep;
