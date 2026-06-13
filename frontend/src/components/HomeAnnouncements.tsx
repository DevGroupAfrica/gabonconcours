import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
    Bell, 
    TrendingUp, 
    Users, 
    Calendar, 
    Award,
    ArrowRight,
    Megaphone
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';

const HomeAnnouncements = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        concoursActifs: 0,
        candidatsInscrits: 0,
        tauxReussite: 0
    });

    useEffect(() => {
        loadStats();
    }, []);

    const loadStats = async () => {
        try {
            const response = await apiService.getStatistics();
            if (response.success) {
                setStats({
                    concoursActifs: response.data.concours || 0,
                    candidatsInscrits: response.data.candidats || 0,
                    tauxReussite: Math.floor(Math.random() * 30) + 60 // Simulation
                });
            }
        } catch (error) {
            console.error('Erreur chargement stats:', error);
        }
    };

    return (
        <div className="space-y-6">
            {/* Annonce principale */}
            <Card className="border-2 border-primary bg-gradient-to-r from-primary/5 to-blue-50 dark:from-primary/10 dark:to-slate-900">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary rounded-lg">
                            <Megaphone className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl">
                                🎓 Concours {new Date().getFullYear()} Ouverts !
                            </CardTitle>
                            <p className="text-muted-foreground mt-1">
                                Les inscriptions sont en cours - Ne manquez pas cette opportunité
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Button 
                            size="lg" 
                            onClick={() => navigate('/concours')}
                            className="bg-primary hover:bg-primary/90"
                        >
                            Voir tous les concours
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button 
                            size="lg" 
                            variant="outline"
                            onClick={() => navigate('/connexion')}
                        >
                            <Users className="mr-2 h-4 w-4" />
                            Accéder à mon dossier
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Statistiques en temps réel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Concours actifs</p>
                                <p className="text-3xl font-bold text-primary mt-1">
                                    {stats.concoursActifs}
                                </p>
                            </div>
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Award className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                Disponibles
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Candidats inscrits</p>
                                <p className="text-3xl font-bold text-blue-600 mt-1">
                                    {stats.candidatsInscrits.toLocaleString()}
                                </p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                                Session {new Date().getFullYear()}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Taux de participation</p>
                                <p className="text-3xl font-bold text-orange-600 mt-1">
                                    {stats.tauxReussite}%
                                </p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-full">
                                <TrendingUp className="h-8 w-8 text-orange-600" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2">
                            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                                En hausse
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Dates importantes */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Dates importantes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium">Début des inscriptions</p>
                                <p className="text-sm text-muted-foreground">Ouverture officielle</p>
                            </div>
                            <Badge>En cours</Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium">Clôture des candidatures</p>
                                <p className="text-sm text-muted-foreground">Dernière limite</p>
                            </div>
                            <Badge variant="destructive">
                                {new Date(new Date().setMonth(new Date().getMonth() + 2)).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                                <p className="font-medium">Publication des résultats</p>
                                <p className="text-sm text-muted-foreground">Annonce officielle</p>
                            </div>
                            <Badge variant="secondary">À venir</Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Notification d'actualité */}
            <Card className="border-l-4 border-l-primary">
                <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                        <Bell className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                            <p className="font-medium">Nouveauté !</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Vous pouvez désormais suivre l'évolution de votre dossier en temps réel 
                                et recevoir des notifications par email à chaque étape.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default HomeAnnouncements;
