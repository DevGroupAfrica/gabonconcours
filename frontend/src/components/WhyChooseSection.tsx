import React from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {GraduationCap, FileText, Users, Shield} from 'lucide-react';

const WhyChooseSection = () => {
    const features = [
        {
            icon: GraduationCap,
            title: "Concours Publics",
            description: "Accédez à tous les concours de la fonction publique gabonaise",
            color: "text-blue-500",
            bgColor: "bg-blue-50"
        },
        {
            icon: FileText,
            title: "Candidature Simplifiée",
            description: "Processus de candidature en ligne sécurisé et simplifié",
            color: "text-green-500",
            bgColor: "bg-green-50"
        },
        {
            icon: Users,
            title: "Suivi en Temps Réel",
            description: "Suivez l'avancement de votre candidature à tout moment",
            color: "text-orange-500",
            bgColor: "bg-orange-50"
        },
        {
            icon: Shield,
            title: "Sécurisé",
            description: "Vos données personnelles sont protégées et sécurisées",
            color: "text-purple-500",
            bgColor: "bg-purple-50"
        }
    ];

    return (
        <section className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-foreground mb-4">
                        Pourquoi Choisir GabConcours ?
                    </h2>
                    <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                        Une plateforme moderne, sécurisée et simple d'utilisation pour tous vos concours publics
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <Card key={index} className="text-center hover:shadow-lg transition-shadow border-0 shadow-sm">
                            <CardContent className="p-8">
                                <div
                                    className={`inline-flex items-center justify-center w-16 h-16 ${feature.bgColor} rounded-full mb-6`}>
                                    <feature.icon className={`h-8 w-8 ${feature.color}`}/>
                                </div>
                                <h3 className="text-xl font-semibold text-foreground mb-4">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.description}
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default WhyChooseSection;
