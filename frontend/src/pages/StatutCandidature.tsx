import React from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Progress} from '@/components/ui/progress';
import {
    CheckCircle,
    Clock,
    FileText,
    CreditCard,
    User,
    AlertCircle,
    Download,
    GraduationCap,
    BookOpen,
    Trophy
} from 'lucide-react';
import Layout from '@/components/Layout';
import {candidatureService} from '@/services/candidatureService';
import {routeManager} from '@/services/routeManager';

const StatutCandidature = () => {
    const {nupcan} = useParams<{ nupcan: string }>();
    const navigate = useNavigate();

    const {data: candidatureData, isLoading, error} = useQuery({
        queryKey: ['candidature-statut', nupcan],
        queryFn: () => candidatureService.getCandidatureByNupcan(nupcan!),
        enabled: !!nupcan,
        retry: 2,
        refetchInterval: 30000, // Actualiser toutes les 30 secondes
    });

    if (isLoading) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Chargement de votre candidature...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error || !candidatureData) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4"/>
                        <h1 className="text-2xl font-bold text-red-600 mb-4">Candidature non trouvée</h1>
                        <p className="text-muted-foreground mb-6">
                            {error ? 'Erreur lors du chargement des données' : `Aucune candidature trouvée avec le numéro : ${nupcan}`}
                        </p>
                        <div className="space-x-4">
                            <Button onClick={() => navigate('/connexion')}>
                                Réessayer la connexion
                            </Button>
                            <Button variant="outline" onClick={() => navigate('/concours')}>
                                Voir les concours
                            </Button>
                        </div>
                    </div>
                </div>
            </Layout>
        );
    }

    const {candidat, concours, filiere, documents, paiement, progression} = candidatureData;

    const etapes = [
        {
            id: 'inscription',
            nom: 'Inscription',
            statut: progression.etapesCompletes.includes('inscription') ? 'termine' :
                progression.etapeActuelle === 'inscription' ? 'en-cours' : 'attente',
            icone: User,
            description: 'Informations personnelles enregistrées'
        },
        {
            id: 'documents',
            nom: 'Documents',
            statut: progression.etapesCompletes.includes('documents') ? 'termine' :
                progression.etapeActuelle === 'documents' ? 'en-cours' : 'attente',
            icone: FileText,
            description: `Upload des documents requis (${documents.length} soumis)`
        },
        {
            id: 'paiement',
            nom: 'Paiement',
            statut: progression.etapesCompletes.includes('paiement') ? 'termine' :
                progression.etapeActuelle === 'paiement' ? 'en-cours' : 'attente',
            icone: CreditCard,
            description: 'Paiement des frais de candidature'
        }
    ];

    const getStatutColor = (statut: string) => {
        switch (statut) {
            case 'termine':
                return 'bg-green-500';
            case 'en-cours':
                return 'bg-blue-500';
            default:
                return 'bg-gray-300';
        }
    };

    const getStatutBadge = (statut: string) => {
        switch (statut) {
            case 'termine':
                return <Badge className="bg-green-500 text-white">Terminé</Badge>;
            case 'en-cours':
                return <Badge className="bg-blue-500 text-white">En cours</Badge>;
            default:
                return <Badge variant="secondary">En attente</Badge>;
        }
    };

    const getStatutGlobal = () => {
        switch (progression.etapeActuelle) {
            case 'complete':
                return {label: 'Candidature complète', color: 'text-green-600', bg: 'bg-green-50'};
            case 'paiement':
                return {label: 'Prêt pour le paiement', color: 'text-blue-600', bg: 'bg-blue-50'};
            case 'documents':
                return {label: 'Upload de documents', color: 'text-orange-600', bg: 'bg-orange-50'};
            default:
                return {label: 'Inscription en cours', color: 'text-gray-600', bg: 'bg-gray-50'};
        }
    };

    const continuerCandidature = () => {
        if (progression.etapeActuelle === 'documents') {
            const documentsUrl = routeManager.getDocumentsUrl({nupcan: nupcan!});
            navigate(documentsUrl);
        } else if (progression.etapeActuelle === 'paiement') {
            const paiementUrl = routeManager.getPaiementUrl({nupcan: nupcan!});
            navigate(paiementUrl);
        }
    };

    const statutGlobal = getStatutGlobal();

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        État de votre candidature
                    </h1>
                    <p className="text-muted-foreground mb-4">
                        Numéro de candidature : <span className="font-mono font-semibold">{nupcan}</span>
                    </p>
                    <div className={`inline-flex items-center px-4 py-2 rounded-lg ${statutGlobal.bg}`}>
            <span className={`font-medium ${statutGlobal.color}`}>
              Statut : {statutGlobal.label}
            </span>
                    </div>
                </div>

                {/* Barre de progression synchronisée */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Progression de votre candidature</span>
                                <span>{progression.pourcentage}%</span>
                            </div>
                            <Progress value={progression.pourcentage} className="w-full"/>
                            <p className="text-xs text-muted-foreground">
                                {progression.etapesCompletes.length} sur 3 étapes terminées
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Informations du candidat */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <User className="h-5 w-5"/>
                            <span>Vos informations</span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Nom complet</p>
                                <p className="font-semibold">{candidat.prncan} {candidat.nomcan}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-semibold">{candidat.maican}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Téléphone</p>
                                <p className="font-semibold">{candidat.telcan}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Date de naissance</p>
                                <p className="font-semibold">{new Date(candidat.dtncan).toLocaleDateString('fr-FR')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Concours et Filière */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Trophy className="h-5 w-5"/>
                                <span>Concours</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Concours</p>
                                <p className="font-semibold">{concours.libcnc}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Établissement</p>
                                <p className="font-semibold">{concours.etablissement_nomets}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Session</p>
                                <p className="font-semibold">{concours.sescnc}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {filiere && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    <GraduationCap className="h-5 w-5"/>
                                    <span>Filière</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm text-muted-foreground">Filière choisie</p>
                                    <p className="font-semibold">{filiere.nomfil}</p>
                                </div>
                                {filiere.description && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Description</p>
                                        <p className="text-sm">{filiere.description}</p>
                                    </div>
                                )}
                                {filiere.matieres && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Matières</p>
                                        <p className="font-semibold">{filiere.matieres.length} matières</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Matières détaillées */}
                {filiere && filiere.matieres && filiere.matieres.length > 0 && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <BookOpen className="h-5 w-5"/>
                                <span>Matières d'étude</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {filiere.matieres.map((matiere: any, index: number) => (
                                    <div key={index}
                                         className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                <span className="text-primary font-semibold text-sm">{index + 1}</span>
                                            </div>
                                            <div>
                                                <h4 className="font-medium">{matiere.nom_matiere}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Coefficient: {matiere.coefficient}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            {matiere.duree && (
                                                <Badge variant="secondary" className="text-xs">
                                                    {matiere.duree}h
                                                </Badge>
                                            )}
                                            {matiere.obligatoire && (
                                                <Badge variant="destructive" className="text-xs">
                                                    Obligatoire
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Documents soumis */}
                {documents && documents.length > 0 && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <FileText className="h-5 w-5"/>
                                <span>Documents soumis</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {documents.map((doc: any) => (
                                    <div key={doc.id}
                                         className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex-1">
                                            <p className="font-medium">{doc.type || doc.type_document}</p>
                                            <p className="text-sm text-muted-foreground">{doc.nom_fichier}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge
                                                variant={doc.statut === 'valide' ? 'default' : doc.statut === 'rejete' ? 'destructive' : 'secondary'}>
                                                {doc.statut}
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => window.open(`/api/documents/${doc.id}/download`, '_blank')}
                                            >
                                                <Download className="h-4 w-4"/>
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Informations de paiement */}
                {paiement && (
                    <Card className="mb-8">
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <CreditCard className="h-5 w-5"/>
                                <span>Paiement</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-muted-foreground">Statut</p>
                                    <Badge variant={paiement.statut === 'valide' ? 'default' : 'secondary'}>
                                        {paiement.statut}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Montant</p>
                                    <p className="font-semibold">{paiement.montant} FCFA</p>
                                </div>
                                {paiement.methode && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Méthode</p>
                                        <p className="font-semibold">{paiement.methode}</p>
                                    </div>
                                )}
                                {paiement.date_paiement && (
                                    <div>
                                        <p className="text-sm text-muted-foreground">Date de paiement</p>
                                        <p className="font-semibold">
                                            {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Progression détaillée */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Étapes de votre candidature</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            {etapes.map((etape) => {
                                const Icone = etape.icone;
                                return (
                                    <div key={etape.id} className="flex items-center space-x-4">
                                        <div
                                            className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatutColor(etape.statut)}`}>
                                            {etape.statut === 'termine' ? (
                                                <CheckCircle className="h-6 w-6 text-white"/>
                                            ) : etape.statut === 'en-cours' ? (
                                                <Clock className="h-6 w-6 text-white"/>
                                            ) : (
                                                <Icone className="h-6 w-6 text-white"/>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between">
                                                <h3 className="font-semibold">{etape.nom}</h3>
                                                {getStatutBadge(etape.statut)}
                                            </div>
                                            <p className="text-sm text-muted-foreground">{etape.description}</p>
                                            {etape.statut === 'en-cours' && (
                                                <p className="text-sm text-blue-600 font-medium mt-1">
                                                    Étape en cours - Cliquez sur "Continuer" ci-dessous
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="text-center space-x-4">
                    <Button
                        onClick={continuerCandidature}
                        className="bg-primary hover:bg-primary/90"
                        disabled={progression.etapeActuelle === 'complete'}
                        size="lg"
                    >
                        {progression.etapeActuelle === 'documents' && 'Continuer - Upload documents'}
                        {progression.etapeActuelle === 'paiement' && 'Continuer - Effectuer le paiement'}
                        {progression.etapeActuelle === 'complete' && 'Candidature terminée'}
                        {progression.etapeActuelle === 'inscription' && 'Candidature en cours'}
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate('/concours')}
                        size="lg"
                    >
                        Voir les autres concours
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => navigate(`/dashboard/${nupcan}`)}
                        size="lg"
                    >
                        <User className="h-4 w-4 mr-2"/>
                        Tableau de bord
                    </Button>
                </div>
            </div>
        </Layout>
    );
};

export default StatutCandidature;
