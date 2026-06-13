import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {LogIn, Search, User} from 'lucide-react';
import Layout from '@/components/Layout';
import {candidatureStateManager} from '@/services/candidatureStateManager';
import {toast} from '@/hooks/use-toast';
import IllustrationGraduate from '@/components/IllustrationGraduate';

const Connexion = () => {
    const [nupcan, setNupcan] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nupcan.trim()) {
            toast({
                title: "NUPCAN requis",
                description: "Veuillez saisir votre numéro de candidature",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);

        try {
            // Valider le format NUPCAN
            if (!candidatureStateManager.validateNupcanFormat(nupcan.trim())) {
                throw new Error('Format NUPCAN invalide');
            }

            // Essayer de récupérer la candidature
            const state = await candidatureStateManager.initializeContinueCandidature(nupcan.trim());

            toast({
                title: "Connexion réussie !",
                description: `Bienvenue ${state.candidatData?.prncan || 'candidat'}`,
            });

            // Rediriger vers le dashboard candidat
            navigate(`/dashboard/${encodeURIComponent(nupcan.trim())}`);

        } catch (error) {
            console.error('Erreur de connexion:', error);
            toast({
                title: "Erreur de connexion",
                description: "NUPCAN introuvable ou invalide. Vérifiez votre numéro de candidature.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-12">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Formulaire de connexion */}
                        <div className="space-y-8">
                            <div className="text-center lg:text-left">
                                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                                    Accédez à votre candidature
                                </h1>
                                <p className="text-xl text-muted-foreground">
                                    Saisissez votre NUPCAN pour suivre l'évolution de votre candidature
                                </p>
                            </div>

                            <Card className="shadow-lg">
                                <CardHeader>
                                    <CardTitle className="flex items-center space-x-2">
                                        <LogIn className="h-5 w-5 text-primary"/>
                                        <span>Connexion candidat</span>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div>
                                            <Label htmlFor="nupcan" className="text-base">
                                                Numéro de candidature (NUPCAN)
                                            </Label>
                                            <div className="mt-2 relative">
                                                <Input
                                                    id="nupcan"
                                                    type="text"
                                                    value={nupcan}
                                                    onChange={(e) => setNupcan(e.target.value)}
                                                    placeholder="Ex: 202578-1"
                                                    className="pl-10 text-base py-3"
                                                    disabled={isLoading}
                                                />
                                                <User
                                                    className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"/>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-2">
                                                Format: 2025moisjour-numéro (reçu par email après inscription)
                                            </p>
                                        </div>

                                        <Button
                                            type="submit"
                                            disabled={isLoading}
                                            className="w-full bg-primary hover:bg-primary/90 text-white py-3 text-base"
                                            size="lg"
                                        >
                                            {isLoading ? (
                                                <>
                                                    <Search className="h-5 w-5 mr-2 animate-spin"/>
                                                    Recherche en cours...
                                                </>
                                            ) : (
                                                <>
                                                    <LogIn className="h-5 w-5 mr-2"/>
                                                    Accéder à mon dashboard
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </CardContent>
                            </Card>

                            {/* Informations supplémentaires */}
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="pt-6">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-blue-900">
                                            Que pouvez-vous faire avec votre NUPCAN ?
                                        </h3>
                                        <ul className="space-y-2 text-blue-800">
                                            <li className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span>Suivre l'état de votre candidature en temps réel</span>
                                            </li>
                                            <li className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span>Compléter vos documents manquants</span>
                                            </li>
                                            <li className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span>Effectuer ou compléter votre paiement</span>
                                            </li>
                                            <li className="flex items-center space-x-2">
                                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                <span>Télécharger votre récapitulatif de candidature</span>
                                            </li>
                                        </ul>
                                    </div>
                                </CardContent>
                            </Card>

                            <div className="text-center">
                                <p className="text-muted-foreground">
                                    Vous n'avez pas encore de candidature ?{' '}
                                    <Button variant="link" asChild className="p-0 h-auto text-primary">
                                        <a href="/concours">Découvrir les concours disponibles</a>
                                    </Button>
                                </p>
                            </div>
                        </div>

                        {/* Illustration */}
                        <div className="hidden lg:block">
                            <div className="relative">
                                <IllustrationGraduate className="w-full h-auto max-w-lg mx-auto"/>

                                {/* Éléments décoratifs */}
                                <div
                                    className="absolute top-1/4 right-0 w-20 h-20 bg-primary/10 rounded-full blur-xl"></div>
                                <div
                                    className="absolute bottom-1/4 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-xl"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Connexion;
