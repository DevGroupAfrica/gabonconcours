import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {CalendarDays, MapPin, Users, DollarSign, GraduationCap} from 'lucide-react';
import {Concours} from '@/types/entities';

interface ConcoursCardProps {
    concours: Concours;
}

const ConcoursCard: React.FC<ConcoursCardProps> = ({concours}) => {
    const navigate = useNavigate();
    const montant = parseFloat(concours.fracnc);
    const isGratuit = montant === 0;
    const dateDebut = new Date(concours.debcnc);
    const dateFin = new Date(concours.fincnc);
    const maintenant = new Date();
    const estOuvert = maintenant >= dateDebut && maintenant <= dateFin;

    const handleCandidater = () => {
        navigate(`/concours/${concours.id}`);
    };

    const getStatutColor = (statut: string) => {
        switch (statut) {
            case '1':
                return 'bg-green-100 text-green-800 border-green-200';
            case '2':
                return 'bg-red-100 text-red-800 border-red-200';
            case '3':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            default:
                return 'bg-blue-100 text-blue-800 border-blue-200';
        }
    };

    const getStatutText = (statut: string) => {
        switch (statut) {
            case '1':
                return 'Ouvert';
            case '2':
                return 'Fermé';
            case '3':
                return 'Terminé';
            default:
                return 'Inconnu';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatPrice = (price: string) => {
        const numPrice = parseInt(price);
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
        }).format(numPrice);
    };

    return (
        <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2">{concours.libcnc}</CardTitle>
                    <Badge className={getStatutColor(concours.stacnc)}>
                        {getStatutText(concours.stacnc)}
                    </Badge>
                </div>
                <CardDescription className="line-clamp-2">
                    {concours.etablissement_nomets} • Session {concours.sescnc}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 p-6">
                <div className="space-y-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <CalendarDays className="w-4 h-4 mr-2"/>
                        <span>Du {formatDate(concours.debcnc)} au {formatDate(concours.fincnc)}</span>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                        <GraduationCap className="w-4 h-4 mr-2"/>
                        <span>{concours.niveau_nomniv}</span>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2"/>
                        <span>{concours.etablissement_nomets}</span>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                        <DollarSign className="w-4 h-4 mr-2"/>
                        <span className="font-medium">{formatPrice(concours.fracnc)}</span>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                        <Users className="w-4 h-4 mr-2"/>
                        <span>Âge limite: {concours.agecnc} ans</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className="p-6 pt-0">
                <Button
                    onClick={handleCandidater}
                    disabled={!estOuvert}
                    className="w-full"
                    size="lg"
                >
                    {estOuvert ? 'Voir les détails' : 'Concours fermé'}
                </Button>
            </CardFooter>
        </Card>
    );
};

export default ConcoursCard;
