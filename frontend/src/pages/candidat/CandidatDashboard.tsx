import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { 
    User, FileText, CreditCard, MessageSquare, 
    Bell, Download, CheckCircle, Clock, XCircle,
    BookOpen, BarChart
} from 'lucide-react';
import { apiService } from '@/services/api';
import { useNavigate } from 'react-router-dom';

const CandidatDashboard = () => {
    const navigate = useNavigate();
    const [candidat, setCandidat] = useState<any>(null);
    const [documents, setDocuments] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [moyenne, setMoyenne] = useState<string | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    const nupcan = localStorage.getItem('nupcan');

    useEffect(() => {
        if (!nupcan) {
            navigate('/candidat/login');
            return;
        }
        fetchCandidatData();
    }, [nupcan]);

    const fetchCandidatData = async () => {
        try {
            setLoading(true);
            
            // Récupérer les infos du candidat
            const candidatResponse = await apiService.makeRequest(`/candidats/nupcan/${nupcan}`, 'GET');
            if (candidatResponse.success) {
                setCandidat(candidatResponse.data);
            }
            
            // Récupérer les documents
            const docsResponse = await apiService.makeRequest(`/documents/nupcan/${nupcan}`, 'GET');
            if (docsResponse.success) {
                setDocuments(Array.isArray(docsResponse.data) ? docsResponse.data : []);
            }
            
            // Récupérer les notes
            const notesResponse = await apiService.makeRequest(`/notes/nupcan/${nupcan}`, 'GET');
            if (notesResponse.success && notesResponse.data) {
                const notesData = notesResponse.data as any;
                setNotes(Array.isArray(notesData.notes) ? notesData.notes : []);
                setMoyenne(notesData.moyenne || null);
            }
            
            // Récupérer les messages
            const messagesResponse = await apiService.makeRequest(`/messages/candidat/${nupcan}`, 'GET');
            if (messagesResponse.success) {
                setMessages(Array.isArray(messagesResponse.data) ? messagesResponse.data : []);
            }
            
            // Récupérer les notifications
            const notifResponse = await apiService.makeRequest(`/notifications/candidat/${nupcan}`, 'GET');
            if (notifResponse.success) {
                setNotifications(Array.isArray(notifResponse.data) ? notifResponse.data : []);
            }
        } catch (error) {
            console.error('Erreur chargement données:', error);
            toast({
                title: 'Erreur',
                description: 'Impossible de charger vos données',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (statut: string) => {
        switch (statut) {
            case 'valide':
                return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1"/>Validé</Badge>;
            case 'rejete':
                return <Badge className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1"/>Rejeté</Badge>;
            case 'en_attente':
                return <Badge className="bg-orange-100 text-orange-800"><Clock className="h-3 w-3 mr-1"/>En attente</Badge>;
            default:
                return <Badge variant="secondary">Inconnu</Badge>;
        }
    };

    const calculateProgress = () => {
        if (!candidat) return 0;
        
        let progress = 0;
        
        // Candidature complétée : 33%
        if (candidat.nomcan && candidat.prncan) progress += 33;
        
        // Documents uploadés : 33%
        const validDocs = documents.filter(d => d.statut === 'valide').length;
        if (validDocs > 0) progress += 33;
        
        // Paiement effectué : 34%
        if (candidat.paiement_statut === 'valide') progress += 34;
        
        return progress;
    };

    const handleLogout = () => {
        localStorage.removeItem('nupcan');
        navigate('/candidat/login');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">
                                Bienvenue, {candidat?.prncan} {candidat?.nomcan}
                            </h1>
                            <p className="text-muted-foreground">
                                NUPCAN: {nupcan}
                            </p>
                        </div>
                        <Button variant="outline" onClick={handleLogout}>
                            Déconnexion
                        </Button>
                    </div>
                    
                    {/* Barre de progression */}
                    <Card className="mt-4">
                        <CardContent className="pt-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span>Progression de votre candidature</span>
                                    <span className="font-medium">{calculateProgress()}%</span>
                                </div>
                                <Progress value={calculateProgress()} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>Inscription</span>
                                    <span>Documents</span>
                                    <span>Paiement</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="overview">
                            <User className="h-4 w-4 mr-2" />
                            Vue d'ensemble
                        </TabsTrigger>
                        <TabsTrigger value="documents">
                            <FileText className="h-4 w-4 mr-2" />
                            Documents ({documents.length})
                        </TabsTrigger>
                        <TabsTrigger value="notes">
                            <BookOpen className="h-4 w-4 mr-2" />
                            Résultats
                        </TabsTrigger>
                        <TabsTrigger value="messages">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Messages ({messages.length})
                        </TabsTrigger>
                    </TabsList>

                    {/* Vue d'ensemble */}
                    <TabsContent value="overview" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Documents</CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{documents.length}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {documents.filter(d => d.statut === 'valide').length} validés
                                    </p>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Messages</CardTitle>
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{messages.length}</div>
                                    <p className="text-xs text-muted-foreground">
                                        {messages.filter(m => m.statut === 'non_lu' && m.expediteur === 'admin').length} non lus
                                    </p>
                                </CardContent>
                            </Card>
                            
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between pb-2">
                                    <CardTitle className="text-sm font-medium">Moyenne</CardTitle>
                                    <BarChart className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {moyenne ? `${moyenne}/20` : 'N/A'}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        {notes.length} note(s)
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Notifications récentes */}
                        {notifications.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Bell className="h-5 w-5" />
                                        Notifications récentes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {notifications.slice(0, 5).map((notif) => (
                                            <div key={notif.id} className="flex items-start gap-3 p-3 border rounded-lg">
                                                <Bell className="h-5 w-5 text-primary mt-0.5" />
                                                <div className="flex-1">
                                                    <p className="font-medium">{notif.titre}</p>
                                                    <p className="text-sm text-muted-foreground">{notif.message}</p>
                                                    <p className="text-xs text-muted-foreground mt-1">
                                                        {new Date(notif.created_at).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* Documents */}
                    <TabsContent value="documents">
                        <Card>
                            <CardHeader>
                                <CardTitle>Mes documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {documents.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        Aucun document soumis
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {documents.map((doc) => (
                                            <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex items-center gap-4">
                                                    <FileText className="h-8 w-8 text-blue-500" />
                                                    <div>
                                                        <p className="font-medium">{doc.nomdoc}</p>
                                                        <p className="text-sm text-muted-foreground">{doc.type}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(doc.statut)}
                                                    <Button variant="outline" size="sm">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Notes */}
                    <TabsContent value="notes">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center justify-between">
                                    <span>Mes résultats</span>
                                    {moyenne && (
                                        <Badge variant="outline" className="text-lg px-4 py-1">
                                            Moyenne: {moyenne}/20
                                        </Badge>
                                    )}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {notes.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        Vos résultats ne sont pas encore disponibles
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b">
                                                    <th className="text-left p-2">Matière</th>
                                                    <th className="text-center p-2">Note</th>
                                                    <th className="text-center p-2">Coefficient</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {notes.map((note) => (
                                                    <tr key={note.id} className="border-b">
                                                        <td className="p-2">{note.nom_matiere}</td>
                                                        <td className="text-center p-2 font-medium">{note.note}/20</td>
                                                        <td className="text-center p-2">{note.coefficient}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Messages */}
                    <TabsContent value="messages">
                        <Card>
                            <CardHeader>
                                <CardTitle>Mes messages</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {messages.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        Aucun message
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((msg) => (
                                            <div key={msg.id} className="p-4 border rounded-lg">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="font-medium">{msg.sujet}</p>
                                                        <p className="text-sm text-muted-foreground mt-1">{msg.message}</p>
                                                    </div>
                                                    <Badge variant={msg.expediteur === 'admin' ? 'default' : 'secondary'}>
                                                        {msg.expediteur === 'admin' ? 'Administration' : 'Vous'}
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    {new Date(msg.created_at).toLocaleString('fr-FR')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
};

export default CandidatDashboard;
