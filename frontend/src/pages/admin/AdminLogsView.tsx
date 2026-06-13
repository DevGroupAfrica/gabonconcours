import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { apiService } from '@/services/api';
import { Activity, FileCheck, FileX, Mail, GraduationCap } from 'lucide-react';

export default function AdminLogsView() {
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [logsRes, statsRes] = await Promise.all([
                apiService.makeRequest('/admin-logs', 'GET'),
                apiService.makeRequest('/admin-logs/stats', 'GET')
            ]);

            if (logsRes.data) setLogs(logsRes.data);
            if (statsRes.data) setStats(statsRes.data);
        } catch (error) {
            console.error('Erreur chargement logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'validation_document':
                return <FileCheck className="h-4 w-4 text-green-500" />;
            case 'rejet_document':
                return <FileX className="h-4 w-4 text-red-500" />;
            case 'envoi_message':
                return <Mail className="h-4 w-4 text-blue-500" />;
            case 'attribution_note':
                return <GraduationCap className="h-4 w-4 text-purple-500" />;
            default:
                return <Activity className="h-4 w-4" />;
        }
    };

    const getActionLabel = (action: string) => {
        const labels: Record<string, string> = {
            'validation_document': 'Validation document',
            'rejet_document': 'Rejet document',
            'envoi_message': 'Envoi message',
            'attribution_note': 'Attribution note',
            'creation_candidat': 'Création candidat',
            'modification_candidat': 'Modification candidat'
        };
        return labels[action] || action;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Journal d'activité</h1>
                <p className="text-muted-foreground">Toutes les actions des administrateurs</p>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_actions || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Validations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.validations || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Rejets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.rejets || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Aujourd'hui
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.actions_aujourd_hui || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Table des logs */}
            <Card>
                <CardHeader>
                    <CardTitle>Historique des actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Admin</TableHead>
                                <TableHead>Table</TableHead>
                                <TableHead>Enregistrement</TableHead>
                                <TableHead>IP</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.map((log) => (
                                <TableRow key={log.id}>
                                    <TableCell>
                                        {new Date(log.created_at).toLocaleString('fr-FR')}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {getActionIcon(log.action)}
                                            <span className="text-sm">{getActionLabel(log.action)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <div className="font-medium">{log.admin_prenom} {log.admin_nom}</div>
                                            <div className="text-xs text-muted-foreground">{log.admin_email}</div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{log.table_name || '-'}</Badge>
                                    </TableCell>
                                    <TableCell>{log.record_id || '-'}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {log.ip_address || '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
