import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, CreditCard, TrendingUp, Building2, Award, CheckCircle, XCircle, Clock } from 'lucide-react';
import { apiService } from '@/services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#2874f0', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatsDashboard: React.FC = () => {
    const { data: stats, isLoading } = useQuery({
        queryKey: ['stats-global'],
        queryFn: async () => {
            const response = await apiService.makeRequest('/stats/global', 'GET');
            return response.data;
        },
        refetchInterval: 60000, // Rafraîchir chaque minute
    });

    if (isLoading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            </div>
        );
    }

    const totaux = (stats as any)?.totaux || {};
    const repartition = (stats as any)?.repartition || {};
    const evolution = (stats as any)?.evolution || [];

    // Données pour le graphique en secteurs (documents)
    const documentsData = [
        { name: 'Validés', value: totaux.documents_valides || 0 },
        { name: 'En attente', value: totaux.documents_en_attente || 0 },
        { name: 'Rejetés', value: totaux.documents_rejetes || 0 },
    ];

    // Données pour le graphique en secteurs (paiements)
    const paiementsData = [
        { name: 'Validés', value: totaux.paiements_valides || 0 },
        { name: 'En attente', value: totaux.paiements_en_attente || 0 },
    ];

    return (
        <div className="space-y-6">
            {/* Cartes de statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Candidats</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totaux.candidats || 0}</div>
                        <p className="text-xs text-muted-foreground">Candidatures enregistrées</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Documents</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totaux.documents || 0}</div>
                        <div className="flex gap-2 text-xs mt-1">
                            <span className="text-green-600 flex items-center">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {totaux.documents_valides || 0}
                            </span>
                            <span className="text-orange-600 flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {totaux.documents_en_attente || 0}
                            </span>
                            <span className="text-red-600 flex items-center">
                                <XCircle className="h-3 w-3 mr-1" />
                                {totaux.documents_rejetes || 0}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paiements</CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totaux.paiements || 0}</div>
                        <div className="flex gap-2 text-xs mt-1">
                            <span className="text-green-600">Validés: {totaux.paiements_valides || 0}</span>
                            <span className="text-orange-600">En attente: {totaux.paiements_en_attente || 0}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(totaux.montant_total || 0).toLocaleString()} FCFA
                        </div>
                        <p className="text-xs text-muted-foreground">Revenus générés</p>
                    </CardContent>
                </Card>
            </div>

            {/* Graphiques */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Graphique par concours */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Award className="h-5 w-5" />
                            Candidats par Concours
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={repartition.par_concours || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="libcnc" angle={-45} textAnchor="end" height={100} fontSize={12} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="nombre_candidats" fill="#2874f0" name="Candidats" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Graphique par établissement */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Candidats par Établissement
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={repartition.par_etablissement || []}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="nomets" angle={-45} textAnchor="end" height={100} fontSize={12} />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="nombre_candidats" fill="#10b981" name="Candidats" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Statut des documents */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Statut des Documents
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={documentsData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {documentsData.map((entry, index) => (
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
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Évolution (30 derniers jours)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={evolution}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="date" 
                                    tickFormatter={(date) => new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                />
                                <YAxis />
                                <Tooltip 
                                    labelFormatter={(date) => new Date(date).toLocaleDateString('fr-FR')}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="nombre" stroke="#2874f0" name="Candidatures" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            {/* Tableau par filière */}
            <Card>
                <CardHeader>
                    <CardTitle>Répartition par Filière</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left p-2">Filière</th>
                                    <th className="text-right p-2">Nombre de candidats</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(repartition.par_filiere || []).map((filiere: any) => (
                                    <tr key={filiere.id} className="border-b">
                                        <td className="p-2">{filiere.nomfil}</td>
                                        <td className="text-right p-2 font-semibold">{filiere.nombre_candidats}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default StatsDashboard;
