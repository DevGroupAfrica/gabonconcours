import React, {useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {AlertTriangle, CheckCircle, Lock, Loader2} from 'lucide-react';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {Badge} from '@/components/ui/badge';
import {toast} from '@/hooks/use-toast';
import Layout from '@/components/Layout';
import {apiService} from '@/services/api';
import {useCandidature} from '@/hooks/useCandidature';

const DashboardCandidat = () => {
    const {nupcan} = useParams<{ nupcan: string }>();
    const navigate = useNavigate();
    const {candidatureData, isLoading, error, loadCandidature} = useCandidature();

    useEffect(() => {
        if (nupcan) {
            loadCandidature(nupcan).catch((err) => {
                console.error("Erreur lors du chargement de la candidature:", err);
                toast({
                    title: "Erreur",
                    description: "Impossible de charger les informations de candidature",
                    variant: "destructive",
                });
                navigate('/');
            });
        }
    }, [nupcan, loadCandidature, navigate]);

    const etapes = [
        {
            nom: 'inscription',
            titre: 'Inscription',
            description: 'Remplir le formulaire de candidature',
            lien: `/candidature/${candidatureData?.concours?.id}`
        },
        {
            nom: 'documents',
            titre: 'Documents',
            description: 'Soumettre les documents requis',
            lien: `/documents/continue/${encodeURIComponent(nupcan || '')}`
        },
        {
            nom: 'paiement',
            titre: 'Paiement',
            description: 'Payer les frais de candidature',
            lien: `/paiement/continue/${encodeURIComponent(nupcan || '')}`
        },
        {
            nom: 'complete',
            titre: 'Confirmation',
            description: 'Candidature complétée',
            lien: `/succes/continue/${encodeURIComponent(nupcan || '')}`
        },
    ];

    // Corrections des comparaisons de types
    const getEtapeNumero = (etape: string): number => {
        switch (etape) {
            case 'inscription':
                return 1;
            case 'documents':
                return 2;
            case 'paiement':
                return 3;
            case 'complete':
                return 4;
            default:
                return 1;
        }
    };

    const isEtapeComplete = (etapeNom: string): boolean => {
        const etapeActuelleNum = getEtapeNumero(candidatureData?.progression?.etapeActuelle || 'inscription');
        const etapeNum = getEtapeNumero(etapeNom);
        return etapeNum < etapeActuelleNum || (candidatureData?.progression?.etapesCompletes?.includes(etapeNom) || false);
    };

    const isEtapeActive = (etapeNom: string): boolean => {
        return candidatureData?.progression?.etapeActuelle === etapeNom;
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex justify-center items-center min-h-screen">
                    <div className="text-center">
                        <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto"/>
                        <p className="mt-4 text-muted-foreground">Chargement des informations...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4"/>
                        <AlertDescription>
                            Erreur lors du chargement des données: {error}
                        </AlertDescription>
                    </Alert>
                </div>
            </Layout>
        );
    }

    if (!candidatureData) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <Alert>
                        <AlertTriangle className="h-4 w-4"/>
                        <AlertDescription>
                            Aucune candidature trouvée avec ce NUPCAN.
                        </AlertDescription>
                    </Alert>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Tableau de bord Candidat
                    </h1>
                    <p className="text-muted-foreground">
                        Suivez l'état de votre candidature
                    </p>
                </div>

                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Informations Candidat</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex justify-between">
                            <span>Nom:</span>
                            <span className="font-medium">{candidatureData.candidat.nomcan}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Prénom:</span>
                            <span className="font-medium">{candidatureData.candidat.prncan}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>NUPCAN:</span>
                            <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                {candidatureData.nupcan}
              </span>
                        </div>
                        <div className="flex justify-between">
                            <span>Concours:</span>
                            <span className="font-medium">{candidatureData.concours.libcnc}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Établissement:</span>
                            <span className="font-medium">{candidatureData.concours.etablissement_nomets}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Progression de votre candidature</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {etapes.map((etape) => (
                                <div key={etape.nom} className="relative">
                                    <div
                                        className={`p-4 rounded-lg border text-center ${isEtapeComplete(etape.nom)
                                            ? 'bg-green-50 border-green-200 text-green-700'
                                            : isEtapeActive(etape.nom)
                                                ? 'bg-blue-50 border-blue-200 text-blue-700'
                                                : 'bg-muted border-muted-foreground text-muted-foreground'
                                        }`}
                                    >
                                        <h3 className="font-semibold">{etape.titre}</h3>
                                        <p className="text-sm">{etape.description}</p>
                                        {isEtapeComplete(etape.nom) && (
                                            <CheckCircle className="absolute top-2 right-2 h-4 w-4 text-green-500"/>
                                        )}
                                        {!isEtapeComplete(etape.nom) && !isEtapeActive(etape.nom) && (
                                            <Lock className="absolute top-2 right-2 h-4 w-4 text-muted-foreground"/>
                                        )}
                                    </div>
                                    {(!isEtapeComplete(etape.nom) || isEtapeActive(etape.nom)) && (
                                        <Button
                                            onClick={() => navigate(etape.lien)}
                                            variant="outline"
                                            className="w-full mt-2"
                                            disabled={!isEtapeActive(etape.nom) && !isEtapeComplete(etape.nom)}
                                        >
                                            {isEtapeComplete(etape.nom) ? 'Voir' : 'Continuer'}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default DashboardCandidat;
