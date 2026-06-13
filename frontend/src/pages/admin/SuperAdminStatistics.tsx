import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { apiService } from '@/services/api';
import {
  BarChart3,
  Users,
  Trophy,
  FileText,
  TrendingUp,
  Building,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const SuperAdminStatistics = () => {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year

  useEffect(() => {
    loadStatistics();
  }, [timeRange]);

  const loadStatistics = async () => {
  try {
    const [globalStats, documentStats, candidatsStats] = await Promise.all([
      apiService.makeRequest('/stats/global', 'GET'),
      apiService.makeRequest('/statistics/documents', 'GET'),
      apiService.makeRequest('/statistics/candidats', 'GET')
    ]);

    // 🧩 Normalisation des structures (pour éviter les 0 non justifiés)
    const normalize = (data: any) => data?.data ?? data ?? {};

    const normalizeDocuments = (data: any) => ({
      valides: data.valides ?? data.valid ?? 0,
      en_attente: data.en_attente ?? data.enAttente ?? 0,
      rejetes: data.rejetes ?? data.rejet ?? 0
    });

    setStats({
      global: normalize(globalStats),
      documents: normalizeDocuments(normalize(documentStats)),
      candidats: normalize(normalize(candidatsStats))
    });

    // 👀 Debug temporaire pour vérifier les données reçues
    console.log({
      global: normalize(globalStats),
      documents: normalizeDocuments(normalize(documentStats)),
      candidats: normalize(normalize(candidatsStats))
    });
  } catch (error) {
    console.error('Erreur chargement statistiques:', error);
  } finally {
    setLoading(false);
  }
};


  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

const statsCards = [
  {
    title: 'Total Candidats',
    value: stats.global?.totaux?.candidats || 0,
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100'
  },
  {
    title: 'Paiements Validés',
    value: stats.global?.totaux?.paiements_valides || 0,
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100'
  },
  {
    title: 'Paiements en Attente',
    value: stats.global?.totaux?.paiements_en_attente || 0,
    icon: Clock,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100'
  },
  {
    title: 'Montant Total Payé (FCFA)',
    value: stats.global?.totaux?.montant_total || 0,
    icon: TrendingUp,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100'
  },
  {
    title: 'Documents Validés',
    value: stats.documents?.valides || 0,
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100'
  },
  {
    title: 'Documents Rejetés',
    value: stats.documents?.rejetes || 0,
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100'
  }
];


  // Données pour graphiques
  const documentStatusData = [
    { name: 'Validés', value: stats.documents.valides || 0 },
    { name: 'En attente', value: stats.documents.en_attente || 0 },
    { name: 'Rejetés', value: stats.documents.rejetes || 0 }
  ];

  const candidatsParMoisData = stats.candidats.parMois || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Statistiques</h1>
          <p className="text-muted-foreground">Vue d'ensemble des données de la plateforme</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-background"
        >
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="year">Cette année</option>
        </select>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statsCards.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statut des documents */}
        <Card>
          <CardHeader>
            <CardTitle>Statut des Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={documentStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {documentStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Évolution des candidatures */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des Candidatures</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={candidatsParMoisData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Taux de conversion */}
      <Card>
        <CardHeader>
          <CardTitle>Taux de Validation des Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={documentStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8">
                {documentStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default SuperAdminStatistics;
