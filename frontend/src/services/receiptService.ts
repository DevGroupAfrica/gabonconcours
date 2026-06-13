import { jsPDF } from 'jspdf';
import { apiService } from './api';
import QRCode from 'qrcode';
export interface ReceiptData {
    candidat: {
        nupcan: string;
        nomcan: string;
        prncan: string;
        maican: string;
        telcan: string;
        dtncan: string;
        ldncan?: string;
        phtcan?: File | string;
    };
    concours: {
        libcnc: string;
        fracnc?: number;
        etablissement_nomets?: string;
        sescnc?: string;
    };
    filiere?: {
        nomfil: string;
        description?: string;
        matieres?: Array<{
            nom_matiere: string;
            coefficient: number;
            obligatoire?: boolean;
        }>;
    };
    paiement?: {
        reference?: string;
        montant?: number;
        date?: string;
        statut?: string;
        methode?: string;
    };
    documents?: Array<{
        nomdoc: string;
        type: string;
        statut: string;
    }>;
}

class ReceiptService {
    private validateReceiptData(data: any): ReceiptData {
        let phtcanValue: string | undefined;
        if (data.candidat.phtcan) {
            if (typeof data.candidat.phtcan === 'string') {
                phtcanValue = data.candidat.phtcan;
            } else {
                phtcanValue = undefined;
            }
        }

        return {
            candidat: {
                nupcan: data.candidat.nupcan || '',
                nomcan: data.candidat.nomcan || '',
                prncan: data.candidat.prncan || '',
                maican: data.candidat.maican || '',
                telcan: data.candidat.telcan || '',
                dtncan: data.candidat.dtncan || '',
                ldncan: data.candidat.ldncan || '',
                phtcan: phtcanValue
            },
            concours: {
                libcnc: data.concours.libcnc || '',
                fracnc: data.concours.fracnc || 0,
                etablissement_nomets: data.concours.etablissement_nomets || '',
                sescnc: data.concours.sescnc || ''
            },
            filiere: data.filiere,
            paiement: data.paiement,
            documents: data.documents || []
        };
    }

    // ✅ Génère un PDF encodé en base64 (sans le télécharger)
    private async generateReceiptPDFBase64(data: any): Promise<string> {
        const validatedData = this.validateReceiptData(data);
        const pdf = new jsPDF();

        pdf.setFontSize(20);
        pdf.text('REÇU DE CANDIDATURE', 20, 30);

        pdf.setFontSize(12);
        pdf.text(`NUPCAN: ${validatedData.candidat.nupcan}`, 20, 50);
        pdf.text(`Nom: ${validatedData.candidat.prncan} ${validatedData.candidat.nomcan}`, 20, 65);
        pdf.text(`Email: ${validatedData.candidat.maican}`, 20, 80);
        pdf.text(`Concours: ${validatedData.concours.libcnc}`, 20, 95);

        if (validatedData.filiere) {
            pdf.text(`Filière: ${validatedData.filiere.nomfil}`, 20, 110);
        }

        if (validatedData.paiement) {
            pdf.text(`Montant: ${validatedData.paiement.montant || 0} FCFA`, 20, 125);
            pdf.text(`Statut: ${validatedData.paiement.statut || 'En attente'}`, 20, 140);
        }

        // Retourne le PDF encodé en base64 (sans préfixe)
        return pdf.output('datauristring').split(',')[1];
    }

    async downloadReceiptPDF(data: any): Promise<void> {
        try {
            const validatedData = this.validateReceiptData(data);
            const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

            // --- Couleurs et en-tête ---
            pdf.setFillColor(11, 83, 148);
            pdf.rect(0, 0, 297, 30, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(20);
            pdf.text('REÇU DE CANDIDATURE', 148, 20, { align: 'center' });

            pdf.setTextColor(0, 0, 0);
            pdf.setFontSize(12);

            // --- Candidat ---
            pdf.text(`NUPCAN: ${validatedData.candidat.nupcan}`, 20, 50);
            pdf.text(`Nom: ${validatedData.candidat.prncan} ${validatedData.candidat.nomcan}`, 20, 60);
            pdf.text(`Email: ${validatedData.candidat.maican}`, 20, 70);
            pdf.text(`Téléphone: ${validatedData.candidat.telcan}`, 20, 80);
            pdf.text(`Date de naissance: ${validatedData.candidat.dtncan}`, 20, 90);
            if (validatedData.candidat.ldncan) {
                pdf.text(`Lieu de naissance: ${validatedData.candidat.ldncan}`, 20, 100);
            }

            // --- Concours ---
            pdf.text(`Concours: ${validatedData.concours.libcnc}`, 120, 50);
            pdf.text(`Établissement: ${validatedData.concours.etablissement_nomets}`, 120, 60);
            pdf.text(`Session: ${validatedData.concours.sescnc}`, 120, 70);
            pdf.text(`Frais: ${validatedData.concours.fracnc || 0} FCFA`, 120, 80);

            // --- Filière ---
            if (validatedData.filiere) {
                pdf.text(`Filière: ${validatedData.filiere.nomfil}`, 220, 50);
            }

            // --- Documents ---
            pdf.text(`Documents soumis: ${validatedData.documents.length}`, 220, 70);
            validatedData.documents.slice(0, 5).forEach((doc: any, i: number) => {
                pdf.text(`${i + 1}. ${doc.nomdoc || 'Document'}`, 220, 75 + i * 5);
            });
            if (validatedData.documents.length > 5) {
                pdf.text(`... et ${validatedData.documents.length - 5} autres`, 220, 100);
            }

            // --- Paiement ---
            if (validatedData.paiement) {
                pdf.text(`Montant: ${validatedData.paiement.montant || 0} FCFA`, 20, 120);
                pdf.text(`Statut: ${validatedData.paiement.statut || 'En attente'}`, 20, 130);
                pdf.text(`Référence: ${validatedData.paiement.reference || 'N/A'}`, 20, 140);
            }

            // --- QR Code ---
            const qrString = JSON.stringify({
                nupcan: validatedData.candidat.nupcan,
                url: `${window.location.origin}/dashboard/${validatedData.candidat.nupcan}`
            });
            const qrDataUrl = await QRCode.toDataURL(qrString, { width: 80 });
            pdf.addImage(qrDataUrl, 'PNG', 250, 120, 35, 35);

            // --- Téléchargement ---
            pdf.save(`Recu_Candidature_${validatedData.candidat.nupcan}.pdf`);

        } catch (error) {
            console.error('Erreur génération PDF:', error);
            throw new Error('Impossible de générer le reçu PDF');
        }
    }
    // ✅ Envoie le reçu par email avec pièce jointe
    async generateAndSendReceiptEmail(data: any, maican: string): Promise<void> {
        try {
            if (!maican || !maican.includes('@')) {
                throw new Error('Adresse email invalide');
            }

            const validatedData = this.validateReceiptData(data);
            const pdfBase64 = await this.generateReceiptPDFBase64(validatedData);

            const response = await apiService.makeRequest('/email/receipt', 'POST', {
                maican: maican,
                nupcan: validatedData.candidat.nupcan,
                candidatData: validatedData,
                pdfAttachment: pdfBase64,
                attachmentType: 'pdf'
            });

            if (!response.success) {
                throw new Error(response.message || 'Erreur lors de l\'envoi de l\'email');
            }
        } catch (error) {
            console.error('Erreur envoi email reçu:', error);
            throw new Error(error instanceof Error ? error.message : 'Impossible d\'envoyer le reçu par email');
        }
    }

    async sendReceiptByEmail(data: any, maican: string): Promise<void> {
        return this.generateAndSendReceiptEmail(data, maican);
    }
}

export const receiptService = new ReceiptService();
