import React, {useState} from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Input} from '@/components/ui/input';
import {Label} from '@/components/ui/label';
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog';
import {Download, Mail, FileText, Send} from 'lucide-react';
import {toast} from '@/hooks/use-toast';
import {apiService} from '@/services/api';
import {pdfService, PDFData} from '@/services/pdfService';

interface EnhancedReceiptPDFProps {
    candidatureData: {
        candidat: any;
        concours: any;
        paiement: any;
        documents: any[];
        filiere?: any;
    };
    onDownload?: () => void;
}

const EnhancedReceiptPDF: React.FC<EnhancedReceiptPDFProps> = ({
                                                                   candidatureData,
                                                                   onDownload
                                                               }) => {
    const [emailDialog, setEmailDialog] = useState(false);
    const [maican, setEmail] = useState(candidatureData.candidat?.maican || '');
    const [sending, setSending] = useState(false);

    const preparePDFData = (): PDFData => {
        const {candidat, concours, paiement, documents, filiere} = candidatureData;

        return {
            candidat: {
                nupcan: candidat.nupcan,
                nomcan: candidat.nomcan,
                prncan: candidat.prncan,
                maican: candidat.maican,
                telcan: candidat.telcan,
                dtncan: candidat.dtncan,
                ldncan: candidat.ldncan,
            },
            concours: {
                libcnc: concours?.libcnc || 'Concours non spécifié',
                fracnc: concours?.fracnc || 0,
                etablissement_nomets: concours?.etablissement_nomets,
                sescnc: concours?.sescnc,
            },
            filiere: filiere ? {
                nomfil: filiere.nomfil,
                description: filiere.description,
                matieres: filiere.matieres?.map((m: any) => ({
                    nom_matiere: m.nom_matiere,
                    coefficient: m.coefficient,
                    obligatoire: m.obligatoire,
                })),
            } : undefined,
            paiement: paiement ? {
                reference: paiement.reference_paiement || `PAY-${candidat.nupcan}`,
                montant: paiement.montant,
                date: paiement.created_at,
                statut: paiement.statut,
                methode: paiement.methode || 'N/A',
            } : undefined,
            documents: documents.map(doc => ({
                nomdoc: doc.type || doc.nomdoc,
                type: doc.type || 'Document',
                statut: doc.statut || doc.document_statut || 'Soumis',
            })),
        };
    };

    const handleDownloadPDF = async () => {
        try {
            const pdfData = preparePDFData();
            await pdfService.downloadReceiptPDF(pdfData);

            toast({
                title: "PDF téléchargé",
                description: "Le reçu PDF a été téléchargé avec succès",
            });

            if (onDownload) {
                onDownload();
            }
        } catch (error) {
            console.error('Erreur génération PDF:', error);
            toast({
                title: "Erreur de génération",
                description: "Impossible de générer le PDF",
                variant: "destructive",
            });
        }
    };

    const handleSendEmail = async () => {
        if (!maican) {
            toast({
                title: "Email requis",
                description: "Veuillez saisir une adresse email",
                variant: "destructive",
            });
            return;
        }

        try {
            setSending(true);

            // Générer le PDF
            const pdfData = preparePDFData();
            const pdfBlob = await pdfService.generatePDFBlob(pdfData);

            // Créer FormData pour envoyer le PDF
            const formData = new FormData();
            formData.append('nupcan', candidatureData.candidat.nupcan);
            formData.append('maican', maican);
            formData.append('pdf', pdfBlob, `recu_${candidatureData.candidat.nupcan}.pdf`);

            await apiService.sendReceiptByEmail(candidatureData.candidat.nupcan, maican);

            toast({
                title: "Email envoyé",
                description: `Le reçu PDF a été envoyé à ${maican}`,
            });

            setEmailDialog(false);
        } catch (error) {
            console.error('Erreur envoi email:', error);
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
                    <span>Reçu de candidature PDF</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        Téléchargez votre reçu officiel au format PDF ou recevez-le par email.
                    </p>

                    <div className="flex space-x-2">
                        <Button
                            onClick={handleDownloadPDF}
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
                                    <DialogTitle>Envoyer le reçu PDF par email</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div>
                                        <Label htmlFor="email">Adresse email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={maican}
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

export default EnhancedReceiptPDF;
