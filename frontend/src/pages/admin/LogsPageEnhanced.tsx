import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Search, Filter, Activity } from 'lucide-react';
import { apiService } from '@/services/api';
import { useState } from 'react';

const LogsPage = () => {
    const [filterUserType, setFilterUserType] = useState<string>('all');
    const [filterAction, setFilterAction] = useState<string>('');
    const [searchTerm, setSearchTerm] = useState<string>('');

    // Récupérer les logs avec filtres
    const { data: logs, isLoading } = useQuery({
        queryKey: ['admin-logs', filterUserType, filterAction],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filterUserType !== 'all') params.append('user_type', filterUserType);
            if (filterAction) params.append('action', filterAction);
            
            const response = await apiService.makeRequest(`/logs?${params.toString()}`, 'GET');
            return response.data || [];
        }
    });

    // Récupérer les stats
    const { data: stats } = useQuery({
        queryKey: ['logs-stats'],
        queryFn: async () => {
            const response = await apiService.makeRequest('/logs/stats', 'GET');
            return response.data || {};
        }
    });

    const filteredLogs = logs?.filter((log: any) => {
        const matchesSearch = 
            log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.admin_nom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.nomcan?.toLowerCase().includes(searchTerm.toLowerCase());
        
        return matchesSearch;
    });

    const getUserBadge = (userType: string) => {
        const variants: Record<string, any> = {
            admin: { variant: 'default', label: 'Admin' },
            candidat: { variant: 'secondary', label: 'Candidat' },
            super_admin: { variant: 'destructive', label: 'Super Admin' }
        };
        const config = variants[userType] || { variant: 'outline', label: userType };
        return <Badge variant={config.variant}>{config.label}</Badge>;
    };

    const exportLogs = () => {
        // Créer un CSV des logs
        const csv = [
            ['Date', 'Type', 'Utilisateur', 'Action', 'Détails'].join(','),
            ...filteredLogs.map((log: any) => [
                new Date(log.created_at).toLocaleString('fr-FR'),
                log.user_type,
                log.admin_nom || log.nomcan || 'N/A',
                log.action,
                log.details || ''
            ].join(','))
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString()}.csv`;
        a.click();
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Activity className="h-8 w-8" />
                        Journal d'Activité
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Suivi des actions sur la plateforme
                    </p>
                </div>
                <Button onClick={exportLogs} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exporter (CSV)
                </Button>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Total Actions</div>
                        <div className="text-2xl font-bold">{logs?.length || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Actions Admin</div>
                        <div className="text-2xl font-bold">
                            {logs?.filter((l: any) => l.user_type === 'admin').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Actions Candidat</div>
                        <div className="text-2xl font-bold">
                            {logs?.filter((l: any) => l.user_type === 'candidat').length || 0}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-sm text-muted-foreground">Aujourd'hui</div>
                        <div className="text-2xl font-bold">
                            {logs?.filter((l: any) => 
                                new Date(l.created_at).toDateString() === new Date().toDateString()
                            ).length || 0}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filtres */}
            <Card>
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
                        
                        <Select value={filterUserType} onValueChange={setFilterUserType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Type d'utilisateur" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                                <SelectItem value="admin">Administrateurs</SelectItem>
                                <SelectItem value="candidat">Candidats</SelectItem>
                                <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            placeholder="Filtrer par action..."
                            value={filterAction}
                            onChange={(e) => setFilterAction(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Table des logs */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center">Chargement...</div>
                    ) : filteredLogs && filteredLogs.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Utilisateur</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Détails</TableHead>
                                    <TableHead>IP</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredLogs.map((log: any) => (
                                    <TableRow key={log.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString('fr-FR', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </TableCell>
                                        <TableCell>{getUserBadge(log.user_type)}</TableCell>
                                        <TableCell>
                                            {log.user_type === 'admin' 
                                                ? `${log.admin_prenom} ${log.admin_nom}` 
                                                : `${log.prncan} ${log.nomcan}`}
                                        </TableCell>
                                        <TableCell className="font-medium">{log.action}</TableCell>
                                        <TableCell className="max-w-md truncate">
                                            {log.details || '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {log.ip_address || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            Aucun log trouvé
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default LogsPage;
