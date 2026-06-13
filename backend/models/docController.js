const fs = require('fs');
const path = require('path');
const Document = require('Document');

// ✅ Mettre à jour les informations d’un document
exports.updateDocumentInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const { nomdoc, type, statut, commentaire } = req.body;

        const document = await Document.findByPk(id);
        if (!document) return res.status(404).json({ message: 'Document non trouvé' });

        await document.update({ nomdoc, type, statut, commentaire });
        res.json({ message: 'Document mis à jour avec succès', data: document });
    } catch (error) {
        console.error('Erreur updateDocumentInfo:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};

// ✅ Remplacer un document rejeté
exports.replaceDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const document = await Document.findByPk(id);
        if (!document) return res.status(404).json({ message: 'Document non trouvé' });

        if (document.statut !== 'rejete') {
            return res.status(403).json({ message: 'Seuls les documents rejetés peuvent être remplacés' });
        }

        if (!req.file) return res.status(400).json({ message: 'Aucun fichier fourni' });

        const oldPath = document.chemin_fichier ? path.resolve(document.chemin_fichier) : null;
        if (oldPath && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);

        const newPath = path.join('uploads/documents', req.file.filename);
        await document.update({
            nom_fichier: req.file.originalname,
            chemin_fichier: newPath,
            statut: 'en_attente',
            updated_at: new Date(),
        });

        res.json({ message: 'Document remplacé avec succès', data: document });
    } catch (error) {
        console.error('Erreur replaceDocument:', error);
        res.status(500).json({ message: 'Erreur serveur' });
    }
};
