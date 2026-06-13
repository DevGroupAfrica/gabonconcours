import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Download, Mail, FileText, Send} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import {apiService} from '@/services/api';
import jsPDF from 'jspdf';

interface EnhancedRecuCandidaturePDFProps {
    candidatureData: {
        candidat: any;
        concours: any;
        paiement: any;
        documents: any[];
        filiere?: any;
    };
    onDownload?: () => void;
}

const EnhancedRecuCandidaturePDF: React.FC<EnhancedRecuCandidaturePDFProps> = ({
                                                                                   candidatureData,
                                                                                   onDownload
                                                                               }) => {
    const [emailDialog, setEmailDialog] = useState(false);
    const [email, setEmail] = useState(candidatureData.candidat?.maican || '');
    const [sending, setSending] = useState(false);

    const generatePDF = () => {
        const doc = new jsPDF();
        const {candidat, concours, paiement, documents, filiere} = candidatureData;

        // En-tête avec logo
        doc.setFontSize(24);
        doc.setTextColor(37, 99, 235);
        doc.text('GABConcours', 105, 25, {align: 'center'});

        doc.setFontSize(18);
        doc.setTextColor(0, 0, 0);
        doc.text('REÇU DE CANDIDATURE', 105, 40, {align: 'center'});

        // Ligne de séparation
        doc.setLineWidth(1);
        doc.setDrawColor(37, 99, 235);
        doc.line(20, 50, 190, 50);

        // Informations candidat
        let yPos = 65;
        doc.setFontSize(16);
        doc.setTextColor(37, 99, 235);
        doc.text('INFORMATIONS DU CANDIDAT', 20, yPos);

        yPos += 12;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);

        const candidatInfo = [
            `NUPCAN: ${candidat.nupcan}`,
            `Nom complet: ${candidat.prncan} ${candidat.nomcan}`,
            `Email: ${candidat.maican}`,
            `Téléphone: ${candidat.telcan}`,
            `Date de naissance: ${new Date(candidat.dtncan).toLocaleDateString('fr-FR')}`,
            `Lieu de naissance: ${candidat.ldncan || 'N/A'}`
        ];

        candidatInfo.forEach(info => {
            doc.text(info, 20, yPos);
            yPos += 7;
        });

        // Informations concours
        yPos += 10;
        doc.setFontSize(16);
        doc.setTextColor(37, 99, 235);
        doc.text('INFORMATIONS DU CONCOURS', 20, yPos);

        yPos += 12;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);

        if (concours) {
            const concoursInfo = [
                `Concours: ${concours.libcnc}`,
                `Établissement: ${concours.etablissement_nomets}`,
                `Session: ${concours.sescnc || 'N/A'}`,
                `Frais: ${concours.fracnc} FCFA`
            ];

            concoursInfo.forEach(info => {
                doc.text(info, 20, yPos);
                yPos += 7;
            });
        }

        // Filière
        if (filiere) {
            yPos += 5;
            doc.text(`Filière choisie: ${filiere.nomfil}`, 20, yPos);
            yPos += 7;
            if (filiere.description) {
                doc.text(`Description: ${filiere.description}`, 20, yPos);
                yPos += 7;
            }
        }

        // Informations paiement
        if (paiement) {
            yPos += 10;
            doc.setFontSize(16);
            doc.setTextColor(37, 99, 235);
            doc.text('INFORMATIONS DE PAIEMENT', 20, yPos);

            yPos += 12;
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);

            const paiementInfo = [
                `Statut: ${paiement.statut}`,
                `Montant: ${paiement.montant} FCFA`,
                `Méthode: ${paiement.methode || 'N/A'}`,
                `Référence: ${paiement.reference_paiement || 'N/A'}`,
                `Date: ${new Date(paiement.created_at).toLocaleDateString('fr-FR')}`
            ];

            paiementInfo.forEach(info => {
                doc.text(info, 20, yPos);
                yPos += 7;
            });
        }

        // Documents
        if (documents && documents.length > 0) {
            yPos += 10;
            doc.setFontSize(16);
            doc.setTextColor(37, 99, 235);
            doc.text('DOCUMENTS SOUMIS', 20, yPos);

            yPos += 12;
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);

            documents.forEach((document, index) => {
                const statut = document.statut || document.document_statut;
                doc.text(`${index + 1}. ${document.type || document.nomdoc} - ${statut}`, 25, yPos);
                yPos += 7;
            });
        }

        // Pied de page
        yPos = 270;
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Ce document certifie l\'inscription du candidat au concours mentionné ci-dessus.', 105, yPos, {align: 'center'});
        yPos += 5;
        doc.text(`Document généré automatiquement le ${new Date().toLocaleDateString('fr-FR')}`, 105, yPos, {align: 'center'});
        yPos += 5;
        doc.text('GABConcours - Plateforme officielle de candidature', 105, yPos, {align: 'center'});

        // Télécharger le PDF
        doc.save(`recu-candidature-${candidat.nupcan}.pdf`);

        toast({
            title: "PDF généré",
            description: "Le reçu a été téléchargé avec succès",
        });

        if (onDownload) {
            onDownload();
        }
    };

    const handleSendEmail = async () => {
        if (!email) {
            toast({
                title: "Email requis",
                description: "Veuillez saisir une adresse email",
                variant: "destructive",
            });
            return;
        }

        try {
            setSending(true);
            await apiService.sendReceiptByEmail(candidatureData.candidat.nupcan, email);

            toast({
                title: "Email envoyé",
                description: `Le reçu a été envoyé à ${email}`,
            });

            setEmailDialog(false);
        } catch (error) {
            toast({
                title: "Erreur d'envoi",
                description: "Impossible d'envoyer l'email",
                variant: "destructive",
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                    <FileText className="h-5 w-5"/>
                    <span>Reçu de candidature</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Téléchargez ou recevez par email votre reçu officiel de candidature.
                    </p>

                    <div className="flex space-x-2">
                        <Button
                            onClick={generatePDF}
                            className="flex items-center space-x-2"
                        >
                            <Download className="h-4 w-4"/>
                            <span>Télécharger PDF</span>
                        </Button>

                        <Dialog open={emailDialog} onOpenChange={setEmailDialog}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="flex items-center space-x-2"
                                >
                                    <Mail className="h-4 w-4"/>
                                    <span>Envoyer par email</span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Envoyer le reçu par email</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="email">Adresse email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="votre@email.com"
                                        />
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            onClick={handleSendEmail}
                                            disabled={sending}
                                            className="flex items-center space-x-2"
                                        >
                                            {sending ? (
                                                <div
                                                    className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"/>
                                            ) : (
                                                <Send className="h-4 w-4"/>
                                            )}
                                            <span>{sending ? 'Envoi...' : 'Envoyer'}</span>
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => setEmailDialog(false)}
                                        >
                                            Annuler
                                        </Button>
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default EnhancedRecuCandidaturePDF;
