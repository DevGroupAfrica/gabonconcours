// routes/candidatures.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const Tesseract = require('tesseract.js');
const pdfParse = require('pdf-parse');

const router = express.Router();

// Configuration multer pour upload
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        const uploadDir = 'uploads/temp';
        try {
            await fs.mkdir(uploadDir, { recursive: true });
            cb(null, uploadDir);
        } catch (error) {
            cb(error, '');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|image\/(jpeg|jpg|png)/;
    if (allowedTypes.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Format non supporté. Utilisez PDF, JPG ou PNG.'), false);
    }
};

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter
});

// Fonction d'extraction intelligente des données
function extractDataFromText(text) {
    const result = {
        texteBrut: text,
        success: false,
        errors: []
    };

    // Nettoyer le texte
    const cleanText = text
        .toLowerCase()
        .replace(/[^\w\sàáâäãåèéêëìíîïòóôöùúûüÿç]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Patterns regex pour extraction
    const patterns = {
        nom: [
            /(?:nom|nom\s+de\s*famille|family\s*name|nom\s*et\s*prénom)[:\s]+([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)/i,
            /([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)\s+(?:né[e]?\s*(?:le\s*)?|naissance)/i,
            /(?:nom\s*:?\s*|nom:\s*)([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)/i,
            /n°?\s*de\s*carte\s*:?\s*[^\n\r]+(?:\n\r|\n|[\s]*)([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)/i
        ],
        prenoms: [
            /(?:prénom|prénoms|first\s*name|prenom)[:\s]+([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)/i,
            /prénoms?\s*:?\s*([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)/i,
            /([a-zàáâäãåèéêëìíîïòóôöùúûüÿç\s]+)\s+(?:né[e]?\s*(?:le\s*)?|le\s+\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
        ],
        dateNaissance: [
            /(?:date\s+de\s*naissance|né\s*(?:le\s*)?|née\s*(?:le\s*)?|dob|birth\s*date)[:\s]+(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
            /né[e]?\s*(?:le\s*)?(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
            /naissance\s*:\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/i,
            /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4})/i,
            /(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})/i
        ]
    };

    // Extraire nom
    for (const pattern of patterns.nom) {
        const match = cleanText.match(pattern);
        if (match?.[1]) {
            result.nom = match[1]
                .trim()
                .replace(/\b(?:le|la|les|de|du|des|à|au)\b/gi, '')
                .replace(/\s+/g, ' ')
                .toUpperCase();
            break;
        }
    }

    // Extraire prénoms
    for (const pattern of patterns.prenoms) {
        const match = cleanText.match(pattern);
        if (match?.[1]) {
            result.prenoms = match[1]
                .trim()
                .replace(/\s+/g, ' ')
                .toUpperCase();
            break;
        }
    }

    // Extraire date de naissance
    for (const pattern of patterns.dateNaissance) {
        const match = cleanText.match(pattern);
        if (match?.[1]) {
            let dateStr = match[1].replace(/[\.\s]/g, '/');
            const dateFormats = [
                /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/, // dd/mm/yyyy
                /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/  // yyyy/mm/dd
            ];

            let day, month, year;
            for (const format of dateFormats) {
                const formatMatch = dateStr.match(format);
                if (formatMatch) {
                    if (formatMatch[3].length === 4) { // dd/mm/yyyy
                        [day, month, year] = formatMatch.slice(1);
                    } else { // yyyy/mm/dd
                        [year, month, day] = formatMatch.slice(1);
                    }
                    break;
                }
            }

            if (year && month && day) {
                if (year.length === 2) year = '19' + year;
                result.dateNaissance = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                break;
            }
        }
    }

    // Validation
    if (result.nom && result.prenoms && result.dateNaissance) {
        result.success = true;
    } else {
        if (!result.nom) result.errors.push('Nom non détecté');
        if (!result.prenoms) result.errors.push('Prénoms non détectés');
        if (!result.dateNaissance) result.errors.push('Date de naissance non détectée');
    }

    return result;
}

// Fonction pour nettoyer les fichiers
const cleanupFile = async (filePath) => {
    try {
        await fs.access(filePath).then(() => fs.unlink(filePath)).catch(() => {});
    } catch (error) {
        console.warn('Erreur nettoyage fichier:', error);
    }
};
// routes/candidatures.js - Version avec debug
router.post('/scan-document', upload.single('document'), async (req, res) => {
    console.log('=== SCAN DOCUMENT DEBUG ===');
    console.log('req.file:', req.file);
    console.log('req.files:', req.files);
    console.log('req.body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);

    let filePath = '';

    try {
        // ✅ Vérification détaillée
        if (!req.file) {
            console.error('❌ AUCUN FICHIER TROUVÉ - req.file est null/undefined');
            return res.status(400).json({
                success: false,
                error: 'Aucun fichier reçu. Vérifiez que le champ s\'appelle "document"',
                debug: {
                    hasFile: !!req.file,
                    fieldname: req.file?.fieldname,
                    mimetype: req.file?.mimetype,
                    size: req.file?.size
                }
            });
        }

        console.log('✅ Fichier reçu:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path
        });

        // Vérifier le type MIME
        if (!req.file.mimetype.match(/^(application\/pdf|image\/(jpeg|jpg|png))/)) {
            await cleanupFile(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Format non supporté',
                receivedType: req.file.mimetype,
                allowed: 'application/pdf, image/jpeg, image/jpg, image/png'
            });
        }

        // Vérifier la taille
        if (req.file.size > 10 * 1024 * 1024) {
            await cleanupFile(req.file.path);
            return res.status(400).json({
                success: false,
                error: 'Fichier trop volumineux (max 10MB)'
            });
        }

        filePath = req.file.path;
        let text = '';
        let confidence = 0;

        // Traitement...
        if (req.file.mimetype === 'application/pdf') {
            console.log('📄 Traitement PDF...');
            const dataBuffer = await fs.readFile(filePath);
            const pdfData = await pdfParse(dataBuffer);
            text = pdfData.text;
            confidence = 95;
        } else {
            console.log('🖼️ Traitement OCR...');
            const { data } = await Tesseract.recognize(filePath, 'fra+eng');
            text = data.text;
            confidence = data.confidence || 0;
        }

        await cleanupFile(filePath);

        const extractedData = extractDataFromText(text);
        extractedData.confidence = confidence;

        console.log('✅ SCAN RÉUSSI:', {
            nom: extractedData.nom,
            prenoms: extractedData.prenoms,
            dateNaissance: extractedData.dateNaissance,
            success: extractedData.success
        });

        res.json({
            success: true,
            data: extractedData,
            rawText: text.length > 2000 ? text.substring(0, 2000) + '...' : text,
            fullTextLength: text.length,
            confidence: confidence
        });

    } catch (error) {
        console.error('❌ ERREUR SCAN:', error);
        if (filePath) await cleanupFile(filePath);

        res.status(500).json({
            success: false,
            error: error.message || 'Erreur lors de l\'analyse',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
module.exports = router;