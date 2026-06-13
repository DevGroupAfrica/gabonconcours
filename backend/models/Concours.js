// =================================================================
// FICHIER : models/Concours.js (Modèle SQL)
// =================================================================
const {getConnection} = require('../config/database');

class Concours {
    static async findAll() {
        const connection = getConnection();
        // Modification: Sélection explicite de 'c.is_gorri' (nouvelle colonne)
        const [rows] = await connection.execute(
            `SELECT c.*, 
              e.nomets as etablissement_nomets,
              e.photo as etablissement_photo,
              n.nomniv as niveau_nomniv
       FROM concours c
       LEFT JOIN etablissements e ON c.etablissement_id = e.id
       LEFT JOIN niveaux n ON c.niveau_id = n.id
       WHERE c.stacnc = '1'
       ORDER BY c.debcnc DESC`
        );
        return rows;
    }

    static async findById(id) {
        const connection = getConnection();
        // Modification: Sélection de tous les champs y compris les JSON
        const [rows] = await connection.execute(
            `SELECT c.*, 
              e.nomets as etablissement_nomets,
              e.photo as etablissement_photo,
              n.nomniv as niveau_nomniv
       FROM concours c
       LEFT JOIN etablissements e ON c.etablissement_id = e.id
       LEFT JOIN niveaux n ON c.niveau_id = n.id
       WHERE c.id = ?`,
            [id]
        );
        
        if (rows[0]) {
            // Parser les champs JSON si ce sont des strings
            const concours = rows[0];
            if (typeof concours.series_bac_acceptees === 'string') {
                try {
                    concours.series_bac_acceptees = JSON.parse(concours.series_bac_acceptees);
                } catch (e) {
                    concours.series_bac_acceptees = [];
                }
            }
            if (typeof concours.documents_requis === 'string') {
                try {
                    concours.documents_requis = JSON.parse(concours.documents_requis);
                } catch (e) {
                    concours.documents_requis = [];
                }
            }
            if (typeof concours.criteres_selection === 'string') {
                try {
                    concours.criteres_selection = JSON.parse(concours.criteres_selection);
                } catch (e) {
                    concours.criteres_selection = [];
                }
            }
            if (typeof concours.modalites_inscription === 'string') {
                try {
                    concours.modalites_inscription = JSON.parse(concours.modalites_inscription);
                } catch (e) {
                    concours.modalites_inscription = [];
                }
            }
            if (typeof concours.conditions_eligibilite === 'string') {
                try {
                    concours.conditions_eligibilite = JSON.parse(concours.conditions_eligibilite);
                } catch (e) {
                    concours.conditions_eligibilite = [];
                }
            }
            return concours;
        }
        
        return null;
    }

    static async create(concoursData) {
        const connection = getConnection();

        // Correction pour les concours gratuits
        const fracncValue = concoursData.fracnc !== undefined && concoursData.fracnc !== null
            ? concoursData.fracnc
            : 0;

        // Préparer les champs JSON
        const series_bac = concoursData.series_bac_acceptees ? 
            (typeof concoursData.series_bac_acceptees === 'string' ? 
                concoursData.series_bac_acceptees : 
                JSON.stringify(concoursData.series_bac_acceptees)) : null;
        
        const documents = concoursData.documents_requis ? 
            (typeof concoursData.documents_requis === 'string' ? 
                concoursData.documents_requis : 
                JSON.stringify(concoursData.documents_requis)) : null;
        
        const criteres = concoursData.criteres_selection ? 
            (typeof concoursData.criteres_selection === 'string' ? 
                concoursData.criteres_selection : 
                JSON.stringify(concoursData.criteres_selection)) : null;
        
        const modalites = concoursData.modalites_inscription ? 
            (typeof concoursData.modalites_inscription === 'string' ? 
                concoursData.modalites_inscription : 
                JSON.stringify(concoursData.modalites_inscription)) : null;
        
        const conditions = concoursData.conditions_eligibilite ? 
            (typeof concoursData.conditions_eligibilite === 'string' ? 
                concoursData.conditions_eligibilite : 
                JSON.stringify(concoursData.conditions_eligibilite)) : null;

        const [result] = await connection.execute(
            `INSERT INTO concours (
                etablissement_id, niveau_id, libcnc, sescnc, debcnc, fincnc, stacnc, agecnc, fracnc, 
                etddos, is_gorri, type_concours, description_concours, nombre_places_total, 
                duree_formation, diplome_delivre, date_publication_resultats, date_debut_cours,
                series_bac_acceptees, documents_requis, criteres_selection, modalites_inscription,
                conditions_eligibilite, contact_email, contact_telephone, lieu_examen,
                informations_complementaires
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                concoursData.etablissement_id,
                concoursData.niveau_id || null,
                concoursData.libcnc,
                concoursData.sescnc,
                concoursData.debcnc || null,
                concoursData.fincnc || null,
                concoursData.stacnc || '1',
                concoursData.agecnc || null,
                fracncValue,
                concoursData.etddos || '0',
                concoursData.is_gorri || 0,
                concoursData.type_concours || 'autre',
                concoursData.description_concours || null,
                concoursData.nombre_places_total || 0,
                concoursData.duree_formation || null,
                concoursData.diplome_delivre || null,
                concoursData.date_publication_resultats || null,
                concoursData.date_debut_cours || null,
                series_bac,
                documents,
                criteres,
                modalites,
                conditions,
                concoursData.contact_email || null,
                concoursData.contact_telephone || null,
                concoursData.lieu_examen || null,
                concoursData.informations_complementaires || null
            ]
        );

        return this.findById(result.insertId);
    }

    static async update(id, concoursData) {
        const connection = getConnection();

        // CORRECTION: Récupérer seulement les champs valides
        const fieldsToUpdate = {};
        for (const key in concoursData) {
            if (concoursData[key] !== undefined && key !== 'id') {
                fieldsToUpdate[key] = concoursData[key];
            }
        }

        if (Object.keys(fieldsToUpdate).length === 0) {
            return this.findById(id);
        }

        const fields = Object.keys(fieldsToUpdate).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(fieldsToUpdate), id];

        await connection.execute(
            `UPDATE concours SET ${fields}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            values
        );

        return this.findById(id);
    }

    static async delete(id) {
        const connection = getConnection();
        const [result] = await connection.execute('DELETE FROM concours WHERE id = ?', [id]);
        return {success: result.affectedRows > 0};
    }
}

module.exports = Concours;