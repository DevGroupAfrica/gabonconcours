import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  XCircle,
  DollarSign,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { apiService } from '@/services/api';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

const Statistiques = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => apiService.getStatistics(),
  });

  const statisticsData = stats?.data || {};

  // Données pour les graphiques
  const documentStatusData = [
    { name: 'Validés', value: statisticsData?.documents?.valides || 0, color: '#10b981' },
    { name: 'En attente', value: statisticsData?.documents?.en_attente || 0, color: '#f59e0b' },
    { name: 'Rejetés', value: statisticsData?.documents?.rejetes || 0, color: '#ef4444' },
  ];

  const paiementStatusData = [
    { name: 'Validés', value: statisticsData?.paiements?.valides || 0, color: '#10b981' },
    { name: 'En attente', value: statisticsData?.paiements?.en_attente || 0, color: '#f59e0b' },
  ];

  const evolutionCandidatsData = [
    { mois: '2025-01', candidats: Math.floor((statisticsData?.candidats?.total || 0) * 0.1) },
    { mois: '2025-02', candidats: Math.floor((statisticsData?.candidats?.total || 0) * 0.2) },
    { mois: '2025-03', candidats: Math.floor((statisticsData?.candidats?.total || 0) * 0.35) },
    { mois: '2025-04', candidats: Math.floor((statisticsData?.candidats?.total || 0) * 0.5) },
    { mois: '2025-05', candidats: Math.floor((statisticsData?.candidats?.total || 0) * 0.65) },
    { mois: '2025-06', candidats: Math.floor((statisticsData?.candidats?.total || 0) * 0.75) },
    { mois: '2025-07', candidats: Math.floor((statisticsData?.candidats?.total || 0) * 0.82) },
    { mois: '2025-08', candidats: Math.floor((statisticsData?.candidats?.total || 0) * 0.90) },
    { mois: '2025-09', candidats: Math.floor((statisticsData?.candidats?.total || 0) * 0.95) },
    { mois: '2025-10', candidats: statisticsData?.candidats?.total || 0 },
  ];
  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold mb-2">Statistiques</h1>
        <p className="text-muted-foreground">Vue et ensemble des données de la plateforme</p>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidats</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statisticsData?.candidats?.total || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {statisticsData?.candidats?.complets || 0} dossiers complets
            </p>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${((statisticsData?.candidats?.complets || 0) / (statisticsData?.candidats?.total || 1)) * 100}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements Validés</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {statisticsData?.paiements?.valides || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {((statisticsData?.paiements?.valides / (statisticsData?.paiements?.total || 1)) * 100).toFixed(1)}% du total
            </p>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-green-600" style={{ width: `${((statisticsData?.paiements?.valides / (statisticsData?.paiements?.total || 1)) * 100)}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paiements en Attente</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {statisticsData?.paiements?.en_attente || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              À traiter
            </p>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-orange-600" style={{ width: `${((statisticsData?.paiements?.en_attente || 0) / (statisticsData?.paiements?.total || 1)) * 100}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {(statisticsData?.paiements?.montant_total || 0).toLocaleString()} FCFA
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenus cumulés
            </p>
            <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-blue-600" style={{ width: '88%' }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des Candidatures */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Évolution des Candidatures
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={evolutionCandidatsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="candidats" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.6}
                  name="Candidats"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Statut des Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Taux de Validation des Documents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={documentStatusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" fill="#8b5cf6" name="Documents">
                  {documentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Statut des Paiements - Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Répartition des Paiements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={paiementStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paiementStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Statistiques détaillées */}
        <Card>
          <CardHeader>
            <CardTitle>Récapitulatif Global</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Total Candidats</span>
              </div>
              <span className="text-lg font-bold">{statisticsData?.candidats?.total || 0}</span>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Documents Totaux</span>
              </div>
              <span className="text-lg font-bold">{statisticsData?.documents?.total || 0}</span>
            </div>
            
            <div className="flex justify-between items-center pb-3 border-b">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Paiements Totaux</span>
              </div>
              <span className="text-lg font-bold">{statisticsData?.paiements?.total || 0}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium">Documents Validés</span>
              </div>
              <span className="text-lg font-bold text-emerald-600">
                {statisticsData?.documents?.valides || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Statistiques;
