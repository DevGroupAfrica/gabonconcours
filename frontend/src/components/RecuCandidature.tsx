import React from 'react';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Download, User, School, Calendar, Phone, Mail, MapPin} from 'lucide-react';

interface RecuCandidatureProps {
    candidatureData: any;
    onDownload?: () => void;
}

const RecuCandidature: React.FC<RecuCandidatureProps> = ({
                                                             candidatureData,
                                                             onDownload
                                                         }) => {
    const candidat = candidatureData.candidat;
    const concours = candidatureData.concours;
    const montant = parseFloat(concours.fracnc);
    const isGratuit = montant === 0;

    const handlePrint = () => {
        window.print();
    };

    return (
        <Card className="w-full max-w-4xl mx-auto print:shadow-none">
            <CardHeader className="text-center border-b">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-primary">REÇU DE CANDIDATURE</h1>
                    <p className="text-muted-foreground">GabConcours - Plateforme Officielle</p>
                </div>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-sm text-muted-foreground">Numéro de candidature</p>
                        <p className="font-mono font-bold text-lg">{candidatureData.nupcan}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-muted-foreground">Date d'inscription</p>
                        <p className="font-semibold">
                            {new Date(candidat.created_at).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
                {/* Informations du candidat */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <User className="h-5 w-5 mr-2 text-primary"/>
                        Informations du Candidat
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Nom complet</p>
                            <p className="font-semibold">{candidat.prncan} {candidat.nomcan}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Date de naissance</p>
                            <p className="font-semibold">
                                {new Date(candidat.dtncan).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Email</p>
                            <p className="font-semibold flex items-center">
                                <Mail className="h-4 w-4 mr-1"/>
                                {candidat.maican}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Téléphone</p>
                            <p className="font-semibold flex items-center">
                                <Phone className="h-4 w-4 mr-1"/>
                                {candidat.telcan}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Lieu de naissance</p>
                            <p className="font-semibold flex items-center">
                                <MapPin className="h-4 w-4 mr-1"/>
                                {candidat.ldncan}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">NIP Candidat</p>
                            <p className="font-mono font-semibold">{candidat.nipcan}</p>
                        </div>
                    </div>
                </div>

                {/* Informations du concours */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <School className="h-5 w-5 mr-2 text-primary"/>
                        Concours Sélectionné
                    </h3>
                    <div className="bg-muted p-4 rounded-lg">
                        <h4 className="font-semibold text-lg mb-2">{concours.libcnc}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Établissement</p>
                                <p className="font-semibold">{concours.etablissement_nomets}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Session</p>
                                <p className="font-semibold">{concours.sescnc}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Âge limite</p>
                                <p className="font-semibold">{concours.agecnc} ans</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Date limite</p>
                                <p className="font-semibold">
                                    {new Date(concours.fincnc).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Informations de paiement */}
                <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-primary"/>
                        Frais d'Inscription
                    </h3>
                    <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Montant:</span>
                            <div className="text-right">
                                {isGratuit ? (
                                    <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300">
                                        GRATUIT (NGORI)
                                    </Badge>
                                ) : (
                                    <span className="text-xl font-bold text-green-700">
                    {montant.toLocaleString()} FCFA
                  </span>
                                )}
                            </div>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                            <span className="font-medium">Statut:</span>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                                {isGratuit ? 'AUCUN FRAIS' : 'PAYÉ'}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Statut des documents */}
                <div>
                    <h3 className="text-lg font-semibold mb-4">Documents Soumis</h3>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Nombre de documents:</span>
                            <Badge variant="outline" className="bg-blue-100 text-blue-700">
                                {candidatureData.documents?.length || 0} document(s)
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Footer officiel */}
                <div className="border-t pt-4 mt-6">
                    <div className="text-center text-sm text-muted-foreground">
                        <p className="mb-2">
                            Ce reçu confirme votre inscription au concours sélectionné.
                        </p>
                        <p className="mb-2">
                            Conservez précieusement ce document pour vos démarches administratives.
                        </p>
                        <p className="font-semibold">
                            GabConcours - Plateforme Officielle des Concours du Gabon
                        </p>
                        <p className="text-xs mt-2">
                            Document généré
                            le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                        </p>
                    </div>
                </div>

                {/* Boutons d'action */}
                <div className="flex justify-center space-x-4 print:hidden">
                    <Button onClick={handlePrint} variant="outline">
                        <Download className="h-4 w-4 mr-2"/>
                        Imprimer le reçu
                    </Button>
                    {onDownload && (
                        <Button onClick={onDownload}>
                            <Download className="h-4 w-4 mr-2"/>
                            Télécharger PDF
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default RecuCandidature;
