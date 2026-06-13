import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, XCircle, Clock, Download, Upload, MessageCircle } from 'lucide-react';
import { ProgressBar } from '@/components/ProgressBar';
import MessagerieCandidat from '@/components/MessagerieCandidat';
import { apiService } from '@/services/api';
import { toast } from '@/hooks/use-toast';

const CandidatDashboard = () => {
    const [searchParams] = useSearchParams();
    const nupcan = searchParams.get('nupcan');
    const [candidat, setCandidat] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [showMessaging, setShowMessaging] = useState(false);

    useEffect(() => {
        if (nupcan) {
            loadCandidatData();
        }
    }, [nupcan]);

    const loadCandidatData = async () => {
        try {
            setLoading(true);
            const response = await apiService.getCandidatByNupcan(nupcan!);
            if (response.success) {
                setCandidat(response.data);
            }
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible de charger vos données',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReplaceDocument = async (documentId: number, file: File) => {
        const formData = new FormData();
        formData.append('document', file);

        try {
            const response = await apiService.replaceDocument(documentId, formData);
            if (response.success) {
                toast({
                    title: 'Document remplacé',
                    description: 'Votre document a été soumis pour validation'
                });
                await loadCandidatData();
            }
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible de remplacer le document',
                variant: 'destructive'
            });
        }
    };

    const handleDeleteDocument = async (documentId: number) => {
        try {
            const response = await apiService.deleteDocument(documentId);
            if (response.success) {
                toast({
                    title: 'Document supprimé',
                    description: 'Le document a été supprimé avec succès'
                });
                await loadCandidatData();
            }
        } catch (error) {
            toast({
                title: 'Erreur',
                description: 'Impossible de supprimer le document',
                variant: 'destructive'
            });
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'valide':
                return <Badge className="bg-green-100 text-green-800 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Validé</Badge>;
            case 'rejete':
                return <Badge className="bg-red-100 text-red-800 border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejeté</Badge>;
            case 'en_attente':
                return <Badge className="bg-orange-100 text-orange-800 border-orange-200"><Clock className="h-3 w-3 mr-1" />En attente</Badge>;
            default:
                return <Badge variant="secondary">Inconnu</Badge>;
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-lg">Chargement...</p>
            </div>
        );
    }

    if (!candidat) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="p-6">
                        <p className="text-center text-red-600">Candidat non trouvé</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* En-tête */}
                <Card className="border-l-4 border-l-primary">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold gradient-text">
                                    {candidat.prncan} {candidat.nomcan}
                                </h1>
                                <p className="text-sm text-muted-foreground">NUPCAN: {candidat.nupcan}</p>
                            </div>
                            <Button onClick={() => setShowMessaging(!showMessaging)} variant="outline">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                {showMessaging ? 'Fermer' : 'Messages'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Barre de progression */}
                <ProgressBar
                    currentStep={candidat.progression?.etapeActuelle || 'inscription'}
                />

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Colonne principale */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Informations du concours */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Informations du Concours</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Concours</p>
                                        <p className="font-medium">{candidat.concours?.libcnc || 'Non spécifié'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Filière</p>
                                        <p className="font-medium">{candidat.filiere?.nomfil || 'Non spécifiée'}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Documents */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Mes Documents
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {!candidat.documents || candidat.documents.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        Aucun document soumis
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {candidat.documents.map((doc: any) => (
                                            <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex-1">
                                                    <p className="font-medium">{doc.nomdoc}</p>
                                                    <p className="text-sm text-muted-foreground">{doc.type}</p>
                                                    {doc.commentaire_validation && (
                                                        <p className="text-sm text-red-600 mt-1">
                                                            Commentaire: {doc.commentaire_validation}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getStatusBadge(doc.statut)}

                                                    {doc.statut === 'rejete' && (
                                                        <label className="cursor-pointer">
                                                            <Button size="sm" variant="outline" asChild>
                                                                <span>
                                                                    <Upload className="h-4 w-4 mr-1" />
                                                                    Remplacer
                                                                </span>
                                                            </Button>
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                onChange={(e) => {
                                                                    const file = e.target.files?.[0];
                                                                    if (file) handleReplaceDocument(doc.id, file);
                                                                }}
                                                            />
                                                        </label>
                                                    )}

                                                    {doc.statut !== 'valide' && (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="text-red-600"
                                                            onClick={() => handleDeleteDocument(doc.id)}
                                                        >
                                                            Supprimer
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Paiement */}
                        {candidat.paiement && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Paiement</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 border rounded-lg">
                                            <div>
                                                <p className="font-medium">{candidat.paiement.montant} FCFA</p>
                                                <p className="text-sm text-muted-foreground">
                                                    Méthode: {candidat.paiement.methode}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    Référence: {candidat.paiement.reference_paiement}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {getStatusBadge(candidat.paiement.statut)}
                                                <Button size="sm" variant="outline">
                                                    <Download className="h-4 w-4 mr-1" />
                                                    Reçu
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Colonne latérale */}
                    <div className="space-y-6">
                        {showMessaging && (
                            <MessagerieCandidat nupcan={nupcan || ''} />
                        )}

                        <Card>
                            <CardHeader>
                                <CardTitle>Informations Personnelles</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Email</p>
                                    <p className="font-medium">{candidat.maican}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Téléphone</p>
                                    <p className="font-medium">{candidat.telcan}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Date de naissance</p>
                                    <p className="font-medium">
                                        {new Date(candidat.dtncan).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Lieu de naissance</p>
                                    <p className="font-medium">{candidat.ldncan}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CandidatDashboard;