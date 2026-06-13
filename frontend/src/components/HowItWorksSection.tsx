import React from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Search, FileText, Upload, CreditCard} from 'lucide-react';

const HowItWorksSection = () => {
    const steps = [
        {
            number: 1,
            icon: Search,
            title: "Choisir un concours",
            description: "Consultez la liste des concours disponibles et sélectionnez celui qui vous intéresse.",
            color: "text-blue-500",
            bgColor: "bg-blue-500"
        },
        {
            number: 2,
            icon: FileText,
            title: "Remplir le formulaire",
            description: "Saisissez vos informations personnelles et recevez votre NIP unique.",
            color: "text-green-500",
            bgColor: "bg-green-500"
        },
        {
            number: 3,
            icon: Upload,
            title: "Soumettre les documents",
            description: "Téléchargez les pièces justificatives requises pour votre dossier.",
            color: "text-orange-500",
            bgColor: "bg-orange-500"
        },
        {
            number: 4,
            icon: CreditCard,
            title: "Payer les frais",
            description: "Effectuez le paiement des frais de dossier pour finaliser votre candidature.",
            color: "text-purple-500",
            bgColor: "bg-purple-500"
        }
    ];

    return (
        <section className="py-16 bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold text-foreground mb-4">
                        Comment ça fonctionne
                    </h2>
                    <p className="text-lg text-muted-foreground">
                        Un processus simple en 4 étapes pour votre candidature
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <div key={index} className="relative">
                            <Card
                                className="text-center hover:shadow-lg transition-all duration-300 border-0 shadow-sm">
                                <CardContent className="p-8">
                                    <div
                                        className={`inline-flex items-center justify-center w-16 h-16 ${step.bgColor} rounded-full mb-6 relative`}>
                                        <step.icon className="h-8 w-8 text-white"/>
                                        <div
                                            className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                                            <span className="text-sm font-bold text-gray-800">{step.number}</span>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground mb-4">
                                        {step.title}
                                    </h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {step.description}
                                    </p>
                                </CardContent>
                            </Card>

                            {/* Connector line */}
                            {index < steps.length - 1 && (
                                <div
                                    className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gray-300 transform -translate-y-1/2"></div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default HowItWorksSection;
