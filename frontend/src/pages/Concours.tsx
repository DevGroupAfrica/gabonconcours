import React, { useState, useMemo } from 'react';
import {useQuery} from '@tanstack/react-query';
import {useNavigate} from 'react-router-dom';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Calendar, MapPin, GraduationCap, Clock, Users, DollarSign, Search, Filter, X, ChevronLeft, ChevronRight} from 'lucide-react';
import Layout from '@/components/Layout';
import {apiService} from '@/services/api';
import {Concours as ConcoursType} from '@/types/entities';

const Concours = () => {
    const navigate = useNavigate();
    
    // États pour les filtres
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEtablissement, setSelectedEtablissement] = useState('all');
    const [selectedStatus, setSelectedStatus] = useState('all');
    const [selectedSession, setSelectedSession] = useState('all');
    const [selectedNiveau, setSelectedNiveau] = useState('all');
    const [selectedFiliere, setSelectedFiliere] = useState('all');
    const [selectedSerieBac, setSelectedSerieBac] = useState('all');
    const [minFrais, setMinFrais] = useState('');
    const [maxFrais, setMaxFrais] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    
    // États pour la pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 3;

    const {data: concoursResponse, isLoading, error} = useQuery({
        queryKey: ['concours'],
        queryFn: () => apiService.getConcours(),
    });

    // Récupérer toutes les filières
    const {data: filieresResponse} = useQuery({
        queryKey: ['filieres'],
        queryFn: async () => {
            const response = await apiService.makeRequest('/filieres', 'GET');
            return response.data || [];
        }
    });

    const concours = concoursResponse?.data || [];
    const allFilieres = filieresResponse || [];
    
    // Extraire les valeurs uniques pour les filtres
    const etablissements = useMemo(() => {
        const unique = [...new Set(concours.map((c: ConcoursType) => c.etablissement_nomets))];
        return unique.filter(Boolean);
    }, [concours]);
    
    const sessions = useMemo(() => {
        const unique = [...new Set(concours.map((c: ConcoursType) => c.sescnc))];
        return unique.filter(Boolean);
    }, [concours]);
    
    const niveaux = useMemo(() => {
        const unique = [...new Set(concours.map((c: ConcoursType) => c.niveau_nomniv))];
        return unique.filter(Boolean);
    }, [concours]);
    
    // Récupérer les filières associées à chaque concours
    const concoursWithFilieres = useQuery({
        queryKey: ['concours-filieres-map'],
        queryFn: async () => {
            const map: Record<number, any[]> = {};
            for (const c of (concours as ConcoursType[])) {
                try {
                    const response = await apiService.makeRequest(`/concours/${c.id}/filieres`, 'GET');
                    map[c.id] = response.data || [];
                } catch (error) {
                    map[c.id] = [];
                }
            }
            return map;
        },
        enabled: concours.length > 0
    });
    
    const concoursFilieresMap: Record<number, any[]> = concoursWithFilieres.data || {};
    
    // Filtrer les concours
    const filteredConcours = useMemo(() => {
        return concours.filter((concour: ConcoursType) => {
            // Filtre de recherche
            const matchesSearch = searchTerm === '' || 
                concour.libcnc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                concour.etablissement_nomets?.toLowerCase().includes(searchTerm.toLowerCase());
            
            // Filtre établissement
            const matchesEtablissement = selectedEtablissement === 'all' || 
                concour.etablissement_nomets === selectedEtablissement;
            
            // Filtre statut
            const matchesStatus = selectedStatus === 'all' || concour.stacnc === selectedStatus;
            
            // Filtre session
            const matchesSession = selectedSession === 'all' || concour.sescnc === selectedSession;
            
            // Filtre niveau
            const matchesNiveau = selectedNiveau === 'all' || concour.niveau_nomniv === selectedNiveau;
            
            // Filtre filière
            const matchesFiliere = selectedFiliere === 'all' || 
                (concoursFilieresMap[concour.id] && 
                 concoursFilieresMap[concour.id].some((f: any) => f.filiere_id === parseInt(selectedFiliere)));
            
            // Filtre série du bac (uniquement pour concours de première année)
            const matchesSerieBac = selectedSerieBac === 'all' ||
                concour.type_concours !== 'premiere_annee' ||
                (concour.series_bac_acceptees && 
                 Array.isArray(concour.series_bac_acceptees) &&
                 concour.series_bac_acceptees.includes(selectedSerieBac));
            
            // Filtre frais
            const frais = parseInt(String(concour.fracnc));
            const matchesMinFrais = minFrais === '' || frais >= parseInt(minFrais);
            const matchesMaxFrais = maxFrais === '' || frais <= parseInt(maxFrais);
            
            return matchesSearch && matchesEtablissement && matchesStatus && 
                   matchesSession && matchesNiveau && matchesFiliere && matchesSerieBac && matchesMinFrais && matchesMaxFrais;
        });
    }, [concours, searchTerm, selectedEtablissement, selectedStatus, selectedSession, selectedNiveau, selectedFiliere, selectedSerieBac, minFrais, maxFrais, concoursFilieresMap]);
    
    // Pagination
    const totalPages = Math.ceil(filteredConcours.length / itemsPerPage);
    const paginatedConcours = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredConcours.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredConcours, currentPage, itemsPerPage]);
    
    // Réinitialiser à la page 1 quand les filtres changent
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedEtablissement, selectedStatus, selectedSession, selectedNiveau, selectedFiliere, selectedSerieBac, minFrais, maxFrais]);
    
    const clearFilters = () => {
        setSearchTerm('');
        setSelectedEtablissement('all');
        setSelectedStatus('all');
        setSelectedSession('all');
        setSelectedNiveau('all');
        setSelectedFiliere('all');
        setSelectedSerieBac('all');
        setMinFrais('');
        setMaxFrais('');
        setCurrentPage(1);
    };
    
    const activeFiltersCount = [
        searchTerm !== '',
        selectedEtablissement !== 'all',
        selectedStatus !== 'all',
        selectedSession !== 'all',
        selectedNiveau !== 'all',
        selectedFiliere !== 'all',
        selectedSerieBac !== 'all',
        minFrais !== '',
        maxFrais !== ''
    ].filter(Boolean).length;

    const getStatusBadge = (stacnc: string) => {
        switch (stacnc) {
            case '1':
                return <Badge className="bg-green-500">Ouvert</Badge>;
            case '2':
                return <Badge className="bg-orange-500">Fermé</Badge>;
            case '3':
                return <Badge className="bg-red-500">Terminé</Badge>;
            default:
                return <Badge variant="secondary">Inconnu</Badge>;
        }
    };

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('fr-FR');
        } catch {
            return dateString;
        }
    };

    const handlePostuler = (concoursId: number) => {
        navigate(`/candidature/${concoursId}`);
    };
    const voirPlus = (concoursId: number) => {
        navigate(`/concours/${concoursId}`);
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="flex justify-center items-center min-h-[400px]">
                    <div className="text-center">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                        <p>Chargement des concours...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="text-center py-12">
                    <p className="text-red-500">Erreur lors du chargement des concours</p>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-4">
                        Concours Disponibles
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                        Découvrez les concours publics ouverts et postulez en quelques étapes simples
                    </p>
                </div>

                {/* Barre de recherche et bouton filtres */}
                <div className="mb-6 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                placeholder="Rechercher un concours ou un établissement..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                            className="relative"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filtres
                            {activeFiltersCount > 0 && (
                                <Badge className="ml-2 bg-blue-500 text-white">
                                    {activeFiltersCount}
                                </Badge>
                            )}
                        </Button>
                        {activeFiltersCount > 0 && (
                            <Button variant="ghost" onClick={clearFilters}>
                                <X className="h-4 w-4 mr-2" />
                                Réinitialiser
                            </Button>
                        )}
                    </div>

                    {/* Panneau de filtres */}
                    {showFilters && (
                        <Card className="p-6 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Établissement</label>
                                    <Select value={selectedEtablissement} onValueChange={setSelectedEtablissement}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tous les établissements" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tous les établissements</SelectItem>
                                            {etablissements.map((etab) => (
                                                <SelectItem key={etab} value={etab}>
                                                    {etab}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Statut</label>
                                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tous les statuts" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tous les statuts</SelectItem>
                                            <SelectItem value="1">Ouvert</SelectItem>
                                            <SelectItem value="2">Fermé</SelectItem>
                                            <SelectItem value="3">Terminé</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Session</label>
                                    <Select value={selectedSession} onValueChange={setSelectedSession}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Toutes les sessions" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Toutes les sessions</SelectItem>
                                            {sessions.map((session) => (
                                                <SelectItem key={session} value={session}>
                                                    {session}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Niveau</label>
                                    <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Tous les niveaux" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Tous les niveaux</SelectItem>
                                            {niveaux.map((niveau) => (
                                                <SelectItem key={niveau} value={niveau}>
                                                    {niveau}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Filière</label>
                                    <Select value={selectedFiliere} onValueChange={setSelectedFiliere}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Toutes les filières" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Toutes les filières</SelectItem>
                                            {allFilieres.map((filiere: any) => (
                                                <SelectItem key={filiere.id} value={filiere.id.toString()}>
                                                    {filiere.nomfil}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Série du Bac</label>
                                    <Select value={selectedSerieBac} onValueChange={setSelectedSerieBac}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Toutes les séries" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Toutes les séries</SelectItem>
                                            <SelectItem value="Série A">Série A</SelectItem>
                                            <SelectItem value="Série C">Série C</SelectItem>
                                            <SelectItem value="Série D">Série D</SelectItem>
                                            <SelectItem value="Série E">Série E</SelectItem>
                                            <SelectItem value="Série F">Série F</SelectItem>
                                            <SelectItem value="Série G">Série G</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Pour concours de 1ère année</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Frais minimum (FCFA)</label>
                                    <Input
                                        type="number"
                                        placeholder="0"
                                        value={minFrais}
                                        onChange={(e) => setMinFrais(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Frais maximum (FCFA)</label>
                                    <Input
                                        type="number"
                                        placeholder="100000"
                                        value={maxFrais}
                                        onChange={(e) => setMaxFrais(e.target.value)}
                                    />
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Résultats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <p>
                            {filteredConcours.length} concours trouvé{filteredConcours.length > 1 ? 's' : ''}
                            {activeFiltersCount > 0 && ` (${activeFiltersCount} filtre${activeFiltersCount > 1 ? 's' : ''} actif${activeFiltersCount > 1 ? 's' : ''})`}
                        </p>
                        {totalPages > 1 && (
                            <p>
                                Page {currentPage} sur {totalPages}
                            </p>
                        )}
                    </div>
                </div>

                {paginatedConcours.length === 0 ? (
                    <div className="text-center py-12">
                        <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                        <h3 className="text-xl font-semibold mb-2">Aucun concours trouvé</h3>
                        <p className="text-muted-foreground mb-4">
                            {activeFiltersCount > 0 
                                ? 'Essayez de modifier vos critères de recherche'
                                : 'Aucun concours n\'est actuellement disponible'}
                        </p>
                        {activeFiltersCount > 0 && (
                            <Button onClick={clearFilters} variant="outline">
                                Réinitialiser les filtres
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {paginatedConcours.map((concour: ConcoursType) => (
                                <Card key={concour.id} className="hover:shadow-lg transition-shadow duration-200">
                                    <CardHeader>
                                        <div className="flex justify-between items-start mb-2">
                                            <CardTitle className="text-lg font-bold line-clamp-2">
                                                {concour.libcnc}
                                            </CardTitle>
                                            {getStatusBadge(concour.stacnc)}
                                        </div>
                                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                                            <MapPin className="h-4 w-4"/>
                                            <span>{concour.etablissement_nomets}</span>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="h-4 w-4 text-primary"/>
                                                <div>
                                                    <p className="font-medium">Session</p>
                                                    <p className="text-muted-foreground">{concour.sescnc}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <GraduationCap className="h-4 w-4 text-primary"/>
                                                <div>
                                                    <p className="font-medium">Niveau</p>
                                                    <p className="text-muted-foreground">{concour.niveau_nomniv}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Clock className="h-4 w-4 text-primary"/>
                                                <div>
                                                    <p className="font-medium">Début</p>
                                                    <p className="text-muted-foreground">{formatDate(concour.debcnc)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Clock className="h-4 w-4 text-primary"/>
                                                <div>
                                                    <p className="font-medium">Fin</p>
                                                    <p className="text-muted-foreground">{formatDate(concour.fincnc)}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <Users className="h-4 w-4 text-primary"/>
                                                <div>
                                                    <p className="font-medium">Âge limite</p>
                                                    <p className="text-muted-foreground">{concour.agecnc} ans</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                <DollarSign className="h-4 w-4 text-primary"/>
                                                <div>
                                                    <p className="font-medium">Frais</p>
                                                    <p className="text-muted-foreground">{parseInt(String(concour.fracnc)).toLocaleString()} FCFA</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <div className="pt-4 border-t flex-1">
                                                <Button
                                                    onClick={() => handlePostuler(concour.id)}
                                                    className="w-full bg-primary hover:bg-primary/90"
                                                    disabled={concour.stacnc !== '1'}
                                                >
                                                    {concour.stacnc === '1' ? 'Postuler' : 'Fermé'}
                                                </Button>
                                            </div>
                                            <div className="pt-4 border-t flex-1">
                                                <Button
                                                    onClick={() => voirPlus(concour.id)}
                                                    variant="outline"
                                                    className="w-full"
                                                >
                                                    Détails
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-8 flex items-center justify-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Précédent
                                </Button>
                                
                                <div className="flex gap-1">
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                                        // Afficher seulement quelques pages autour de la page actuelle
                                        if (
                                            page === 1 ||
                                            page === totalPages ||
                                            (page >= currentPage - 1 && page <= currentPage + 1)
                                        ) {
                                            return (
                                                <Button
                                                    key={page}
                                                    variant={currentPage === page ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={() => setCurrentPage(page)}
                                                    className="w-10"
                                                >
                                                    {page}
                                                </Button>
                                            );
                                        } else if (
                                            page === currentPage - 2 ||
                                            page === currentPage + 2
                                        ) {
                                            return <span key={page} className="px-2">...</span>;
                                        }
                                        return null;
                                    })}
                                </div>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Suivant
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Layout>
    );
};

export default Concours;
