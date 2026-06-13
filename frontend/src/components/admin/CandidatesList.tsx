import React from 'react';
import {useNavigate} from 'react-router-dom';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {User, Mail, Phone, Eye} from 'lucide-react';

export interface CandidatesListProps {
    candidats: any[];
    isLoading: boolean;
}

const CandidatesList: React.FC<CandidatesListProps> = ({candidats, isLoading}) => {
    const navigate = useNavigate();

    if (isLoading) {
        return (
            <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Chargement des candidats...</p>
            </div>
        );
    }

    if (!candidats || candidats.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                Aucun candidat trouvé pour ce concours
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {candidats.map((candidature: any) => {
                const candidat = candidature.candidat;
                return (
                    <Card key={candidature.id} className="p-4">
                        <CardContent className="p-0">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div
                                        className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                                        <User className="h-6 w-6 text-primary"/>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">
                                            {candidat.prncan} {candidat.nomcan}
                                        </h3>
                                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                                            <div className="flex items-center space-x-1">
                                                <Mail className="h-3 w-3"/>
                                                <span>{candidat.maican}</span>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                <Phone className="h-3 w-3"/>
                                                <span>{candidat.telcan}</span>
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            NUPCAN: {candidat.nupcan}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Badge
                                        variant={
                                            candidature.statut === 'valide' ? 'default' :
                                                candidature.statut === 'rejete' ? 'destructive' : 'secondary'
                                        }
                                    >
                                        {candidature.statut === 'valide' ? 'Validé' :
                                            candidature.statut === 'rejete' ? 'Rejeté' : 'En attente'}
                                    </Badge>
                                    <Button
                                        onClick={() => navigate(`/admin/candidats/${candidat.nupcan}`)}
                                        variant="outline"
                                        size="sm"
                                    >
                                        <Eye className="h-4 w-4 mr-2"/>
                                        Gérer
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
};

export default CandidatesList;
