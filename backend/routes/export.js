const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');

// Export liste candidats en PDF
router.get('/candidats/pdf', async (req, res) => {
    try {
        const { etablissement_id, concours_id } = req.query;
        const connection = getConnection();

        let query = `
            SELECT c.*, con.libcnc, e.nom_etablissement, f.nom_filiere
            FROM candidats c
            LEFT JOIN concours con ON c.concours_id = con.id
            LEFT JOIN etablissements e ON con.etablissement_id = e.id
            LEFT JOIN filieres f ON c.filiere_id = f.id
            WHERE 1=1
        `;
        
        const params = [];

        if (etablissement_id) {
            query += ' AND con.etablissement_id = ?';
            params.push(etablissement_id);
        }

        if (concours_id) {
            query += ' AND c.concours_id = ?';
            params.push(concours_id);
        }

        query += ' ORDER BY c.nomcan, c.prncan';

        const [candidats] = await connection.execute(query, params);

        // Créer le PDF
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=liste-candidats.pdf');

        doc.pipe(res);

        // En-tête
        doc.fontSize(20).text('Liste des Candidats', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
        doc.text(`Total: ${candidats.length} candidat(s)`, { align: 'right' });
        doc.moveDown(2);

        // Tableau
        let y = doc.y;
        const tableTop = y;
        const rowHeight = 25;

        // En-têtes
        doc.fontSize(9).font('Helvetica-Bold');
        doc.text('NUPCAN', 50, y);
        doc.text('Nom', 150, y);
        doc.text('Prénom', 250, y);
        doc.text('Concours', 350, y);
        doc.text('Statut', 480, y);

        // Ligne de séparation
        y += 15;
        doc.moveTo(50, y).lineTo(550, y).stroke();

        // Données
        doc.font('Helvetica');
        candidats.forEach((candidat, index) => {
            y += rowHeight;

            if (y > 750) {
                doc.addPage();
                y = 50;
            }

            doc.fontSize(8);
            doc.text(candidat.nupcan || 'N/A', 50, y, { width: 90 });
            doc.text(candidat.nomcan || 'N/A', 150, y, { width: 90 });
            doc.text(candidat.prncan || 'N/A', 250, y, { width: 90 });
            doc.text(candidat.libcnc || 'N/A', 350, y, { width: 120 });
            doc.text(candidat.statut || 'en_attente', 480, y);
        });

        doc.end();
    } catch (error) {
        console.error('Erreur export PDF candidats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Export liste candidats en Excel
router.get('/candidats/excel', async (req, res) => {
    try {
        const { etablissement_id, concours_id, include_notes } = req.query;
        const connection = getConnection();

        let query = `
            SELECT c.*, con.libcnc, e.nom_etablissement, f.nom_filiere
            FROM candidats c
            LEFT JOIN concours con ON c.concours_id = con.id
            LEFT JOIN etablissements e ON con.etablissement_id = e.id
            LEFT JOIN filieres f ON c.filiere_id = f.id
            WHERE 1=1
        `;
        
        const params = [];

        if (etablissement_id) {
            query += ' AND con.etablissement_id = ?';
            params.push(etablissement_id);
        }

        if (concours_id) {
            query += ' AND c.concours_id = ?';
            params.push(concours_id);
        }

        query += ' ORDER BY c.nomcan, c.prncan';

        const [candidats] = await connection.execute(query, params);

        // Créer le fichier Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Candidats');

        // Définir les colonnes
        const columns = [
            { header: 'NUPCAN', key: 'nupcan', width: 15 },
            { header: 'Nom', key: 'nomcan', width: 20 },
            { header: 'Prénom', key: 'prncan', width: 20 },
            { header: 'Email', key: 'maican', width: 30 },
            { header: 'Téléphone', key: 'telcan', width: 15 },
            { header: 'Concours', key: 'libcnc', width: 30 },
            { header: 'Filière', key: 'nom_filiere', width: 25 },
            { header: 'Statut', key: 'statut', width: 15 },
        ];

        if (include_notes === 'true') {
            columns.push({ header: 'Moyenne', key: 'moyenne', width: 12 });
        }

        worksheet.columns = columns;

        // Style de l'en-tête
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        // Ajouter les données
        for (const candidat of candidats) {
            const row = {
                nupcan: candidat.nupcan,
                nomcan: candidat.nomcan,
                prncan: candidat.prncan,
                maican: candidat.maican,
                telcan: candidat.telcan,
                libcnc: candidat.libcnc,
                nom_filiere: candidat.nom_filiere,
                statut: candidat.statut,
            };

            if (include_notes === 'true') {
                // Récupérer la moyenne
                const [notes] = await connection.execute(
                    `SELECT AVG(note) as moyenne 
                     FROM notes 
                     WHERE nupcan = ?`,
                    [candidat.nupcan]
                );
                row.moyenne = notes[0]?.moyenne ? parseFloat(notes[0].moyenne).toFixed(2) : 'N/A';
            }

            worksheet.addRow(row);
        }

        // Définir le format de réponse
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=liste-candidats.xlsx');

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Erreur export Excel candidats:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Export notes en PDF
router.get('/notes/pdf', async (req, res) => {
    try {
        const { concours_id, filiere_id } = req.query;
        const connection = getConnection();

        let query = `
            SELECT 
                c.nupcan, c.nomcan, c.prncan,
                n.note, n.coefficient, n.matiere_id, m.nom_matiere,
                (n.note * n.coefficient) as note_ponderee
            FROM notes n
            JOIN candidats c ON n.nupcan = c.nupcan
            JOIN matieres m ON n.matiere_id = m.id
            WHERE 1=1
        `;
        
        const params = [];

        if (concours_id) {
            query += ' AND c.concours_id = ?';
            params.push(concours_id);
        }

        if (filiere_id) {
            query += ' AND c.filiere_id = ?';
            params.push(filiere_id);
        }

        query += ' ORDER BY c.nomcan, c.prncan, m.nom_matiere';

        const [notes] = await connection.execute(query, params);

        // Regrouper par candidat
        const candidatsNotes = {};
        notes.forEach(note => {
            if (!candidatsNotes[note.nupcan]) {
                candidatsNotes[note.nupcan] = {
                    nupcan: note.nupcan,
                    nomcan: note.nomcan,
                    prncan: note.prncan,
                    notes: [],
                    total_pondere: 0,
                    total_coefficient: 0
                };
            }
            candidatsNotes[note.nupcan].notes.push(note);
            candidatsNotes[note.nupcan].total_pondere += note.note_ponderee;
            candidatsNotes[note.nupcan].total_coefficient += note.coefficient;
        });

        // Créer le PDF
        const doc = new PDFDocument({ margin: 50 });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=notes-candidats.pdf');

        doc.pipe(res);

        // En-tête
        doc.fontSize(20).text('Relevé de Notes', { align: 'center' });
        doc.moveDown();
        doc.fontSize(10).text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, { align: 'right' });
        doc.moveDown(2);

        // Pour chaque candidat
        Object.values(candidatsNotes).forEach((candidat, index) => {
            if (index > 0) doc.addPage();

            doc.fontSize(14).font('Helvetica-Bold');
            doc.text(`${candidat.nomcan} ${candidat.prncan}`, 50, doc.y);
            doc.fontSize(10).font('Helvetica');
            doc.text(`NUPCAN: ${candidat.nupcan}`, 50, doc.y);
            doc.moveDown(2);

            // Tableau des notes
            let y = doc.y;
            doc.font('Helvetica-Bold');
            doc.text('Matière', 50, y);
            doc.text('Note', 300, y);
            doc.text('Coefficient', 380, y);
            doc.text('Note x Coef', 470, y);

            y += 15;
            doc.moveTo(50, y).lineTo(550, y).stroke();

            doc.font('Helvetica');
            candidat.notes.forEach((note) => {
                y += 20;
                doc.text(note.nom_matiere, 50, y);
                doc.text(note.note.toString(), 300, y);
                doc.text(note.coefficient.toString(), 380, y);
                doc.text(note.note_ponderee.toFixed(2), 470, y);
            });

            // Moyenne
            y += 30;
            doc.moveTo(50, y).lineTo(550, y).stroke();
            y += 10;
            doc.font('Helvetica-Bold');
            const moyenne = candidat.total_pondere / candidat.total_coefficient;
            doc.text('Moyenne Générale:', 300, y);
            doc.text(`${moyenne.toFixed(2)}/20`, 470, y);
        });

        doc.end();
    } catch (error) {
        console.error('Erreur export PDF notes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
