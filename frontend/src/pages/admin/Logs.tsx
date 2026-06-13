import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { apiService } from '@/services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, User, Filter, Download } from 'lucide-react';

interface AdminLog {
  id: number;
  admin_id: number;
  admin_nom: string;
  admin_prenom: string;
  admin_email: string;
  admin_role: string;
  action: string;
  table_name: string;
  record_id: number;
  created_at: string;
  ip_address: string;
}

const Logs: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const { data: logsData, isLoading } = useQuery({
    queryKey: ['admin-logs', actionFilter, dateFilter],
    queryFn: async () => {
      const response = await apiService.makeRequest('/admin-logs', 'GET', undefined, {
        action_type: actionFilter !== 'all' ? actionFilter : undefined,
        start_date: dateFilter !== 'all' ? dateFilter : undefined,
      });
      return response.data;
    },
    refetchInterval: 30000,
  });

  const logs: AdminLog[] = logsData || [];

  const filteredLogs = logs.filter((log) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      log.admin_nom?.toLowerCase().includes(searchLower) ||
      log.admin_prenom?.toLowerCase().includes(searchLower) ||
      log.admin_email?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower) ||
      log.table_name?.toLowerCase().includes(searchLower)
    );
  });

  const getActionBadge = (action: string) => {
    const actionMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      validation_document: { label: 'Validation', variant: 'default' },
      rejet_document: { label: 'Rejet', variant: 'destructive' },
      envoi_message: { label: 'Message', variant: 'secondary' },
      attribution_note: { label: 'Note', variant: 'outline' },
      creation: { label: 'Création', variant: 'default' },
      modification: { label: 'Modification', variant: 'secondary' },
      suppression: { label: 'Suppression', variant: 'destructive' },
    };

    const actionInfo = actionMap[action] || { label: action, variant: 'outline' as const };
    return <Badge variant={actionInfo.variant}>{actionInfo.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Journal d'activité</h1>
          <p className="text-muted-foreground">Toutes les actions des administrateurs</p>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Validations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {logs.filter((l) => l.action === 'validation_document').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Rejets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {logs.filter((l) => l.action === 'rejet_document').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Aujourd'hui</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {logs.filter((l) => {
                const today = new Date().toDateString();
                const logDate = new Date(l.created_at).toDateString();
                return today === logDate;
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Historique des actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Rechercher par admin, action, table..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Type d'action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="validation_document">Validations</SelectItem>
                <SelectItem value="rejet_document">Rejets</SelectItem>
                <SelectItem value="envoi_message">Messages</SelectItem>
                <SelectItem value="attribution_note">Notes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Chargement des logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>Aucune action trouvée</p>
            </div>
          ) : (
            <div className="border rounded-lg">
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
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">
                              {log.admin_nom} {log.admin_prenom}
                            </p>
                            <p className="text-xs text-muted-foreground">{log.admin_email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">{log.table_name}</code>
                      </TableCell>
                      <TableCell>{log.record_id}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{log.ip_address}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Logs;
