const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Route pour servir les fichiers uploadés
router.get('/uploads/:folder/:filename', (req, res) => {
    try {
        const { folder, filename } = req.params;
        const filePath = path.join(__dirname, '../uploads', folder, filename);
        
        console.log('Serving file:', filePath);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({
                success: false,
                message: 'Fichier non trouvé'
            });
        }
        
        // Déterminer le type MIME
        const ext = path.extname(filename).toLowerCase();
        const mimeTypes = {
            '.pdf': 'application/pdf',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg'
        };
        
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        
        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);
    } catch (error) {
        console.error('Erreur serving file:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération du fichier'
        });
    }
});

module.exports = router;
