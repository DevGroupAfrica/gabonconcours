const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const documentController = require('../models/doc');

// Config multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/documents/');
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});
const upload = multer({ storage });

// 🧩 Routes
router.put('/:id', documentController.updateDocumentInfo);
router.put('/:id/replace', upload.single('document'), documentController.replaceDocument);

module.exports = router;
