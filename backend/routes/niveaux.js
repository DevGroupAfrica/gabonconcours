const express = require('express');
const router = express.Router();

// Simulation des niveaux
const niveaux = [
    {id: 1, nom: 'CP1', description: 'Cours Préparatoire 1ère année'},
    {id: 2, nom: 'CP2', description: 'Cours Préparatoire 2ème année'},
    {id: 3, nom: '5ème', description: 'Cinquième'},
    {id: 4, nom: '4ème', description: 'Quatrième'},
    {id: 5, nom: '3ème', description: 'Troisième'},
    {id: 6, nom: '2nde', description: 'Seconde'},
    {id: 7, nom: '1ère', description: 'Première'},
    {id: 8, nom: 'Terminale', description: 'Terminale'},
    {id: 9, nom: 'Baccalauréat', description: 'Diplôme du Baccalauréat'},
    {id: 10, nom: 'DUT (Diplôme Universitaire de Technologie)', description: 'Diplôme Universitaire de Technologie'},
    {id: 11, nom: 'BTS', description: 'Brevet de Technicien Supérieur'},
    {id: 12, nom: 'Licence', description: 'Licence universitaire'},
    {id: 13, nom: 'Bachelor', description: 'Bachelor'},
    {id: 14, nom: 'Master', description: 'Master universitaire'},
    {id: 15, nom: 'Doctorat', description: 'Doctorat'}
];

// GET /api/niveaux - Obtenir tous les niveaux
router.get('/', async (req, res) => {
    try {
        res.json({
            success: true,
            data: niveaux
        });
    } catch (error) {
        console.error('Erreur lors de la récupération des niveaux:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur',
            errors: [error.message]
        });
    }
});

module.exports = router;