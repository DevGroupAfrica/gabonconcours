import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Home, ArrowLeft} from 'lucide-react';
import Layout from '@/components/Layout';

const NotFound = () => {
    const navigate = useNavigate();

    return (
        <Layout>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <Card className="text-center">
                    <CardContent className="py-16">
                        <div className="mb-8">
                            <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
                            <h2 className="text-2xl font-semibold text-foreground mb-2">Page non trouvée</h2>
                            <p className="text-muted-foreground">
                                La page que vous recherchez n'existe pas ou a été déplacée.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Button onClick={() => navigate(-1)} variant="outline">
                                <ArrowLeft className="h-4 w-4 mr-2"/>
                                Retour
                            </Button>
                            <Button onClick={() => navigate('/')}>
                                <Home className="h-4 w-4 mr-2"/>
                                Accueil
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </Layout>
    );
};

export default NotFound;
