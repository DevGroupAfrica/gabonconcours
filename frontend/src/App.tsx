import {BrowserRouter as Router, Routes, Route, Navigate} from 'react-router-dom';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {Toaster} from '@/components/ui/toaster';
import {AdminAuthProvider, useAdminAuth} from '@/contexts/AdminAuthContext';
import {LanguageProvider} from '@/contexts/LanguageContext';

// Pages publiques
import NewIndex from '@/pages/NewIndex';


import Concours from '@/pages/Concours';
import Candidature from '@/pages/Candidature';
import ChoixFiliere from '@/pages/ChoixFiliere';
import Confirmation from '@/pages/Confirmation';
import Documents from '@/pages/Documents';
import DocumentPage from '@/pages/DocumentPage';
import DocumentsContinue from '@/pages/DocumentsContinue';
import Paiement from '@/pages/Paiement';
import PaiementContinue from '@/pages/PaiementContinue';
import Succes from '@/pages/Succes';
import SuccesContinue from '@/pages/SuccesContinue';
import Connexion from '@/pages/Connexion';
import NotFound from '@/pages/NotFound';
import StatutCandidature from '@/pages/StatutCandidature';
import DashboardCandidat from '@/pages/DashboardCandidat';
import RecapPaiement from '@/pages/RecapPaiement';
import ConcoursDetails from "@/pages/ConcoursDetails";
import GradeManagement from "@/pages/admin/GradeManagement";
import MessagerieAdmin from "@/components/admin/MessagerieAdmin";

// Pages admin
import AdminLayout from '@/components/admin/AdminLayout';
import AdminProtectedRoute from '@/components/admin/AdminProtectedRoute';
import AdminLogin from '@/pages/admin/Login';
import AdminConcours from '@/pages/admin/Concours';
import AdminConcoursDetail from '@/pages/admin/ConcoursDetail';
import AdminCandidats from '@/pages/admin/Candidats';
import SuperAdminCandidats from '@/pages/admin/CandList';
import AdminEtablissements from '@/pages/admin/Etablissements';
import AdminDossiers from '@/pages/admin/Dossiers';
import AdminPaiements from '@/pages/admin/Paiements';
import CandidateManagement from '@/pages/admin/CandidateManagement';
import GestionNiveaux from '@/pages/admin/GestionNiveaux';
import GestionFilieres from '@/pages/admin/GestionFilieres';
import GestionEtablissements from '@/pages/admin/GestionEtablissements';
import GestionAdmins from '@/pages/admin/GestionAdmins';
import Support from './components/Support';
import CandidatDashboard from '@/pages/CandidatDashboard';
import DashboardNipcan from '@/pages/candidat/DashboardNipcan';
import ConcoursFilieresManagement from '@/pages/admin/ConcoursFilieresManagement';
import FiliereMatieresManagement from '@/pages/admin/FiliereMatieresManagement';
import ConcoursBasedDashboard from "@/components/admin/ConcoursBasedDashboard.tsx";
import Dashboard from './pages/admin/Dashboard';
import SubAdminsManager from "@/components/admin/SubAdminsManager.tsx";
import AdminProfileSettings from "@/components/admin/AdminProfileSettings.tsx";
import AdminLogsView from "@/pages/admin/AdminLogsView.tsx";
import SuperAdminStatistics from "@/pages/admin/SuperAdminStatistics.tsx";
import SuperAdminSupport from "@/pages/admin/SuperAdminSupport.tsx";
import GestionSousAdmins from "@/pages/admin/GestionSousAdmins.tsx";
import Logs from "@/pages/admin/Logs.tsx";
import NewHomePage from './pages/NewHomePage';
import LoginCandidat from './pages/candidat/LoginCandidat';
import StatistiquesPage from './pages/admin/StatistiquesPage';
import LogsPage from './pages/admin/LogsPage';
import LogsPageEnhanced from './pages/admin/LogsPageEnhanced';
import GestionConcoursFilieresPage from './pages/admin/GestionConcoursFilieresPage';
import MessagerieAdminPage from './pages/admin/MessagerieAdminPage';
import SousAdminsPage from './pages/admin/SousAdminsPage';
import MatieresManagementPage from './pages/admin/MatieresManagementPage';
import APropos from './pages/APropos';
import ForgotPassword from './pages/admin/ForgotPassword';
import ResetPassword from './pages/admin/ResetPassword';
import ApplicationErrorBoundary from '@/components/ApplicationErrorBoundary';


const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

// Composant pour les routes protégées super-admin
const SuperAdminRoute = ({children}: { children: React.ReactNode }) => {
    const {admin} = useAdminAuth();

    if (!admin || admin.role !== 'super_admin') {
        return <Navigate to="/admin/dashboard" replace/>;
    }

    return <>{children}</>;
};

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <AdminAuthProvider>
                    <ApplicationErrorBoundary>
                    <Router>
                    <Routes>
                        {/* Routes publiques */}
                        <Route path="/" element={<NewHomePage/>}/>
                 
                        <Route path="/about" element={<APropos/>}/>

                        <Route path="/support" element={<Support/>}/>
                        <Route path="/concours" element={<Concours/>}/>
                        <Route path="/concours/:concoursId" element={<ConcoursDetails/>}/>

                        {/* Routes pour nouvelles candidatures avec filières */}
                        <Route path="/candidature/:concoursId" element={<ChoixFiliere/>}/>
                        <Route path="/candidature/:concoursId/filiere/:filiereId" element={<Candidature/>}/>

                        <Route path="/confirmation/:numeroCandidature" element={<Confirmation/>}/>
                        <Route path="/documents/:numeroCandidature" element={<Documents/>}/>
                        <Route path="/paiement/:numeroCandidature" element={<Paiement/>}/>
                        <Route path="/succes/:numeroCandidature" element={<Succes/>}/>

                        {/* Routes pour continuer candidatures existantes */}
                        <Route path="/documents/continue/:nupcan" element={<DocumentsContinue/>}/>
                        <Route path="/documentPage/:nupcan" element={<DocumentPage/>}/>
                        <Route path="/paiement/continue/:nupcan" element={<PaiementContinue/>}/>
                        <Route path="/succes-continue/:nupcan" element={<SuccesContinue/>}/>

                        {/* Routes pour statut et connexion */}
                        <Route path="/statut/:nupcan" element={<StatutCandidature/>}/>
                        <Route path="/dashboard/:nipcan" element={<DashboardNipcan/>}/>
                        <Route path="/dashboard/candidature/:nupcan" element={<DashboardCandidat/>}/>
                        <Route path="/candidat/dashboard" element={<CandidatDashboard/>}/>
                        <Route path="/recap/:nupcan" element={<RecapPaiement/>}/>
                        <Route path="/connexion" element={<LoginCandidat/>}/>


                        {/* Routes admin */}
                        <Route path="/admin/login" element={<AdminLogin/>}/>
                        <Route path="/admin/forgot-password" element={<ForgotPassword/>}/>
                        <Route path="/admin/reset-password/:token" element={<ResetPassword/>}/>
                        <Route
                            path="/admin"
                            element={
                                <AdminProtectedRoute>
                                    <AdminLayout/>


                                </AdminProtectedRoute>
                            }
                        >

                            <Route index element={<Navigate to="/admin/dashboard" replace/>}/>
                            <Route path="dashboard" element={<Dashboard/>}/>
                            <Route path="concours" element={<ConcoursBasedDashboard/>}/>
                            <Route path="concour" element={<AdminConcours/>}/>
                            <Route path="concour/:id" element={<AdminConcoursDetail/>}/>
                            <Route path="candidats" element={<AdminCandidats/>}/>  
                             <Route path="candList" element={<SuperAdminCandidats/>}/>
                            <Route path="candidats/:nupcan" element={<CandidateManagement/>}/>
                            <Route path="etablissements" element={<AdminEtablissements/>}/>
                            <Route path="dossiers" element={<AdminDossiers/>}/>
                            <Route path="paiements" element={<AdminPaiements/>}/>
                            <Route path="niveaux" element={<GestionNiveaux/>}/>
                            <Route path="filieres" element={<GestionFilieres/>}/>
                            <Route path="notes" element={<GradeManagement/>}/>
                            <Route path="messagerie" element={<MessagerieAdmin/>}/>
                            <Route path="sous-admins" element={<GestionSousAdmins/>}/>
                            <Route path="profile" element={<AdminProfileSettings />} />




                            {/* Routes réservées au super-admin */}
                            <Route path="gestion-admins" element={
                                <SuperAdminRoute>
                                    <GestionAdmins/>
                                </SuperAdminRoute>
                            }/>

                            <Route path="gestion-etablissements" element={
                                <SuperAdminRoute>
                                    <GestionEtablissements/>
                                </SuperAdminRoute>
                            }/>
                            
                            <Route path="concours-filieres" element={
                                <SuperAdminRoute>
                                    <ConcoursFilieresManagement/>
                                </SuperAdminRoute>
                            }/>

                            <Route path="filiere-matieres" element={
                                <SuperAdminRoute>
                                    <FiliereMatieresManagement/>
                                </SuperAdminRoute>
                            }/>


                            <Route path="logs-admin" element={
                                <SuperAdminRoute>
                                    <AdminLogsView/>
                                </SuperAdminRoute>
                            }/>
                            <Route path="logs" element={
                                <SuperAdminRoute>
                                    <LogsPage/>
                                </SuperAdminRoute>
                            }/>
                            <Route path="statistiques" element={
                                <SuperAdminRoute>
                                    <StatistiquesPage/>
                                </SuperAdminRoute>
                            }/>
                            <Route path="concours-filieres-management" element={
                                <SuperAdminRoute>
                                    <GestionConcoursFilieresPage/>
                                </SuperAdminRoute>
                            }/>
                            <Route path="messagerie" element={<MessagerieAdminPage/>}/>
                            <Route path="sous-admins" element={<SousAdminsPage/>}/>
                            <Route path="matieres" element={<MatieresManagementPage/>}/>
                            <Route path="logs" element={<LogsPageEnhanced/>}/>
                            <Route path="support" element={
                                <SuperAdminRoute>
                                    <SuperAdminSupport/>
                                </SuperAdminRoute>
                            }/>


                        </Route>

                        <Route path="*" element={<NotFound/>}/>
                    </Routes>
                        <Toaster/>
                    </Router>
                    </ApplicationErrorBoundary>
                </AdminAuthProvider>
            </LanguageProvider>
        </QueryClientProvider>
    );
}

export default App;
