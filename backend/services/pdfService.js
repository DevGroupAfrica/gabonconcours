const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
    // Générer un reçu de paiement
    async generatePaymentReceipt(candidat, paiement, concours) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ size: 'A4', margin: 50 });
                const fileName = `recu_${paiement.nupcan}_${Date.now()}.pdf`;
                const uploadsDir = path.join(__dirname, '..', 'uploads', 'recus');
                
                // Créer le dossier s'il n'existe pas
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }
                
                const filePath = path.join(uploadsDir, fileName);
                const stream = fs.createWriteStream(filePath);

                doc.pipe(stream);

                // En-tête
                doc.fontSize(20)
                   .fillColor('#2563eb')
                   .text('REÇU DE PAIEMENT', { align: 'center' })
                   .moveDown();

                doc.fontSize(12)
                   .fillColor('#000000')
                   .text('GabConcours - Gestion des Concours', { align: 'center' })
                   .moveDown(2);

                // Rectangle pour les informations principales
                doc.rect(50, doc.y, 495, 100)
                   .strokeColor('#2563eb')
                   .stroke();

                const startY = doc.y + 10;
                
                // Informations candidat
                doc.fontSize(11)
                   .fillColor('#374151')
                   .text('INFORMATIONS CANDIDAT', 60, startY, { underline: true })
                   .moveDown(0.5);

                doc.fontSize(10)
                   .text(`Nom : ${candidat.nomcan}`, 60)
                   .text(`Prénom : ${candidat.prncan}`, 60)
                   .text(`NUPCAN : ${candidat.nupcan}`, 60)
                   .text(`Email : ${candidat.maican}`, 60);

                // Informations paiement
                doc.fontSize(11)
                   .fillColor('#374151')
                   .text('INFORMATIONS PAIEMENT', 320, startY, { underline: true })
                   .moveDown(0.5);

                doc.fontSize(10)
                   .text(`Montant : ${paiement.montant} FCFA`, 320, startY + 20)
                   .text(`Méthode : ${paiement.methode}`, 320)
                   .text(`Référence : ${paiement.reference_paiement}`, 320)
                   .text(`Date : ${new Date(paiement.created_at).toLocaleDateString('fr-FR')}`, 320);

                doc.moveDown(3);

                // Informations concours
                doc.rect(50, doc.y, 495, 80)
                   .strokeColor('#2563eb')
                   .stroke();

                const concoursY = doc.y + 10;
                
                doc.fontSize(11)
                   .fillColor('#374151')
                   .text('CONCOURS', 60, concoursY, { underline: true })
                   .moveDown(0.5);

                doc.fontSize(10)
                   .text(`Libellé : ${concours?.libcnc || 'N/A'}`, 60)
                   .text(`Établissement : ${concours?.etablissement_nom || 'N/A'}`, 60);

                doc.moveDown(3);

                // Statut
                doc.fontSize(14)
                   .fillColor('#10b981')
                   .text('✓ PAIEMENT CONFIRMÉ', { align: 'center' })
                   .moveDown(2);

                // Pied de page
                doc.fontSize(9)
                   .fillColor('#6b7280')
                   .text('Ce reçu est généré automatiquement et ne nécessite pas de signature.', { align: 'center' })
                   .text(`Document généré le ${new Date().toLocaleString('fr-FR')}`, { align: 'center' });

                // QR Code zone (placeholder)
                doc.fontSize(8)
                   .text('GabConcours © 2025 - Tous droits réservés', 50, 750, { align: 'center' });

                doc.end();

                stream.on('finish', () => {
                    resolve({
                        fileName,
                        filePath,
                        relativePath: `/uploads/recus/${fileName}`
                    });
                });

                stream.on('error', (error) => {
                    reject(error);
                });

            } catch (error) {
                console.error('Erreur génération PDF:', error);
                reject(error);
            }
        });
    }

    // Générer une liste de candidats (export)
    async generateCandidatesList(candidats, concours) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ size: 'A4', margin: 30, layout: 'landscape' });
                const fileName = `liste_candidats_${concours?.id || 'all'}_${Date.now()}.pdf`;
                const uploadsDir = path.join(__dirname, '..', 'uploads', 'exports');
                
                if (!fs.existsSync(uploadsDir)) {
                    fs.mkdirSync(uploadsDir, { recursive: true });
                }
                
                const filePath = path.join(uploadsDir, fileName);
                const stream = fs.createWriteStream(filePath);

                doc.pipe(stream);

                // En-tête
                doc.fontSize(16)
                   .fillColor('#2563eb')
                   .text('LISTE DES CANDIDATS', { align: 'center' })
                   .moveDown();

                if (concours) {
                    doc.fontSize(12)
                       .fillColor('#374151')
                       .text(`Concours : ${concours.libcnc}`, { align: 'center' })
                       .moveDown();
                }

                doc.fontSize(10)
                   .text(`Date d'édition : ${new Date().toLocaleDateString('fr-FR')}`, { align: 'center' })
                   .text(`Total candidats : ${candidats.length}`, { align: 'center' })
                   .moveDown(2);

                // Tableau
                const tableTop = doc.y;
                const tableHeaders = ['N°', 'NUPCAN', 'Nom', 'Prénom', 'Email', 'Téléphone', 'Statut'];
                const colWidths = [30, 90, 100, 100, 150, 90, 80];
                let x = 30;

                // En-têtes
                doc.fontSize(9).fillColor('#ffffff');
                tableHeaders.forEach((header, i) => {
                    doc.rect(x, tableTop, colWidths[i], 20).fill('#2563eb');
                    doc.fillColor('#ffffff').text(header, x + 5, tableTop + 5, {
                        width: colWidths[i] - 10,
                        align: 'left'
                    });
                    x += colWidths[i];
                });

                // Données
                let y = tableTop + 20;
                doc.fontSize(8).fillColor('#000000');
                
                candidats.forEach((candidat, index) => {
                    if (y > 520) { // Nouvelle page si nécessaire
                        doc.addPage();
                        y = 30;
                    }

                    x = 30;
                    const rowData = [
                        (index + 1).toString(),
                        candidat.nupcan || 'N/A',
                        candidat.nomcan || '',
                        candidat.prncan || '',
                        candidat.maican || '',
                        candidat.tlecan || '',
                        candidat.statut || 'En attente'
                    ];

                    rowData.forEach((data, i) => {
                        doc.rect(x, y, colWidths[i], 15).stroke();
                        doc.text(data, x + 5, y + 3, {
                            width: colWidths[i] - 10,
                            align: 'left'
                        });
                        x += colWidths[i];
                    });

                    y += 15;
                });

                doc.end();

                stream.on('finish', () => {
                    resolve({
                        fileName,
                        filePath,
                        relativePath: `/uploads/exports/${fileName}`
                    });
                });

                stream.on('error', reject);

            } catch (error) {
                console.error('Erreur génération PDF liste:', error);
                reject(error);
            }
        });
    }
}

module.exports = new PDFService();
