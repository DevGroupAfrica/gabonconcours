import jsPDF from 'jspdf';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';

export interface CandidatureReceiptData {
    candidat: {
        nupcan: string;
        nomcan: string;
        prncan: string;
        maican: string;
        telcan: string;
        dtncan: string;
        ldncan?: string;
        phtcan?: string;
    };
    concours: {
        libcnc: string;
        fracnc?: number;
        etablissement_nomets?: string;
        sescnc?: string;
    };
    filiere?: {
        nomfil: string;
    };
    documents: Array<{
        nomdoc: string;
        type: string;
        statut: string;
    }>;
    paiement?: {
        statut: string;
        montant?: number;
        reference?: string;
    };
}

class ReceiptGenerator {
    async generateReceiptPDF(data: CandidatureReceiptData): Promise<Blob> {
        const doc = new jsPDF('portrait', 'mm', 'a4');
        const pageWidth = 210;
        const pageHeight = 297;

        // Couleurs selon le modèle
        const primaryBlue = [33, 150, 243];
        const lightBlue = [232, 245, 253];
        const greenSuccess = [76, 175, 80];
        const textGray = [97, 97, 97];

        // Fond léger
        doc.setFillColor(lightBlue[0], lightBlue[1], lightBlue[2]);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');

        // Logo et en-tête
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(10, 10, 190, 40, 3, 3, 'F');

        // Logo DevGroup (simulé)
        doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.rect(20, 18, 8, 24, 'F');
        doc.setFontSize(12);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('DevGroup', 35, 28);

        // Titre principal
        doc.setFontSize(20);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.text('REÇU DE CANDIDATURE', 105, 25, {align: 'center'});

        // NUPCAN
        doc.setFontSize(12);
        doc.setTextColor(200, 100, 50);
        doc.setFont('helvetica', 'bold');
        doc.text(`NUPCAN: ${data.candidat.nupcan}`, 105, 40, {align: 'center'});

        // QR Code
        let qrCodeDataUrl = '';
        try {
            const qrData = {
                nupcan: data.candidat.nupcan,
                nom: `${data.candidat.prncan} ${data.candidat.nomcan}`,
                concours: data.concours.libcnc
            };
            qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
                width: 200,
                margin: 1,
                color: {dark: '#000000', light: '#FFFFFF'}
            });
        } catch (error) {
            console.error('Erreur QR Code:', error);
        }

        // Zone QR Code
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(15, 60, 45, 70, 2, 2, 'F');

        if (qrCodeDataUrl) {
            doc.addImage(qrCodeDataUrl, 'PNG', 20, 65, 35, 35);
        }

        doc.setFontSize(8);
        doc.setTextColor(textGray[0], textGray[1], textGray[2]);
        doc.text('Scannez pour accéder', 37.5, 108, {align: 'center'});
        doc.text('aux détails complets', 37.5, 115, {align: 'center'});

        // Section Candidat
        let yPos = 60;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(70, yPos, 125, 70, 2, 2, 'F');

        doc.setFontSize(14);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('👤 Candidat', 75, yPos + 10);

        yPos += 18;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        const candidatInfo = [
            `Nom: ${data.candidat.prncan} ${data.candidat.nomcan}`,
            `📧 ${data.candidat.maican}`,
            `📞 ${data.candidat.telcan}`,
            `📅 ${new Date(data.candidat.dtncan).toLocaleDateString('fr-FR')}`,
            `📍 ${data.candidat.ldncan || 'Libreville'}`
        ];

        candidatInfo.forEach((info, index) => {
            doc.text(info, 75, yPos + (index * 6));
        });

        // Section Concours
        yPos = 140;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(70, yPos, 125, 70, 2, 2, 'F');

        doc.setFontSize(14);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('🏆 Concours', 75, yPos + 10);

        yPos += 18;
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        const concoursInfo = [
            `Intitulé: ${data.concours.libcnc}`,
            `Établissement: ${data.concours.etablissement_nomets}`,
            `Session: ${data.concours.sescnc}`,
            `Frais: ${!data.concours.fracnc || data.concours.fracnc === 0 ? 'GRATUIT (Programme GORRI)' : `${data.concours.fracnc} FCFA`}`
        ];

        concoursInfo.forEach((info, index) => {
            const lines = doc.splitTextToSize(info, 115);
            doc.text(lines, 75, yPos + (index * 8));
        });

        // Section Documents
        yPos = 220;
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(15, yPos, 85, 50, 2, 2, 'F');

        doc.setFontSize(12);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(`📄 Documents (${data.documents.length})`, 20, yPos + 10);

        yPos += 18;
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        data.documents.slice(0, 4).forEach((doc_item, index) => {
            doc.setFillColor(greenSuccess[0], greenSuccess[1], greenSuccess[2]);
            doc.circle(22, yPos + (index * 6) - 1, 1, 'F');
            doc.text(doc_item.nomdoc.substring(0, 30) + (doc_item.nomdoc.length > 30 ? '...' : ''), 25, yPos + (index * 6));
        });

        // Section Paiement
        doc.setFillColor(255, 255, 255);
        doc.roundedRect(110, 220, 85, 50, 2, 2, 'F');

        doc.setFontSize(12);
        doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
        doc.setFont('helvetica', 'bold');
        doc.text('💳 Paiement', 115, 230);

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        const paymentStatus = data.paiement?.statut === 'valide' ? 'Payé' :
            (!data.concours.fracnc || data.concours.fracnc === 0) ? 'Gratuit' : 'En attente';

        doc.text(`Statut: ${paymentStatus}`, 115, 245);

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(textGray[0], textGray[1], textGray[2]);
        doc.text(`Reçu généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`,
            105, 285, {align: 'center'});

        return doc.output('blob');
    }

    async generateReceiptPNG(data: CandidatureReceiptData): Promise<Blob> {
        // Créer un élément temporaire avec le design du reçu
        const element = document.createElement('div');
        element.style.width = '794px'; // A4 width in pixels at 96 DPI
        element.style.height = '1123px'; // A4 height in pixels at 96 DPI
        element.style.padding = '40px';
        element.style.backgroundColor = '#e8f5fd';
        element.style.fontFamily = 'Arial, sans-serif';
        element.style.position = 'absolute';
        element.style.left = '-9999px';

        element.innerHTML = `
      <div style="background: white; border-radius: 12px; padding: 30px; height: 100%; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2196f3; padding-bottom: 20px;">
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 15px;">
            <div style="width: 40px; height: 40px; background: #2196f3; margin-right: 15px; display: flex; align-items: center; justify-content: center; border-radius: 8px;">
              <span style="color: white; font-weight: bold; font-size: 12px;">DG</span>
            </div>
            <h1 style="color: #2196f3; font-size: 24px; font-weight: bold; margin: 0;">REÇU DE CANDIDATURE</h1>
          </div>
          <div style="background: #fff3e0; padding: 8px 20px; border-radius: 20px; display: inline-block;">
            <span style="color: #f57c00; font-weight: bold; font-size: 14px;">NUPCAN: ${data.candidat.nupcan}</span>
          </div>
        </div>

        <div style="display: flex; gap: 30px;">
          <!-- Left Column -->
          <div style="flex: 1;">
            <!-- Candidat Section -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
              <h3 style="color: #2196f3; font-size: 16px; margin-bottom: 15px; display: flex; align-items: center;">
                <span style="margin-right: 8px;">👤</span> Candidat
              </h3>
              <div style="font-size: 12px; line-height: 1.6;">
                <div><strong>Nom:</strong> ${data.candidat.prncan} ${data.candidat.nomcan}</div>
                <div style="margin-top: 5px;">📧 ${data.candidat.maican}</div>
                <div style="margin-top: 5px;">📞 ${data.candidat.telcan}</div>
                <div style="margin-top: 5px;">📅 ${new Date(data.candidat.dtncan).toLocaleDateString('fr-FR')}</div>
                <div style="margin-top: 5px;">📍 ${data.candidat.ldncan || 'Libreville'}</div>
              </div>
            </div>

            <!-- Documents Section -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px;">
              <h3 style="color: #2196f3; font-size: 16px; margin-bottom: 15px; display: flex; align-items: center;">
                <span style="margin-right: 8px;">📄</span> Documents (${data.documents.length})
              </h3>
              <div style="font-size: 11px;">
                ${data.documents.slice(0, 4).map(doc => `
                  <div style="margin-bottom: 8px; display: flex; align-items: center;">
                    <span style="width: 6px; height: 6px; background: #4caf50; border-radius: 50%; margin-right: 8px;"></span>
                    ${doc.nomdoc.length > 35 ? doc.nomdoc.substring(0, 35) + '...' : doc.nomdoc}
                  </div>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Right Column -->
          <div style="flex: 1;">
            <!-- Concours Section -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
              <h3 style="color: #2196f3; font-size: 16px; margin-bottom: 15px; display: flex; align-items: center;">
                <span style="margin-right: 8px;">🏆</span> Concours
              </h3>
              <div style="font-size: 12px; line-height: 1.6;">
                <div><strong>Intitulé:</strong><br>${data.concours.libcnc}</div>
                <div style="margin-top: 8px;"><strong>Établissement:</strong><br>${data.concours.etablissement_nomets}</div>
                <div style="margin-top: 8px;"><strong>Session:</strong> ${data.concours.sescnc}</div>
                <div style="margin-top: 8px;"><strong>Frais:</strong> 
                  <span style="color: ${!data.concours.fracnc || data.concours.fracnc === 0 ? '#4caf50' : '#f57c00'}; font-weight: bold;">
                    ${!data.concours.fracnc || data.concours.fracnc === 0 ? 'GRATUIT' : data.concours.fracnc + ' FCFA'}
                  </span>
                </div>
              </div>
            </div>

            <!-- Paiement Section -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 12px;">
              <h3 style="color: #2196f3; font-size: 16px; margin-bottom: 15px; display: flex; align-items: center;">
                <span style="margin-right: 8px;">💳</span> Paiement
              </h3>
              <div style="font-size: 12px;">
                <div>Statut: 
                  <span style="background: ${data.paiement?.statut === 'valide' ? '#e8f5e8' : '#e3f2fd'}; 
                              color: ${data.paiement?.statut === 'valide' ? '#2e7d32' : '#1976d2'}; 
                              padding: 4px 12px; border-radius: 12px; font-weight: bold; font-size: 11px;">
                    ${data.paiement?.statut === 'valide' ? 'Payé' :
            (!data.concours.fracnc || data.concours.fracnc === 0) ? 'Gratuit' : 'En attente'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <div style="font-size: 10px; color: #666;">
            Reçu généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
          </div>
        </div>
      </div>
    `;

        document.body.appendChild(element);

        try {
            const canvas = await html2canvas(element, {
                width: 794,
                height: 1123,
                scale: 2,
                backgroundColor: '#e8f5fd'
            });

            document.body.removeChild(element);

            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob!);
                }, 'image/png', 1.0);
            });
        } catch (error) {
            document.body.removeChild(element);
            throw error;
        }
    }
}

export const receiptGenerator = new ReceiptGenerator();
