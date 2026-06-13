import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Target, Award, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';

const APropos = () => {
    const navigate = useNavigate();

    const stats = [
        { value: "10,000+", label: "Candidats inscrits", icon: Users },
        { value: "50+", label: "Établissements partenaires", icon: Target },
        { value: "95%", label: "Taux de satisfaction", icon: Award }
    ];

    const features = [
        "Inscription en ligne simplifiée et sécurisée",
        "Suivi en temps réel de votre candidature",
        "Gestion numérique des documents",
        "Paiement en ligne sécurisé",
        "Messagerie directe avec l'administration",
        "Consultation des résultats en ligne"
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
            <Header />
            
            <div className="container mx-auto px-4 py-12 space-y-16">
                {/* Hero Section */}
                <div className="text-center space-y-6 animate-fade-in">
                    <h1 className="text-5xl font-bold gradient-text">
                        À Propos de GabConcours
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        La plateforme digitale de référence pour les concours d'entrée 
                        dans les établissements d'enseignement supérieur au Gabon
                    </p>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {stats.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <Card 
                                key={index}
                                className="hover-scale border-2 hover:border-primary/50 transition-all duration-300 animate-fade-in"
                                style={{ animationDelay: `${index * 0.1}s` }}
                            >
                                <CardContent className="p-8 text-center space-y-4">
                                    <Icon className="h-12 w-12 mx-auto text-primary" />
                                    <div className="text-4xl font-bold gradient-text">
                                        {stat.value}
                                    </div>
                                    <p className="text-muted-foreground font-medium">
                                        {stat.label}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>

                {/* Mission Section */}
                <Card className="border-2 animate-fade-in">
                    <CardContent className="p-10 space-y-6">
                        <div className="flex items-center gap-3 mb-6">
                            <Target className="h-10 w-10 text-primary" />
                            <h2 className="text-3xl font-bold">Notre Mission</h2>
                        </div>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            GabConcours digitalise et simplifie le processus de candidature aux concours 
                            d'entrée dans les établissements d'enseignement supérieur. Notre plateforme 
                            offre une expérience fluide, transparente et efficace pour les candidats et 
                            les établissements.
                        </p>
                        <p className="text-lg text-muted-foreground leading-relaxed">
                            Nous croyons en l'égalité des chances et facilitons l'accès à l'éducation 
                            supérieure en supprimant les barrières géographiques et administratives.
                        </p>
                    </CardContent>
                </Card>

                {/* Features Section */}
                <div className="space-y-8">
                    <h2 className="text-3xl font-bold text-center">
                        Fonctionnalités de la Plateforme
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {features.map((feature, index) => (
                            <Card 
                                key={index}
                                className="hover-scale transition-all duration-300 animate-fade-in"
                                style={{ animationDelay: `${index * 0.05}s` }}
                            >
                                <CardContent className="p-6 flex items-start gap-4">
                                    <CheckCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                                    <p className="text-lg">{feature}</p>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                {/* CTA Section */}
                <Card className="gradient-bg text-white animate-fade-in">
                    <CardContent className="p-12 text-center space-y-6">
                        <h2 className="text-3xl font-bold">
                            Prêt à commencer votre candidature ?
                        </h2>
                        <p className="text-lg opacity-90 max-w-2xl mx-auto">
                            Rejoignez des milliers de candidats qui font confiance à GabConcours 
                            pour leur inscription aux concours
                        </p>
                        <Button 
                            size="lg"
                            variant="secondary"
                            onClick={() => navigate('/concours')}
                            className="gap-2 hover-scale"
                        >
                            Voir les concours disponibles
                            <ArrowRight className="h-5 w-5" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Contact Section */}
                <Card className="border-2 animate-fade-in">
                    <CardContent className="p-10 space-y-6">
                        <h2 className="text-3xl font-bold text-center mb-8">
                            Besoin d'aide ?
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-center">
                            <div className="space-y-3">
                                <h3 className="text-xl font-semibold">Support Candidats</h3>
                                <p className="text-muted-foreground">
                                    Consultez votre dashboard pour envoyer un message 
                                    à l'administration de votre établissement
                                </p>
                                <Button 
                                    variant="outline"
                                    onClick={() => navigate('/connexion')}
                                >
                                    Se connecter
                                </Button>
                            </div>
                            <div className="space-y-3">
                                <h3 className="text-xl font-semibold">Établissements</h3>
                                <p className="text-muted-foreground">
                                    Contactez-nous pour intégrer votre établissement 
                                    à la plateforme
                                </p>
                                <Button 
                                    variant="outline"
                                    onClick={() => navigate('/support')}
                                >
                                    Contactez-nous
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default APropos;
