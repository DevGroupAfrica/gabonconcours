import React, {useEffect, useState} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {CheckCircle, Home, FileText, User, Download} from 'lucide-react';
import Layout from '@/components/Layout';
import {useCandidature} from '@/hooks/useCandidature';
import RecuCandidature from '@/components/RecuCandidature';
import {toast} from '@/hooks/use-toast';

const SuccesContinue = () => {
    const {nupcan} = useParams();
    const navigate = useNavigate();
    const {candidatureData, isLoading, error, loadCandidature} = useCandidature();
    const [showRecu, setShowRecu] = useState(false);

    const decodedNupcan = decodeURIComponent(nupcan || '');

    useEffect(() => {
        if (decodedNupcan) {
            loadCandidature(decodedNupcan).catch((err) => {
                console.error("Erreur lors du chargement:", err);
                navigate('/connexion');
            });
        }
    }, [decodedNupcan, loadCandidature, navigate]);

    const handleRetourStatut = () => {
        navigate(`/dashboard/${encodeURIComponent(decodedNupcan)}`);
    };

    const handleVoirRecu = () => {
        setShowRecu(true);
    };

    const handleDownload = () => {
        // Trigger download from RecuCandidature component
        toast({
            title: "Téléchargement",
            description: "Votre reçu est en cours de téléchargement",
        });
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Finalisation de votre candidature...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error || !candidatureData) {
        return (
            <Layout>
                <div className="max-w-4xl mx-auto px-4 py-12">
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6 text-center">
                            <p className="text-red-600">Erreur lors du chargement des données</p>
                            <Button onClick={() => navigate('/connexion')} className="mt-4">
                                Retour à l'accueil
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        );
    }

    if (showRecu) {
        return (
            <Layout>
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="mb-4">
                        <Button
                            onClick={() => setShowRecu(false)}
                            variant="outline"
                            className="print:hidden"
                        >
                            ← Retour
                        </Button>
                    </div>
                    <RecuCandidature
                        candidatureData={candidatureData}
                        onDownload={handleDownload}
                    />
                </div>
            </Layout>
        );
    }

    const montant = parseFloat(candidatureData.concours.fracnc);
    const isGratuit = montant === 0;

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6">
                        <CheckCircle className="h-12 w-12 text-green-500"/>
                    </div>
                    <h1 className="text-4xl font-bold gradient-text mb-4">
                        Candidature Finalisée !
                    </h1>
                    <p className="text-xl text-muted-foreground mb-2">
                        {isGratuit
                            ? 'Félicitations, votre candidature gratuite est maintenant complète'
                            : 'Félicitations, votre candidature est maintenant complète'
                        }
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Numéro de candidature: <span className="font-mono font-semibold">{decodedNupcan}</span>
                    </p>
                </div>

                {/* Récapitulatif final */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Récapitulatif Final</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <User className="h-8 w-8 mx-auto mb-2 text-green-500"/>
                                <h3 className="font-semibold text-green-700">Inscription</h3>
                                <p className="text-sm text-green-600">Complétée</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <FileText className="h-8 w-8 mx-auto mb-2 text-green-500"/>
                                <h3 className="font-semibold text-green-700">Documents</h3>
                                <p className="text-sm text-green-600">Uploadés</p>
                            </div>
                            <div className="text-center p-4 bg-green-50 rounded-lg">
                                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500"/>
                                <h3 className="font-semibold text-green-700">
                                    {isGratuit ? 'Inscription' : 'Paiement'}
                                </h3>
                                <p className="text-sm text-green-600">
                                    {isGratuit ? 'Gratuite' : 'Effectué'}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Informations candidat */}
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Vos Informations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Nom complet</p>
                                <p className=" высказать font-semibold">
                                    {candidatureData.candidat.prncan} {candidatureData.candidat.nomcan}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-semibold">{candidatureData.candidat.maican}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Concours</p>
                                <p className="font-semibold">{candidatureData.concours.libcnc}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Frais</p>
                                <p className={`font-semibold ${isGratuit ? 'text-green-600' : 'text-primary'}`}>
                                    {isGratuit ? 'GRATUIT' : `${montant.toLocaleString()} FCFA`}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="text-center space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button onClick={handleVoirRecu} size="lg" className="bg-primary hover:bg-primary/90">
                            <Download className="h-4 w-4 mr-2"/>
                            Générer mon reçu de candidature
                        </Button>
                        <Button onClick={handleRetourStatut} variant="outline" size="lg">
                            Voir le tableau de bord
                        </Button>
                    </div>
                    <Button variant="outline" onClick={() => navigate('/concours')} size="lg">
                        <Home className="h-4 w-4 mr-2"/>
                        Voir d'autres concours
                    </Button>
                </div>

                {/* Prochaines étapes */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Prochaines Étapes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <div className="flex items-start space-x-3">
                                <div
                                    className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">1
                                </div>
                                <div>
                                    <p className="font-semibold">Vérification des documents</p>
                                    <p className="text-sm text-muted-foreground">
                                        Nos équipes vont vérifier vos documents dans les 48h
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div
                                    className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">2
                                </div>
                                <div>
                                    <p className="font-semibold">Confirmation d'inscription</p>
                                    <p className="text-sm text-muted-foreground">
                                        Vous recevrez un email de confirmation
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-3">
                                <div
                                    className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">3
                                </div>
                                <div>
                                    <p className="font-semibold">Informations sur le concours</p>
                                    <p className="text-sm text-muted-foreground">
                                        Détails sur les dates et modalités du concours
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default SuccesContinue;