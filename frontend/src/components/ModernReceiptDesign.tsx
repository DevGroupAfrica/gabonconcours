import React from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Badge} from '@/components/ui/badge';
import {Button} from '@/components/ui/button';
import {
    Download,
    Mail,
    User,
    Calendar,
    MapPin,
    Phone,
    AtSign,
    FileText,
    CreditCard,
    Trophy,
    QrCode,
    CheckCircle
} from 'lucide-react';
import {pdfService} from '@/services/pdfService';
import {toast} from '@/hooks/use-toast';

interface ModernReceiptDesignProps {
    candidatureData: {
        nupcan: string;
        candidat: {
            prncan: string;
            nomcan: string;
            maican: string;
            telcan: string;
            dtncan: string;
            ldncan: string;
            phtcan?: string;
        };
        concours: {
            libcnc: string;
            etablissement_nomets: string;
            sescnc: string;
            fracnc: string;
        };
        documents?: any[];
        paiement?: {
            statut: string;
            montant: string;
        };
    };
    onDownload?: () => void;
}

const ModernReceiptDesign: React.FC<ModernReceiptDesignProps> = ({
                                                                     candidatureData,
                                                                     onDownload
                                                                 }) => {
    const {candidat, concours, documents = [], paiement} = candidatureData;
    const montant = parseFloat(concours.fracnc);
    const isGratuit = montant === 0;

    const handleDownloadPDF = () => {
        try {
            const pdfData = {
                candidat: {
                    nupcan: candidatureData.nupcan,
                    nomcan: candidat.nomcan,
                    prncan: candidat.prncan,
                    maican: candidat.maican,
                    telcan: candidat.telcan,
                    dtncan: candidat.dtncan,
                    ldncan: candidat.ldncan,
                    phtcan: candidat.phtcan as any
                },
                concours: {
                    libcnc: concours.libcnc,
                    fracnc: parseFloat(concours.fracnc),
                    etablissement_nomets: concours.etablissement_nomets,
                    sescnc: concours.sescnc
                },
                documents: documents.map(doc => ({
                    nomdoc: doc.nomdoc || doc.type || 'Document',
                    type: doc.type || 'Document',
                    statut: doc.statut || doc.document_statut || 'en_attente'
                })),
                paiement: paiement ? {
                    reference: 'N/A',
                    montant: parseFloat(paiement.montant || '0'),
                    date: new Date().toISOString(),
                    statut: paiement.statut || 'en_attente',
                    methode: 'N/A'
                } : undefined
            };

            pdfService.downloadReceiptPDF(pdfData);

            toast({
                title: "Téléchargement réussi",
                description: "Votre reçu PDF a été téléchargé avec succès"
            });

            if (onDownload) {
                onDownload();
            }
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de télécharger le reçu",
                variant: "destructive"
            });
        }
    };

    return (
        <Card
            className="w-full max-w-4xl mx-auto bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl print:shadow-none">
            {/* En-tête avec fond bleu */}
            <div
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative z-10">
                    <h1 className="text-3xl font-bold mb-2">REÇU DE CANDIDATURE</h1>
                    <p className="text-blue-100 text-lg font-medium">
                        NUPCAN: {candidatureData.nupcan}
                    </p>
                </div>
            </div>

            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">

                    {/* Colonne gauche - Photo et QR Code */}
                    <div className="lg:col-span-3 bg-white p-6 border-r border-gray-200">
                        <div className="space-y-6">

                            {/* Photo du candidat */}
                            <div className="text-center">
                                <div
                                    className="w-32 h-40 mx-auto bg-gray-100 border-2 border-blue-200 rounded-lg overflow-hidden">
                                    {candidat.phtcan ? (
                                        <img
                                            src={`http://localhost:8002/uploads/photos/${candidat.phtcan}`}
                                            alt="Photo candidat"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User className="h-16 w-16 text-gray-400"/>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* QR Code */}
                            <div className="text-center">
                                <div
                                    className="w-32 h-32 mx-auto bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center">
                                    <div className="text-center">
                                        <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2"/>
                                        <p className="text-xs text-gray-500 leading-tight">
                                            Scannez pour accéder<br/>aux détails complets
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Colonne centrale - Informations principales */}
                    <div className="lg:col-span-9 bg-white">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">

                            {/* Section Candidat */}
                            <div className="space-y-4">
                                <div
                                    className="flex items-center space-x-2 text-blue-700 border-b border-blue-200 pb-2">
                                    <User className="h-5 w-5"/>
                                    <h3 className="text-lg font-semibold">Candidat</h3>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Nom complet:</p>
                                        <p className="font-semibold text-gray-900">{candidat.prncan} {candidat.nomcan}</p>
                                    </div>

                                    <div className="flex items-center space-x-2 text-sm">
                                        <AtSign className="h-4 w-4 text-blue-500"/>
                                        <span>{candidat.maican}</span>
                                    </div>

                                    <div className="flex items-center space-x-2 text-sm">
                                        <Phone className="h-4 w-4 text-blue-500"/>
                                        <span>{candidat.telcan}</span>
                                    </div>

                                    <div className="flex items-center space-x-2 text-sm">
                                        <Calendar className="h-4 w-4 text-blue-500"/>
                                        <span>{new Date(candidat.dtncan).toLocaleDateString('fr-FR')}</span>
                                    </div>

                                    <div className="flex items-center space-x-2 text-sm">
                                        <MapPin className="h-4 w-4 text-blue-500"/>
                                        <span>{candidat.ldncan}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Section Concours */}
                            <div className="space-y-4">
                                <div
                                    className="flex items-center space-x-2 text-blue-700 border-b border-blue-200 pb-2">
                                    <Trophy className="h-5 w-5"/>
                                    <h3 className="text-lg font-semibold">Concours</h3>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Intitulé:</p>
                                        <p className="font-semibold text-gray-900 text-sm leading-tight">{concours.libcnc}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Établissement:</p>
                                        <p className="font-semibold text-gray-900 text-sm leading-tight">{concours.etablissement_nomets}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Session:</p>
                                        <p className="font-semibold text-gray-900">{concours.sescnc}</p>
                                    </div>

                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Frais:</p>
                                        <div className="font-semibold text-lg">
                                            {isGratuit ? (
                                                <Badge className="bg-green-100 text-green-800 text-base px-3 py-1">
                                                    50000.00 FCFA
                                                </Badge>
                                            ) : (
                                                <span className="text-blue-700">{montant.toLocaleString()} FCFA</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Section Documents et Paiement */}
                        <div className="bg-gray-50 p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Documents */}
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2 text-blue-700">
                                        <FileText className="h-5 w-5"/>
                                        <h4 className="text-lg font-semibold">Documents ({documents.length})</h4>
                                    </div>

                                    <div className="space-y-2">
                                        {documents.slice(0, 5).map((doc, index) => (
                                            <div key={index} className="flex items-center space-x-2 text-sm">
                                                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                                <span className="text-gray-700 truncate">
                          {doc.nomdoc || `Document ${index + 1}`}
                        </span>
                                            </div>
                                        ))}
                                        {documents.length > 5 && (
                                            <p className="text-xs text-gray-500 italic">...
                                                et {documents.length - 5} autre(s)</p>
                                        )}
                                    </div>
                                </div>

                                {/* Paiement */}
                                <div className="space-y-3">
                                    <div className="flex items-center space-x-2 text-blue-700">
                                        <CreditCard className="h-5 w-5"/>
                                        <h4 className="text-lg font-semibold">Paiement</h4>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium">Statut:</span>
                                            <Badge
                                                className={`${
                                                    paiement?.statut === 'valide' || isGratuit
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-orange-100 text-orange-800'
                                                } text-sm px-3 py-1`}
                                            >
                                                Payé
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-white p-6 text-center border-t border-gray-200">
                            <p className="text-sm text-gray-600 mb-4">
                                Reçu généré
                                le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                            </p>

                            <div className="flex justify-center space-x-4 print:hidden">
                                <Button
                                    onClick={() => window.print()}
                                    variant="outline"
                                    size="sm"
                                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                >
                                    <Download className="h-4 w-4 mr-2"/>
                                    Imprimer
                                </Button>
                                <Button
                                    onClick={handleDownloadPDF}
                                    size="sm"
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Download className="h-4 w-4 mr-2"/>
                                    Télécharger PDF
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ModernReceiptDesign;
