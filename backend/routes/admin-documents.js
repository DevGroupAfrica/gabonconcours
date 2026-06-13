const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const {authenticateToken} = require('../middleware/auth'); // Updated import
const nodemailer = require('nodemailer');
const emailService = require("../services/emailService");
const Admin = require("../models/Admin");

// Configuration email
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: process.env.SMTP_PORT || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// GET - Récupérer les candidats avec leurs documents pour un établissement
router.get('/etablissement/:etablissementId/candidats', authenticateToken, async (req, res) => {
    try {
        const {etablissementId} = req.params;

        // Vérifier que l'admin a accès à cet établissement
        if (req.admin.role !== 'super_admin' && req.admin.etablissement_id !== etablissementId) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé à cet établissement'
            });
        }

        const query = `
      SELECT 
        c.nupcan,
        c.nomcan,
        c.prncan,
        c.telcan,
        c.maican,
        c.dtncan,
        c.phtcan,
        p.statut_candidature as statut_dossier,
        co.etablissement_id,
        JSON_ARRAYAGG(
          JSON_OBJECT(
            'id', d.id,
            'nom_document', d.nom_document,
            'chemin_fichier', d.chemin_fichier,
            'type_document', d.type_document,
            'taille_fichier', d.taille_fichier,
            'statut_validation', d.statut_validation,
            'date_upload', d.date_upload,
            'motif_rejet', d.motif_rejet
          )
        ) as documents
      FROM candidats c
      LEFT JOIN participations p ON c.nupcan = p.candidat_nupcan
      LEFT JOIN concours co ON p.concours_id = co.id
      LEFT JOIN documents d ON c.nupcan = d.candidat_nupcan
      WHERE co.etablissement_id = ?
      GROUP BY c.nupcan, c.nomcan, c.prncan, c.telcan, c.maican, c.dtncan, c.phtcan, p.statut_candidature, co.etablissement_id
      ORDER BY c.nomcan, c.prncan
    `;

        const [candidats] = await pool.execute(query, [etablissementId]);

        // Nettoyer les données
        const candidatsFormatted = candidats.map(candidat => ({
            ...candidat,
            documents: candidat.documents ? JSON.parse(candidat.documents).filter(doc => doc.id !== null) : []
        }));

        res.json({
            success: true,
            data: candidatsFormatted
        });

    } catch (error) {
        console.error('Erreur récupération candidats établissement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// GET - Récupérer les dossiers pour un établissement
router.get('/etablissement/:etablissementId/dossiers', authenticateToken, async (req, res) => {
    try {
        const {etablissementId} = req.params;

        if (req.admin.role !== 'super_admin' && req.admin.etablissement_id !== etablissementId) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        const query = `
      SELECT 
        d.*,
        c.nomcan,
        c.prncan,
        c.nupcan as candidat_nupcan
      FROM documents d
      JOIN candidats c ON d.candidat_nupcan = c.nupcan
      JOIN participations p ON c.nupcan = p.candidat_nupcan
      JOIN concours co ON p.concours_id = co.id
      WHERE co.etablissement_id = ?
      ORDER BY d.date_upload DESC
    `;

        const [dossiers] = await pool.execute(query, [etablissementId]);

        res.json({
            success: true,
            data: dossiers
        });

    } catch (error) {
        console.error('Erreur récupération dossiers:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// GET - Récupérer les paiements pour un établissement
router.get('/etablissement/:etablissementId/paiements', authenticateToken, async (req, res) => {
    try {
        const {etablissementId} = req.params;

        if (req.admin.role !== 'super_admin' && req.admin.etablissement_id !== etablissementId) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        const query = `
      SELECT 
        pa.*,
        c.nomcan,
        c.prncan,
        c.nupcan as candidat_nupcan
      FROM paiements pa
      JOIN candidats c ON pa.candidat_nupcan = c.nupcan
      JOIN participations p ON c.nupcan = p.candidat_nupcan
      JOIN concours co ON p.concours_id = co.id
      WHERE co.etablissement_id = ?
      ORDER BY pa.date_paiement DESC
    `;

        const [paiements] = await pool.execute(query, [etablissementId]);

        res.json({
            success: true,
            data: paiements
        });

    } catch (error) {
        console.error('Erreur récupération paiements:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// GET - Récupérer les concours pour un établissement
router.get('/etablissement/:etablissementId/concours', authenticateToken, async (req, res) => {
    try {
        const {etablissementId} = req.params;

        // Vérifier que l'admin a accès à cet établissement
        if (req.admin.role !== 'super_admin' && req.admin.etablissement_id !== etablissementId) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé à cet établissement'
            });
        }

        const query = `
      SELECT 
        c.*,
        COUNT(DISTINCT p.candidat_nupcan) as candidats_count
      FROM concours c
      LEFT JOIN participations p ON c.id = p.concours_id
      WHERE c.etablissement_id = ? AND c.stacnc = '1'
      GROUP BY c.id
      ORDER BY c.debcnc DESC
    `;

        const [concours] = await pool.execute(query, [etablissementId]);

        res.json({
            success: true,
            data: concours
        });

    } catch (error) {
        console.error('Erreur récupération concours établissement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});

// GET - Récupérer les candidats pour un concours
router.get('/concours/:concoursId/candidats', authenticateToken, async (req, res) => {
    try {
        const {concoursId} = req.params;

        // Vérifier que l'admin a accès à ce concours
        const [concoursCheck] = await pool.execute(
            'SELECT etablissement_id FROM concours WHERE id = ?',
            [concoursId]
        );

        if (concoursCheck.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Concours non trouvé'
            });
        }

        if (req.admin.role !== 'super_admin' && req.admin.etablissement_id !== concoursCheck[0].etablissement_id) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé à ce concours'
            });
        }

        const query = `
      SELECT 
        c.nupcan,
        c.nomcan,
        c.prncan,
        c.telcan,
        c.maican,
        c.dtncan,
        c.phtcan,
        p.statut_candidature as statut_dossier,
        p.created_at
      FROM candidats c
      JOIN participations p ON c.nupcan = p.candidat_nupcan
      WHERE p.concours_id = ?
      ORDER BY p.created_at DESC
    `;

        const [candidats] = await pool.execute(query, [concoursId]);

        res.json({
            success: true,
            data: candidats
        });

    } catch (error) {
        console.error('Erreur récupération candidats concours:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
});



router.post('/documents/:documentId/validate', authenticateToken, async (req, res) => {
    try {
        const {documentId} = req.params;
        const {statut, motif} = req.body;

        if (!['valide', 'rejete'].includes(statut)) {
            return res.status(400).json({
                success: false,
                message: 'Statut de validation invalide'
            });
        }

        // Récupérer les informations du document et du candidat
        const [documentInfo] = await pool.execute(`
      SELECT 
        d.*,
        c.nomcan,
        c.prncan,
        c.maican,
        c.nupcan,
        co.etablissement_id
      FROM documents d
      JOIN candidats c ON d.candidat_nupcan = c.nupcan
      JOIN participations p ON c.nupcan = p.candidat_nupcan
      JOIN concours co ON p.concours_id = co.id
      WHERE d.id = ?
    `, [documentId]);

        if (documentInfo.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé'
            });
        }

        const document = documentInfo[0];

        // Vérifier l'autorisation
        if (req.admin.role !== 'super_admin' && req.admin.etablissement_id !== document.etablissement_id) {
            return res.status(403).json({
                success: false,
                message: 'Accès non autorisé'
            });
        }

        // Mettre à jour le statut du document
        await pool.execute(`
      UPDATE documents 
      SET statut_validation = ?, 
          motif_rejet = ?,
          date_validation = NOW(),
          admin_validateur_id = ?
      WHERE id = ?
    `, [statut, motif || null, req.admin.id, documentId]);






        // Envoyer la notification par email
        try {
            const emailSubject = `Validation de document - ${document.nom_document}`;
            const statusText = statut === 'valide' ? 'VALIDÉ' : 'REJETÉ';
            const statusColor = statut === 'valide' ? '#155724' : '#721c24';
            const bgColor = statut === 'valide' ? '#d4edda' : '#f8d7da';
            const borderColor = statut === 'valide' ? '#c3e6cb' : '#f5c6cb';

            const emailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Validation de document</h2>
          <p>Bonjour ${document.prncan} ${document.nomcan},</p>
          
          <div style="background-color: ${bgColor}; border: 1px solid ${borderColor}; padding: 15px; margin: 20px 0; border-radius: 5px;">
            <h3 style="margin: 0; color: ${statusColor};">Document ${statusText}</h3>
            <p style="margin: 10px 0 0 0;"><strong>Document:</strong> ${document.nom_document}</p>
            ${motif ? `<p style="margin: 10px 0 0 0;"><strong>Commentaire:</strong> ${motif}</p>` : ''}
          </div>
          
          <p>Numéro de candidature: <strong>${document.nupcan}</strong></p>
          <p>Validé par: <strong>${req.admin.prenom} ${req.admin.nom}</strong></p>
          <p>Date de validation: <strong>${new Date().toLocaleDateString('fr-FR')}</strong></p>
          
          ${statut === 'rejete' ?
                '<p style="color: #721c24;"><strong>Action requise:</strong> Veuillez soumettre un nouveau document corrigé via votre espace candidat.</p>' :
                '<p style="color: #155724;">Votre dossier progresse bien. Vous serez informé des prochaines étapes.</p>'
            }
          
          <hr style="margin: 30px 0;" />
          <p style="color: #666; font-size: 12px;">
            Ce message a été envoyé automatiquement depuis le système de gestion des candidatures.
            Ne pas répondre à ce message.
          </p>
        </div>
      `;

            // await transporter.sendMail({
            //     from: process.env.SMTP_FROM || 'noreply@concours.com',
            //     to: document.maican,
            //     subject: emailSubject,
            //     html: emailHTML
            // });
            //
            //
            //
            //
            // try {
            await emailService.sendDocumentValidationEmail({
                ...emailSubject,
                html: emailHTML
            });
            console.log(`Email envoyé avec succès à ${document.maican}`);
            // } catch (emailError) {
            //     console.error('Erreur envoi email:', emailError);
            //     // On continue même si l'email échoue
            // }

        } catch (emailError) {
            console.error('Erreur envoi email:', emailError);
            // Ne pas faire échouer la validation si l'email ne marche pas
        }

        res.json({
            success: true,
            message: `Document ${statut === 'valide' ? 'validé' : 'rejeté'} avec succès`
        });

    } catch (error) {
        console.error('Erreur validation document:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la validation'
        });
    }
});

// // POST - Valider un document
// router.post('/documents/:documentId/validate', authenticateToken, async (req, res) => {
//     try {
//         const {documentId} = req.params;
//         const {statut, motif} = req.body;
//
//         if (!['valide', 'rejete'].includes(statut)) {
//             return res.status(400).json({
//                 success: false,
//                 message: 'Statut de validation invalide'
//             });
//         }
//
//         // Récupérer les informations du document et du candidat
//         const [documentInfo] = await pool.execute(`
//       SELECT
//         d.*,
//         c.nomcan,
//         c.prncan,
//         c.maican,
//         c.nupcan,
//         co.etablissement_id
//       FROM documents d
//       JOIN candidats c ON d.candidat_nupcan = c.nupcan
//       JOIN participations p ON c.nupcan = p.candidat_nupcan
//       JOIN concours co ON p.concours_id = co.id
//       WHERE d.id = ?
//     `, [documentId]);
//
//         if (documentInfo.length === 0) {
//             return res.status(404).json({
//                 success: false,
//                 message: 'Document non trouvé'
//             });
//         }
//
//         const document = documentInfo[0];
//
//         // Vérifier l'autorisation
//         if (req.admin.role !== 'super_admin' && req.admin.etablissement_id !== document.etablissement_id) {
//             return res.status(403).json({
//                 success: false,
//                 message: 'Accès non autorisé'
//             });
//         }
//
//         // Mettre à jour le statut du document
//         await pool.execute(`
//       UPDATE documents
//       SET statut_validation = ?,
//           motif_rejet = ?,
//           date_validation = NOW(),
//           admin_validateur_id = ?
//       WHERE id = ?
//     `, [statut, motif || null, req.admin.id, documentId]);
//
//
//
//
//
//
//         // Envoyer la notification par email
//         try {
//             const emailSubject = `Validation de document - ${document.nom_document}`;
//             const statusText = statut === 'valide' ? 'VALIDÉ' : 'REJETÉ';
//             const statusColor = statut === 'valide' ? '#155724' : '#721c24';
//             const bgColor = statut === 'valide' ? '#d4edda' : '#f8d7da';
//             const borderColor = statut === 'valide' ? '#c3e6cb' : '#f5c6cb';
//
//             const emailHTML = `
//         <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
//           <h2 style="color: #333;">Validation de document</h2>
//           <p>Bonjour ${document.prncan} ${document.nomcan},</p>
//
//           <div style="background-color: ${bgColor}; border: 1px solid ${borderColor}; padding: 15px; margin: 20px 0; border-radius: 5px;">
//             <h3 style="margin: 0; color: ${statusColor};">Document ${statusText}</h3>
//             <p style="margin: 10px 0 0 0;"><strong>Document:</strong> ${document.nom_document}</p>
//             ${motif ? `<p style="margin: 10px 0 0 0;"><strong>Commentaire:</strong> ${motif}</p>` : ''}
//           </div>
//
//           <p>Numéro de candidature: <strong>${document.nupcan}</strong></p>
//           <p>Validé par: <strong>${req.admin.prenom} ${req.admin.nom}</strong></p>
//           <p>Date de validation: <strong>${new Date().toLocaleDateString('fr-FR')}</strong></p>
//
//           ${statut === 'rejete' ?
//                 '<p style="color: #721c24;"><strong>Action requise:</strong> Veuillez soumettre un nouveau document corrigé via votre espace candidat.</p>' :
//                 '<p style="color: #155724;">Votre dossier progresse bien. Vous serez informé des prochaines étapes.</p>'
//             }
//
//           <hr style="margin: 30px 0;" />
//           <p style="color: #666; font-size: 12px;">
//             Ce message a été envoyé automatiquement depuis le système de gestion des candidatures.
//             Ne pas répondre à ce message.
//           </p>
//         </div>
//       `;
//
//             // await transporter.sendMail({
//             //     from: process.env.SMTP_FROM || 'noreply@concours.com',
//             //     to: document.maican,
//             //     subject: emailSubject,
//             //     html: emailHTML
//             // });
//             //
//             //
//             //
//             //
//             // try {
//                 await emailService.sendAdminCredentials({
//                     ...emailSubject,
//                     html: emailHTML
//                 });
//                 console.log(`Email envoyé avec succès à ${document.maican}`);
//             // } catch (emailError) {
//             //     console.error('Erreur envoi email:', emailError);
//             //     // On continue même si l'email échoue
//             // }
//
//         } catch (emailError) {
//             console.error('Erreur envoi email:', emailError);
//             // Ne pas faire échouer la validation si l'email ne marche pas
//         }
//
//         res.json({
//             success: true,
//             message: `Document ${statut === 'valide' ? 'validé' : 'rejeté'} avec succès`
//         });
//
//     } catch (error) {
//         console.error('Erreur validation document:', error);
//         res.status(500).json({
//             success: false,
//             message: 'Erreur serveur lors de la validation'
//         });
//     }
// });

module.exports = router;
