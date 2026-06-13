const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const Candidat = require('../models/Candidat');
const { authenticateAdmin } = require('../middleware/auth');
const { getConnection } = require('../config/database');
const Notification = require("../models/Notification");

// Créer ou mettre à jour une note
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { candidat_id, concours_id, matiere_id, note, coefficient } = req.body;

        if (!candidat_id || !concours_id || !matiere_id || note === undefined) {
            return res.status(400).json({
                success: false,
                message: 'Données manquantes'
            });
        }

        // Vérifier si une note existe déjà
        const connection = getConnection();
        const [existing] = await connection.execute(
            'SELECT id FROM notes WHERE candidat_id = ? AND concours_id = ? AND matiere_id = ?',
            [candidat_id, concours_id, matiere_id]
        );

        let result;
        if (existing.length > 0) {
            // Mettre à jour la note existante
            result = await Note.update(existing[0].id, { note, coefficient });
        } else {
            // Créer une nouvelle note
            result = await Note.create({
                candidat_id,
                concours_id,
                matiere_id,
                note,
                coefficient: coefficient || 1
            });
        }

        res.json({
            success: true,
            message: 'Note enregistrée avec succès',
            data: result
        });
    } catch (error) {
        console.error('Erreur enregistrement note:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Récupérer les notes d'un candidat pour un concours
router.get('/candidat/:candidat_id/concours/:concours_id', authenticateAdmin, async (req, res) => {
    try {
        const { candidat_id, concours_id } = req.params;

        const notes = await Note.findByCandidatAndConcours(candidat_id, concours_id);
        const moyenne = await Note.calculateMoyenne(candidat_id, concours_id);

        res.json({
            success: true,
            data: {
                notes,
                moyenne: moyenne.moyenne ? parseFloat(moyenne.moyenne).toFixed(2) : null,
                nombre_notes: moyenne.nombre_notes,
                total_coefficients: moyenne.total_coefficients
            }
        });
    } catch (error) {
        console.error('Erreur récupération notes:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Récupérer les notes par NUPCAN
router.get('/nupcan/:nupcan', async (req, res) => {
    try {
        const { nupcan } = req.params;

        const notes = await Note.findByNupcan(nupcan);

        // Calculer la moyenne
        let moyenne = null;
        if (notes.length > 0) {
            const totalPoints = notes.reduce((sum, n) => sum + (n.note * n.coefficient), 0);
            const totalCoef = notes.reduce((sum, n) => sum + n.coefficient, 0);
            moyenne = totalCoef > 0 ? (totalPoints / totalCoef).toFixed(2) : null;
        }

        res.json({
            success: true,
            data: {
                notes,
                moyenne,
                nombre_notes: notes.length
            }
        });
    } catch (error) {
        console.error('Erreur récupération notes:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Route pour les notes par candidat (pour le Dashboard candidat avec /grades/candidat/:nupcan)
router.get('/candidat/:nupcan', async (req, res) => {
    try {
        const { nupcan } = req.params;
        console.log('Récupération notes pour NUPCAN:', nupcan);

        const connection = getConnection();

        // Récupérer le candidat
        const [candidats] = await connection.execute(
            'SELECT id, nomcan, prncan, nupcan FROM candidats WHERE nupcan = ?',
            [nupcan]
        );

        if (candidats.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Candidat non trouvé'
            });
        }

        const candidat = candidats[0];

        // Récupérer les notes
        const [notes] = await connection.execute(`
            SELECT
                n.id,
                n.note,
                n.coefficient,
                m.nom_matiere as nommat,
                m.coefficient as coefmat,
                m.duree
            FROM notes n
            LEFT JOIN matieres m ON n.matiere_id = m.id
            WHERE n.candidat_id = ?
            ORDER BY m.nom_matiere ASC
        `, [candidat.id]);

        // Calculer la moyenne générale
        let moyenneGenerale = null;
        if (notes.length > 0) {
            const totalPoints = notes.reduce((sum, n) => sum + (parseFloat(n.note) * parseFloat(n.coefmat || n.coefficient)), 0);
            const totalCoef = notes.reduce((sum, n) => sum + parseFloat(n.coefmat || n.coefficient), 0);
            moyenneGenerale = totalCoef > 0 ? (totalPoints / totalCoef).toFixed(2) : null;
        }

        res.json({
            success: true,
            data: {
                candidat: {
                    id: candidat.id,
                    nomcan: candidat.nomcan,
                    prncan: candidat.prncan,
                    nupcan: candidat.nupcan
                },
                notes: notes,
                moyenneGenerale: moyenneGenerale
            }
        });
    } catch (error) {
        console.error('Erreur récupération notes candidat:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Récupérer toutes les moyennes d'un concours
router.get('/concours/:concours_id/moyennes', authenticateAdmin, async (req, res) => {
    try {
        const { concours_id } = req.params;

        const moyennes = await Note.calculateMoyennesByConcours(concours_id);

        res.json({
            success: true,
            data: moyennes
        });
    } catch (error) {
        console.error('Erreur calcul moyennes:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Envoyer les résultats par email à un candidat
router.post('/envoyer-resultats', authenticateAdmin, async (req, res) => {
    try {
        const { candidat_id, concours_id } = req.body;

        if (!candidat_id || !concours_id) {
            return res.status(400).json({
                success: false,
                message: 'Données manquantes'
            });
        }

        const connection = getConnection();

        // Récupérer les informations du candidat
        const candidat = await Candidat.findById(candidat_id);
        if (!candidat) {
            return res.status(404).json({
                success: false,
                message: 'Candidat non trouvé'
            });
        }

        // Récupérer les notes et la moyenne
        const notes = await Note.findByCandidatAndConcours(candidat_id, concours_id);
        const moyenneData = await Note.calculateMoyenne(candidat_id, concours_id);

        // Récupérer les infos du concours
        const [concours] = await connection.execute(
            'SELECT libcnc, sescnc FROM concours WHERE id = ?',
            [concours_id]
        );

        // Envoyer email avec nodemailer
        const nodemailer = require('nodemailer');
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false,
            auth: {
                user: process.env.SMTP_USER || process.env.EMAIL_USER,
                pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD
            }
        });

        let notesHtml = `
            <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
                <thead>
                    <tr style="background: #2563eb; color: white;">
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Matière</th>
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Note</th>
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: center;">Coefficient</th>
                    </tr>
                </thead>
                <tbody>
        `;

        notes.forEach(note => {
            notesHtml += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;">${note.nom_matiere}</td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;"><strong>${note.note}/20</strong></td>
                    <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${note.coefficient}</td>
                </tr>
            `;
        });

        notesHtml += '</tbody></table>';

        const moyenne = moyenneData.moyenne ? parseFloat(moyenneData.moyenne).toFixed(2) : 'N/A';

        const mailOptions = {
            from: process.env.SMTP_USER || process.env.EMAIL_USER || 'noreply@gabconcours.ga',
            to: candidat.maican,
            subject: `📊 Bulletin de notes - ${concours[0]?.libcnc || 'Concours'} - GABConcours`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #2563eb, #1d4ed8); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0; font-size: 28px;">🎓 GABConcours</h1>
                        <p style="color: #e2e8f0; margin: 10px 0 0 0;">République Gabonaise - Plateforme Officielle</p>
                    </div>

                    <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
                        <h2 style="color: #1e293b; margin-top: 0;">📊 Bulletin de Notes</h2>

                        <p>Bonjour <strong>${candidat.prncan} ${candidat.nomcan}</strong>,</p>

                        <p>Vos résultats pour le concours <strong>${concours[0]?.libcnc || ''}</strong> sont maintenant disponibles.</p>

                        <div style="background: white; padding: 20px; border-left: 4px solid #2563eb; margin: 20px 0; border-radius: 0 8px 8px 0;">
                            <h3 style="margin-top: 0; color: #2563eb;">📝 Détail des notes</h3>
                            ${notesHtml}
                        </div>

                        <div style="background: #ecfdf5; border: 1px solid #bbf7d0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                            <h3 style="margin: 0; color: #166534; font-size: 24px;">
                                📊 Moyenne Générale: ${moyenne}/20
                            </h3>
                            <p style="margin: 10px 0 0 0; color: #166534;">
                                Nombre de matières: ${notes.length}
                            </p>
                        </div>

                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.APP_URL || 'http://localhost:8001'}/dashboard/${candidat.nupcan}"
                               style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                📱 Consulter mon bulletin complet
                            </a>
                        </div>

                        <p style="margin-top: 30px;">
                            Cordialement,<br>
                            <strong>L'équipe GABConcours</strong><br>
                            <em>République Gabonaise</em>
                        </p>
                    </div>

                    <div style="background: #1e293b; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
                        <p style="color: #94a3b8; margin: 0; font-size: 12px;">
                            GABConcours - Plateforme Officielle des Concours du Gabon<br>
                            Ne répondez pas à cet email automatique
                        </p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        // Créer une notification
        try {
            await Notification.create({
                candidat_id: candidat.id,
                type: 'resultats',
                titre: 'Bulletin de notes disponible',
                message: `Votre bulletin de notes pour ${concours[0]?.libcnc || 'le concours'} est maintenant disponible. Moyenne: ${moyenne}/20`,
                lu: false
            });
        } catch (notifError) {
            console.error('Erreur création notification:', notifError);
            // Non bloquant
        }
        res.json({
            success: true,
            message: 'Bulletin de notes envoyé par email avec succès'
        });
    } catch (error) {
        console.error('Erreur envoi résultats:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// Supprimer une note
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        await Note.delete(id);

        res.json({
            success: true,
            message: 'Note supprimée avec succès'
        });
    } catch (error) {
        console.error('Erreur suppression note:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
