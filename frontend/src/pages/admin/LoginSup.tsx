import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {LogIn, Shield, AlertCircle} from 'lucide-react';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {toast} from '@/hooks/use-toast';

const SupAdminLogin = () => {
    const navigate = useNavigate();
    const {login} = useAdminAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const success = await login(email, password);
            if (success) {
                toast({
                    title: "Connexion réussie",
                    description: "Bienvenue dans l'interface d'administration",
                });
                navigate('/admin/Sup');
            } else {
                toast({
                    title: "Erreur de connexion",
                    description: "Email ou mot de passe incorrect",
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            console.error('Erreur de connexion:', error);
            toast({
                title: "Erreur",
                description: error.message || "Une erreur est survenue lors de la connexion",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-2xl mb-6">
                        <Shield className="h-8 w-8 text-primary"/>
                    </div>
                    <h1 className="text-3xl font-bold text-foreground mb-2">
                        Administration
                    </h1>
                    <p className="text-muted-foreground">
                        Connexion à l'interface d'administration GabConcours
                    </p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Connexion Administrateur</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} className="space-y-4">
                            <div>
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@gabconcours.ga"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="password">Mot de passe</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Votre mot de passe"
                                    required
                                />
                            </div>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isLoading}
                            >
                                <LogIn className="h-4 w-4 mr-2"/>
                                {isLoading ? 'Connexion...' : 'Se connecter'}
                            </Button>
                        </form>

                        {/*<div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">*/}
                        {/*  <div className="flex items-start space-x-2">*/}
                        {/*    <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />*/}
                        {/*    <div>*/}
                        {/*      <p className="text-sm font-medium text-orange-800 mb-2">*/}
                        {/*        Première installation*/}
                        {/*      </p>*/}
                        {/*      <p className="text-sm text-orange-700 mb-2">*/}
                        {/*        Si c'est votre première connexion, vous devez d'abord créer un compte administrateur.*/}
                        {/*      </p>*/}
                        {/*      <p className="text-sm text-orange-700">*/}
                        {/*        Exécutez cette commande sur le serveur:*/}
                        {/*      </p>*/}
                        {/*      <code className="block mt-1 p-2 bg-orange-100 text-orange-800 text-xs rounded">*/}
                        {/*        node scripts/createDefaultAdmin.js*/}
                        {/*      </code>*/}
                        {/*    </div>*/}
                        {/*  </div>*/}
                        {/*</div>*/}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default SupAdminLogin;
