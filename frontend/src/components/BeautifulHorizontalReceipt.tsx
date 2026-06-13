import React from 'react';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
    QrCode
} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import QRCode from 'qrcode';

interface CandidatureData {
    candidat: any;
    concours: any;
    filiere?: any;
    documents: any[];
    paiement?: any;
    nupcan?: string;
}

interface BeautifulHorizontalReceiptProps {
    candidatureData: CandidatureData;
    onEmailSend?: () => void;
}

const BeautifulHorizontalReceipt: React.FC<BeautifulHorizontalReceiptProps> = ({
                                                                                   candidatureData,
                                                                                   onEmailSend
                                                                               }) => {
    const {candidat, concours, filiere, documents, paiement, nupcan} = candidatureData;
    const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('');

    React.useEffect(() => {
        generateQRCode();
    }, [candidatureData]);

    const generateQRCode = async () => {
        try {
            const candidatureInfo = {
                nupcan: nupcan || candidat?.nupcan,
                nom: `${candidat?.prncan} ${candidat?.nomcan}`,
                email: candidat?.maican,
                telephone: candidat?.telcan,
                concours: concours?.libcnc,
                etablissement: concours?.etablissement_nomets,
                dateNaissance: candidat?.dtncan,
                lieuNaissance: candidat?.ldncan,
                frais: concours?.fracnc,
                documentsCount: documents?.length || 0,
                statutPaiement: paiement?.statut || 'en_attente',
                dateInscription: candidat?.created_at || new Date().toISOString(),
                url: `${window.location.origin}/dashboard/${nupcan || candidat?.nupcan}`
            };

            const qrString = JSON.stringify(candidatureInfo);
            const qrDataUrl = await QRCode.toDataURL(qrString, {
                width: 150,
                margin: 1,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            setQrCodeUrl(qrDataUrl);
        } catch (error) {
            console.error('Erreur génération QR Code:', error);
        }
    };

    const handleDownloadReceipt = async () => {
        try {
            const element = document.getElementById('receipt-content');
            if (!element) {
                toast({
                    title: "Erreur",
                    description: "Contenu du reçu introuvable.",
                    variant: "destructive",
                });
                return;
            }

            // Capture du rendu
            const canvas = await html2canvas(element, {
                scale: 2, // meilleure qualité
                useCORS: true, // pour les images externes
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height],
            });

            // Ajout de l'image au PDF
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

            // Nom du fichier = NUPCAN + date
            const fileName = `Recu_Candidature_${nupcan || candidat?.nupcan || 'candidat'}.pdf`;

            pdf.save(fileName);

            toast({
                title: "Téléchargement réussi",
                description: "Votre reçu a été téléchargé avec succès.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Erreur",
                description: "Impossible de générer le reçu en PDF.",
                variant: "destructive",
            });
        }
    };

    const handleEmailSend = () => {
        if (onEmailSend) {
            onEmailSend();
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
                <Button onClick={handleDownloadReceipt} className="flex items-center space-x-2">
                    <Download className="h-4 w-4"/>
                    <span>Télécharger le reçu</span>
                </Button>
                <Button variant="outline" onClick={handleEmailSend} className="flex items-center space-x-2">
                    <Mail className="h-4 w-4"/>
                    <span>Envoyer par email</span>
                </Button>
            </div>

            {/* Reçu horizontal */}
            <Card className="max-w-5xl mx-auto shadow-lg">
                <CardContent id="receipt-content" className="p-0">
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                            {/* Section gauche - Photo et QR Code */}
                            <div className="space-y-6 text-center">
                                {/* Photo du candidat */}
                                <div className="flex justify-center">
                                    <div
                                        className="w-32 h-32 rounded-lg overflow-hidden border-4 border-primary/20 shadow-lg bg-white">
                                        {candidat?.phtcan ? (
                                            <img
                                                src={`http://localhost:8002/uploads/photos/${candidat.phtcan}`}
                                                alt={`Photo de ${candidat.prncan} ${candidat.nomcan}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                                <User className="h-12 w-12 text-gray-400"/>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* QR Code */}
                                <div className="space-y-2">
                                    <div className="flex justify-center">
                                        {qrCodeUrl ? (
                                            <img src={qrCodeUrl} alt="QR Code Candidature"
                                                 className="border rounded-lg"/>
                                        ) : (
                                            <div
                                                className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                                <QrCode className="h-8 w-8 text-gray-400"/>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Scannez pour accéder<br/>aux détails complets
                                    </p>
                                </div>
                            </div>

                            {/* Section centrale - Informations principales */}
                            <div className="lg:col-span-2 space-y-6">
                                {/* En-tête */}
                                <div className="text-center border-b pb-4">
                                    <h1 className="text-2xl font-bold text-primary mb-2">
                                        REÇU DE CANDIDATURE
                                    </h1>
                                    <Badge variant="outline" className="text-lg px-4 py-1">
                                        NUPCAN: {nupcan || candidat?.nupcan}
                                    </Badge>
                                </div>

                                {/* Informations du candidat */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-primary flex items-center">
                                            <User className="h-5 w-5 mr-2"/>
                                            Candidat
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-medium">Nom complet:</span>
                                                <span>{candidat?.prncan} {candidat?.nomcan}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <AtSign className="h-4 w-4 text-muted-foreground"/>
                                                <span>{candidat?.maican}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Phone className="h-4 w-4 text-muted-foreground"/>
                                                <span>{candidat?.telcan}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground"/>
                                                <span>{candidat?.dtncan ? formatDate(candidat.dtncan) : 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <MapPin className="h-4 w-4 text-muted-foreground"/>
                                                <span>{candidat?.ldncan}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-lg font-semibold text-primary flex items-center">
                                            <Trophy className="h-5 w-5 mr-2"/>
                                            Concours
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div>
                                                <span className="font-medium">Intitulé:</span>
                                                <p className="text-muted-foreground">{concours?.libcnc}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium">Établissement:</span>
                                                <p className="text-muted-foreground">{concours?.etablissement_nomets}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium">Session:</span>
                                                <p className="text-muted-foreground">{concours?.sescnc}</p>
                                            </div>
                                            <div>
                                                <span className="font-medium">Frais:</span>
                                                <p className="text-muted-foreground font-semibold">
                                                    {parseFloat(concours?.fracnc || '0') === 0 ?
                                                        'GRATUIT (Programme GORRI)' :
                                                        `${concours?.fracnc} FCFA`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Informations documents et paiement */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                                    <div className="space-y-2">
                                        <h4 className="font-semibold flex items-center">
                                            <FileText className="h-4 w-4 mr-2"/>
                                            Documents ({documents?.length || 0})
                                        </h4>
                                        <div className="text-sm text-muted-foreground">
                                            {documents && documents.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {documents.slice(0, 3).map((doc, index) => (
                                                        <li key={index} className="flex items-center space-x-2">
                                                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                            <span>{doc.nomdoc || `Document ${index + 1}`}</span>
                                                        </li>
                                                    ))}
                                                    {documents.length > 3 && (
                                                        <li className="text-xs text-muted-foreground italic">
                                                            ... et {documents.length - 3} autre(s)
                                                        </li>
                                                    )}
                                                </ul>
                                            ) : (
                                                <p className="italic">Aucun document téléchargé</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <h4 className="font-semibold flex items-center">
                                            <CreditCard className="h-4 w-4 mr-2"/>
                                            Paiement
                                        </h4>
                                        <div className="text-sm">
                                            <div className="flex items-center space-x-2">
                                                <span>Statut:</span>
                                                <Badge
                                                    className={
                                                        paiement?.statut === 'valide' ? 'bg-green-100 text-green-800' :
                                                            paiement?.statut === 'en_attente' ? 'bg-orange-100 text-orange-800' :
                                                                parseFloat(concours?.fracnc || '0') === 0 ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-gray-100 text-gray-800'
                                                    }
                                                >
                                                    {paiement?.statut === 'valide' ? 'Payé' :
                                                        paiement?.statut === 'en_attente' ? 'En attente' :
                                                            parseFloat(concours?.fracnc || '0') === 0 ? 'Gratuit' :
                                                                'Non payé'}
                                                </Badge>
                                            </div>
                                            {paiement?.reference && (
                                                <div className="text-xs text-muted-foreground">
                                                    Réf: {paiement.reference}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Date d'émission */}
                                <div className="text-center pt-4 border-t">
                                    <p className="text-xs text-muted-foreground">
                                        Reçu généré
                                        le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default BeautifulHorizontalReceipt;
