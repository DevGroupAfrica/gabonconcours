const express = require('express');
const cors = require('./middleware/cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ CRÉATION DES RÉPERTOIRES AVANT TOUT
const ensureDirectories = () => {
    const dirs = [
        './uploads/documents',
        './uploads/photos',
        './uploads/temp'
    ];

    dirs.forEach(dir => {
        const fullPath = path.join(__dirname, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`📁 Répertoire créé: ${fullPath}`);
        } else {
            console.log(`📁 Répertoire existe: ${fullPath}`);
        }
    });
};

// Créer les répertoires au démarrage
ensureDirectories();

// ✅ MIDDLEWARE CORS AVANT TOUT
app.use(cors);

// ✅ bodyParser AVANT multer (IMPORTANT)
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// ✅ CONFIGURATION MULTER GLOBALE CORRIGÉE
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Utiliser uploads/temp pour les scans temporaires
        const uploadDir = path.join(__dirname, './uploads/temp');

        // Vérifier/créer le dossier à chaque upload
        fs.mkdir(uploadDir, { recursive: true }, (err) => {
            if (err) {
                console.error('❌ Erreur création dossier temp:', err);
                return cb(err, null);
            }
            console.log('📁 Dossier temp pour scan:', uploadDir);
            cb(null, uploadDir);
        });
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const filename = `scan-${uniqueSuffix}${ext}`;
        console.log('📄 Nom fichier scan généré:', filename);
        cb(null, filename);
    }
});

const fileFilter = (req, file, cb) => {
    console.log('🔍 Filtre multer - Fichier:', file.originalname, 'Type:', file.mimetype);

    const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png'
    ];

    if (allowedTypes.includes(file.mimetype)) {
        console.log('✅ Type accepté:', file.mimetype);
        cb(null, true);
    } else {
        console.error('❌ Type refusé:', file.mimetype);
        cb(new Error(`Type de fichier non autorisé: ${file.mimetype}. Formats acceptés: PDF, JPG, PNG`), false);
    }
};

// Instance multer pour les scans
const scanUpload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1
    },
    fileFilter: fileFilter
});

// ✅ Serveur statique APRÈS création des dossiers
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Routes (exporter scanUpload pour utilisation dans candidatureRoutes)
const concoursRoutes = require('./routes/concours');
const candidatsRoutes = require('./routes/candidats');
const provincesRoutes = require('./routes/provinces');
const niveauxRoutes = require('./routes/niveaux');
const filieresRoutes = require('./routes/filieres');
const etablissementsRoutes = require('./routes/etablissements');
const matieresRoutes = require('./routes/matieres');
const participationsRoutes = require('./routes/participations');
const dossiersRoutes = require('./routes/dossiers');
const sessionsRoutes = require('./routes/sessions');
const statisticsRoutes = require('./routes/statistics');
const adminRoutes = require('./routes/admin');
const emailRoutes = require('./routes/email');
const etudiantsRoutes = require('./routes/etudiants');
const documentsRoutes = require('./routes/documents');
const paiementsRoutes = require('./routes/paiements');
const documentValidationRoutes = require('./routes/documentValidation');
const adminDocumentsRoutes = require('./routes/admin-documents');
const notificationsRoutes = require('./routes/notifications');
const messagesRoutes = require('./routes/messages');
const statsRoutes = require('./routes/stats');
const supportRoutes = require('./routes/supportRoutes');
const exportRoutes = require('./routes/exports');
const adminManagementRoutes = require('./routes/admin-management');
const documentsExtendedRoutes = require('./routes/documents-extended');
const subAdminsRoutes = require('./routes/sub-admins');
const notesRoutes = require('./routes/notes');
const userRolesRoutes = require('./routes/user-roles');
const candidatureRoutes = require('./routes/candidatures');
const candidatureScanRoutes = require('./routes/candidature');

// API Routes (éviter les doublons)
app.use('/api/concours', concoursRoutes);
app.use('/api/candidats', candidatsRoutes);
app.use('/api/provinces', provincesRoutes);
app.use('/api/niveaux', niveauxRoutes);
app.use('/api/filiere', filieresRoutes);
app.use('/api/etablissements', etablissementsRoutes);
app.use('/api/matieres', matieresRoutes);
app.use('/api/participations', participationsRoutes);
app.use('/api/dossiers', dossiersRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/etudiants', etudiantsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/paiements', paiementsRoutes);
app.use('/api/document-validation', documentValidationRoutes);
app.use('/api/admin-documents', adminDocumentsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/exports', exportRoutes);
app.use('/api/admin-management', adminManagementRoutes);
app.use('/api/documents-extended', documentsExtendedRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/grades', notesRoutes);
app.use('/api/user-roles', userRolesRoutes);
app.use('/api/candidatures', candidatureRoutes);
app.use('/api/candidatures', candidatureScanRoutes);
app.use('/api/sub-admins', subAdminsRoutes);

// Routes admin auth
const { router: adminAuthRouter } = require('./routes/adminAuth');
app.use('/api/admin/auth', adminAuthRouter);

// ✅ Route de test étendue
app.get('/api/test', (req, res) => {
    res.json({
        success: true,
        message: 'API GabConcours fonctionnelle!',
        timestamp: new Date().toISOString(),
        serverInfo: {
            port: PORT,
            nodeEnv: process.env.NODE_ENV,
            uploadsDir: path.join(__dirname, 'uploads'),
            multerConfig: 'OK'
        },
        availableEndpoints: [
            'GET /api/test',
            'POST /api/candidatures/scan-document',
            'GET /api/concours',
            'GET /api/provinces',
            'GET /api/candidats'
        ]
    });
});

// ✅ Route de test pour scan
app.post('/api/candidatures/test-scan', scanUpload.single('document'), (req, res) => {
    console.log('🧪 Test scan reçu:', !!req.file);
    if (req.file) {
        res.json({
            success: true,
            message: 'Upload multer fonctionne!',
            file: {
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size
            }
        });
    } else {
        res.status(400).json({
            success: false,
            error: 'Aucun fichier reçu'
        });
    }
});

// ✅ MIDDLEWARE GESTION ERREURS MULTER AVANT le général
app.use((error, req, res, next) => {
    console.error('💥 ERREUR MULTER/SERVEUR:', error);

    // Erreurs Multer spécifiques
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'Fichier trop volumineux (maximum 10MB)'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Un seul fichier autorisé'
            });
        }
        if (error.code === 'MULTIPART_INVALID') {
            return res.status(400).json({
                success: false,
                error: 'Format de requête invalide'
            });
        }
    }

    // Erreurs de fileFilter
    if (error.message && error.message.includes('Type de fichier non autorisé')) {
        return res.status(400).json({
            success: false,
            error: error.message
        });
    }

    // Erreur générale
    res.status(500).json({
        success: false,
        error: 'Erreur interne du serveur',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

// ✅ Route 404 APRÈS toutes les routes
app.use('*', (req, res) => {
    console.log(`❓ Route non trouvée: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        error: `Route non trouvée: ${req.method} ${req.originalUrl}`,
        suggestion: 'Essayez /api/test ou /api/candidatures/scan-document'
    });
});

// Importer les fonctions de base de données
const { createConnection, testConnection } = require('./config/database');

// Fonction pour démarrer le serveur
const startServer = async () => {
    try {
        console.log('🔌 Initialisation de la connexion à la base de données...');
        await createConnection();
        await testConnection();
        console.log('✅ Connexion MySQL établie avec succès');
        console.log(`   Base: ${process.env.DB_NAME || 'gabconcoursv5'}`);

        // Démarrer le serveur
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 SERVEUR DÉMARRÉ avec succès!`);
            console.log(`   📍 Port: ${PORT}`);
            console.log(`   🌐 URL: http://localhost:${PORT}`);
            console.log(`   📁 Uploads: http://localhost:${PORT}/uploads`);
            console.log(`   🧪 Test: http://localhost:${PORT}/api/test`);
            console.log(`   🔍 Scan: POST http://localhost:${PORT}/api/candidatures/scan-document`);
            console.log(`\n📋 SCAN DOCUMENT prêt à l'emploi!`);
        });

    } catch (error) {
        console.error('💥 Erreur de connexion base de données:', error);
        process.exit(1);
    }
};

// Démarrer
startServer();

module.exports = app;