const { getConnection } = require('../config/database');

class ConcoursFiliere {
    /**
     * Créer une liaison concours-filière
     */
    static async create(data) {
        const connection = getConnection();
        
        try {
            const [result] = await connection.execute(
                `INSERT INTO concours_filieres (concours_id, filiere_id, places_disponibles)
                 VALUES (?, ?, ?)`,
                [data.concours_id, data.filiere_id, data.places_disponibles || 0]
            );
            
            return {
                id: result.insertId,
                ...data,
                created_at: new Date().toISOString()
            };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Cette liaison concours-filière existe déjà');
            }
            throw error;
        }
    }
    
    /**
     * Récupérer toutes les filières d'un concours
     */
    static async findByConcoursId(concoursId) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            `SELECT cf.*, 
                    f.nomfil, f.description as filiere_description,
                    n.nomniv as niveau_nom
             FROM concours_filieres cf
             JOIN filieres f ON cf.filiere_id = f.id
             LEFT JOIN niveaux n ON f.niveau_id = n.id
             WHERE cf.concours_id = ?
             ORDER BY f.nomfil ASC`,
            [concoursId]
        );
        
        return rows;
    }
    
    /**
     * Récupérer tous les concours d'une filière
     */
    static async findByFiliereId(filiereId) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            `SELECT cf.*, 
                    c.libcnc, c.datcnc, c.statut as concours_statut
             FROM concours_filieres cf
             JOIN concours c ON cf.concours_id = c.id
             WHERE cf.filiere_id = ?
             ORDER BY c.datcnc DESC`,
            [filiereId]
        );
        
        return rows;
    }
    
    /**
     * Récupérer une liaison spécifique
     */
    static async findOne(concoursId, filiereId) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            `SELECT cf.*,
                    f.nomfil, f.description as filiere_description,
                    c.libcnc
             FROM concours_filieres cf
             JOIN filieres f ON cf.filiere_id = f.id
             JOIN concours c ON cf.concours_id = c.id
             WHERE cf.concours_id = ? AND cf.filiere_id = ?`,
            [concoursId, filiereId]
        );
        
        return rows[0] || null;
    }
    
    /**
     * Mettre à jour une liaison
     */
    static async update(id, data) {
        const connection = getConnection();
        
        await connection.execute(
            `UPDATE concours_filieres 
             SET places_disponibles = ?, updated_at = NOW()
             WHERE id = ?`,
            [data.places_disponibles, id]
        );
        
        return { id, ...data };
    }
    
    /**
     * Supprimer une liaison
     */
    static async delete(id) {
        const connection = getConnection();
        
        await connection.execute(
            'DELETE FROM concours_filieres WHERE id = ?',
            [id]
        );
        
        return { success: true };
    }
    
    /**
     * Supprimer toutes les liaisons d'un concours
     */
    static async deleteByConcoursId(concoursId) {
        const connection = getConnection();
        
        await connection.execute(
            'DELETE FROM concours_filieres WHERE concours_id = ?',
            [concoursId]
        );
        
        return { success: true };
    }
    
    /**
     * Récupérer les statistiques d'une liaison
     */
    static async getStats(concoursId, filiereId) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            `SELECT 
                cf.places_disponibles,
                COUNT(DISTINCT p.id) as candidats_inscrits,
                cf.places_disponibles - COUNT(DISTINCT p.id) as places_restantes
             FROM concours_filieres cf
             LEFT JOIN participations p ON cf.concours_id = p.concours_id 
                                        AND cf.filiere_id = p.filiere_id
             WHERE cf.concours_id = ? AND cf.filiere_id = ?
             GROUP BY cf.id, cf.places_disponibles`,
            [concoursId, filiereId]
        );
        
        return rows[0] || {
            places_disponibles: 0,
            candidats_inscrits: 0,
            places_restantes: 0
        };
    }
}

module.exports = ConcoursFiliere;
