const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const Candidat = require('../models/Candidat');
const Counter = require('../models/Counter');
const Concours = require('../models/Concours');

const normalizeIdentityText = (value) => String(value || '').trim().toLocaleLowerCase('fr');
const normalizePhone = (value) => String(value || '').replace(/\D/g, '');
const normalizeDate = (value) => {
    if (!value) return '';
    const date = value instanceof Date ? value.toISOString() : String(value);
    return date.slice(0, 10);
};

const matchesSubmittedIdentity = (candidate, submitted, existingNipcan) => {
    const sameCoreIdentity =
        normalizeIdentityText(candidate.nomcan) === normalizeIdentityText(submitted.nomcan) &&
        normalizeIdentityText(candidate.prncan) === normalizeIdentityText(submitted.prncan) &&
        normalizeDate(candidate.dtncan) === normalizeDate(submitted.dtncan);

    if (!sameCoreIdentity) return false;

    const sameConnectedNipcan = existingNipcan && candidate.nipcan === existingNipcan;
    const sameContactDetails =
        normalizeIdentityText(candidate.maican) === normalizeIdentityText(submitted.maican) &&
        normalizePhone(candidate.telcan) === normalizePhone(submitted.telcan);

    return Boolean(sameConnectedNipcan || sameContactDetails);
};

// Configuration multer pour l'upload de photos
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        let uploadDir;
        if (file.fieldname === 'phtcan') {
            uploadDir = './uploads/photos/';
        } else {
            uploadDir = './uploads/documents/';
        }

        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, {recursive: true});
            console.log(`Répertoire créé: ${uploadDir}`);
        }

        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        if (file.fieldname === 'phtcan') {
            cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
        } else {
            cb(null, 'document-' + uniqueSuffix + path.extname(file.originalname));
        }
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'phtcan') {
            if (file.mimetype.startsWith('image/')) {
                cb(null, true);
            } else {
                cb(new Error('Seules les images sont autorisées pour la photo'), false);
            }
        } else {
            const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
            const fileExt = path.extname(file.originalname).toLowerCase();
            if (allowedTypes.includes(fileExt)) {
                cb(null, true);
            } else {
                cb(new Error('Type de fichier non autorisé'), false);
            }
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

router.get('/', async (req, res) => {
    try {
        const candidats = await Candidat.findAll();
        console.log('Candidats récupérés:', candidats.length);
        res.json({
            success: true,
            data: candidats,
            message: 'Candidats récupérés avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des candidats:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// ✅ Route pour mettre à jour le statut du candidat
router.put('/:id/statut', async (req, res) => {
    try {
        const { id } = req.params;
        const { statut } = req.body;
        const { getConnection } = require('../config/database');
        const connection = getConnection();

        await connection.execute(
            'UPDATE candidats SET statut = ?, updated_at = NOW() WHERE id = ?',
            [statut, id]
        );

        res.json({ 
            success: true, 
            message: 'Statut mis à jour avec succès',
            data: { id, statut }
        });
    } catch (error) {
        console.error('Erreur mise à jour statut:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ Vérifier et mettre à jour automatiquement le statut d'un candidat
router.post('/:id/check-status', async (req, res) => {
    try {
        const { id } = req.params;
        const { getConnection } = require('../config/database');
        const connection = getConnection();

        // Récupérer le candidat
        const [candidat] = await connection.execute(
            'SELECT * FROM candidats WHERE id = ?',
            [id]
        );

        if (candidat.length === 0) {
            return res.status(404).json({ success: false, message: 'Candidat non trouvé' });
        }

        const nupcan = candidat[0].nupcan;

        // Vérifier les documents
        const [documents] = await connection.execute(
            'SELECT statut FROM documents WHERE nupcan = ?',
            [nupcan]
        );

        // Vérifier le paiement
        const [paiement] = await connection.execute(
            'SELECT statut FROM paiements WHERE nipcan = ?',
            [nupcan]
        );

        const allDocsValid = documents.length > 0 && documents.every(doc => doc.statut === 'valide');
        const paiementValid = paiement.length > 0 && paiement[0].statut === 'valide';

        let newStatut = 'en_attente';
        if (allDocsValid && paiementValid) {
            newStatut = 'valide';
        }

        // Mettre à jour le statut
        await connection.execute(
            'UPDATE candidats SET statut = ?, updated_at = NOW() WHERE id = ?',
            [newStatut, id]
        );

        // Si le statut devient valide, créer une notification
        if (newStatut === 'valide' && candidat[0].statut !== 'valide') {
            const Notification = require('../models/Notification');
            await Notification.create({
                candidat_id: id,
                type: 'candidature',
                titre: 'Candidature validée',
                message: 'Félicitations ! Votre candidature a été entièrement validée. Tous vos documents et votre paiement ont été approuvés.',
                lu: false
            });

            // Envoyer un email de notification
            try {
                const emailService = require('../services/emailService');
                await emailService.sendCandidatureValidated(candidat[0]);
            } catch (emailError) {
                console.error('Erreur envoi email (non bloquant):', emailError);
            }
        }

        res.json({ 
            success: true, 
            data: { 
                statut: newStatut,
                documentsValides: allDocsValid,
                paiementValide: paiementValid
            }
        });
    } catch (error) {
        console.error('Erreur vérification statut:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET /api/candidats/nupcan/:nupcan - Récupérer un candidat par NUPCAN avec toutes ses données
router.get('/nupcan/:nupcan', async (req, res) => {
    try {
        const nupcan = req.params.nupcan;
        console.log('Recherche candidat complet par NUPCAN:', nupcan);

        const candidat = await Candidat.findByNupcan(nupcan);
        if (!candidat) {
            return res.status(404).json({
                success: false,
                message: 'Candidat introuvable avec ce NUPCAN'
            });
        }

        let documents = [];
        try {
            const Dossier = require('../models/Dossier');
            documents = await Dossier.findByNupcan(nupcan);
            console.log('Documents trouvés:', documents.length);
        } catch (docError) {
            console.log('Erreur lors de la récupération des documents:', docError.message);
        }

        let paiement = null;
        try {
            const Paiement = require('../models/Paiement');
            paiement = await Paiement.findByNupcan(nupcan);
            console.log('Paiement trouvé:', paiement ? 'Oui' : 'Non');
        } catch (payError) {
            console.log('Erreur lors de la récupération du paiement:', payError.message);
        }

        let etape = 'documents';
        let etapesCompletes = ['inscription'];
        let pourcentage = 33;

        if (documents.length > 0) {
            etapesCompletes.push('documents');
            etape = 'paiement';
            pourcentage = 67;
        }

        if (paiement && paiement.statut === 'valide') {
            etapesCompletes.push('paiement');
            etape = 'complete';
            pourcentage = 100;
        }

        let concours = null;
        let filiere = null;
        try {
            if (candidat.concours_id) {
                concours = await Concours.findById(candidat.concours_id);
            }

            if (candidat.filiere_id) {
                const Filiere = require('../models/Filiere');
                filiere = await Filiere.findById(candidat.filiere_id);
            }
        } catch (error) {
            console.log('Erreur lors de la récupération des informations concours/filière:', error);
        }

        // Créer automatiquement une participation si elle n'existe pas
        const { getConnection } = require('../config/database');
        const connection = getConnection();
        
        try {
            const [participations] = await connection.execute(
                'SELECT * FROM participations WHERE candidat_id = ? AND concours_id = ?',
                [candidat.id, candidat.concours_id]
            );
            
            if (participations.length === 0) {
                await connection.execute(
                    `INSERT INTO participations 
                     (candidat_id, concours_id, filiere_id, statut, created_at)
                     VALUES (?, ?, ?, 'en_attente', NOW())`,
                    [candidat.id, candidat.concours_id, candidat.filiere_id]
                );
            }
        } catch (partError) {
            console.error('Erreur création participation:', partError);
        }

        const candidatData = {
            ...candidat,
            documents: documents,
            paiement: paiement,
            concours: concours,
            filiere: filiere,
            etape: etape,
            progression: {
                etapeActuelle: etape,
                etapesCompletes: etapesCompletes,
                pourcentage: pourcentage
            }
        };

        console.log('Candidat complet assemblé:', {
            id: candidatData.id,
            nupcan: candidatData.nupcan,
            etape: candidatData.etape,
            documentsCount: documents.length,
            hasPaiement: !!paiement
        });

        res.json({
            success: true,
            data: candidatData,
            message: 'Candidat récupéré avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du candidat:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/candidats/:id - Récupérer un candidat par ID
router.get('/:id', async (req, res) => {
    try {
        const candidat = await Candidat.findById(req.params.id);
        if (!candidat) {
            return res.status(404).json({
                success: false,
                message: 'Candidat introuvable'
            });
        }
        res.json({
            success: true,
            data: candidat
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du candidat:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/candidats/nip/:nip - Récupérer un candidat par NIP
router.get('/nip/:nip', async (req, res) => {
    try {
        const candidat = await Candidat.findByNip(req.params.nip);
        if (!candidat) {
            return res.status(404).json({
                success: false,
                message: 'Candidat introuvable avec ce NIP'
            });
        }
        res.json({
            success: true,
            data: candidat
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du candidat:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// POST /api/candidats - Créer un nouveau candidat avec photo
router.post('/', upload.single('phtcan'), async (req, res) => {
    try {
        console.log('=== CRÉATION CANDIDAT ===');
        console.log('Body reçu:', req.body);
        console.log('Fichier reçu:', req.file ? {
            fieldname: req.file.fieldname,
            originalname: req.file.originalname,
            filename: req.file.filename,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        } : 'Aucun fichier');

        const requiredFields = ['nomcan', 'prncan', 'maican', 'dtncan', 'telcan', 'ldncan', 'niveau_id', 'proorg'];
        const missingFields = requiredFields.filter(field => !req.body[field]);

        if (missingFields.length > 0) {
            console.log('Champs manquants:', missingFields);
            return res.status(400).json({
                success: false,
                message: 'Champs requis manquants',
                errors: [`Champs manquants: ${missingFields.join(', ')}`]
            });
        }

        const connection = require('../config/database').getConnection();
        const concoursId = Number(req.body.concours_id);
        const existingNipcan = req.body.existing_nipcan || null;
        const [existingCandidates] = await connection.execute(
            `SELECT id, nipcan, nupcan, concours_id, nomcan, prncan, dtncan, maican, telcan
             FROM candidats
             WHERE (nipcan = ? OR LOWER(maican) = LOWER(?) OR telcan = ?)
             ORDER BY
                CASE
                    WHEN nipcan = ? THEN 0
                    WHEN nipcan REGEXP '^NIP[0-9]{10}$' THEN 1
                    ELSE 2
                END,
                created_at ASC`,
            [existingNipcan, req.body.maican.trim(), req.body.telcan.trim(), existingNipcan]
        );

        const candidatesForSamePerson = existingCandidates.filter(candidate =>
            matchesSubmittedIdentity(candidate, req.body, existingNipcan)
        );

        const duplicateCandidature = candidatesForSamePerson.find(
            candidate => Number(candidate.concours_id) === concoursId
        );

        if (duplicateCandidature) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(409).json({
                success: false,
                code: 'DUPLICATE_CANDIDATURE',
                message: 'Vous avez déjà postulé à ce concours.',
                data: {
                    nipcan: duplicateCandidature.nipcan,
                    nupcan: duplicateCandidature.nupcan
                }
            });
        }

        const reusableNipcan = candidatesForSamePerson.find(candidate => candidate.nipcan)?.nipcan || null;

        // Générer NUPCAN
        const nupcan = await Counter.getNextNupcan();
        console.log('NUPCAN généré:', nupcan);

        // Générer USERNAME: première lettre du nom + prénom en minuscules
        const username = (req.body.nomcan.charAt(0) + req.body.prncan).toLowerCase().replace(/\s+/g, '');
        console.log('👤 USERNAME généré:', username);

        const candidatData = {
            ...req.body,
            nupcan: nupcan,
            nipcan: reusableNipcan,
            username: username,
            filiere_id: req.body.filiere_id || null
        };

        if (req.file) {
            candidatData.phtcan = req.file.filename;
            console.log('Photo ajoutée:', req.file.filename);
            console.log('Chemin complet photo:', req.file.path);
        } else {
            console.log(' Aucune photo reçue dans la requête');
        }

        console.log('Données finales pour création:', candidatData);

        const candidat = await Candidat.create(candidatData);

        console.log(' Candidat créé avec succès:', candidat);

        // Envoyer email de confirmation
        try {
            const emailService = require('../services/emailService');
            await emailService.sendRegistrationConfirmation(candidat);
        } catch (emailError) {
            console.error('Erreur envoi email confirmation:', emailError);
        }

        res.status(201).json({
            success: true,
            data: candidat,
            message: 'Candidat créé avec succès'
        });
    } catch (error) {
        console.error('ERREUR CRÉATION CANDIDAT:', error.stack);
        const status = error.code === 'DUPLICATE_CANDIDATURE' ? 409 : 500;
        res.status(status).json({
            success: false,
            code: error.code,
            message: error.code === 'DUPLICATE_CANDIDATURE'
                ? error.message
                : 'Erreur serveur lors de la création',
            errors: [error.message]
        });
    }
});

// PUT /api/candidats/:id - Mettre à jour un candidat
router.put('/:id', async (req, res) => {
    try {
        const candidat = await Candidat.update(req.params.id, req.body);
        res.json({
            success: true,
            data: candidat,
            message: 'Candidat mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du candidat:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// PUT /api/candidats/:id/filiere - Mettre à jour la filière d'un candidat
router.put('/:id/filiere', async (req, res) => {
    try {
        const {filiere_id} = req.body;
        const candidatId = req.params.id;

        if (!filiere_id) {
            return res.status(400).json({
                success: false,
                message: 'ID de filière requis'
            });
        }

        const candidat = await Candidat.update(candidatId, {filiere_id});

        res.json({
            success: true,
            data: candidat,
            message: 'Filière mise à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la filière:', error.stack);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

module.exports = router;
