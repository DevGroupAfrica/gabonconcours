import React, {useState} from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Badge} from '@/components/ui/badge';
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table';
import {Plus, Search, Edit, Trash, Eye, Building} from 'lucide-react';
import {Link} from 'react-router-dom';
import AdminLayout from '@/components/admin/AdminLayout';

const Etablissements = () => {
    const [searchTerm, setSearchTerm] = useState('');

    // Mock data - à remplacer par une vraie API
    const etablissements = [
        {
            id: 1,
            nom: 'École Nationale d\'Administration',
            type: 'Grande École',
            ville: 'Libreville',
            province: 'Estuaire',
            telephone: '+241 01 23 45 67',
            email: 'contact@ena.ga',
            concours_actifs: 3,
            statut: 'actif'
        },
        {
            id: 2,
            nom: 'École Normale Supérieure',
            type: 'École Normale',
            ville: 'Libreville',
            province: 'Estuaire',
            telephone: '+241 01 23 45 68',
            email: 'contact@ens.ga',
            concours_actifs: 2,
            statut: 'actif'
        },
        {
            id: 3,
            nom: 'Institut National des Sciences de Gestion',
            type: 'Institut',
            ville: 'Port-Gentil',
            province: 'Ogooué-Maritime',
            telephone: '+241 01 23 45 69',
            email: 'contact@insg.ga',
            concours_actifs: 1,
            statut: 'actif'
        }
    ];

    const filteredEtablissements = etablissements.filter(e =>
        e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.ville.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.province.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'actif':
                return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
            case 'inactif':
                return <Badge className="bg-gray-100 text-gray-800">Inactif</Badge>;
            default:
                return <Badge variant="secondary">Inconnu</Badge>;
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Gestion des Établissements</h1>
                        <p className="text-muted-foreground">Gérez tous les établissements partenaires</p>
                    </div>
                    <Button asChild>
                        <Link to="/admin/etablissements/nouveau">
                            <Plus className="h-4 w-4 mr-2"/>
                            Nouvel établissement
                        </Link>
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <Building className="h-8 w-8 text-blue-600"/>
                                <div>
                                    <p className="text-2xl font-bold">{etablissements.length}</p>
                                    <p className="text-sm text-muted-foreground">Établissements</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                                    <span className="text-green-600 font-bold">A</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{etablissements.filter(e => e.statut === 'actif').length}</p>
                                    <p className="text-sm text-muted-foreground">Actifs</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <span className="text-purple-600 font-bold">C</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{etablissements.reduce((sum, e) => sum + e.concours_actifs, 0)}</p>
                                    <p className="text-sm text-muted-foreground">Concours actifs</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center space-x-2">
                                <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <span className="text-orange-600 font-bold">P</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold">{new Set(etablissements.map(e => e.province)).size}</p>
                                    <p className="text-sm text-muted-foreground">Provinces</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Liste des Établissements</CardTitle>
                        <div className="flex items-center space-x-2">
                            <Search className="h-4 w-4 text-muted-foreground"/>
                            <Input
                                placeholder="Rechercher un établissement..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="max-w-sm"
                            />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Localisation</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Concours Actifs</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredEtablissements.map((etablissement) => (
                                    <TableRow key={etablissement.id}>
                                        <TableCell className="font-medium">{etablissement.nom}</TableCell>
                                        <TableCell>{etablissement.type}</TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div>{etablissement.ville}</div>
                                                <div className="text-muted-foreground">{etablissement.province}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                <div>{etablissement.telephone}</div>
                                                <div className="text-muted-foreground">{etablissement.email}</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{etablissement.concours_actifs}</Badge>
                                        </TableCell>
                                        <TableCell>{getStatusBadge(etablissement.statut)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link to={`/admin/etablissements/${etablissement.id}`}>
                                                        <Eye className="h-4 w-4"/>
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link to={`/admin/etablissements/${etablissement.id}/edit`}>
                                                        <Edit className="h-4 w-4"/>
                                                    </Link>
                                                </Button>
                                                <Button variant="ghost" size="sm">
                                                    <Trash className="h-4 w-4"/>
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default Etablissements;
