import html2canvas from 'html2canvas';
import {apiService} from './api';

export interface ReceiptImageData {
    candidat: {
        nupcan: string;
        nomcan: string;
        prncan: string;
        maican: string;
        telcan: string;
        dtncan: string;
        ldncan?: string;
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
    paiement?: {
        reference?: string;
        montant?: number;
        date?: string;
        statut?: string;
        methode?: string;
    };
}

class ReceiptImageService {
    sendReceiptImageByEmail(receiptData: {
        candidat: {
            ldncan: string;
            phtcan: any;
            id: number;
            nomcan: string;
            prncan: string;
            maican: string;
            telcan: string;
            dtncan: string;
            nipcan?: string;
            proorg: number;
            proact: number;
            proaff: number;
            niveau_id: number;
            nupcan: string;
            concours_id?: number;
            filiere_id?: number;
            created_at?: string;
            statut?: string;
        };
        concours: any;
        filiere: any;
        paiement: any;
        documents: any[];
    }, maican: string) {
        throw new Error('Method not implemented.');
    }

    private validateReceiptData(data: any): ReceiptImageData {
        return {
            candidat: {
                nupcan: data.candidat?.nupcan || '',
                nomcan: data.candidat?.nomcan || '',
                prncan: data.candidat?.prncan || '',
                maican: data.candidat?.maican || '',
                telcan: data.candidat?.telcan || '',
                dtncan: data.candidat?.dtncan || '',
                ldncan: data.candidat?.ldncan || 'Libreville'
            },
            concours: {
                libcnc: data.concours?.libcnc || '',
                fracnc: data.concours?.fracnc || 0,
                etablissement_nomets: data.concours?.etablissement_nomets || '',
                sescnc: data.concours?.sescnc || ''
            },
            filiere: data.filiere,
            paiement: data.paiement
        };
    }

    private createReceiptHTML(data: ReceiptImageData): string {
        const currentDate = new Date().toLocaleDateString('fr-FR');
        const isPaid = data.paiement && data.paiement.statut === 'valide';
        const isFree = !data.concours.fracnc || data.concours.fracnc === 0;

        return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            width: 297mm;
            height: 210mm;
          }
          .receipt-container {
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            overflow: hidden;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            position: relative;
          }
          .header::after {
            content: '';
            position: absolute;
            bottom: -10px;
            left: 0;
            right: 0;
            height: 20px;
            background: white;
            border-radius: 50% 50% 0 0 / 100% 100% 0 0;
          }
          .header h1 {
            font-size: 2.5em;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .header p {
            font-size: 1.2em;
            opacity: 0.9;
          }
          .content {
            flex: 1;
            padding: 40px;
            display: flex;
            flex-direction: column;
            gap: 30px;
          }
          .info-row {
            display: flex;
            justify-content: space-between;
            gap: 40px;
          }
          .info-section {
            flex: 1;
            background: #f8fafc;
            padding: 25px;
            border-radius: 12px;
            border-left: 4px solid #667eea;
          }
          .info-section h3 {
            color: #2d3748;
            font-size: 1.3em;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            gap: 10px;
          }
          .info-item {
            margin-bottom: 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .info-label {
            font-weight: 600;
            color: #4a5568;
            font-size: 0.9em;
          }
          .info-value {
            color: #2d3748;
            font-weight: 500;
            text-align: right;
            max-width: 60%;
          }
          .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-paid {
            background: #c6f6d5;
            color: #22543d;
          }
          .status-free {
            background: #bee3f8;
            color: #2a4365;
          }
          .status-pending {
            background: #fef5e7;
            color: #c05621;
          }
          .footer {
            background: #f7fafc;
            padding: 30px;
            text-align: center;
            border-top: 2px solid #e2e8f0;
          }
          .footer p {
            color: #718096;
            font-size: 0.9em;
            margin-bottom: 5px;
          }
          .date-stamp {
            background: #667eea;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            font-weight: bold;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <h1>🎓 REÇU DE CANDIDATURE</h1>
            <p>République Gabonaise - Concours d'Entrée</p>
          </div>
          
          <div class="content">
            <div class="info-row">
              <div class="info-section">
                <h3>👤 Informations Candidat</h3>
                <div class="info-item">
                  <span class="info-label">NUPCAN:</span>
                  <span class="info-value" style="font-weight: bold; color: #667eea;">${data.candidat.nupcan}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Nom:</span>
                  <span class="info-value">${data.candidat.prncan} ${data.candidat.nomcan}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email:</span>
                  <span class="info-value">${data.candidat.maican}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Téléphone:</span>
                  <span class="info-value">${data.candidat.telcan}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Lieu de naissance:</span>
                  <span class="info-value">${data.candidat.ldncan}</span>
                </div>
              </div>
              
              <div class="info-section">
                <h3> Informations Concours</h3>
                <div class="info-item">
                  <span class="info-label">Concours:</span>
                  <span class="info-value">${data.concours.libcnc}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Établissement:</span>
                  <span class="info-value">${data.concours.etablissement_nomets || 'Non spécifié'}</span>
                </div>
                ${data.filiere ? `
                <div class="info-item">
                  <span class="info-label">Filière:</span>
                  <span class="info-value">${data.filiere.nomfil}</span>
                </div>
                ` : ''}
                <div class="info-item">
                  <span class="info-label">Session:</span>
                  <span class="info-value">${data.concours.sescnc || 'Session 2025'}</span>
                </div>
              </div>
            </div>
            
            <div class="info-section">
              <h3> Informations Paiement</h3>
              <div class="info-row" style="gap: 20px;">
                <div style="flex: 1;">
                  <div class="info-item">
                    <span class="info-label">Montant:</span>
                    <span class="info-value" style="font-size: 1.2em; font-weight: bold;">
                      ${isFree ? 'GRATUIT (Programme NGORI)' : `${data.concours.fracnc} FCFA`}
                    </span>
                  </div>
                  ${data.paiement ? `
                  <div class="info-item">
                    <span class="info-label">Référence:</span>
                    <span class="info-value">${data.paiement.reference || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Méthode:</span>
                    <span class="info-value">${data.paiement.methode || 'N/A'}</span>
                  </div>
                  ` : ''}
                </div>
                <div style="flex: 0 0 auto; text-align: right;">
                  <span class="status-badge ${isFree ? 'status-free' : isPaid ? 'status-paid' : 'status-pending'}">
                    ${isFree ? 'GRATUIT' : isPaid ? 'PAYÉ' : 'EN ATTENTE'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>Ce reçu atteste de votre candidature au concours mentionné ci-dessus.</p>
            <p>Conservez ce document précieusement.</p>
            <div class="date-stamp">
               Généré le ${currentDate}
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
    }

    async generateReceiptImage(data: any): Promise<Blob> {
        try {
            const validatedData = this.validateReceiptData(data);
            const htmlContent = this.createReceiptHTML(validatedData);

            // Créer un iframe temporaire pour le rendu
            const iframe = document.createElement('iframe');
            iframe.style.position = 'absolute';
            iframe.style.top = '-9999px';
            iframe.style.width = '297mm';
            iframe.style.height = '210mm';
            document.body.appendChild(iframe);

            // Charger le contenu
            const iframeDoc = iframe.contentDocument!;
            iframeDoc.open();
            iframeDoc.write(htmlContent);
            iframeDoc.close();

            // Attendre le chargement
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Générer l'image avec une qualité optimisée
            const canvas = await html2canvas(iframeDoc.body, {
                width: 1123, // A4 width at 96 DPI
                height: 794,  // A4 height at 96 DPI
                scale: 1,
                useCORS: true,
                allowTaint: true,
                backgroundColor: '#ffffff',
                logging: false
            });

            // Nettoyer
            document.body.removeChild(iframe);

            // Convertir en blob avec compression
            return new Promise((resolve) => {
                canvas.toBlob((blob) => {
                    resolve(blob!);
                }, 'image/png', 0.8); // Compression à 80%
            });
        } catch (error) {
            console.error('Erreur génération image:', error);
            throw new Error('Impossible de générer l\'image du reçu');
        }
    }

    async downloadReceiptImage(data: any): Promise<void> {
        try {
            const blob = await this.generateReceiptImage(data);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `recu-${data.candidat.nupcan}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Erreur téléchargement image:', error);
            throw error;
        }
    }

    async generateAndSendReceiptImageEmail(data: any, maican: string): Promise<void> {
        try {
            if (!maican || !maican.includes('@')) {
                throw new Error('Adresse email invalide');
            }

            const validatedData = this.validateReceiptData(data);

            // Générer l'image
            const imageBlob = await this.generateReceiptImage(data);

            // Convertir en base64
            const base64Image = await this.blobToBase64(imageBlob);

            const response = await apiService.makeRequest('/email/receipt-image', 'POST', {
                maican: maican,
                nupcan: validatedData.candidat.nupcan,
                candidatData: validatedData,
                imageData: base64Image
            });

            if (!response.success) {
                throw new Error(response.message || 'Erreur lors de l\'envoi de l\'email');
            }
        } catch (error) {
            console.error('Erreur envoi email image:', error);
            throw error;
        }
    }

    private blobToBase64(blob: Blob): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64String = (reader.result as string).split(',')[1];
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
}

export const receiptImageService = new ReceiptImageService();
