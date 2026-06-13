import React, {useState, useEffect} from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
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
    Image as ImageIcon
} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import QRCode from 'qrcode';
import {receiptService} from '@/services/receiptService';
import {CandidatureReceiptData} from '@/services/ReceiptGenerator';

interface ModernReceiptCardProps {
    candidatureData: CandidatureReceiptData;
    onEmailSend?: () => void;
}

const ModernReceiptCard: React.FC<ModernReceiptCardProps> = ({
                                                                 candidatureData,
                                                                 onEmailSend
                                                             }) => {
    const {candidat, concours, documents, paiement, filiere} = candidatureData;
    const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

    useEffect(() => {
        generateQRCode();
    }, [candidatureData]);

    const generateQRCode = async () => {
        try {
            const candidatureInfo = {
                nupcan: candidat.nupcan,
                nom: `${candidat.prncan} ${candidat.nomcan}`,
                email: candidat.maican,
                concours: concours.libcnc,
                etablissement: concours.etablissement_nomets,
                url: `${window.location.origin}/dashboard/${candidat.nupcan}`
            };

            const qrString = JSON.stringify(candidatureInfo);
            const qrDataUrl = await QRCode.toDataURL(qrString, {
                width: 150,
                margin: 1,
                color: {dark: '#000000', light: '#FFFFFF'}
            });

            setQrCodeUrl(qrDataUrl);
        } catch (error) {
            console.error('Erreur génération QR Code:', error);
        }
    };

    const handleDownloadPDF = async () => {
        try {
            const receiptData = {
                candidat: {
                    ...candidat,
                    ldncan: candidat.ldncan || 'Libreville',
                    phtcan: typeof candidat.phtcan === 'string' ? candidat.phtcan : undefined
                },
                concours: {
                    ...concours,
                    fracnc: concours.fracnc || 0,
                    sescnc: concours.sescnc || ''
                },
                documents: documents || [],
                paiement,
                filiere: filiere || undefined
            };

            await receiptService.downloadReceiptPDF(receiptData);
            toast({
                title: "Téléchargement réussi",
                description: "Le reçu PDF a été téléchargé"
            });
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de télécharger le reçu PDF",
                variant: "destructive"
            });
        }
    };

    const handleDownloadPNG = async () => {
        try {
            // For now, use PDF download as PNG method doesn't exist
            await handleDownloadPDF();
            toast({
                title: "Téléchargement réussi",
                description: "Le reçu a été téléchargé"
            });
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible de télécharger le reçu",
                variant: "destructive"
            });
        }
    };

    const handleEmailSend = async () => {
        try {
            const receiptData = {
                candidat: {
                    ...candidat,
                    ldncan: candidat.ldncan || 'Libreville',
                    phtcan: typeof candidat.phtcan === 'string' ? candidat.phtcan : undefined
                },
                concours: {
                    ...concours,
                    fracnc: concours.fracnc || 0,
                    sescnc: concours.sescnc || ''
                },
                documents: documents || [],
                paiement,
                filiere: filiere || undefined
            };

            await receiptService.generateAndSendReceiptEmail(receiptData, candidat.maican);
            toast({
                title: "Email envoyé",
                description: "Le reçu a été envoyé par email"
            });
            if (onEmailSend) onEmailSend();
        } catch (error) {
            toast({
                title: "Erreur",
                description: "Impossible d'envoyer le reçu par email",
                variant: "destructive"
            });
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            {/* Boutons d'action */}
            <div className="flex justify-center space-x-4">
                <Button onClick={handleDownloadPDF} className="flex items-center space-x-2">
                    <Download className="h-4 w-4"/>
                    <span>Télécharger PDF</span>
                </Button>
                <Button onClick={handleDownloadPNG} variant="outline" className="flex items-center space-x-2">
                    <ImageIcon className="h-4 w-4"/>
                    <span>Télécharger PNG</span>
                </Button>
                <Button variant="outline" onClick={handleEmailSend} className="flex items-center space-x-2">
                    <Mail className="h-4 w-4"/>
                    <span>Envoyer par email</span>
                </Button>
            </div>

            {/* Reçu moderne */}
            <Card className="max-w-4xl mx-auto shadow-lg bg-gradient-to-br from-blue-50 to-white">
                <CardContent className="p-0">
                    <div className="bg-white border-2 border-blue-100 rounded-lg m-4 p-8">
                        {/* En-tête avec logo */}
                        <div className="flex items-center justify-center mb-6 pb-6 border-b-2 border-blue-500">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">DG</span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-blue-600">REÇU DE CANDIDATURE</h1>
                                    <Badge variant="outline"
                                           className="mt-2 text-base px-4 py-1 bg-orange-50 text-orange-600 border-orange-200">
                                        NUPCAN: {candidat.nupcan}
                                    </Badge>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Section gauche - QR Code */}
                            <div className="space-y-6 text-center">
                                <div className="space-y-2">
                                    <div className="flex justify-center">
                                        {qrCodeUrl ? (
                                            <div className="border-2 border-gray-200 rounded-lg p-2 bg-white">
                                                <img src={qrCodeUrl} alt="QR Code Candidature" className="w-32 h-32"/>
                                            </div>
                                        ) : (
                                            <div
                                                className="w-36 h-36 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                                <QrCode className="h-8 w-8 text-gray-400"/>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Scannez pour accéder<br/>aux détails complets
                                    </p>
                                </div>
                            </div>

                            {/* Sections centrales - Informations */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* Informations candidat et concours */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold text-blue-600 flex items-center mb-3">
                                            <User className="h-5 w-5 mr-2"/>
                                            Candidat
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium">Nom:</span>
                                                <span>{candidat.prncan} {candidat.nomcan}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <AtSign className="h-4 w-4 text-muted-foreground"/>
                                                <span>{candidat.maican}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Phone className="h-4 w-4 text-muted-foreground"/>
                                                <span>{candidat.telcan}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground"/>
                                                <span>{formatDate(candidat.dtncan)}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground"/>
                                                <span>{candidat.ldncan || 'Libreville'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold text-blue-600 flex items-center mb-3">
                                            <Trophy className="h-5 w-5 mr-2"/>
                                            Concours
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="font-medium">Intitulé:</span>
                                                <p className="text-muted-foreground">{concours.libcnc}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium">Établissement:</span>
                                                <p className="text-muted-foreground">{concours.etablissement_nomets}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium">Session:</span>
                                                <p className="text-muted-foreground">{concours.sescnc}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium">Frais:</span>
                                                <p className={`font-semibold ${!concours.fracnc || concours.fracnc === 0 ? 'text-green-600' : 'text-orange-600'}`}>
                                                    {!concours.fracnc || concours.fracnc === 0 ?
                                                        'GRATUIT (Programme GORRI)' :
                                                        `${concours.fracnc} FCFA`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Documents et Paiement */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-semibold flex items-center mb-3">
                                            <FileText className="h-4 w-4 mr-2"/>
                                            Documents ({documents?.length || 0})
                                        </h4>
                                        <div className="text-sm">
                                            {documents && documents.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {documents.slice(0, 4).map((doc, index) => (
                                                        <li key={index} className="flex items-center space-x-2">
                                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                            <span
                                                                className="text-xs">{doc.nomdoc.length > 30 ? doc.nomdoc.substring(0, 30) + '...' : doc.nomdoc}</span>
                                                        </li>
                                                    ))}
                                                    {documents.length > 4 && (
                                                        <li className="text-xs text-muted-foreground italic">
                                                            ... et {documents.length - 4} autre(s)
                                                        </li>
                                                    )}
                                                </ul>
                                            ) : (
                                                <p className="italic text-muted-foreground">Aucun document</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h4 className="font-semibold flex items-center mb-3">
                                            <CreditCard className="h-4 w-4 mr-2"/>
                                            Paiement
                                        </h4>
                                        <div className="text-sm">
                                            <div className="flex items-center space-x-2">
                                                <span>Statut:</span>
                                                <Badge
                                                    className={
                                                        paiement?.statut === 'valide' ? 'bg-green-100 text-green-800' :
                                                            (!concours.fracnc || concours.fracnc === 0) ? 'bg-blue-100 text-blue-800' :
                                                                'bg-orange-100 text-orange-800'
                                                    }
                                                >
                                                    {paiement?.statut === 'valide' ? 'Payé' :
                                                        (!concours.fracnc || concours.fracnc === 0) ? 'Gratuit' :
                                                            'En attente'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="text-center pt-6 mt-6 border-t border-gray-200">
                            <p className="text-xs text-muted-foreground">
                                Reçu généré
                                le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ModernReceiptCard;
