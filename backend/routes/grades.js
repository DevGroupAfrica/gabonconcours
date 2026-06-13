const express = require('express');
const router = express.Router();
const { getConnection } = require('../config/database');
const { sendEmail } = require('../services/emailService');

// GET /api/grades/concours/:concoursId - Récupérer les notes d'un concours
router.get('/concours/:concoursId', async (req, res) => {
    try {
        const { concoursId } = req.params;
        const connection = getConnection();
        
        const [notes] = await connection.execute(`
            SELECT 
                n.*,
                c.nupcan, c.nomcan, c.prncan, c.maican,
                m.nommat,
                con.libcnc
            FROM notes n
            LEFT JOIN participations p ON n.participation_id = p.id
            LEFT JOIN candidats c ON p.candidat_id = c.id
            LEFT JOIN matieres m ON n.matiere_id = m.id
            LEFT JOIN concours con ON p.concours_id = con.id
            WHERE p.concours_id = ?
            ORDER BY c.nomcan, m.nommat
        `, [concoursId]);
        
        res.json({ success: true, data: notes });
    } catch (error) {
        console.error('Erreur récupération notes:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/grades/candidat/:nupcan - Récupérer les notes d'un candidat
router.get('/candidat/:nupcan', async (req, res) => {
    try {
        const { nupcan } = req.params;
        const connection = getConnection();
        
        // Récupérer le candidat
        const [candidats] = await connection.execute(
            'SELECT * FROM candidats WHERE nupcan = ?',
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
                n.*,
                m.nommat,
                m.coefmat,
                p.concours_id,
                con.libcnc
            FROM notes n
            LEFT JOIN participations p ON n.participation_id = p.id
            LEFT JOIN matieres m ON n.matiere_id = m.id
            LEFT JOIN concours con ON p.concours_id = con.id
            WHERE p.candidat_id = ?
            ORDER BY m.nommat
        `, [candidat.id]);
        
        // Calculer la moyenne générale
        let totalPoints = 0;
        let totalCoefficients = 0;
        
        notes.forEach(note => {
            if (note.note !== null && note.coefmat) {
                totalPoints += note.note * note.coefmat;
                totalCoefficients += note.coefmat;
            }
        });
        
        const moyenneGenerale = totalCoefficients > 0 ? (totalPoints / totalCoefficients).toFixed(2) : null;
        
        res.json({ 
            success: true, 
            data: {
                candidat,
                notes,
                moyenneGenerale
            }
        });
    } catch (error) {
        console.error('Erreur récupération notes candidat:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/grades - Créer ou mettre à jour une note
router.post('/', async (req, res) => {
    try {
        const { nupcan, concours_id, matiere_id, note, admin_id } = req.body;
        
        if (!nupcan || !concours_id || !matiere_id || note === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'Données requises manquantes' 
            });
        }
        
        const connection = getConnection();
        
        // Récupérer le candidat
        const [candidats] = await connection.execute(
            'SELECT * FROM candidats WHERE nupcan = ?',
            [nupcan]
        );
        
        if (candidats.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Candidat non trouvé' 
            });
        }
        
        const candidat = candidats[0];
        
        // Vérifier si une participation existe
        let [participations] = await connection.execute(
            'SELECT * FROM participations WHERE candidat_id = ? AND concours_id = ?',
            [candidat.id, concours_id]
        );
        
        let participationId;
        
        if (participations.length === 0) {
            // Créer la participation
            const [result] = await connection.execute(
                'INSERT INTO participations (candidat_id, concours_id, filiere_id, statut, created_at) VALUES (?, ?, ?, "en_attente", NOW())',
                [candidat.id, concours_id, candidat.filiere_id]
            );
            participationId = result.insertId;
        } else {
            participationId = participations[0].id;
        }
        
        // Vérifier si une note existe déjà
        const [existingNotes] = await connection.execute(
            'SELECT * FROM notes WHERE participation_id = ? AND matiere_id = ?',
            [participationId, matiere_id]
        );
        
        if (existingNotes.length > 0) {
            // Mettre à jour la note existante
            await connection.execute(
                'UPDATE notes SET note = ?, updated_at = NOW() WHERE id = ?',
                [note, existingNotes[0].id]
            );
        } else {
            // Créer une nouvelle note
            await connection.execute(
                'INSERT INTO notes (participation_id, matiere_id, note, created_at) VALUES (?, ?, ?, NOW())',
                [participationId, matiere_id, note]
            );
        }
        
        // Calculer la moyenne
        const [notes] = await connection.execute(`
            SELECT n.note, m.coefmat
            FROM notes n
            LEFT JOIN matieres m ON n.matiere_id = m.id
            WHERE n.participation_id = ?
        `, [participationId]);
        
        let totalPoints = 0;
        let totalCoefficients = 0;
        
        notes.forEach(n => {
            if (n.note !== null && n.coefmat) {
                totalPoints += n.note * n.coefmat;
                totalCoefficients += n.coefmat;
            }
        });
        
        const moyenne = totalCoefficients > 0 ? (totalPoints / totalCoefficients).toFixed(2) : null;
        
        // ✅ MISE À JOUR AUTOMATIQUE: Moyenne, Rang et Statut
        const ParticipationService = require('../services/participationService');
        try {
            await ParticipationService.updateMoyenneGenerale(candidat.id, concours_id);
            console.log('✅ Participation mise à jour automatiquement');
        } catch (updateError) {
            console.error('Erreur mise à jour participation:', updateError);
        }
        
        // Envoyer notification au candidat
        try {
            await connection.execute(
                `INSERT INTO notifications (user_type, user_id, type, titre, message, created_at)
                 VALUES ('candidat', ?, 'note', 'Nouvelle note disponible', ?, NOW())`,
                [nupcan, `Une nouvelle note a été saisie. Votre moyenne actuelle est de ${moyenne}/20`]
            );
            
            // Envoyer email
            await sendEmail(
                candidat.maican,
                'Nouvelle note disponible - GabConcours',
                `
                <h2>Nouvelle note disponible</h2>
                <p>Bonjour ${candidat.prncan} ${candidat.nomcan},</p>
                <p>Une nouvelle note a été saisie pour votre candidature.</p>
                <p><strong>Moyenne actuelle:</strong> ${moyenne}/20</p>
                <p>Connectez-vous à votre espace candidat pour consulter le détail de vos notes.</p>
                `
            );
        } catch (notifError) {
            console.error('Erreur envoi notification:', notifError);
        }
        
        res.json({ 
            success: true, 
            message: 'Note enregistrée avec succès',
            data: { moyenne }
        });
    } catch (error) {
        console.error('Erreur enregistrement note:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST /api/grades/batch - Saisir plusieurs notes en une fois
router.post('/batch', async (req, res) => {
    try {
        const { notes, admin_id } = req.body;
        
        if (!notes || !Array.isArray(notes) || notes.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Liste de notes requise' 
            });
        }
        
        const connection = getConnection();
        const results = [];
        
        for (const noteData of notes) {
            const { nupcan, concours_id, matiere_id, note } = noteData;
            
            // Récupérer le candidat
            const [candidats] = await connection.execute(
                'SELECT * FROM candidats WHERE nupcan = ?',
                [nupcan]
            );
            
            if (candidats.length === 0) {
                results.push({ nupcan, success: false, message: 'Candidat non trouvé' });
                continue;
            }
            
            const candidat = candidats[0];
            
            // Vérifier/créer participation
            let [participations] = await connection.execute(
                'SELECT * FROM participations WHERE candidat_id = ? AND concours_id = ?',
                [candidat.id, concours_id]
            );
            
            let participationId;
            if (participations.length === 0) {
                const [result] = await connection.execute(
                    'INSERT INTO participations (candidat_id, concours_id, filiere_id, statut, created_at) VALUES (?, ?, ?, "en_attente", NOW())',
                    [candidat.id, concours_id, candidat.filiere_id]
                );
                participationId = result.insertId;
            } else {
                participationId = participations[0].id;
            }
            
            // Insérer/MAJ note
            const [existingNotes] = await connection.execute(
                'SELECT * FROM notes WHERE participation_id = ? AND matiere_id = ?',
                [participationId, matiere_id]
            );
            
            if (existingNotes.length > 0) {
                await connection.execute(
                    'UPDATE notes SET note = ?, updated_at = NOW() WHERE id = ?',
                    [note, existingNotes[0].id]
                );
            } else {
                await connection.execute(
                    'INSERT INTO notes (participation_id, matiere_id, note, created_at) VALUES (?, ?, ?, NOW())',
                    [participationId, matiere_id, note]
                );
            }
            
            results.push({ nupcan, success: true });
        }
        
        res.json({ 
            success: true, 
            message: `${results.filter(r => r.success).length}/${results.length} notes enregistrées`,
            data: results
        });
    } catch (error) {
        console.error('Erreur enregistrement notes batch:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
