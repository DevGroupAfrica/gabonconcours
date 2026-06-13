import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { 
    ArrowLeft, User, FileText, CreditCard, 
    BookOpen, MessageSquare, Mail, Phone
} from 'lucide-react';
import { apiService } from '@/services/api';
import CandidatDocumentsManager from '@/components/admin/CandidatDocumentsManager';
import NotesManager from '@/components/admin/NotesManager';

const CandidatDetail = () => {
    const { nupcan } = useParams();
    const navigate = useNavigate();
    const [candidat, setCandidat] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (nupcan) {
            fetchCandidatData();
        }
    }, [nupcan]);

    const fetchCandidatData = async () => {
        try {
            setLoading(true);
            
            const response = await apiService.makeRequest(`/candidats/nupcan/${nupcan}`, 'GET');
            
            if (response.success) {
                setCandidat(response.data);
            } else {
                toast({
                    title: 'Erreur',
                    description: 'Impossible de charger les données du candidat',
                    variant: 'destructive'
                });
            }
        } catch (error) {
            console.error('Erreur chargement candidat:', error);
            toast({
                title: 'Erreur',
                description: 'Erreur de connexion au serveur',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!candidat) {
        return (
            <div className="container mx-auto p-6">
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Candidat non trouvé</p>
                    <Button onClick={() => navigate('/admin')} className="mt-4">
                        Retour au dashboard
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/admin')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Retour
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {candidat.prncan} {candidat.nomcan}
                        </h1>
                        <p className="text-muted-foreground">NUPCAN: {candidat.nupcan}</p>
                    </div>
                </div>
                <Badge variant="outline" className="text-sm">
                    {candidat.niveau_nomniv || 'Niveau non défini'}
                </Badge>
            </div>

            {/* Informations générales */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Informations générales
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                                <strong>Email:</strong> {candidat.maican}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">
                                <strong>Téléphone:</strong> {candidat.telcan}
                            </span>
                        </div>
                        <div className="text-sm">
                            <strong>Date de naissance:</strong> {candidat.dtncan ? new Date(candidat.dtncan).toLocaleDateString('fr-FR') : 'N/A'}
                        </div>
                        <div className="text-sm">
                            <strong>Lieu de naissance:</strong> {candidat.ldncan || 'N/A'}
                        </div>
                        <div className="text-sm">
                            <strong>Concours:</strong> {candidat.concours?.libcnc || 'N/A'}
                        </div>
                        <div className="text-sm">
                            <strong>Filière:</strong> {candidat.filiere?.nomfil || 'N/A'}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Onglets */}
            <Tabs defaultValue="documents" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="documents">
                        <FileText className="h-4 w-4 mr-2" />
                        Documents
                    </TabsTrigger>
                    <TabsTrigger value="notes">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Notes
                    </TabsTrigger>
                    <TabsTrigger value="paiement">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Paiement
                    </TabsTrigger>
                </TabsList>

                {/* Documents */}
                <TabsContent value="documents">
                    <CandidatDocumentsManager
                        candidatNupcan={candidat.nupcan}
                        candidatInfo={{
                            nom: candidat.nomcan,
                            prenom: candidat.prncan,
                            email: candidat.maican
                        }}
                        onDocumentValidated={fetchCandidatData}
                    />
                </TabsContent>

                {/* Notes */}
                <TabsContent value="notes">
                    {candidat.id && candidat.concours_id ? (
                        <NotesManager
                            candidatId={candidat.id}
                            candidatNom={candidat.nomcan}
                            candidatPrenom={candidat.prncan}
                            concoursId={candidat.concours_id}
                        />
                    ) : (
                        <Card>
                            <CardContent className="p-8 text-center text-muted-foreground">
                                <p>Le candidat doit être inscrit à un concours pour saisir les notes</p>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Paiement */}
                <TabsContent value="paiement">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informations de paiement</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {candidat.paiement ? (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <p className="font-medium">Montant</p>
                                            <p className="text-2xl font-bold">{candidat.paiement.montant || candidat.paiement.mntfrai} FCFA</p>
                                        </div>
                                        <Badge 
                                            variant={
                                                candidat.paiement.statut === 'valide' ? 'default' : 
                                                candidat.paiement.statut === 'rejete' ? 'destructive' : 
                                                'secondary'
                                            }
                                        >
                                            {candidat.paiement.statut === 'valide' ? 'Payé' :
                                             candidat.paiement.statut === 'rejete' ? 'Rejeté' : 
                                             'En attente'}
                                        </Badge>
                                    </div>
                                    <div className="text-sm space-y-2">
                                        <p><strong>Référence:</strong> {candidat.paiement.reference || 'N/A'}</p>
                                        <p><strong>Méthode:</strong> {candidat.paiement.methode || 'N/A'}</p>
                                        <p><strong>Date:</strong> {candidat.paiement.datfrai ? new Date(candidat.paiement.datfrai).toLocaleDateString('fr-FR') : 'N/A'}</p>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    Aucun paiement enregistré
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CandidatDetail;
