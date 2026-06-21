const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { getConnection } = require('../config/database');
const {
    getRequiredDocumentsForConcours,
    isDocumentAllowed,
} = require('../services/requiredDocumentsService');

// 📂 Dossier de stockage
const uploadDir = path.join(__dirname, '../uploads/documents');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// ⚙️ Configuration Multer avec validation stricte
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `doc-${uniqueSuffix}${ext}`);
    },
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error('Type de fichier non autorisé. Seuls PDF, JPG et PNG sont acceptés.'), false);
    }
    cb(null, true);
};

const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

/* =====================================================
   📋 LISTE DES DOCUMENTS OBLIGATOIRES
===================================================== */
/* =====================================================
   🔹 VÉRIFICATION DES DOCUMENTS OBLIGATOIRES
===================================================== */
async function checkMandatoryDocuments(candidatId) {
    const connection = getConnection();
    const [candidats] = await connection.execute(
        'SELECT concours_id FROM candidats WHERE id = ? LIMIT 1',
        [candidatId]
    );
    const requiredDocuments = candidats.length
        ? await getRequiredDocumentsForConcours(candidats[0].concours_id)
        : [];
    
    const [existingDocs] = await connection.execute(`
        SELECT DISTINCT d.nomdoc
        FROM documents d
        JOIN dossiers dos ON d.id = dos.document_id
        WHERE dos.candidat_id = ?
    `, [candidatId]);

    const existingDocNames = existingDocs.map(doc => doc.nomdoc.toLowerCase().trim());
    
    const missingDocs = requiredDocuments
        .filter(doc => doc.obligatoire)
        .filter(doc => !existingDocNames.includes(doc.nom.toLowerCase()))
        .map(doc => ({
            nomdoc: doc.nom,
            type: 'pdf/image',
            required: true,
        }));

    return {
        allPresent: missingDocs.length === 0,
        missing: missingDocs,
        existing: existingDocs.map(d => d.nomdoc)
    };
}

/* =====================================================
   ➕ AJOUTER UN DOCUMENT (avec vérifications)
===================================================== */
router.post('/', upload.single('file'), async (req, res) => {
    const connection = getConnection();
    
    try {
        const { nomdoc, candidat_id, concours_id, nupcan } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Aucun fichier fourni' 
            });
        }

        if (!nomdoc || !candidat_id || !concours_id) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ 
                success: false, 
                message: 'Données manquantes (nomdoc, candidat_id, concours_id)' 
            });
        }

        const [candidates] = await connection.execute(
            'SELECT concours_id, nupcan FROM candidats WHERE id = ? LIMIT 1',
            [candidat_id]
        );
        if (!candidates.length || Number(candidates[0].concours_id) !== Number(concours_id)) {
            fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: 'Ce concours ne correspond pas à la candidature'
            });
        }
        if (nupcan && candidates[0].nupcan !== nupcan) {
            fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: 'Le NUPCAN ne correspond pas à la candidature'
            });
        }

        const requiredDocuments = await getRequiredDocumentsForConcours(candidates[0].concours_id);
        if (!isDocumentAllowed(nomdoc, requiredDocuments)) {
            fs.unlinkSync(file.path);
            return res.status(400).json({
                success: false,
                message: `Le document "${nomdoc}" n'est pas requis pour ce concours`
            });
        }

        // Vérifier si le document existe déjà pour ce candidat
        const [existing] = await connection.execute(`
            SELECT d.id, d.nomdoc
            FROM documents d
            JOIN dossiers dos ON d.id = dos.document_id
            WHERE dos.candidat_id = ? AND LOWER(TRIM(d.nomdoc)) = LOWER(TRIM(?))
        `, [candidat_id, nomdoc]);

        if (existing.length > 0) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ 
                success: false, 
                message: `Le document "${nomdoc}" existe déjà. Veuillez le remplacer plutôt que d'en créer un nouveau.`,
                existing_document_id: existing[0].id
            });
        }

        // Déterminer le type à partir de l'extension
        const ext = path.extname(file.originalname).toLowerCase();
        const type = ext === '.pdf' ? 'pdf' : 'image';

        // Créer le document
        const [docResult] = await connection.execute(`
            INSERT INTO documents (candidat_id, concours_id, nomdoc, type, nom_fichier, chemin_fichier, statut, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, 'en_attente', NOW(), NOW())
        `, [candidat_id, concours_id, nomdoc, type, file.filename, `/uploads/documents/${file.filename}`]);

        const documentId = docResult.insertId;

        // Créer le dossier associé
        await connection.execute(`
            INSERT INTO dossiers (candidat_id, concours_id, document_id, nupcan, docdsr, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, NOW(), NOW())
        `, [candidat_id, concours_id, documentId, nupcan, file.filename]);

        // Créer une notification
        await connection.execute(`
            INSERT INTO notifications (candidat_nupcan, type, titre, message, statut, priority, created_at)
            VALUES (?, 'document_upload', 'Document ajouté', ?, 'non_lu', 'normal', NOW())
        `, [nupcan, `Votre document "${nomdoc}" a été ajouté avec succès et est en attente de validation.`]);

        res.json({ 
            success: true, 
            message: 'Document ajouté avec succès', 
            data: {
                id: documentId,
                nomdoc,
                type,
                nom_fichier: file.filename,
                statut: 'en_attente',
                url: `/uploads/documents/${file.filename}`
            }
        });
    } catch (error) {
        console.error('Erreur ajout document:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Erreur lors de l\'ajout du document' 
        });
    }
});

/* =====================================================
   📄 RÉCUPÉRER LES DOCUMENTS D'UN CANDIDAT
===================================================== */
router.get('/candidat/:candidat_id', async (req, res) => {
    const connection = getConnection();
    
    try {
        const { candidat_id } = req.params;

        const [documents] = await connection.execute(`
            SELECT d.*, dos.nupcan
            FROM documents d
            JOIN dossiers dos ON d.id = dos.document_id
            WHERE dos.candidat_id = ?
            ORDER BY d.created_at DESC
        `, [candidat_id]);

        // Vérifier les documents obligatoires manquants
        const check = await checkMandatoryDocuments(candidat_id);

        res.json({ 
            success: true, 
            data: documents,
            mandatory_check: check
        });
    } catch (error) {
        console.error('Erreur récupération documents:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des documents' 
        });
    }
});

/* =====================================================
   🔁 REMPLACER UN DOCUMENT
===================================================== */
router.put('/:id/replace', upload.single('file'), async (req, res) => {
    const connection = getConnection();
    
    try {
        const { id } = req.params;
        const { nomdoc } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ 
                success: false, 
                message: 'Aucun fichier fourni' 
            });
        }

        // Récupérer le document actuel
        const [docs] = await connection.execute('SELECT * FROM documents WHERE id = ?', [id]);
        
        if (docs.length === 0) {
            fs.unlinkSync(file.path);
            return res.status(404).json({ 
                success: false, 
                message: 'Document non trouvé' 
            });
        }

        const currentDoc = docs[0];

        // Vérifier le statut (seuls rejete et en_attente peuvent être remplacés)
        if (!['rejete', 'en_attente'].includes(currentDoc.statut)) {
            fs.unlinkSync(file.path);
            return res.status(400).json({ 
                success: false, 
                message: 'Seuls les documents rejetés ou en attente peuvent être remplacés' 
            });
        }

        // Supprimer l'ancien fichier
        const oldPath = path.join(uploadDir, currentDoc.nom_fichier);
        if (fs.existsSync(oldPath)) {
            try {
                fs.unlinkSync(oldPath);
            } catch (err) {
                console.error('Erreur suppression ancien fichier:', err);
            }
        }

        // Déterminer le type
        const ext = path.extname(file.originalname).toLowerCase();
        const type = ext === '.pdf' ? 'pdf' : 'image';

        // Mettre à jour le document
        const newNomdoc = nomdoc || currentDoc.nomdoc;
        const newChemin = `/uploads/documents/${file.filename}`;

        await connection.execute(`
            UPDATE documents 
            SET nomdoc = ?, type = ?, nom_fichier = ?, chemin_fichier = ?, statut = 'en_attente', 
                commentaire_validation = 'Document remplacé - en attente de validation', updated_at = NOW()
            WHERE id = ?
        `, [newNomdoc, type, file.filename, newChemin, id]);

        // Créer une notification
        const [dossiers] = await connection.execute('SELECT nupcan FROM dossiers WHERE document_id = ?', [id]);
        if (dossiers.length > 0) {
            await connection.execute(`
                INSERT INTO notifications (candidat_nupcan, type, titre, message, statut, priority, created_at)
                VALUES (?, 'document_update', 'Document remplacé', ?, 'non_lu', 'normal', NOW())
            `, [dossiers[0].nipcan, `Votre document "${newNomdoc}" a été remplacé et est en attente de validation.`]);
        }

        res.json({ 
            success: true, 
            message: 'Document remplacé avec succès', 
            data: {
                id,
                nomdoc: newNomdoc,
                type,
                nom_fichier: file.filename,
                statut: 'en_attente',
                url: newChemin
            }
        });
    } catch (error) {
        console.error('Erreur remplacement document:', error);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Erreur lors du remplacement' 
        });
    }
});

/* =====================================================
   ❌ SUPPRIMER UN DOCUMENT
===================================================== */
router.delete('/:id', async (req, res) => {
    const connection = getConnection();
    
    try {
        const { id } = req.params;

        // Récupérer le document
        const [docs] = await connection.execute('SELECT * FROM documents WHERE id = ?', [id]);
        
        if (docs.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Document non trouvé' 
            });
        }

        const doc = docs[0];

        // Seuls les documents rejetés ou en attente peuvent être supprimés
        if (!['rejete', 'en_attente'].includes(doc.statut)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Seuls les documents rejetés ou en attente peuvent être supprimés' 
            });
        }

        // Supprimer le fichier physique
        const filePath = path.join(uploadDir, doc.nom_fichier);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // Supprimer le dossier associé (cascade supprimera le document)
        await connection.execute('DELETE FROM dossiers WHERE document_id = ?', [id]);

        res.json({ 
            success: true, 
            message: 'Document supprimé avec succès' 
        });
    } catch (error) {
        console.error('Erreur suppression document:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la suppression' 
        });
    }
});

/* =====================================================
   ✅ VALIDER/REJETER UN DOCUMENT (Admin)
===================================================== */
router.put('/:id/validate', async (req, res) => {
    const connection = getConnection();
    
    try {
        const { id } = req.params;
        const { statut, commentaire, admin_id } = req.body;

        if (!['valide', 'rejete'].includes(statut)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Statut invalide. Utilisez "valide" ou "rejete"' 
            });
        }

        if (!admin_id) {
            return res.status(400).json({ 
                success: false, 
                message: 'admin_id requis' 
            });
        }

        // Vérifier que l'admin existe
        const [admins] = await connection.execute('SELECT id FROM administrateurs WHERE id = ?', [admin_id]);
        if (admins.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Admin non trouvé' 
            });
        }

        // Récupérer le document
        const [docs] = await connection.execute(`
            SELECT d.*, dos.nupcan, dos.candidat_id
            FROM documents d
            JOIN dossiers dos ON d.id = dos.document_id
            WHERE d.id = ?
        `, [id]);

        if (docs.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Document non trouvé' 
            });
        }

        const doc = docs[0];

        // Mettre à jour le document
        await connection.execute(`
            UPDATE documents 
            SET statut = ?, commentaire_validation = ?, validated_by = ?, validated_at = NOW(), updated_at = NOW()
            WHERE id = ?
        `, [statut, commentaire || null, admin_id, id]);

        const notificationMessage = statut === 'valide'
            ? `Votre document "${doc.nomdoc}" a été validé avec succès.`
            : `Votre document "${doc.nomdoc}" a été rejeté.${commentaire ? ` Motif: ${commentaire}` : ''}`;

        await connection.execute(`
            INSERT INTO notifications
                (candidat_nupcan, type, titre, message, statut, priority, created_at, updated_at)
            VALUES (?, 'document_validation', ?, ?, 'non_lu', ?, NOW(), NOW())
        `, [
            doc.nupcan,
            statut === 'valide' ? 'Document validé' : 'Document rejeté',
            notificationMessage,
            statut === 'valide' ? 'normal' : 'high'
        ]);

        await connection.execute(`
            INSERT INTO admin_actions
                (admin_id, action_type, entity_type, entity_id, candidat_nupcan, description, details, ip_address, created_at)
            VALUES (?, ?, 'document', ?, ?, ?, ?, ?, NOW())
        `, [
            admin_id,
            statut === 'valide' ? 'validation_document' : 'rejet_document',
            id,
            doc.nupcan,
            `${statut === 'valide' ? 'Validation' : 'Rejet'} du document: ${doc.nomdoc}`,
            JSON.stringify({statut, commentaire: commentaire || null, type_document: doc.type}),
            req.ip || null
        ]);

        res.json({ 
            success: true, 
            message: `Document ${statut} avec succès`,
            data: {
                document_id: id,
                statut,
                candidat_nupcan: doc.nupcan
            }
        });
    } catch (error) {
        console.error('Erreur validation document:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Erreur lors de la validation' 
        });
    }
});

/* =====================================================
   📊 STATISTIQUES DOCUMENTS
===================================================== */
router.get('/stats/overview', async (req, res) => {
    const connection = getConnection();
    
    try {
        const [stats] = await connection.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN statut = 'en_attente' THEN 1 ELSE 0 END) as en_attente,
                SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as valide,
                SUM(CASE WHEN statut = 'rejete' THEN 1 ELSE 0 END) as rejete
            FROM documents
        `);

        res.json({ 
            success: true, 
            data: stats[0]
        });
    } catch (error) {
        console.error('Erreur stats documents:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération des statistiques' 
        });
    }
});

/* =====================================================
   📥 TÉLÉCHARGER UN DOCUMENT
===================================================== */
router.get('/:id/download', async (req, res) => {
    const connection = getConnection();
    
    try {
        const [docs] = await connection.execute('SELECT * FROM documents WHERE id = ?', [req.params.id]);
        
        if (docs.length === 0) {
            return res.status(404).json({ success: false, message: 'Document non trouvé' });
        }

        const doc = docs[0];
        const filePath = path.join(uploadDir, doc.nom_fichier);

        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ success: false, message: 'Fichier physique non trouvé' });
        }

        const ext = path.extname(doc.nom_fichier).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.pdf') contentType = 'application/pdf';
        else if (['.jpg', '.jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${doc.nomdoc || doc.nom_fichier}"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Erreur téléchargement:', error);
        res.status(500).json({ success: false, message: 'Erreur lors du téléchargement' });
    }
});

module.exports = router;
