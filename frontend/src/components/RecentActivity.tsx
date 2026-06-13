import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Clock, User, FileText, DollarSign} from 'lucide-react';
import {useRealtimeData} from '@/hooks/useRealtimeData';

const RecentActivity = () => {
    const {candidats, paiements, isLoading} = useRealtimeData();

    // Combine and sort recent activities
    const activities = [
        ...candidats.slice(0, 3).map(candidat => ({
            id: `candidat-${candidat.id}`,
            type: 'inscription' as const,
            title: `Nouvelle inscription`,
            description: `${candidat.prncan} ${candidat.nomcan}`,
            time: candidat.created_at,
            badge: 'Nouveau candidat',
            badgeColor: 'bg-blue-100 text-blue-800',
        })),
        ...paiements.slice(0, 2).map(paiement => ({
            id: `paiement-${paiement.id}`,
            type: 'paiement' as const,
            title: `Paiement reçu`,
            description: `${paiement.montant?.toLocaleString() || '0'} FCFA`,
            time: paiement.created_at,
            badge: 'Paiement',
            badgeColor: 'bg-green-100 text-green-800',
        }))
    ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

    const getIcon = (type: string) => {
        switch (type) {
            case 'inscription':
                return User;
            case 'paiement':
                return DollarSign;
            default:
                return FileText;
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Activité récente</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="animate-pulse flex items-center space-x-4">
                                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-primary"/>
                    <span>Activité récente</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {activities.length > 0 ? activities.map((activity) => {
                        const Icon = getIcon(activity.type);
                        return (
                            <div key={activity.id}
                                 className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Icon className="h-5 w-5 text-primary"/>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center space-x-2 mb-1">
                                        <p className="text-sm font-medium truncate">{activity.title}</p>
                                        <Badge variant="secondary" className={`text-xs ${activity.badgeColor}`}>
                                            {activity.badge}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground truncate">{activity.description}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(activity.time).toLocaleDateString('fr-FR', {
                                            day: 'numeric',
                                            month: 'short',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            </div>
                        );
                    }) : (
                        <div className="text-center py-8">
                            <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4"/>
                            <p className="text-muted-foreground">Aucune activité récente</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default RecentActivity;
