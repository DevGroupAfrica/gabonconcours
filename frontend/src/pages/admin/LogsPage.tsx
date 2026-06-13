import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Search, Filter, Calendar, User, Activity } from 'lucide-react';
import { apiService } from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import ErrorMessage from '@/components/ErrorMessage';

const LogsPage = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAction, setFilterAction] = useState<string>('all');
    const [filterUser, setFilterUser] = useState<string>('all');

    // Récupérer les logs
    const { data: logs, isLoading, error, refetch } = useQuery({
        queryKey: ['admin-logs', filterAction, filterUser],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterAction !== 'all') params.append('action', filterAction);
            if (filterUser !== 'all') params.append('user_id', filterUser);
            
            const response = await apiService.makeRequest(`/logs?${params.toString()}`, 'GET');
            return response.data;
        }
    });

    // Récupérer la liste des utilisateurs pour le filtre
    const { data: users } = useQuery({
        queryKey: ['admin-users'],
        queryFn: async () => {
            const response = await apiService.makeRequest('/administrateurs', 'GET');
            return response.data;
        }
    });

    const actionTypes = [
        { value: 'all', label: 'Toutes les actions' },
        { value: 'CREATE', label: 'Créations' },
        { value: 'UPDATE', label: 'Modifications' },
        { value: 'DELETE', label: 'Suppressions' },
        { value: 'LOGIN', label: 'Connexions' },
        { value: 'EXPORT', label: 'Exports' },
        { value: 'VALIDATE', label: 'Validations' },
    ];

    const getActionBadgeColor = (action: string) => {
        const colors: any = {
            'CREATE': 'bg-green-100 text-green-800',
            'UPDATE': 'bg-blue-100 text-blue-800',
            'DELETE': 'bg-red-100 text-red-800',
            'LOGIN': 'bg-purple-100 text-purple-800',
            'EXPORT': 'bg-orange-100 text-orange-800',
            'VALIDATE': 'bg-teal-100 text-teal-800',
        };
        return colors[action] || 'bg-gray-100 text-gray-800';
    };

    const filteredLogs = logs?.filter((log: any) => {
        const matchesSearch = searchTerm === '' || 
            log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.admin_nom?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    if (error) {
        return <ErrorMessage message="Impossible de charger les logs" onRetry={refetch} />;
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Activity className="h-8 w-8 text-primary" />
                    Logs d'Activité
                </h1>
                <p className="text-muted-foreground mt-2">
                    Historique de toutes les actions effectuées sur la plateforme
                </p>
            </div>

            {/* Filtres et recherche */}
            <Card className="animate-fade-in">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtres
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        <Select value={filterAction} onValueChange={setFilterAction}>
                            <SelectTrigger>
                                <SelectValue placeholder="Type d'action" />
                            </SelectTrigger>
                            <SelectContent>
                                {actionTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>
                                        {type.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select value={filterUser} onValueChange={setFilterUser}>
                            <SelectTrigger>
                                <SelectValue placeholder="Utilisateur" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                                {users?.map((user: any) => (
                                    <SelectItem key={user.id} value={user.id.toString()}>
                                        {user.nom} {user.prenom}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Liste des logs */}
            <Card className="animate-fade-in">
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Historique ({filteredLogs?.length || 0} entrées)
                        </span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                            <p className="mt-4 text-muted-foreground">Chargement des logs...</p>
                        </div>
                    ) : filteredLogs && filteredLogs.length > 0 ? (
                        <ScrollArea className="h-[600px] pr-4">
                            <div className="space-y-4">
                                {filteredLogs.map((log: any) => (
                                    <div
                                        key={log.id}
                                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <Badge className={getActionBadgeColor(log.action)}>
                                                        {log.action}
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <User className="h-4 w-4" />
                                                        {log.admin_nom} {log.admin_prenom}
                                                    </span>
                                                </div>
                                                <p className="text-sm">{log.description}</p>
                                                {log.details && (
                                                    <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                                        {log.details}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    {log.created_at ? format(new Date(log.created_at), 'dd MMM yyyy', { locale: fr }) : 'N/A'}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {log.created_at ? format(new Date(log.created_at), 'HH:mm:ss') : 'N/A'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="text-center py-12">
                            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-lg font-semibold">Aucun log trouvé</p>
                            <p className="text-muted-foreground">Aucune activité ne correspond à vos critères</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default LogsPage;
