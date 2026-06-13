const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const { getConnection } = require('../config/database');
const { authenticateAdmin } = require('../middleware/auth');

// Export candidatures par concours (filtré par établissement)
router.get('/candidatures/concours', async (req, res) => {
    try {
        const { concours_id, etablissement_id } = req.query;
        
        const connection = getConnection();
        
        // Vérifier que le concours appartient à l'établissement de l'admin
        let query = `
            SELECT 
                c.nupcan,
                c.nomcan,
                c.prncan,
                c.maican,
                c.telcan,
            
                c.dtncan,
                f.nomfil as filiere,
                con.libcnc as concours,
                e.nomets as etablissement,
                c.created_at as date_inscription
            FROM candidats c
            LEFT JOIN filieres f ON c.filiere_id = f.id
            LEFT JOIN concours con ON c.concours_id = con.id
            LEFT JOIN etablissements e ON con.etablissement_id = e.id
            WHERE c.concours_id = ?
        `;
        
        const params = [concours_id];
        
        if (etablissement_id) {
            query += ' AND con.etablissement_id = ?';
            params.push(etablissement_id);
        }
        
        query += ' ORDER BY c.created_at DESC';
        
        const [candidats] = await connection.execute(query, params);
        
        if (candidats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Aucune candidature trouvée'
            });
        }
        
        // Créer le fichier Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Candidatures');
        
        // En-tête
        worksheet.columns = [
            { header: 'NUPCAN', key: 'nupcan', width: 15 },
            { header: 'Nom', key: 'nomcan', width: 20 },
            { header: 'Prénom', key: 'prncan', width: 20 },
            { header: 'Email', key: 'maican', width: 30 },
            { header: 'Téléphone', key: 'telcan', width: 15 },
            { header: 'Sexe', key: 'sexcan', width: 10 },
            { header: 'Date de naissance', key: 'dtncan', width: 15 },
            { header: 'Filière', key: 'filiere', width: 25 },
            { header: 'Concours', key: 'concours', width: 30 },
            { header: 'Établissement', key: 'etablissement', width: 30 },
            { header: 'Date inscription', key: 'date_inscription', width: 20 }
        ];
        
        // Style de l'en-tête
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563EB' }
        };
        
        // Ajouter les données
        candidats.forEach(candidat => {
            worksheet.addRow({
                nupcan: candidat.nupcan,
                nomcan: candidat.nomcan,
                prncan: candidat.prncan,
                maican: candidat.maican,
                telcan: candidat.telcan,
                sexcan: candidat.sexcan,
                dtncan: candidat.dtncan ? new Date(candidat.dtncan).toLocaleDateString('fr-FR') : '',
                filiere: candidat.filiere || 'N/A',
                concours: candidat.concours,
                etablissement: candidat.etablissement,
                date_inscription: candidat.date_inscription ? new Date(candidat.date_inscription).toLocaleDateString('fr-FR') : ''
            });
        });
        
        // Générer le fichier
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="candidatures_concours_${concours_id}_${Date.now()}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Erreur export candidatures:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Export candidatures par filière (filtré par établissement)
router.get('/candidatures/filiere/:filiere_id', async (req, res) => {
    try {
        const { filiere_id } = req.params;
        const { etablissement_id, concours_id } = req.query;
        
        const connection = getConnection();
        
        let query = `
            SELECT 
                c.nupcan,
                c.nomcan,
                c.prncan,
                c.maican,
                c.telcan,
                c.sexcan,
                c.dtncan,
                f.nomfil as filiere,
                con.libcnc as concours,
                e.nomets as etablissement,
                c.created_at as date_inscription
            FROM candidats c
            LEFT JOIN filieres f ON c.filiere_id = f.id
            LEFT JOIN concours con ON c.concours_id = con.id
            LEFT JOIN etablissements e ON con.etablissement_id = e.id
            WHERE c.filiere_id = ?
        `;
        
        const params = [filiere_id];
        
        if (etablissement_id) {
            query += ' AND con.etablissement_id = ?';
            params.push(etablissement_id);
        }
        
        if (concours_id) {
            query += ' AND c.concours_id = ?';
            params.push(concours_id);
        }
        
        query += ' ORDER BY c.created_at DESC';
        
        const [candidats] = await connection.execute(query, params);
        
        if (candidats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Aucune candidature trouvée'
            });
        }
        
        // Créer le fichier Excel
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Candidatures par Filière');
        
        worksheet.columns = [
            { header: 'NUPCAN', key: 'nupcan', width: 15 },
            { header: 'Nom', key: 'nomcan', width: 20 },
            { header: 'Prénom', key: 'prncan', width: 20 },
            { header: 'Email', key: 'maican', width: 30 },
            { header: 'Téléphone', key: 'telcan', width: 15 },
            { header: 'Sexe', key: 'sexcan', width: 10 },
            { header: 'Date de naissance', key: 'dtncan', width: 15 },
            { header: 'Filière', key: 'filiere', width: 25 },
            { header: 'Concours', key: 'concours', width: 30 },
            { header: 'Établissement', key: 'etablissement', width: 30 },
            { header: 'Date inscription', key: 'date_inscription', width: 20 }
        ];
        
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563EB' }
        };
        
        candidats.forEach(candidat => {
            worksheet.addRow({
                nupcan: candidat.nupcan,
                nomcan: candidat.nomcan,
                prncan: candidat.prncan,
                maican: candidat.maican,
                telcan: candidat.telcan,
                sexcan: candidat.sexcan,
                dtncan: candidat.dtncan ? new Date(candidat.dtncan).toLocaleDateString('fr-FR') : '',
                filiere: candidat.filiere || 'N/A',
                concours: candidat.concours,
                etablissement: candidat.etablissement,
                date_inscription: candidat.date_inscription ? new Date(candidat.date_inscription).toLocaleDateString('fr-FR') : ''
            });
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="candidatures_filiere_${filiere_id}_${Date.now()}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Erreur export candidatures filière:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Export résultats par concours (filtré par établissement)
router.get('/resultats/concours/:concours_id', async (req, res) => {
    try {
        const { concours_id } = req.params;
        const { etablissement_id } = req.query;
        
        const connection = getConnection();
        
        let query = `
            SELECT 
                c.nupcan,
                c.nomcan,
                c.prncan,
                c.maican,
                f.nomfil as filiere,
                con.libcnc as concours,
                n.note,
                m.nom_matiere,
                m.coefficient
            FROM candidats c
            LEFT JOIN filieres f ON c.filiere_id = f.id
            LEFT JOIN concours con ON c.concours_id = con.id
            LEFT JOIN notes n ON c.id = n.candidat_id
            LEFT JOIN matieres m ON n.matiere_id = m.id
            WHERE c.concours_id = ?
        `;
        
        const params = [concours_id];
        
        if (etablissement_id) {
            query += ' AND con.etablissement_id = ?';
            params.push(etablissement_id);
        }
        
        query += ' ORDER BY c.nomcan, m.nom_matiere';
        
        const [resultats] = await connection.execute(query, params);
        
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Résultats');
        
        worksheet.columns = [
            { header: 'NUPCAN', key: 'nupcan', width: 15 },
            { header: 'Nom', key: 'nomcan', width: 20 },
            { header: 'Prénom', key: 'prncan', width: 20 },
            { header: 'Email', key: 'maican', width: 30 },
            { header: 'Filière', key: 'filiere', width: 25 },
            { header: 'Matière', key: 'nom_matiere', width: 25 },
            { header: 'Note', key: 'note', width: 10 },
            { header: 'Coefficient', key: 'coefficient', width: 12 }
        ];
        
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF2563EB' }
        };
        
        resultats.forEach(res => {
            worksheet.addRow(res);
        });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="resultats_concours_${concours_id}_${Date.now()}.xlsx"`);
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Erreur export résultats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
