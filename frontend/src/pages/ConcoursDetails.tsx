// @ts-nocheck

import React, {useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {RadioGroup, RadioGroupItem} from '@/components/ui/radio-group';
import {Label} from '@/components/ui/label';
import {Separator} from '@/components/ui/separator';
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs';
import {
    ArrowLeft, Users, BookOpen, GraduationCap, Calendar, MapPin, Clock, DollarSign,
    FileText, AlertCircle, CheckCircle, Award, Target, Info, School, Briefcase
} from 'lucide-react';
import Layout from '@/components/Layout';
import {apiService} from '@/services/api';
import {ConcoursFiliere} from '@/types/entities';

// Interfaces pour les données JSON du concours
interface DocumentRequis {
    nom: string;
    obligatoire: boolean;
    description: string;
}

interface CritereSelection {
    critere: string;
    poids: number;
    description?: string;
}

interface ModaliteInscription {
    etape: number;
    titre: string;
    description: string;
}

interface ConditionEligibilite {
    condition: string;
    obligatoire: boolean;
}

interface Matiere {
    nom_matiere: string;
    coefficient?: number;
    duree?: number;
}

const ConcoursDetails = () => {
    const {concoursId} = useParams<{ concoursId: string }>();
    const navigate = useNavigate();
    const [selectedFiliere, setSelectedFiliere] = useState<string>('');
    const [activeTab, setActiveTab] = useState('overview');

    const {data: concoursData, isLoading} = useQuery({
        queryKey: ['concours', concoursId],
        queryFn: () => apiService.getConcoursById(concoursId!),
        enabled: !!concoursId,
    });

    const {data: filieresData, isLoading: isLoadingFilieres} = useQuery({
        queryKey: ['concours-filieres', concoursId],
        queryFn: () => apiService.getConcoursFiliere(concoursId!),
        enabled: !!concoursId,
    });

    const {data: matieresData} = useQuery({
        queryKey: ['filiere-matieres', selectedFiliere],
        queryFn: () => apiService.getFiliereWithMatieres(selectedFiliere!),
        enabled: !!selectedFiliere,
    });

    const concours = concoursData?.data;
    const filieres = filieresData?.data || [];
    const matieres = matieresData?.data?.matieres || [];

    const montant = parseFloat(concours?.fracnc || 0);
    const isGratuit = montant === 0;
    
    // Déterminer si c'est un concours de première année
    const isPremiereAnnee = concours?.type_concours === 'premiere_annee';
    
    // Parser les données JSON depuis la base de données
    const seriesBacAcceptees = concours?.series_bac_acceptees ? 
        (typeof concours.series_bac_acceptees === 'string' ? 
            JSON.parse(concours.series_bac_acceptees) : 
            concours.series_bac_acceptees) : [];
    
    const documentsRequis = concours?.documents_requis ? 
        (typeof concours.documents_requis === 'string' ? 
            JSON.parse(concours.documents_requis) : 
            concours.documents_requis) : [];
    
    const critereSelection = concours?.criteres_selection ? 
        (typeof concours.criteres_selection === 'string' ? 
            JSON.parse(concours.criteres_selection) : 
            concours.criteres_selection) : [];
    
    const modalitesInscription = concours?.modalites_inscription ? 
        (typeof concours.modalites_inscription === 'string' ? 
            JSON.parse(concours.modalites_inscription) : 
            concours.modalites_inscription) : [];
    
    const conditionsEligibilite = concours?.conditions_eligibilite ? 
        (typeof concours.conditions_eligibilite === 'string' ? 
            JSON.parse(concours.conditions_eligibilite) : 
            concours.conditions_eligibilite) : [];
    
    // Calendrier du concours depuis la base de données
    const calendrier = [
        { etape: 'Ouverture des inscriptions', date: concours?.debcnc },
        { etape: 'Clôture des inscriptions', date: concours?.fincnc },
        { etape: 'Publication des résultats', date: concours?.date_publication_resultats },
        { etape: 'Début des cours', date: concours?.date_debut_cours }
    ].filter(item => item.date); // Filtrer les dates non définies

    const handleContinue = () => {
        if (selectedFiliere && concoursId) {
            navigate(`/candidature/${concoursId}/filiere/${selectedFiliere}`);
        }
    };

    const handleBack = () => {
        navigate('/concours');
    };
    
    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    if (isLoading || isLoadingFilieres) {
        return (
            <Layout>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Chargement des détails du concours...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (!concours) {
        return (
            <Layout>
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Concours introuvable</h1>
                        <Button onClick={handleBack}>Retour aux concours</Button>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        className="mb-6"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2"/>
                        Retour aux concours
                    </Button>
                </div>

                {/* En-tête du concours */}
                <Card className="mb-8">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                                    {concours.libcnc}
                                </CardTitle>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                    <span className="flex items-center">
                                        <School className="h-4 w-4 mr-1"/>
                                        {concours.etablissement_nomets}
                                    </span>
                                    <span className="flex items-center">
                                        <BookOpen className="h-4 w-4 mr-1"/>
                                        {concours.niveau_nomniv}
                                    </span>
                                    <span className="flex items-center">
                                        <Calendar className="h-4 w-4 mr-1"/>
                                        Session {concours.sescnc}
                                    </span>
                                    {isPremiereAnnee && (
                                        <Badge variant="secondary" className="flex items-center gap-1">
                                            <Award className="h-3 w-3" />
                                            Première année
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 lg:mt-0 text-right">
                                <div className="text-2xl font-bold text-primary mb-1">
                                    {isGratuit ? 'GRATUIT' : `${montant.toLocaleString()} FCFA`}
                                </div>
                                <Badge variant={isGratuit ? "secondary" : "default"} className="text-xs">
                                    {isGratuit ? 'Programme NGORI' : 'Frais d\'inscription'}
                                </Badge>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="flex items-center space-x-3">
                                <Clock className="h-5 w-5 text-primary"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">Date limite</p>
                                    <p className="font-semibold">
                                        {formatDate(concours.fincnc)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Users className="h-5 w-5 text-primary"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">Âge limite</p>
                                    <p className="font-semibold">{concours.agecnc} ans</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <MapPin className="h-5 w-5 text-primary"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">Lieu</p>
                                    <p className="font-semibold">{concours.etablissement_nomets}</p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Briefcase className="h-5 w-5 text-primary"/>
                                <div>
                                    <p className="text-sm text-muted-foreground">Filières</p>
                                    <p className="font-semibold">{filieres.length} disponible{filieres.length > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Onglets d'informations */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
                    <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
                        <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                        <TabsTrigger value="filieres">Filières</TabsTrigger>
                        <TabsTrigger value="documents">Documents</TabsTrigger>
                        <TabsTrigger value="criteres">Critères</TabsTrigger>
                        <TabsTrigger value="calendrier">Calendrier</TabsTrigger>
                    </TabsList>

                    {/* Onglet Vue d'ensemble */}
                    <TabsContent value="overview" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Info className="h-5 w-5" />
                                    Informations générales
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                            <School className="h-4 w-4 text-primary" />
                                            Établissement
                                        </h4>
                                        <p className="text-muted-foreground">{concours.etablissement_nomets}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                            <GraduationCap className="h-4 w-4 text-primary" />
                                            Niveau d'études
                                        </h4>
                                        <p className="text-muted-foreground">{concours.niveau_nomniv}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            Session
                                        </h4>
                                        <p className="text-muted-foreground">{concours.sescnc}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                                            <DollarSign className="h-4 w-4 text-primary" />
                                            Frais d'inscription
                                        </h4>
                                        <p className="text-muted-foreground font-semibold">
                                            {isGratuit ? 'GRATUIT (Programme NGORI)' : `${montant.toLocaleString()} FCFA`}
                                        </p>
                                    </div>
                                </div>

                                {isPremiereAnnee && seriesBacAcceptees && seriesBacAcceptees.length > 0 && (
                                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                                        <h4 className="font-semibold mb-3 flex items-center gap-2">
                                            <Award className="h-4 w-4 text-blue-600" />
                                            Séries du Baccalauréat acceptées
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {seriesBacAcceptees.map((serie: string, index: number) => (
                                                <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-700">
                                                    {serie}
                                                </Badge>
                                            ))}
                                        </div>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Vous devez avoir obtenu votre Baccalauréat dans l'une de ces séries pour être éligible.
                                        </p>
                                    </div>
                                )}

                                <div className="mt-6">
                                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                                        <Target className="h-4 w-4 text-primary" />
                                        Modalités d'inscription
                                    </h4>
                                    {modalitesInscription && modalitesInscription.length > 0 ? (
                                        <ol className="space-y-2">
                                            {modalitesInscription.map((modalite: ModaliteInscription, index: number) => (
                                                <li key={index} className="flex items-start gap-3">
                                                    <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                                                        {modalite.etape || index + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium">{modalite.titre}</p>
                                                        <p className="text-sm text-muted-foreground">{modalite.description}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <p className="text-muted-foreground">Aucune modalité d'inscription définie</p>
                                    )}
                                </div>

                                {concours.description_concours && (
                                    <div className="mt-6">
                                        <h4 className="font-semibold mb-2">Description</h4>
                                        <p className="text-muted-foreground">{concours.description_concours}</p>
                                    </div>
                                )}

                                {concours.duree_formation && (
                                    <div className="mt-4">
                                        <h4 className="font-semibold mb-2">Durée de la formation</h4>
                                        <p className="text-muted-foreground">{concours.duree_formation}</p>
                                    </div>
                                )}

                                {concours.diplome_delivre && (
                                    <div className="mt-4">
                                        <h4 className="font-semibold mb-2">Diplôme délivré</h4>
                                        <p className="text-muted-foreground">{concours.diplome_delivre}</p>
                                    </div>
                                )}

                                {concours.informations_complementaires && (
                                    <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                                        <h4 className="font-semibold mb-2">Informations complémentaires</h4>
                                        <p className="text-sm text-muted-foreground whitespace-pre-line">
                                            {concours.informations_complementaires}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Onglet Filières */}
                    <TabsContent value="filieres" className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <BookOpen className="h-5 w-5 mr-2"/>
                                        Filières disponibles ({filieres.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {filieres.length > 0 ? (
                                        <RadioGroup
                                            value={selectedFiliere}
                                            onValueChange={setSelectedFiliere}
                                            className="space-y-4"
                                        >
                                            {filieres.map((filiere: ConcoursFiliere) => (
                                                <div key={filiere.id}
                                                     className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                                                    <RadioGroupItem
                                                        value={filiere.filiere_id.toString()}
                                                        id={`filiere-${filiere.id}`}
                                                        className="mt-1"
                                                    />
                                                    <Label
                                                        htmlFor={`filiere-${filiere.id}`}
                                                        className="flex-1 cursor-pointer"
                                                    >
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-start">
                                                                <h3 className="font-semibold text-lg">{filiere.nomfil}</h3>
                                                                <Badge variant="outline" className="flex items-center ml-2">
                                                                    <Users className="h-3 w-3 mr-1"/>
                                                                    {filiere.places_disponibles} places
                                                                </Badge>
                                                            </div>
                                                            {filiere.description && (
                                                                <p className="text-muted-foreground text-sm">{filiere.description}</p>
                                                            )}
                                                        </div>
                                                    </Label>
                                                </div>
                                            ))}
                                        </RadioGroup>
                                    ) : (
                                        <div className="text-center py-8">
                                            <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                                            <h3 className="text-lg font-semibold mb-2">Aucune filière disponible</h3>
                                            <p className="text-muted-foreground">
                                                Ce concours n'a pas encore de filières configurées.
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center">
                                        <GraduationCap className="h-5 w-5 mr-2"/>
                                        Matières à étudier
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedFiliere ? (
                                        matieres.length > 0 ? (
                                            <div className="space-y-3">
                                                {matieres.map((matiere: Matiere, index: number) => (
                                                    <div key={index}
                                                         className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                                        <div className="flex items-center space-x-3">
                                                            <div
                                                                className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                                <span
                                                                    className="text-primary font-semibold text-sm">{index + 1}</span>
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium">{matiere.nom_matiere}</h4>
                                                                {matiere.coefficient && (
                                                                    <p className="text-sm text-muted-foreground">
                                                                        Coefficient: {matiere.coefficient}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {matiere.duree && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                {matiere.duree}h
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
                                                <p className="text-muted-foreground">
                                                    Aucune matière définie pour cette filière
                                                </p>
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center py-8">
                                            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-3"/>
                                            <p className="text-muted-foreground">
                                                Sélectionnez une filière pour voir les matières
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Onglet Documents */}
                    <TabsContent value="documents">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Documents requis
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {documentsRequis && documentsRequis.length > 0 ? (
                                    <>
                                        <div className="space-y-3">
                                            {documentsRequis.map((doc: DocumentRequis, index: number) => (
                                                <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                                                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-medium">{doc.nom}</p>
                                                            {doc.obligatoire && (
                                                                <Badge variant="destructive" className="text-xs">Obligatoire</Badge>
                                                            )}
                                                        </div>
                                                        {doc.description && (
                                                            <p className="text-sm text-muted-foreground mt-1">
                                                                {doc.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                                            <div className="flex items-start gap-3">
                                                <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <h4 className="font-semibold text-amber-900 dark:text-amber-100 mb-1">
                                                        Important
                                                    </h4>
                                                    <p className="text-sm text-amber-800 dark:text-amber-200">
                                                        Tous les documents doivent être scannés en format PDF ou image (JPG, PNG). 
                                                        Assurez-vous que les documents sont lisibles et de bonne qualité.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                                        <p className="text-muted-foreground">
                                            Aucun document requis défini pour ce concours
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Onglet Critères */}
                    <TabsContent value="criteres">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Target className="h-5 w-5" />
                                    Critères de sélection
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {critereSelection && critereSelection.length > 0 ? (
                                    <>
                                        <div className="space-y-4">
                                            {critereSelection.map((critere: CritereSelection, index: number) => (
                                                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                                                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <span className="text-primary font-semibold text-sm">{index + 1}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <h4 className="font-semibold">{critere.critere}</h4>
                                                            {critere.poids && (
                                                                <Badge variant="secondary">{critere.poids}%</Badge>
                                                            )}
                                                        </div>
                                                        {critere.description && (
                                                            <p className="text-sm text-muted-foreground">
                                                                {critere.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
                                            <h4 className="font-semibold mb-2 flex items-center gap-2">
                                                <Info className="h-4 w-4 text-blue-600" />
                                                Conditions d'éligibilité
                                            </h4>
                                            {conditionsEligibilite && conditionsEligibilite.length > 0 ? (
                                                <ul className="space-y-2 text-sm text-muted-foreground">
                                                    {conditionsEligibilite.map((condition: ConditionEligibilite, index: number) => (
                                                        <li key={index} className="flex items-start gap-2">
                                                            <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                                            <span>{condition.condition}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <ul className="space-y-2 text-sm text-muted-foreground">
                                                    <li className="flex items-start gap-2">
                                                        <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                                        <span>Être de nationalité gabonaise</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                                        <span>Avoir au maximum {concours.agecnc} ans à la date de clôture</span>
                                                    </li>
                                                    <li className="flex items-start gap-2">
                                                        <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                                        <span>Être titulaire du diplôme requis ({concours.niveau_nomniv})</span>
                                                    </li>
                                                    {isPremiereAnnee && seriesBacAcceptees.length > 0 && (
                                                        <li className="flex items-start gap-2">
                                                            <CheckCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                                            <span>Avoir obtenu le Baccalauréat dans une série acceptée</span>
                                                        </li>
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                                        <p className="text-muted-foreground">
                                            Aucun critère de sélection défini pour ce concours
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Onglet Calendrier */}
                    <TabsContent value="calendrier">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5" />
                                    Calendrier du concours
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {calendrier && calendrier.length > 0 ? (
                                    <>
                                        <div className="space-y-4">
                                            {calendrier.map((item, index) => (
                                                <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                                                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                                        <Clock className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h4 className="font-semibold mb-1">{item.etape}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {item.date ? formatDate(item.date) : 'Date à déterminer'}
                                                        </p>
                                                    </div>
                                                    {index === 0 && new Date(item.date) <= new Date() && new Date(calendrier[1]?.date) >= new Date() && (
                                                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                                                            En cours
                                                        </Badge>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        {(concours.lieu_examen || concours.contact_email || concours.contact_telephone) && (
                                            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                                                <h4 className="font-semibold mb-3">Informations de contact</h4>
                                                <div className="space-y-2 text-sm">
                                                    {concours.lieu_examen && (
                                                        <div className="flex items-center gap-2">
                                                            <MapPin className="h-4 w-4 text-primary" />
                                                            <span><strong>Lieu:</strong> {concours.lieu_examen}</span>
                                                        </div>
                                                    )}
                                                    {concours.contact_email && (
                                                        <div className="flex items-center gap-2">
                                                            <FileText className="h-4 w-4 text-primary" />
                                                            <span><strong>Email:</strong> {concours.contact_email}</span>
                                                        </div>
                                                    )}
                                                    {concours.contact_telephone && (
                                                        <div className="flex items-center gap-2">
                                                            <Users className="h-4 w-4 text-primary" />
                                                            <span><strong>Téléphone:</strong> {concours.contact_telephone}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center py-8">
                                        <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                                        <p className="text-muted-foreground">
                                            Aucune information de calendrier disponible
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Bouton de continuation */}
                <div className="text-center mt-8">
                    <Separator className="mb-6"/>
                    <Button
                        onClick={handleContinue}
                        disabled={!selectedFiliere}
                        size="lg"
                        className="bg-primary hover:bg-primary/90 px-8"
                    >
                        Continuer l'inscription
                    </Button>
                    {!selectedFiliere && (
                        <p className="text-sm text-muted-foreground mt-2">
                            Veuillez sélectionner une filière pour continuer
                        </p>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ConcoursDetails;
