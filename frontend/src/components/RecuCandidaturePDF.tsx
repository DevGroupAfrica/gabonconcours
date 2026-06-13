import React from 'react';
import {Button} from '@/components/ui/button';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Download, Eye, FileText} from 'lucide-react';
import jsPDF from 'jspdf';

interface RecuCandidaturePDFProps {
    candidatureData: {
        candidat: any;
        concours: any;
        paiement: any;
        documents: any[];
        filiere?: any;
    };
    onDownload?: () => void;
}

const RecuCandidaturePDF: React.FC<RecuCandidaturePDFProps> = ({
                                                                   candidatureData,
                                                                   onDownload
                                                               }) => {
    const generatePDF = () => {
        const doc = new jsPDF();
        const {candidat, concours, paiement, documents, filiere} = candidatureData;

        // En-tête
        doc.setFontSize(20);
        doc.setTextColor(40, 116, 240);
        doc.text('REÇU DE CANDIDATURE', 105, 30, {align: 'center'});

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text('GABConcours - Plateforme de candidature', 105, 45, {align: 'center'});

        // Ligne de séparation
        doc.setLineWidth(0.5);
        doc.line(20, 55, 190, 55);

        // Informations candidat
        let yPos = 70;
        doc.setFontSize(16);
        doc.setTextColor(40, 116, 240);
        doc.text('INFORMATIONS DU CANDIDAT', 20, yPos);

        yPos += 15;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`NUPCAN: ${candidat.nupcan}`, 20, yPos);
        yPos += 8;
        doc.text(`Nom: ${candidat.prncan} ${candidat.nomcan}`, 20, yPos);
        yPos += 8;
        doc.text(`Email: ${candidat.maican}`, 20, yPos);
        yPos += 8;
        doc.text(`Téléphone: ${candidat.telcan}`, 20, yPos);
        yPos += 8;
        doc.text(`Date de naissance: ${new Date(candidat.dtncan).toLocaleDateString('fr-FR')}`, 20, yPos);

        // Informations concours
        yPos += 20;
        doc.setFontSize(16);
        doc.setTextColor(40, 116, 240);
        doc.text('INFORMATIONS DU CONCOURS', 20, yPos);

        yPos += 15;
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`Concours: ${concours?.libcnc || 'N/A'}`, 20, yPos);
        yPos += 8;
        doc.text(`Établissement: ${concours?.etablissement_nomets || 'N/A'}`, 20, yPos);

        if (filiere) {
            yPos += 8;
            doc.text(`Filière: ${filiere.nomfil}`, 20, yPos);
        }

        // Informations paiement
        if (paiement) {
            yPos += 20;
            doc.setFontSize(16);
            doc.setTextColor(40, 116, 240);
            doc.text('INFORMATIONS DE PAIEMENT', 20, yPos);

            yPos += 15;
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            doc.text(`Statut: ${paiement.statut}`, 20, yPos);
            yPos += 8;
            doc.text(`Montant: ${paiement.montant} FCFA`, 20, yPos);
            yPos += 8;
            doc.text(`Référence: ${paiement.reference_paiement || 'N/A'}`, 20, yPos);
            yPos += 8;
            doc.text(`Date: ${new Date(paiement.created_at).toLocaleDateString('fr-FR')}`, 20, yPos);
        }

        // Documents
        if (documents && documents.length > 0) {
            yPos += 20;
            doc.setFontSize(16);
            doc.setTextColor(40, 116, 240);
            doc.text('DOCUMENTS SOUMIS', 20, yPos);

            yPos += 15;
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            documents.forEach((doc, index) => {
                doc.text(`${index + 1}. ${doc.type || doc.nomdoc} - ${doc.statut || doc.document_statut}`, 25, yPos);
                yPos += 8;
            });
        }

        // Pied de page
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Document généré automatiquement', 105, 280, {align: 'center'});
        doc.text(`Date d'impression: ${new Date().toLocaleDateString('fr-FR')}`, 105, 290, {align: 'center'});

        // Télécharger le PDF
        doc.save(`recu-candidature-${candidat.nupcan}.pdf`);

        if (onDownload) {
            onDownload();
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
                        Téléchargez votre reçu officiel de candidature au format PDF.
                    </p>
                    <div className="flex space-x-2">
                        <Button onClick={generatePDF} className="flex items-center space-x-2">
                            <Download className="h-4 w-4"/>
                            <span>Télécharger le reçu PDF</span>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default RecuCandidaturePDF;
