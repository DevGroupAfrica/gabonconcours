import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Search, Eye, CheckCircle, XCircle, DollarSign, TrendingUp, RefreshCw} from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import {useRealtimeData} from '@/hooks/useRealtimeData';
import {toast} from '@/hooks/use-toast';

const Paiements = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const {paiements, statistics, isLoading} = useRealtimeData();

    const filteredPaiements = paiements.filter(p =>
        (p.candidat_nom || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.reference || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalPaiements = paiements.reduce((sum, p) => sum + (p.montant || 0), 0);
    const paiementsValides = paiements.filter(p => p.statut === 'valide');
    const totalValide = paiementsValides.reduce((sum, p) => sum + (p.montant || 0), 0);

    const handleValidatePayment = (paiementId: number) => {
        toast({
            title: "Paiement validé",
            description: "Le paiement a été validé avec succès.",
        });
    };

    const handleRejectPayment = (paiementId: number) => {
        toast({
            title: "Paiement rejeté",
            description: "Le paiement a été rejeté.",
            variant: "destructive",
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'valide':
                return <Badge className="bg-green-100 text-green-800 border-green-200">Validé</Badge>;
            case 'rejete':
                return <Badge className="bg-red-100 text-red-800 border-red-200">Rejeté</Badge>;
            case 'en_attente':
                return <Badge className="bg-orange-100 text-orange-800 border-orange-200">En attente</Badge>;
            default:
                return <Badge variant="secondary">Inconnu</Badge>;
        }
    };

    const getMethodeBadge = (methode: string) => {
        const badgeClasses = "border-2";
        switch (methode) {
            case 'mobile_money':
                return <Badge variant="outline" className={`${badgeClasses} border-blue-200 text-blue-700`}>Mobile
                    Money</Badge>;
            case 'virement':
                return <Badge variant="outline"
                              className={`${badgeClasses} border-green-200 text-green-700`}>Virement</Badge>;
            case 'especes':
                return <Badge variant="outline"
                              className={`${badgeClasses} border-purple-200 text-purple-700`}>Espèces</Badge>;
            default:
                return <Badge variant="outline">Autre</Badge>;
        }
    };

    if (isLoading) {
        return (
            <AdminProtectedRoute>
                <AdminLayout>
                    <div className="space-y-6">
                        <div className="flex items-center space-x-2">
                            <RefreshCw className="h-5 w-5 animate-spin"/>
                            <span>Chargement des données de paiement...</span>
                        </div>
                    </div>
                </AdminLayout>
            </AdminProtectedRoute>
        );
    }

    return (
        <AdminProtectedRoute>
            <AdminLayout>
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold gradient-text">Gestion des Paiements</h1>
                            <p className="text-muted-foreground">Suivi et validation des paiements en temps réel</p>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="border-l-4 border-l-green-500">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <div className="p-3 rounded-full bg-green-100">
                                        <DollarSign className="h-6 w-6 text-green-600"/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-green-600">{totalValide.toLocaleString()}</p>
                                        <p className="text-sm text-muted-foreground">FCFA Validés</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-blue-500">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <div className="p-3 rounded-full bg-blue-100">
                                        <TrendingUp className="h-6 w-6 text-blue-600"/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-blue-600">{totalPaiements.toLocaleString()}</p>
                                        <p className="text-sm text-muted-foreground">FCFA Total</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-purple-500">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <div className="p-3 rounded-full bg-purple-100">
                                        <CheckCircle className="h-6 w-6 text-purple-600"/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {paiements.filter(p => p.statut === 'valide').length}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Validés</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-orange-500">
                            <CardContent className="p-6">
                                <div className="flex items-center space-x-3">
                                    <div className="p-3 rounded-full bg-orange-100">
                                        <XCircle className="h-6 w-6 text-orange-600"/>
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold text-orange-600">
                                            {paiements.filter(p => p.statut === 'en_attente').length}
                                        </p>
                                        <p className="text-sm text-muted-foreground">En attente</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Payments Table */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xl">Liste des Paiements</CardTitle>
                                <div className="flex items-center space-x-2">
                                    <Search className="h-4 w-4 text-muted-foreground"/>
                                    <Input
                                        placeholder="Rechercher un paiement..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="max-w-sm"
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Candidat</TableHead>
                                        <TableHead>Référence</TableHead>
                                        <TableHead>Concours</TableHead>
                                        <TableHead>Montant</TableHead>
                                        <TableHead>Méthode</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPaiements.length > 0 ? filteredPaiements.map((paiement) => (
                                        <TableRow key={paiement.id} className="hover:bg-muted/50">
                                            <TableCell>
                                                <div>
                                                    <div
                                                        className="font-medium">{paiement.candidat_nom || 'Nom non disponible'}</div>
                                                    <div
                                                        className="text-sm text-muted-foreground">{paiement.nupcan || 'NIP non disponible'}</div>
                                                </div>
                                            </TableCell>
                                            <TableCell
                                                className="font-mono text-sm">{paiement.reference || `REF_${paiement.id}`}</TableCell>
                                            <TableCell>{paiement.concours || 'Concours non spécifié'}</TableCell>
                                            <TableCell className="font-medium text-green-600">
                                                {(paiement.montant || 0).toLocaleString()} FCFA
                                            </TableCell>
                                            <TableCell>{getMethodeBadge(paiement.methode || 'mobile_money')}</TableCell>
                                            <TableCell>{new Date(paiement.date_paiement || paiement.created_at).toLocaleDateString('fr-FR')}</TableCell>
                                            <TableCell>{getStatusBadge(paiement.statut || 'en_attente')}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                        <Eye className="h-4 w-4"/>
                                                    </Button>
                                                    {(paiement.statut || 'en_attente') === 'en_attente' && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleValidatePayment(paiement.id)}
                                                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                                                            >
                                                                <CheckCircle className="h-4 w-4"/>
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRejectPayment(paiement.id)}
                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <XCircle className="h-4 w-4"/>
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center py-8">
                                                <div className="text-muted-foreground">
                                                    {searchTerm ? 'Aucun paiement trouvé pour cette recherche' : 'Aucun paiement enregistré'}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </AdminLayout>
        </AdminProtectedRoute>
    );
};

export default Paiements;
