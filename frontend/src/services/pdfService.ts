import jsPDF from 'jspdf';
import QRCode from 'qrcode';

export interface PDFData {
    candidat: {
        nupcan: string;
        nomcan: string;
        prncan: string;
        maican: string;
        telcan: string;
        dtncan: string;
        ldncan?: string;
        phtcan?: string; // URL or base64 string for the photo
        created_at?: string; // For inscription date
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
        reference: string;
        montant: number;
        date: string;
        statut: string; // 'valide', 'en_attente', 'rejete'
        methode: string;
    };
    documents: Array<{
        nomdoc: string;
        type: string;
        statut: string; // 'valide', 'en_attente', 'rejete'
    }>;
    nupcan?: string; // Main NUPCAN for the receipt
}

class PDFService {
    private mainBackgroundColor = [242, 246, 254]; // rgb(242, 246, 254)
    private primaryColor = [59, 130, 246]; // Tailwind 'blue-500'
    private textColor = [0, 0, 0]; // Black
    private mutedTextColor = [100, 100, 100]; // Gray for muted text
    private successColor = [34, 197, 94]; // Green for success (paid)
    private successBgColor = [240, 253, 244]; // Light green background for success badge
    private warningColor = [249, 115, 22]; // Orange for pending/warning
    private warningBgColor = [255, 246, 232]; // Light orange background for warning badge
    private borderColor = [200, 200, 200]; // Light grey border

    async generateReceiptPDF(data: PDFData): Promise<jsPDF> {
        const doc = new jsPDF('landscape', 'mm', 'a4');

        const pageWidth = doc.internal.pageSize.width; // 297mm
        const pageHeight = doc.internal.pageSize.height; // 210mm

        // Set the single main background color for the entire page
        doc.setFillColor(this.mainBackgroundColor[0], this.mainBackgroundColor[1], this.mainBackgroundColor[2]);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Content container (simulates the card with slight margin)
        const contentMargin = 10;
        const contentX = contentMargin;
        const contentY = contentMargin;
        const contentWidth = pageWidth - (contentMargin * 2);
        const contentHeight = pageHeight - (contentMargin * 2);

        doc.setFillColor(255, 255, 255); // White background for the main content area
        doc.rect(contentX, contentY, contentWidth, contentHeight, 'F');
        doc.setDrawColor(this.borderColor[0], this.borderColor[1], this.borderColor[2]); // Light border for the content area
        doc.setLineWidth(0.1);
        doc.rect(contentX, contentY, contentWidth, contentHeight, 'S');

        // Generate QR Code
        let qrCodeDataUrl = '';
        try {
            const candidatureInfo = {
                nupcan: data.nupcan || data.candidat.nupcan,
                nomcan: `${data.candidat.prncan} ${data.candidat.nomcan}`,
                maican: data.candidat.maican,
                tel: data.candidat.telcan,
                concours: data.concours.libcnc,
                etablissement: data.concours.etablissement_nomets,
                dateNaissance: data.candidat.dtncan,
                lieuNaissance: data.candidat.ldncan,
                frais: data.concours.fracnc,
                filiere: data.filiere?.nomfil,
                documentsCount: data.documents?.length || 0,
                statutPaiement: data.paiement?.statut || 'en_attente',
                dateInscription: data.candidat.created_at || new Date().toISOString(),
                // url: `${window.location.origin}/dashboard/${data.nupcan || data.candidat.nupcan}` // Cannot include window.location in server-side
            };
            qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(candidatureInfo), {
                width: 150, // Matches React component's QR width
                margin: 1,
                color: {dark: '#000000', light: '#FFFFFF'}
            });
        } catch (error) {
            console.error('Erreur génération QR Code:', error);
            qrCodeDataUrl = ''; // Ensure it's empty on error
        }

        // --- Layout Coordinates (tuned for single page fit) ---
        const topHeaderY = contentY + 15;
        const nupcanBadgeY = topHeaderY + 13;
        const contentStartBlockY = contentY + 50; // Y for start of photo/candidate/concours blocks

        const col1X = contentX + 15; // Left column (Photo, QR)
        const col2X = contentX + 90; // Middle column (Candidat, Concours)
        const col3X = col2X + (contentWidth - col2X - contentX - 20) / 2; // Right column (Concours)

        // Header
        doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('REÇU DE CANDIDATURE', pageWidth / 2, topHeaderY, {align: 'center'});

        // NUPCAN Badge
        const nupcanText = `NUPCAN: ${data.nupcan || data.candidat.nupcan || 'N/A'}`;
        const nupcanTextWidth = doc.getTextWidth(nupcanText);
        const badgePadding = 3; // Smaller padding for badge
        const badgeWidth = nupcanTextWidth + (badgePadding * 2);
        const badgeHeight = 7; // Smaller height for badge
        const badgeX = (pageWidth / 2) - (badgeWidth / 2);

        doc.setDrawColor(this.borderColor[0], this.borderColor[1], this.borderColor[2]);
        doc.setFillColor(240, 240, 240); // Light gray background for badge
        doc.roundedRect(badgeX, nupcanBadgeY, badgeWidth, badgeHeight, 1.5, 1.5, 'FD'); // Smaller rounded corners
        doc.setTextColor(0, 0, 0); // Black text for badge
        doc.setFontSize(10); // Smaller font for badge
        doc.text(nupcanText, badgeX + badgePadding, nupcanBadgeY + badgeHeight - 2.5);

        // --- Main Sections ---
        // Column 1: Photo and QR Code
        await this.drawPhotoAndQRSection(doc, col1X, contentStartBlockY, data.candidat, qrCodeDataUrl);

        // Column 2 & 3: Candidat and Concours Sections
        this.drawCandidatSection(doc, col2X, contentStartBlockY, data.candidat);
        this.drawConcoursSection(doc, col3X, contentStartBlockY, data.concours);

        // Filiere and Matieres section (New section)
        if (data.filiere && Object.keys(data.filiere).length > 0) {
            this.drawFiliereSection(doc, col1X, contentStartBlockY + 125, data.filiere); // Position after existing blocks
        }

        // Documents and Payment Section (positioned below the main content blocks)
        // Determine the Y position based on the tallest section above.
        // Adjust this Y based on whether filiere section is drawn
        const documentsPaymentSectionY = (data.filiere && Object.keys(data.filiere).length > 0) ? contentStartBlockY + 125 + 55 : contentStartBlockY + 115; // Adjusted to make space

        this.drawDocumentsAndPaymentSection(doc, col1X, documentsPaymentSectionY, data.documents, data.paiement, data.concours.fracnc);


        // Footer
        doc.setFontSize(9);
        doc.setTextColor(this.mutedTextColor[0], this.mutedTextColor[1], this.mutedTextColor[2]);
        doc.setFont('helvetica', 'normal');
        const footerText = `Reçu généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit'
        })}`;
        doc.text(footerText, pageWidth / 2, pageHeight - 10, {align: 'center'});

        return doc;
    }

    private async drawPhotoAndQRSection(doc: jsPDF, x: number, y: number, candidat: any, qrCodeDataUrl: string): Promise<void> {
        const photoBoxSize = 35; // Size of the photo container
        const photoBorderThickness = 1.5; // Border for the photo container
        const photoMargin = 5; // Margin below photo before QR code
        const qrSize = 38; // Size of the QR code image

        // Photo container
        const photoRectX = x;
        const photoRectY = y;

        doc.setDrawColor(this.borderColor[0], this.borderColor[1], this.borderColor[2]); // Light gray border
        doc.setLineWidth(photoBorderThickness);
        doc.setFillColor(255, 255, 255); // White background
        doc.roundedRect(photoRectX, photoRectY, photoBoxSize, photoBoxSize, 2, 2, 'FD'); // Rounded corners

        // Photo (or placeholder)
        const innerPhotoX = photoRectX + photoBorderThickness / 2;
        const innerPhotoY = photoRectY + photoBorderThickness / 2;
        const innerPhotoSize = photoBoxSize - photoBorderThickness;

        if (candidat.phtcan) {
            try {
                const img = new Image();
                img.src = candidat.phtcan.startsWith('data:image/') ? candidat.phtcan : `data:image/jpeg;base64,${candidat.phtcan}`; // Assume base64 if not data URL

                // Use a Promise to ensure image is loaded before adding to PDF
                await new Promise<void>((resolve, reject) => {
                    img.onload = () => {
                        doc.addImage(img, 'JPEG', innerPhotoX, innerPhotoY, innerPhotoSize, innerPhotoSize, undefined, 'FAST');
                        resolve();
                    };
                    img.onerror = (e) => {
                        console.error('Failed to load image:', e);
                        this.drawPhotoPlaceholder(doc, innerPhotoX, innerPhotoY, innerPhotoSize); // Draw placeholder on error
                        reject(new Error('Image failed to load')); // Reject the promise
                    };
                    // If image is already loaded (from cache), onload might not fire.
                    // Check complete status for immediate execution.
                    if (img.complete) {
                        doc.addImage(img, 'JPEG', innerPhotoX, innerPhotoY, innerPhotoSize, innerPhotoSize, undefined, 'FAST');
                        resolve();
                    }
                });
            } catch (error) {
                console.error('Error adding photo, drawing placeholder instead:', error);
                this.drawPhotoPlaceholder(doc, innerPhotoX, innerPhotoY, innerPhotoSize);
            }
        } else {
            this.drawPhotoPlaceholder(doc, innerPhotoX, innerPhotoY, innerPhotoSize);
        }

        // QR Code container
        const qrRectX = x;
        const qrRectY = photoRectY + photoBoxSize + photoMargin;

        doc.setDrawColor(this.borderColor[0], this.borderColor[1], this.borderColor[2]); // Light gray border
        doc.setLineWidth(0.5);
        doc.setFillColor(255, 255, 255); // White background
        doc.rect(qrRectX, qrRectY, qrSize, qrSize, 'FD'); // Square for QR

        // QR Code image
        if (qrCodeDataUrl) {
            try {
                doc.addImage(qrCodeDataUrl, 'PNG', qrRectX + 1, qrRectY + 1, qrSize - 2, qrSize - 2); // Small padding inside
            } catch (error) {
                console.error('Erreur ajout QR Code:', error);
                doc.setFontSize(8);
                doc.setTextColor(this.mutedTextColor[0], this.mutedTextColor[1], this.mutedTextColor[2]);
                doc.text('QR Code Error', qrRectX + qrSize / 2, qrRectY + qrSize / 2, {align: 'center'});
            }
        } else {
            doc.setFontSize(8);
            doc.setTextColor(this.mutedTextColor[0], this.mutedTextColor[1], this.mutedTextColor[2]);
            doc.text('QR Code N/A', qrRectX + qrSize / 2, qrRectY + qrSize / 2, {align: 'center'});
        }

        // QR Code descriptive text
        doc.setFontSize(7);
        doc.setTextColor(this.mutedTextColor[0], this.mutedTextColor[1], this.mutedTextColor[2]);
        doc.text('Scannez pour accéder', qrRectX + qrSize / 2, qrRectY + qrSize + 3, {align: 'center'});
        doc.text('aux détails complets', qrRectX + qrSize / 2, qrRectY + qrSize + 6, {align: 'center'});
    }

    private drawPhotoPlaceholder(doc: jsPDF, x: number, y: number, size: number) {
        doc.setFillColor(245, 245, 245); // Light gray background for placeholder
        doc.rect(x, y, size, size, 'F');
        doc.setFontSize(18); // Simulate User icon size
        doc.setTextColor(180, 180, 180); // Lighter gray for icon
        doc.setFont('helvetica', 'normal');
        doc.text('👤', x + size / 2, y + size / 2 + 3, {align: 'center'}); // Unicode user icon
    }

    private drawCandidatSection(doc: jsPDF, x: number, y: number, candidat: any): void {
        let currentY = y;

        // Section Title
        doc.setFontSize(13);
        doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('👤 Candidat', x, currentY); // Icon before text

        currentY += 8; // Space after title

        // Details
        doc.setFontSize(10);
        doc.setTextColor(this.textColor[0], this.textColor[1], this.textColor[2]);
        doc.setFont('helvetica', 'normal');

        const addDetail = (label: string, value: string | undefined) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label + ':', x + 5, currentY); // Label slightly indented
            doc.setFont('helvetica', 'normal');
            doc.text(value || 'N/A', x + 5 + doc.getTextWidth(label + ': '), currentY);
            currentY += 6;
        };
        const addIconDetail = (icon: string, value: string | undefined) => {
            doc.setFont('helvetica', 'normal'); // Font for icons
            doc.text(icon, x, currentY); // Icon at the main x position
            doc.setTextColor(this.mutedTextColor[0], this.mutedTextColor[1], this.mutedTextColor[2]); // Muted color for these details
            doc.text(value || 'N/A', x + 5, currentY); // Value slightly indented
            doc.setTextColor(this.textColor[0], this.textColor[1], this.textColor[2]); // Reset to black
            currentY += 6;
        };

        addDetail('Nom complet', `${candidat.prncan || ''} ${candidat.nomcan || ''}`.trim());
        addIconDetail('📧', candidat.maican);
        addIconDetail('📞', candidat.telcan);
        addIconDetail('🗓️', candidat.dtncan ? this.formatDate(candidat.dtncan) : 'N/A');
        addIconDetail('📍', candidat.ldncan);
    }

    private drawConcoursSection(doc: jsPDF, x: number, y: number, concours: any): void {
        let currentY = y;

        // Section Title
        doc.setFontSize(13);
        doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('🏆 Concours', x, currentY); // Icon before text

        currentY += 8; // Space after title

        // Details
        doc.setFontSize(10);
        doc.setTextColor(this.textColor[0], this.textColor[1], this.textColor[2]);
        doc.setFont('helvetica', 'normal');

        const addDetail = (label: string, value: string | undefined, isMultiline: boolean = false) => {
            doc.setFont('helvetica', 'bold');
            doc.text(label + ':', x, currentY);
            doc.setFont('helvetica', 'normal');
            if (isMultiline) {
                const lines = doc.splitTextToSize(value || 'N/A', 75); // Max width for content
                doc.text(lines, x, currentY + 4);
                currentY += (lines.length * 4.5) + 3; // Line height * num lines + small gap
            } else {
                doc.text(value || 'N/A', x + doc.getTextWidth(`${label}: `), currentY);
                currentY += 6;
            }
        };

        addDetail('Intitulé', concours.libcnc, true);
        addDetail('Établissement', concours.etablissement_nomets, true);
        addDetail('Session', concours.sescnc);

        const fraisText = (!concours.fracnc || concours.fracnc === 0) ? 'GRATUIT (Programme GORRI)' : `${concours.fracnc} FCFA`;
        doc.setFont('helvetica', 'bold');
        doc.text('Frais:', x, currentY);
        doc.setFont('helvetica', 'bold'); // Make the fee amount bold as well
        doc.text(fraisText, x + doc.getTextWidth('Frais: '), currentY);
        currentY += 6;
    }

    private drawFiliereSection(doc: jsPDF, x: number, y: number, filiere: any): void {
        let currentY = y;
        const sectionWidth = (doc.internal.pageSize.width - (10 * 2) - 2 * x + 15); // Adjust width to fill remaining space

        doc.setFillColor(255, 255, 255); // White background
        doc.setDrawColor(this.borderColor[0], this.borderColor[1], this.borderColor[2]);
        doc.setLineWidth(0.2);
        // Draw a larger rounded rectangle for the whole filiere section
        doc.roundedRect(x, currentY, sectionWidth, 50, 2, 2, 'FD'); // Fixed height for section

        currentY += 5; // Padding from top of the box

        doc.setFontSize(13);
        doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('🎓 Filière d\'Études', x + 3, currentY);

        currentY += 8;
        doc.setFontSize(10);
        doc.setTextColor(this.textColor[0], this.textColor[1], this.textColor[2]);
        doc.setFont('helvetica', 'normal');

        const addDetail = (label: string, value: string | undefined, detailX: number, isMultiline: boolean = false) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`${label}:`, detailX, currentY);
            doc.setFont('helvetica', 'normal');
            if (isMultiline) {
                const lines = doc.splitTextToSize(value || 'N/A', sectionWidth - (detailX - x) - 5); // Adjust max width
                doc.text(lines, detailX, currentY + 4);
                currentY += (lines.length * 4.5) + 3;
            } else {
                doc.text(value || 'N/A', detailX + doc.getTextWidth(`${label}: `), currentY);
                currentY += 6;
            }
        };

        // Main filiere details
        doc.setTextColor(this.mutedTextColor[0], this.mutedTextColor[1], this.mutedTextColor[2]);
        addDetail('Nom', filiere.nomfil, x + 5);

        // Description is longer, handle multiline
        currentY -= 6; // Move back up for description
        doc.setFont('helvetica', 'bold');
        doc.text('Description:', x + 5, currentY + 6);
        doc.setFont('helvetica', 'normal');
        const descriptionLines = doc.splitTextToSize(filiere.description || 'N/A', sectionWidth - 10);
        doc.text(descriptionLines, x + 5, currentY + 10);
        currentY += (descriptionLines.length * 4.5) + 10;

        // Matières (if any)
        if (filiere.matieres && filiere.matieres.length > 0) {
            doc.setFontSize(11);
            doc.setTextColor(this.primaryColor[0], this.primaryColor[1], this.primaryColor[2]);
            doc.setFont('helvetica', 'bold');
            doc.text('Matières:', x + 3, currentY + 5);
            currentY += 10;

            doc.setFontSize(9);
            doc.setTextColor(this.textColor[0], this.textColor[1], this.textColor[2]);
            doc.setFont('helvetica', 'normal');

            filiere.matieres.forEach((matiere: any, index: number) => {
                const matiereText = `• ${matiere.nom_matiere} (Coeff: ${matiere.coefficient})${matiere.obligatoire ? ' - Obligatoire' : ''}`;
                doc.text(matiereText, x + 5, currentY);
                currentY += 5;
            });
        }
    }

    private drawDocumentsAndPaymentSection(doc: jsPDF, x: number, y: number, documents: any[], paiement: any, fracnc?: number) {
        const totalContentWidth = doc.internal.pageSize.width - (10 * 2); // Page width minus overall content margins
        const sectionWidth = (totalContentWidth - 2 * x - 10) / 2; // (Total content width - left margin for both - gap between) / 2
        const sectionHeight = 40; // Fixed height for both sections for alignment

        // Documents Section (Left)
        doc.setFillColor(255, 255, 255); // White background
        doc.setDrawColor(this.borderColor[0], this.borderColor[1], this.borderColor[2]); // Light gray border
        doc.setLineWidth(0.2);
        doc.rect(x, y, sectionWidth, sectionHeight, 'FD');

        let currentDocY = y + 5;
        doc.setFontSize(12);
        doc.setTextColor(this.textColor[0], this.textColor[1], this.textColor[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`📄 Documents (${documents?.length || 0})`, x + 3, currentDocY);

        currentDocY += 8;
        doc.setFontSize(9);
        doc.setTextColor(this.mutedTextColor[0], this.mutedTextColor[1], this.mutedTextColor[2]);
        doc.setFont('helvetica', 'normal');

        if (documents && documents.length > 0) {
            documents.slice(0, 3).forEach((docItem, index) => {
                // Unicode bullet point (green circle)
                doc.setTextColor(60, 179, 113); // Sea green for bullet
                doc.text('•', x + 3, currentDocY);
                doc.setTextColor(this.mutedTextColor[0], this.mutedTextColor[1], this.mutedTextColor[2]); // Reset text color
                doc.text(docItem.nomdoc || docItem.type || `Document ${index + 1}`, x + 6, currentDocY);
                currentDocY += 5;
            });
            if (documents.length > 3) {
                doc.setFontSize(8);
                doc.setTextColor(this.mutedTextColor[0], this.mutedTextColor[1], this.mutedTextColor[2]);
                doc.text(`... et ${documents.length - 3} autre(s)`, x + 5, currentDocY + 2);
            }
        } else {
            doc.setTextColor(this.mutedTextColor[0], this.mutedTextColor[1], this.mutedTextColor[2]);
            doc.text('Aucun document téléchargé', x + 5, currentDocY);
        }

        // Payment Section (Right)
        const paymentX = x + sectionWidth + 10; // Positioned next to documents section with a gap
        doc.setDrawColor(this.borderColor[0], this.borderColor[1], this.borderColor[2]); // Light gray border

        let statutBgColor = this.mainBackgroundColor; // Default for "Non payé" or "Gratuit"
        let statutTextColor = this.textColor; // Default text color

        const isFree = (!fracnc || fracnc === 0);
        let statutDisplay = 'Non payé';

        if (isFree) {
            statutDisplay = 'Gratuit';
            statutBgColor = this.mainBackgroundColor; // No special background, matches overall
            statutTextColor = [60, 179, 113]; // Sea green for free text
        } else if (paiement?.statut === 'valide') {
            statutDisplay = 'Payé';
            statutBgColor = this.successBgColor;
            statutTextColor = this.successColor;
        } else if (paiement?.statut === 'en_attente') {
            statutDisplay = 'En attente';
            statutBgColor = this.warningBgColor;
            statutTextColor = this.warningColor;
        }

        doc.setFillColor(statutBgColor[0], statutBgColor[1], statutBgColor[2]);
        doc.rect(paymentX, y, sectionWidth, sectionHeight, 'FD'); // Fill with appropriate background

        let currentPaymentY = y + 5;
        doc.setFontSize(12);
        doc.setTextColor(this.textColor[0], this.textColor[1], this.textColor[2]); // Section title always black
        doc.setFont('helvetica', 'bold');
        doc.text('💳 Paiement', paymentX + 3, currentPaymentY);

        currentPaymentY += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');

        // Statut
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(this.textColor[0], this.textColor[1], this.textColor[2]);
        doc.text('Statut:', paymentX + 3, currentPaymentY);
        doc.setTextColor(statutTextColor[0], statutTextColor[1], statutTextColor[2]); // Text color based on status
        doc.text(statutDisplay, paymentX + 3 + doc.getTextWidth('Statut: '), currentPaymentY);
        currentPaymentY += 6;

        // Other payment details (only if not free and payment data exists)
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(this.mutedTextColor[0], this.mutedTextColor[1], this.mutedTextColor[2]);
        if (paiement && !isFree) {
            doc.text(`Montant: ${paiement.montant || 'N/A'} FCFA`, paymentX + 3, currentPaymentY);
            currentPaymentY += 5;
            doc.text(`Date: ${paiement.date ? this.formatDate(paiement.date) : 'N/A'}`, paymentX + 3, currentPaymentY);
            currentPaymentY += 5;
            doc.text(`Réf: ${paiement.reference || 'N/A'}`, paymentX + 3, currentPaymentY);
        } else if (!paiement && !isFree) {
            doc.setTextColor(this.mutedTextColor[0], this.mutedTextColor[1], this.mutedTextColor[2]);
            doc.text('Détails de paiement non disponibles', paymentX + 3, currentPaymentY);
        }
    }

    private formatDate(dateString: string): string {
        try {
            return new Date(dateString).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (e) {
            console.error('Failed to format date:', dateString, e);
            return dateString; // Return as is if parsing fails
        }
    }

    downloadReceiptPDF(data: PDFData): void {
        this.generateReceiptPDF(data).then((doc) => {
            const nupcan = data.nupcan || data.candidat.nupcan || 'candidat';
            doc.save(`Recu_Candidature_${nupcan}_${new Date().toISOString().split('T')[0]}.pdf`);
        }).catch((error) => console.error('PDF generation error:', error));
    }

    async generatePDFBlob(data: PDFData): Promise<Blob> {
        return this.generateReceiptPDF(data).then((doc) => doc.output('blob'));
    }
}

export const pdfService = new PDFService();