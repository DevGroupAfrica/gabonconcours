import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {Users, Calendar, DollarSign, School} from 'lucide-react';

interface ConcoursCardProps {
    concours: {
        id: number;
        libcnc: string;
        fracnc: number;
        sescnc: string;
        datdeb?: string;
        datfin?: string;
        etablissement_nomets?: string;
    };
    candidatsCount: number;
    onViewCandidats: () => void;
}

const ConcoursCard: React.FC<ConcoursCardProps> = ({
                                                       concours,
                                                       candidatsCount,
                                                       onViewCandidats
                                                   }) => {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg line-clamp-2">{concours.libcnc}</CardTitle>
                    <Badge variant="outline">{concours.sescnc}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground"/>
                        <span>{candidatsCount} candidat(s)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground"/>
                        <span>
              {!concours.fracnc || concours.fracnc === 0
                  ? 'GRATUIT'
                  : `${concours.fracnc} FCFA`}
            </span>
                    </div>
                </div>

                {concours.etablissement_nomets && (
                    <div className="flex items-center space-x-2 text-sm">
                        <School className="h-4 w-4 text-muted-foreground"/>
                        <span className="line-clamp-1">{concours.etablissement_nomets}</span>
                    </div>
                )}

                {(concours.datdeb || concours.datfin) && (
                    <div className="flex items-center space-x-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground"/>
                        <span>
              {concours.datdeb && new Date(concours.datdeb).toLocaleDateString('fr-FR')}
                            {concours.datdeb && concours.datfin && ' - '}
                            {concours.datfin && new Date(concours.datfin).toLocaleDateString('fr-FR')}
            </span>
                    </div>
                )}

                <Button
                    onClick={onViewCandidats}
                    className="w-full"
                    variant="default"
                >
                    Voir les candidats ({candidatsCount})
                </Button>
            </CardContent>
        </Card>
    );
};

export default ConcoursCard;
