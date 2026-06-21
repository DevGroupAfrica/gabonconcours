const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const Document = require('../models/Document');
const Dossier = require('../models/Dossier');
const Candidat = require('../models/Candidat');
const {unlinkSync, existsSync, renameSync} = require("node:fs");
const { type } = require('node:os');
const {
    getRequiredDocumentsForConcours,
    isDocumentAllowed,
} = require('../services/requiredDocumentsService');

// Configuration multer pour l'upload de documents
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/documents/');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'documents-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png'];
        const fileExt = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error('Type de fichier non autorisé'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max
    }
});

// Middleware to handle multiple files
const uploadMultiple = upload.array('documents', 15); // Augmenté à 15 fichiers max

// GET /api/dossiers/nupcan/:nupcan - Récupérer documents par NUPCAN
router.get('/nupcan/:nupcan', async (req, res) => {
    try {
        const {nupcan} = req.params;
        const decodedNupcan = decodeURIComponent(nupcan);

        console.log('Recherche documents pour NUPCAN:', decodedNupcan);

        // Récupérer le candidat par NUPCAN
        const candidat = await Candidat.findByNupcan(decodedNupcan);
        if (!candidat) {
            return res.status(404).json({
                success: false,
                message: 'Candidat non trouvé'
            });
        }

        // Récupérer les dossiers du candidat
        const dossiers = await Dossier.findByNupcan(decodedNupcan);

        res.json({
            success: true,
            data: dossiers,
            message: 'Documents récupérés avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des documents:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/dossiers/admin/all - Récupérer tous les dossiers avec infos complètes pour l'admin
router.get('/admin/all', async (req, res) => {
    try {
        const connection = require('../config/database').getConnection();

        const [rows] = await connection.execute(`
      SELECT 
        d.id,
        d.nomdoc,
        d.type,
        d.nom_fichier,
        d.statut,
        d.created_at,
        d.updated_at,
        dos.nupcan as nupcan,
        dos.candidat_id,
        dos.concours_id,
        dos.docdsr,
        c.nomcan,
        c.prncan,
        c.maican,
        c.telcan,
        con.libcnc,
        con.fracnc,
        f.nomfil,
        e.nomets
      FROM documents d
      LEFT JOIN dossiers dos ON d.id = dos.document_id
      LEFT JOIN candidats c ON dos.candidat_id = c.id
      LEFT JOIN concours con ON dos.concours_id = con.id
      LEFT JOIN filieres f ON c.filiere_id = f.id
      LEFT JOIN etablissements e ON con.etablissement_id = e.id
      ORDER BY d.created_at DESC
    `);

        console.log(`Documents admin récupérés: ${rows.length}`);

        res.json({
            success: true,
            data: rows,
            message: 'Documents récupérés avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des documents admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/dossiers - Récupérer tous les dossiers
router.get('/', async (req, res) => {
    try {
        const dossiers = await Document.findAll();
        res.json({
            success: true,
            data: dossiers,
            message: 'Dossiers récupérés avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des dossiers:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// GET /api/dossiers/:id - Récupérer un dossier par ID
router.get('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const dossier = await Document.findById(id);
        if (!dossier) {
            return res.status(404).json({
                success: false,
                message: 'Dossier non trouvé'
            });
        }
        res.json({
            success: true,
            data: dossier,
            message: 'Dossier récupéré avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la récupération du dossier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

router.post('/', (req, res) => {
    uploadMultiple(req, res, async (err) => {
        try {
            if (err) {
                console.error('❌ Erreur d\'upload Multer:', err);
                return res.status(400).json({
                    success: false,
                    message: 'Erreur d\'upload',
                    errors: [err.message]
                });
            }

            console.log('📥 Requête reçue - Body:', req.body);
            console.log('📁 Fichiers reçus:', req.files?.length || 0, 'fichier(s)');

            const {concours_id, nupcan} = req.body;
            
            // Validation des champs requis
            if (!concours_id || !nupcan) {
                console.error('❌ Champs manquants - concours_id:', concours_id, 'nupcan:', nupcan);
                return res.status(400).json({
                    success: false,
                    message: 'Champs requis manquants',
                    errors: ['concours_id et nupcan sont obligatoires']
                });
            }

            // Récupérer le candidat par nupcan
            console.log('🔍 Recherche candidat avec NUPCAN:', nupcan);
            const candidat = await Candidat.findByNupcan(nupcan);
            if (!candidat) {
                console.error('❌ Candidat non trouvé pour NUPCAN:', nupcan);
                return res.status(404).json({
                    success: false,
                    message: 'Candidat non trouvé'
                });
            }
            console.log('✅ Candidat trouvé - ID:', candidat.id);
            const candidat_id = candidat.id;
            if (Number(candidat.concours_id) !== Number(concours_id)) {
                req.files?.forEach(file => existsSync(file.path) && unlinkSync(file.path));
                return res.status(400).json({
                    success: false,
                    message: 'Ce concours ne correspond pas à la candidature'
                });
            }

            // Vérifier si des fichiers ont été uploadés
            if (!req.files || req.files.length === 0) {
                console.error('❌ Aucun fichier uploadé');
                return res.status(400).json({
                    success: false,
                    message: 'Aucun fichier uploadé',
                    errors: ['Veuillez uploader au moins un document']
                });
            }

            console.log('📄 Traitement de', req.files.length, 'document(s)...');

            let documentNames = [];
            try {
                documentNames = JSON.parse(req.body.document_names || '[]');
            } catch {
                documentNames = [];
            }

            if (documentNames.length !== req.files.length) {
                req.files.forEach(file => existsSync(file.path) && unlinkSync(file.path));
                return res.status(400).json({
                    success: false,
                    message: 'Les noms des documents envoyés sont invalides'
                });
            }

            const requiredDocuments = await getRequiredDocumentsForConcours(candidat.concours_id);
            const unauthorizedDocument = documentNames.find(name => !isDocumentAllowed(name, requiredDocuments));
            if (unauthorizedDocument) {
                req.files.forEach(file => existsSync(file.path) && unlinkSync(file.path));
                return res.status(400).json({
                    success: false,
                    message: `Le document "${unauthorizedDocument}" n'est pas requis pour ce concours`
                });
            }
            const normalizedNames = documentNames.map(name => name.trim().toLowerCase());
            if (new Set(normalizedNames).size !== normalizedNames.length) {
                req.files.forEach(file => existsSync(file.path) && unlinkSync(file.path));
                return res.status(400).json({
                    success: false,
                    message: 'Un même document ne peut être téléversé qu’une seule fois'
                });
            }

            // Process each uploaded file
            const dossierPromises = req.files.map(async (file, index) => {
                console.log(`  📄 Document ${index + 1}:`, file.originalname, '-', file.filename);
                
                // Créer d'abord le document
                const documentData = {
                    nomdoc: documentNames[index],
                    type: file.mimetype.includes('pdf') ? 'pdf' : 'image',
                    nom_fichier: file.filename,
                    statut: 'en_attente'
                };

                const document = await Document.create(documentData);
                console.log(`  ✅ Document créé - ID:`, document.id);

                // Puis créer le dossier qui lie le document au candidat
                const dossierData = {
                    candidat_id,
                    concours_id: candidat.concours_id,
                    document_id: document.id,
                    nupcan: nupcan,  // Utilise nupcan (numéro de candidature)
                    docdsr: file.path
                };

                const dossier = await Dossier.create(dossierData);
                console.log(`  ✅ Dossier créé - ID:`, dossier.id);
                
                return dossier;
            });

            const dossiers = await Promise.all(dossierPromises);

            console.log('✅ Tous les documents enregistrés avec succès!');
            res.status(201).json({
                success: true,
                data: dossiers,
                message: `${dossiers.length} dossier(s) créé(s) avec succès`
            });
        } catch (error) {
            console.error('❌ Erreur lors de la création du dossier:', error);
            res.status(500).json({
                success: false,
                message: 'Erreur serveur',
                errors: [error.message]
            });
        }
    });
});


// POST /api/dossiers/add-document - Ajouter un document supplémentaire
router.post('/add-document', upload.single('file'), async (req, res) => {
    try {
        const { nomdoc, type, nupcan } = req.body;
        
        if (!nomdoc || !nupcan || !req.file) {
            return res.status(400).json({
                success: false,
                message: 'Données manquantes (nomdoc, nupcan, file)'
            });
        }

        // Récupérer le candidat
        const candidat = await Candidat.findByNupcan(nupcan);
        if (!candidat) {
            return res.status(404).json({
                success: false,
                message: 'Candidat non trouvé'
            });
        }

        const requiredDocuments = await getRequiredDocumentsForConcours(candidat.concours_id);
        if (!isDocumentAllowed(nomdoc, requiredDocuments)) {
            if (existsSync(req.file.path)) unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: `Le document "${nomdoc}" n'est pas requis pour ce concours`
            });
        }

        const connection = require('../config/database').getConnection();
        const [existingDocs] = await connection.execute(
            `SELECT d.id FROM documents d
             INNER JOIN dossiers dos ON d.id = dos.document_id
             WHERE dos.nupcan = ? AND LOWER(TRIM(d.nomdoc)) = LOWER(TRIM(?))
             LIMIT 1`,
            [nupcan, nomdoc]
        );

        if (existingDocs.length) {
            if (existsSync(req.file.path)) unlinkSync(req.file.path);
            return res.status(400).json({
                success: false,
                message: `Le document "${nomdoc}" existe déjà. Remplacez-le plutôt que de l'ajouter à nouveau.`
            });
        }

        // Créer le document
        const documentData = {
            nomdoc: nomdoc,
            type: type || 'autre',
            nom_fichier: req.file.filename,
            statut: 'en_attente'
        };

        const document = await Document.create(documentData);

        // Créer le dossier qui lie le document au candidat
        const dossierData = {
            candidat_id: candidat.id,
            concours_id: candidat.concours_id,
            document_id: document.id,
            nupcan: nupcan,  // Utilise nupcan (numéro de candidature)
            docdsr: req.file.path
        };

        const dossier = await Dossier.create(dossierData);

        res.status(201).json({
            success: true,
            data: { document, dossier },
            message: 'Document ajouté avec succès'
        });
    } catch (error) {
        console.error('Erreur ajout document:', error);
        // Nettoyer le fichier en cas d'erreur
        if (req.file && existsSync(req.file.path)) {
            unlinkSync(req.file.path);
        }
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// PUT /api/dossiers/:id - Mettre à jour un dossier
router.put('/:id', upload.single('docdsr'), async (req, res) => {
    try {
        const {id} = req.params;

        // Récupérer le dossier existant
        const existingDossier = await Document.findById(id);
        if (!existingDossier) {
            return res.status(404).json({
                success: false,
                message: 'Dossier non trouvé'
            });
        }

        // Préparer les données de mise à jour
        const dossierData = {
            concours_id: req.body.concours_id ? parseInt(req.body.concours_id) : existingDossier.concours_id,
            document_id: req.body.document_id ? parseInt(req.body.document_id) : existingDossier.document_id,
            candidat_id: req.body.candidat_id ? parseInt(req.body.candidat_id) : existingDossier.candidat_id,
            docdsr: req.file ? req.file.path : existingDossier.docdsr
        };

        // Mettre à jour le dossier
        const dossier = await Document.updateStatus(id, 'en_attente');

        console.log('Dossier mis à jour:', dossier);

        res.json({
            success: true,
            data: dossier,
            message: 'Dossier mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du dossier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// PUT /api/dossiers/:id/status - Mettre à jour le statut d'un document
router.put('/:id/status', async (req, res) => {
    try {
        const {id} = req.params;
        const {statut} = req.body;

        console.log(`Mise à jour du statut du document ${id} à ${statut}`);

        // Valider le statut
        if (!statut || !['en_attente', 'valide', 'rejete'].includes(statut)) {
            return res.status(400).json({
                success: false,
                message: 'Statut invalide',
                errors: ['Le statut doit être "en_attente", "valide" ou "rejete"']
            });
        }

        // Récupérer le dossier existant
        const existingDossier = await Document.findById(id);
        if (!existingDossier) {
            return res.status(404).json({
                success: false,
                message: 'Dossier non trouvé'
            });
        }

        // Récupérer le document associé
        const document = await Document.findById(existingDossier.id);
        if (!document) {
            return res.status(404).json({
                success: false,
                message: 'Document non trouvé'
            });
        }

        // Mettre à jour le statut du document
        const documentData = {
            statut: statut
        };
        await Document.updateStatus(id, statut);

        console.log('Statut du document mis à jour:', documentData);

        res.json({
            success: true,
            message: 'Statut du document mis à jour avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la mise à jour du statut du document:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

// DELETE /api/dossiers/:id - Supprimer un dossier
router.delete('/:id', async (req, res) => {
    try {
        const {id} = req.params;
        const deleted = await Document.deleteById(id);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: 'Dossier non trouvé'
            });
        }
        res.json({
            success: true,
            message: 'Dossier supprimé avec succès'
        });
    } catch (error) {
        console.error('Erreur lors de la suppression du dossier:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});



// PUT /api/dossiers/documents/:id/replace
router.put('/documents/:id/replace', upload.single('file'), async (req, res) => {
    const fs = require('fs');
    try {
        const { id } = req.params;
        const file = req.file;
        const { nomdoc } = req.body; // récupéré depuis le FormData frontend

        if (!file) {
            return res.status(400).json({ success: false, message: 'Aucun fichier fourni' });
        }

        const connection = require('../config/database').getConnection();
        const [rows] = await connection.execute('SELECT * FROM documents WHERE id = ?', [id]);
        if (rows.length === 0) {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(404).json({ success: false, message: 'Document introuvable' });
        }

        const doc = rows[0];
        if (doc.statut !== 'rejete') {
            if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: 'Seuls les documents rejetés peuvent être remplacés.'
            });
        }

        // Suppression de l'ancien fichier s'il existe
        const oldPath = path.join('uploads/documents', doc.nom_fichier || '');
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

        // Nouveau fichier (multer l’a déjà placé dans uploads/documents)
        const newFileName = file.filename;
        const newFilePath = path.join('uploads/documents', newFileName);

        // ✅ Mise à jour de la base de données (corrigée)
     await connection.execute(
    `
    UPDATE documents
    SET nomdoc = ?, nom_fichier = ?, type = ?, chemin_fichier = ?, statut = 'en_attente', updated_at = NOW()
    WHERE id = ?
    `,
    [nomdoc || doc.nomdoc, newFileName, doc.type, newFilePath, id]
);
        console.log(`✅ Document ${id} remplacé avec succès dans la base de données.`);

        res.json({
            success: true,
            message: 'Document remplacé avec succès.',
            data: {
                id,
                
                nomdoc: nomdoc || doc.nomdoc, 
                  type: doc.type,
                nom_fichier: newFileName,
             
                chemin_fichier: newFilePath,
                statut: 'en_attente'
            }
        });
    } catch (error) {
        console.error('Erreur remplacement document:', error);
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});


module.exports = router;
