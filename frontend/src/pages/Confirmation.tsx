import React, {useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {CheckCircle, ArrowRight, AlertTriangle, FileText, DollarSign, Bookmark} from 'lucide-react';
import Layout from '@/components/Layout';
import {useCandidature} from '@/hooks/useCandidature';

const Confirmation = () => {
    const {numeroCandidature} = useParams<{ numeroCandidature: string }>();
    const navigate = useNavigate();
    const {candidatureData, isLoading, error, loadCandidature} = useCandidature();

    useEffect(() => {
        if (numeroCandidature) {
            loadCandidature(numeroCandidature);
        }
    }, [numeroCandidature, loadCandidature]);

    const handleContinuerVersDocuments = () => {
        navigate(`/documents/${encodeURIComponent(numeroCandidature)}`);
    };

    // Gestion des états de chargement et d'erreur (inchangée)
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
                    <Card className="border-red-200 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="text-center">
                                <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4"/>
                                <h2 className="text-xl font-bold text-red-700 mb-2">Erreur de chargement</h2>
                                <p className="text-red-600 mb-4">{error || 'Candidature introuvable'}</p>
                                <Button onClick={() => navigate('/concours')} variant="outline">
                                    Retour aux concours
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* En-tête de succès centré */}
                <div className="text-center mb-10">
                    <div
                        className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-6 border-4 border-green-200">
                        <CheckCircle className="h-10 w-10 text-green-700"/>
                    </div>
                    <h1 className="text-4xl font-extrabold text-foreground mb-2">
                        Candidature Enregistrée
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        Votre dossier a été créé avec le numéro de candidature ci-dessous.
                    </p>
                </div>

                {/* STRUCTURE BICOLONNE (2/3 à gauche, 1/3 à droite) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* COLONNE GAUCHE (2/3): DÉTAILS & PROGRESSION */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* 1. Informations de candidature */}
                        <Card>
                            <CardHeader className="border-b">
                                <CardTitle className="text-2xl font-semibold text-primary">Détails
                                    Personnels</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-4">
                                    <div className="md:col-span-2 grid gap-4 border-b pb-6 sm:grid-cols-2">
                                        <div className="rounded-md bg-primary/10 p-4">
                                            <p className="text-xs font-bold uppercase tracking-wider text-primary">Votre NIP personnel</p>
                                            <p className="mt-2 font-mono text-2xl font-extrabold tracking-wider text-primary">
                                                {candidatureData.candidat.nipcan}
                                            </p>
                                            <p className="mt-2 text-xs text-muted-foreground">Identifiant permanent à conserver.</p>
                                        </div>
                                        <div className="rounded-md bg-slate-50 p-4">
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Numéro de candidature</p>
                                            <p className="mt-2 font-mono text-xl font-bold tracking-wider text-slate-800">{candidatureData.nupcan}</p>
                                            <p className="mt-2 text-xs text-muted-foreground">Identifiant propre à ce concours.</p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm text-muted-foreground">Nom et Prénom</p>
                                        <p className="font-semibold text-base">{candidatureData.candidat.prncan} {candidatureData.candidat.nomcan}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Téléphone</p>
                                        <p className="font-semibold text-base">{candidatureData.candidat.telcan}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <p className="text-sm text-muted-foreground">Email</p>
                                        <p className="font-semibold text-base">{candidatureData.candidat.maican}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 2. Progression de la candidature (Timeline Simplifiée) */}
                        <Card>
                            <CardHeader className="border-b">
                                <CardTitle className="text-xl font-semibold">Prochaines Étapes</CardTitle>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="space-y-4">

                                    {/* Étape 1: Complétée */}
                                    <div className="flex items-center space-x-3 text-green-700">
                                        <CheckCircle className="h-6 w-6 flex-shrink-0"/>
                                        <span className="font-medium text-lg">1. Inscription Complète</span>
                                    </div>

                                    {/* Séparateur pour l'étape actuelle */}
                                    <div className="h-6 ml-3 w-0.5 bg-gray-200"></div>

                                    {/* Étape 2: Actuelle / Prochaine */}
                                    <div
                                        className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-800">
                                        <FileText className="h-6 w-6 flex-shrink-0"/>
                                        <span className="font-bold text-lg">2. Soumission des Documents</span>
                                    </div>

                                    {/* Séparateur pour l'étape future */}
                                    <div className="h-6 ml-3 w-0.5 bg-gray-200"></div>

                                    {/* Étape 3: Future */}
                                    <div className="flex items-center space-x-3 opacity-60 text-muted-foreground">
                                        <DollarSign className="h-6 w-6 flex-shrink-0"/>
                                        <span className="font-medium text-lg">3. Paiement des Frais</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 3. Actions */}
                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            <Button
                                onClick={handleContinuerVersDocuments}
                                className="bg-primary hover:bg-primary/90 shadow-md transition"
                                size="lg"
                            >
                                Continuer vers les Documents
                                <ArrowRight className="ml-2 h-5 w-5"/>
                            </Button>

                            <Button
                                variant="outline"
                                onClick={() => navigate('/concours')}
                                size="lg"
                            >
                                Retourner à la liste
                            </Button>
                        </div>
                    </div>

                    {/* COLONNE DROITE (1/3): RÉSUMÉ CONCOURS & ALERTE */}
                    <div className="lg:col-span-1 space-y-6">

                        {/* 4. Informations du concours (Résumé en colonne) */}
                        <Card className="bg-primary/5 border-primary/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-xl flex items-center gap-2 text-primary">
                                    <Bookmark className="h-5 w-5"/> Concours Sélectionné
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm pt-4">
                                <p className="font-extrabold text-base text-primary/90">{candidatureData.concours.libcnc}</p>
                                <div className="pt-2 border-t border-primary/10 space-y-1">
                                    <p className="text-muted-foreground">Établissement:</p>
                                    <p className="font-semibold">{candidatureData.concours.etablissement_nomets}</p>
                                </div>
                                <div className="pt-2 border-t border-primary/10 space-y-1">
                                    <p className="text-muted-foreground">Session:</p>
                                    <p className="font-semibold">{candidatureData.concours.sescnc}</p>
                                </div>
                                <div className="pt-2 border-t border-primary/10">
                                    <p className="text-lg font-bold text-green-700">
                                        Frais: {candidatureData.concours.fracnc} FCFA
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* 5. Information importante (Alerte Visuelle) */}
                        <Card className="bg-amber-50 border-amber-300 shadow-lg">
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto mb-2"/>
                                    <h3 className="font-extrabold text-amber-800 mb-2">NOTE IMPORTANTE</h3>
                                    <p className="text-amber-700 text-sm">
                                        <strong>Conservez précieusement votre NIP.</strong> Il vous permettra de
                                        retrouver votre espace candidat et vos candidatures.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Confirmation;
