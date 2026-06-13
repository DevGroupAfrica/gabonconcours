// import React, {useState, useEffect} from 'react';
// import {useQuery} from '@tanstack/react-query';
// import {adminConcoursService} from '@/services/adminConcoursService';
// import {adminCandidatureService} from '@/services/adminCandidatureService';
// import {useAdminAuth} from '@/contexts/AdminAuthContext';
// import {apiService} from '@/services/api';
// import {
//     Card,
//     CardContent,
//     CardHeader,
//     CardTitle,
// } from "@/components/ui/card";
// import {Button} from '@/components/ui/button';
// import {ArrowLeft} from 'lucide-react';
// import CandidatesList from './CandidatesList';
// import AdminNavigation from "@/components/admin/AdminNavigation.tsx";
// import {adminApiService} from "@/services/adminApi.ts";
// import {id} from "date-fns/locale";
//
// interface ConcoursCardProps {
//
//     concours: any;
//     onSelect: () => void;
// }
//
// const ConcoursCard: React.FC<ConcoursCardProps> = ({concours, onSelect}) => {
//     return (
//         <Card className="cursor-pointer hover:shadow-md transition-shadow duration-300" onClick={onSelect}>
//             <CardHeader>
//                 <CardTitle>{concours.libcnc}</CardTitle>
//             </CardHeader>
//             <CardContent>
//                 <p className="text-sm text-muted-foreground">Session: {concours.sescnc}</p>
//                 <p className="text-sm text-muted-foreground">
//                     Date limite: {new Date(concours.fincnc).toLocaleDateString()}
//                 </p>
//             </CardContent>
//         </Card>
//     );
// };
//
// const ConcoursBasedDashboard = () => {
//     const {admin, token, isLoading} = useAdminAuth();
//     const [selectedConcours, setSelectedConcours] = useState<number | null>(null);
//
//     // Définir le token dans apiService
//     useEffect(() => {
//         if (token) {
//             apiService.setToken(token);
//         }
//     }, [token]);
//
//     // Wait for auth loading to complete
//     if (isLoading) {
//         return (
//             <div className="flex justify-center items-center h-64">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
//             </div>
//         );
//     }
//
//     // eslint-disable-next-line react-hooks/rules-of-hooks
//     const {data: concours, isLoading: isLoadingConcours} = useQuery({
//         queryKey: ['adminConcours', admin?.etablissement_id],
//         queryFn: () => adminConcoursService.getConcoursByEtablissement(admin?.etablissement_id || 0),
//         enabled: !!admin?.etablissement_id && !!token,
//         retry: 2,
//     });
//
//
//     // const { data: candidatsData,isLoading: isLoadingCandidatures } = useQuery({
//     //     queryKey: ['admin-candidats-concours', selectedConcours?.id],
//     //     queryFn: () => adminApiService.getCandidatsByConcours(selectedConcours!.id),
//     //     enabled: !!selectedConcours && !!token,
//     //     retry: 2,
//     // });
//
//
//   //  eslint-disable-next-line react-hooks/rules-of-hooks
//     const {data: candidatsData, isLoading: isLoadingCandidatures} = useQuery({
//         queryKey: ['admin-candidats-concours', selectedConcours?.id],
//         queryFn: () => adminApiService.getCandidatsByConcours(selectedConcours!),
//         enabled: !!selectedConcours && !!token, // Assure que la requête ne se lance que si selectedConcours est défini
//         retry: 2,
//     });
//
//     // Statistiques des candidatures
//     const getStatistiques = () => {
//         if (!candidatsData || !Array.isArray(candidatsData)) {
//             return {
//                 total: 0,
//                 enAttente: 0,
//                 valides: 0,
//                 rejetes: 0,
//             };
//         }
//         return {
//             total: candidatsData.length,
//             enAttente: candidatsData.filter((c: any) => c.statut === 'en_attente').length,
//             valides: candidatsData.filter((c: any) => c.statut === 'valide').length,
//             rejetes: candidatsData.filter((c: any) => c.statut === 'rejete').length,
//         };
//     };
//
//     // Statistiques des paiements
//     const getStatistiquesPaiements = () => {
//         if (!candidatsData || !Array.isArray(candidatsData)) {
//             return {
//                 total: 0,
//                 payes: 0,
//                 enAttente: 0,
//             };
//         }
//         return {
//             total: candidatsData.length,
//             payes: candidatsData.filter((c: any) => c.paiement?.statut === 'valide').length,
//             enAttente: candidatsData.filter((c: any) => c.paiement?.statut === 'en_attente' || !c.paiement).length,
//         };
//     };
//
//     // Statistiques des documents
//     const getStatistiquesDocuments = () => {
//         if (!candidatsData || !Array.isArray(candidatsData)) {
//             return {
//                 total: 0,
//                 complets: 0,
//                 incomplets: 0,
//             };
//         }
//         return {
//             total: candidatsData.length,
//             complets: candidatsData.filter((c: any) => c.documents_count >= 4).length,
//             incomplets: candidatsData.filter((c: any) => !c.documents_count || c.documents_count < 4).length,
//         };
//     };
//
//     const stats = getStatistiques();
//     const statsPaiements = getStatistiquesPaiements();
//     const statsDocuments = getStatistiquesDocuments();
//
//     if (isLoadingConcours) {
//         return (
//             <div className="flex justify-center items-center h-64">
//                 <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
//             </div>
//         );
//     }
//
//     // Vue des concours (lorsque selectedConcours est null)
//     if (!selectedConcours) {
//         return (
//             <div className="space-y-6">
//
//                 <div>
//                     <h1 className="text-2xl font-bold">Dashboard - Concours</h1>
//                     <p className="text-muted-foreground">
//                         Gérez les candidatures par concours de votre établissement
//                     </p>
//                 </div>
//
//                 {/* Grille des concours */}
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//                     {concours && Array.isArray(concours) ? (
//                         concours.map((c: any) => (
//                             <ConcoursCard
//                                 key={c.id}
//                                 concours={c}
//                                 onSelect={() => setSelectedConcours(c.id)}
//                             />
//                         ))
//                     ) : (
//                         <div className="col-span-full text-center py-8 text-muted-foreground">
//                             Aucun concours trouvé pour votre établissement
//                         </div>
//                     )}
//                 </div>
//             </div>
//         );
//     }
//
//     // Vue détaillée d'un concours (lorsque selectedConcours est défini)
//     const concoursSelectionne = Array.isArray(concours) ? concours.find((c: any) => c.id === selectedConcours) : null;
//
//     return (
//
//         <div className="space-y-6">
//
//             {/* En-tête avec retour */}
//             <div className="flex items-center space-x-4">
//                 <Button
//                     variant="ghost"
//                     onClick={() => setSelectedConcours(null)} // Réinitialise l'état pour revenir à la liste
//                 >
//                     <ArrowLeft className="h-4 w-4 mr-2"/>
//                     Retour aux concours
//                 </Button>
//                 <div>
//                     <h1 className="text-2xl font-bold">{concoursSelectionne?.libcnc}</h1>
//                     <p className="text-muted-foreground">
//                         Session {concoursSelectionne?.sescnc}
//                     </p>
//                 </div>
//             </div>
//
//             {/* Statistiques */}
//             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                 <Card>
//                     <CardHeader className="pb-2">
//                         <CardTitle className="text-sm">Total Candidatures</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="text-2xl font-bold">{stats.total}</div>
//                     </CardContent>
//                 </Card>
//
//                 <Card>
//                     <CardHeader className="pb-2">
//                         <CardTitle className="text-sm">En Attente</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="text-2xl font-bold text-orange-600">{stats.enAttente}</div>
//                     </CardContent>
//                 </Card>
//
//                 <Card>
//                     <CardHeader className="pb-2">
//                         <CardTitle className="text-sm">Validées</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="text-2xl font-bold text-green-600">{stats.valides}</div>
//                     </CardContent>
//                 </Card>
//
//                 <Card>
//                     <CardHeader className="pb-2">
//                         <CardTitle className="text-sm">Rejetées</CardTitle>
//                     </CardHeader>
//                     <CardContent>
//                         <div className="text-2xl font-bold text-red-600">{stats.rejetes}</div>
//                     </CardContent>
//                 </Card>
//             </div>
//
//             {/* Liste des candidats */}
//             <Card>
//                 <CardHeader>
//                     <CardTitle>Liste des Candidats</CardTitle>
//                 </CardHeader>
//                 <CardContent>
//                     {isLoadingCandidatures ? (
//                         <div className="text-center py-4">
//                             <div
//                                 className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
//                             <p>Chargement des candidatures...</p>
//                         </div>
//                     ) : (
//                         <CandidatesList />
//                     )}
//                 </CardContent>
//             </Card>
//         </div>
//     );
// };
//
// export default ConcoursBasedDashboard;



import React, {useState, useEffect} from 'react';
import {useQuery} from '@tanstack/react-query';
import {adminConcoursService} from '@/services/adminConcoursService';
import {adminCandidatureService} from '@/services/adminCandidatureService';
import {useAdminAuth} from '@/contexts/AdminAuthContext';
import {apiService} from '@/services/api';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {Button} from '@/components/ui/button';
import {ArrowLeft} from 'lucide-react';
import CandidatesList from './CandidatesList';
import AdminNavigation from "@/components/admin/AdminNavigation.tsx";

interface ConcoursCardProps {

    concours: any;
    onSelect: () => void;
}

const ConcoursCard: React.FC<ConcoursCardProps> = ({concours, onSelect}) => {
    return (
        <Card className="cursor-pointer hover:shadow-md transition-shadow duration-300" onClick={onSelect}>
            <CardHeader>
                <CardTitle>{concours.libcnc}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Session: {concours.sescnc}</p>
                <p className="text-sm text-muted-foreground">
                    Date limite: {new Date(concours.fincnc).toLocaleDateString()}
                </p>
            </CardContent>
        </Card>
    );
};

const ConcoursBasedDashboard = () => {
    const {admin, token, isLoading} = useAdminAuth();
    const [selectedConcours, setSelectedConcours] = useState<number | null>(null);

    // Définir le token dans apiService
    useEffect(() => {
        if (token) {
            apiService.setToken(token);
        }
    }, [token]);

    // Wait for auth loading to complete
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const {data: concours, isLoading: isLoadingConcours} = useQuery({
        queryKey: ['adminConcours', admin?.etablissement_id],
        queryFn: () => adminConcoursService.getConcoursByEtablissement(admin?.etablissement_id || 0),
        enabled: !!admin?.etablissement_id && !!token,
        retry: 2,
    });

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const {data: candidatures, isLoading: isLoadingCandidatures} = useQuery({
        queryKey: ['adminCandidatures', selectedConcours],
        queryFn: () => adminCandidatureService.getAllCandidaturesByConcours(selectedConcours!),
        enabled: !!selectedConcours && !!token, // Assure que la requête ne se lance que si selectedConcours est défini
        retry: 2,
    });

    // Statistiques des candidatures
    const getStatistiques = () => {
        if (!candidatures || !Array.isArray(candidatures)) {
            return {
                total: 0,
                enAttente: 0,
                valides: 0,
                rejetes: 0,
            };
        }
        return {
            total: candidatures.length,
            enAttente: candidatures.filter((c: any) => c.statut === 'en_attente').length,
            valides: candidatures.filter((c: any) => c.statut === 'valide').length,
            rejetes: candidatures.filter((c: any) => c.statut === 'rejete').length,
        };
    };

    // Statistiques des paiements
    const getStatistiquesPaiements = () => {
        if (!candidatures || !Array.isArray(candidatures)) {
            return {
                total: 0,
                payes: 0,
                enAttente: 0,
            };
        }
        return {
            total: candidatures.length,
            payes: candidatures.filter((c: any) => c.paiement?.statut === 'valide').length,
            enAttente: candidatures.filter((c: any) => c.paiement?.statut === 'en_attente' || !c.paiement).length,
        };
    };

    // Statistiques des documents
    const getStatistiquesDocuments = () => {
        if (!candidatures || !Array.isArray(candidatures)) {
            return {
                total: 0,
                complets: 0,
                incomplets: 0,
            };
        }
        return {
            total: candidatures.length,
            complets: candidatures.filter((c: any) => c.documents_count >= 4).length,
            incomplets: candidatures.filter((c: any) => !c.documents_count || c.documents_count < 4).length,
        };
    };

    const stats = getStatistiques();
    const statsPaiements = getStatistiquesPaiements();
    const statsDocuments = getStatistiquesDocuments();

    if (isLoadingConcours) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    // Vue des concours (lorsque selectedConcours est null)
    if (!selectedConcours) {
        return (
            <div className="space-y-6">

                <div>
                    <h1 className="text-2xl font-bold">Dashboard - Concours</h1>
                    <p className="text-muted-foreground">
                        Gérez les candidatures par concours de votre établissement
                    </p>
                </div>

                {/* Grille des concours */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {concours && Array.isArray(concours) ? (
                        concours.map((c: any) => (
                            <ConcoursCard
                                key={c.id}
                                concours={c}
                                onSelect={() => setSelectedConcours(c.id)}
                            />
                        ))
                    ) : (
                        <div className="col-span-full text-center py-8 text-muted-foreground">
                            Aucun concours trouvé pour votre établissement
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // Vue détaillée d'un concours (lorsque selectedConcours est défini)
    const concoursSelectionne = Array.isArray(concours) ? concours.find((c: any) => c.id === selectedConcours) : null;

    return (

        <div className="space-y-6">

            {/* En-tête avec retour */}
            <div className="flex items-center space-x-4">
                <Button
                    variant="ghost"
                    onClick={() => setSelectedConcours(null)} 
                >
                    <ArrowLeft className="h-4 w-4 mr-2"/>
                    Retour aux concours
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">{concoursSelectionne?.libcnc}</h1>
                    <p className="text-muted-foreground">
                        Session {concoursSelectionne?.sescnc}
                    </p>
                </div>
            </div>

            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Total Candidatures</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">En Attente</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.enAttente}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Validées</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.valides}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Rejetées</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{stats.rejetes}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Liste des candidats */}
            <Card>
                <CardHeader>
                    <CardTitle>Liste des Candidats</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingCandidatures ? (
                        <div className="text-center py-4">
                            <div
                                className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                            <p>Chargement des candidatures...</p>
                        </div>
                    ) : (
                        <CandidatesList
                            candidats={candidatures || []}
                            isLoading={isLoadingCandidatures}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default ConcoursBasedDashboard;