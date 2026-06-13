const multer = require('multer');
const path = require('path');

// Taille maximale: 2 MB
const MAX_FILE_SIZE = 2 * 1024 * 1024;

// Types MIME autorisés
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
];

// Validation des fichiers
const fileFilter = (req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new Error('Type de fichier non autorisé. Formats acceptés: PDF, JPG, PNG'), false);
    }
    cb(null, true);
};

// Configuration Multer avec validation
const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, 'uploads/documents/');
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    }),
    fileFilter: fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE
    }
});

module.exports = { upload, MAX_FILE_SIZE, ALLOWED_MIME_TYPES };
