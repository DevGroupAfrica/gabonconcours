const { getConnection } = require('../config/database');

class FiliereMatiere {
    /**
     * Créer une liaison filière-matière
     */
    static async create(data) {
        const connection = getConnection();
        
        try {
            const [result] = await connection.execute(
                `INSERT INTO filiere_matieres (filiere_id, matiere_id, coefficient, obligatoire)
                 VALUES (?, ?, ?, ?)`,
                [
                    data.filiere_id, 
                    data.matiere_id, 
                    data.coefficient || 1.0,
                    data.obligatoire !== undefined ? data.obligatoire : 1
                ]
            );
            
            return {
                id: result.insertId,
                ...data,
                created_at: new Date().toISOString()
            };
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new Error('Cette liaison filière-matière existe déjà');
            }
            throw error;
        }
    }
    
    /**
     * Récupérer toutes les matières d'une filière
     */
    static async findByFiliereId(filiereId) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            `SELECT fm.*, 
                    m.nom_matiere, m.duree, m.description as matiere_description
             FROM filiere_matieres fm
             JOIN matieres m ON fm.matiere_id = m.id
             WHERE fm.filiere_id = ?
             ORDER BY m.nom_matiere ASC`,
            [filiereId]
        );
        
        return rows;
    }
    
    /**
     * Récupérer toutes les filières qui ont une matière
     */
    static async findByMatiereId(matiereId) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            `SELECT fm.*, 
                    f.nomfil, f.description as filiere_description
             FROM filiere_matieres fm
             JOIN filieres f ON fm.filiere_id = f.id
             WHERE fm.matiere_id = ?
             ORDER BY f.nomfil ASC`,
            [matiereId]
        );
        
        return rows;
    }
    
    /**
     * Récupérer une liaison spécifique
     */
    static async findOne(filiereId, matiereId) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            `SELECT fm.*,
                    f.nomfil,
                    m.nom_matiere
             FROM filiere_matieres fm
             JOIN filieres f ON fm.filiere_id = f.id
             JOIN matieres m ON fm.matiere_id = m.id
             WHERE fm.filiere_id = ? AND fm.matiere_id = ?`,
            [filiereId, matiereId]
        );
        
        return rows[0] || null;
    }
    
    /**
     * Mettre à jour une liaison
     */
    static async update(id, data) {
        const connection = getConnection();
        
        const fields = [];
        const values = [];
        
        if (data.coefficient !== undefined) {
            fields.push('coefficient = ?');
            values.push(data.coefficient);
        }
        
        if (data.obligatoire !== undefined) {
            fields.push('obligatoire = ?');
            values.push(data.obligatoire);
        }
        
        fields.push('updated_at = NOW()');
        values.push(id);
        
        await connection.execute(
            `UPDATE filiere_matieres SET ${fields.join(', ')} WHERE id = ?`,
            values
        );
        
        return { id, ...data };
    }
    
    /**
     * Supprimer une liaison
     */
    static async delete(id) {
        const connection = getConnection();
        
        await connection.execute(
            'DELETE FROM filiere_matieres WHERE id = ?',
            [id]
        );
        
        return { success: true };
    }
    
    /**
     * Supprimer toutes les liaisons d'une filière
     */
    static async deleteByFiliereId(filiereId) {
        const connection = getConnection();
        
        await connection.execute(
            'DELETE FROM filiere_matieres WHERE filiere_id = ?',
            [filiereId]
        );
        
        return { success: true };
    }
    
    /**
     * Supprimer toutes les liaisons d'une matière
     */
    static async deleteByMatiereId(matiereId) {
        const connection = getConnection();
        
        await connection.execute(
            'DELETE FROM filiere_matieres WHERE matiere_id = ?',
            [matiereId]
        );
        
        return { success: true };
    }
    
    /**
     * Calculer la somme des coefficients pour une filière
     */
    static async getTotalCoefficients(filiereId) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            `SELECT SUM(coefficient) as total_coefficients,
                    COUNT(*) as nombre_matieres,
                    SUM(CASE WHEN obligatoire = 1 THEN 1 ELSE 0 END) as matieres_obligatoires
             FROM filiere_matieres
             WHERE filiere_id = ?`,
            [filiereId]
        );
        
        return rows[0] || {
            total_coefficients: 0,
            nombre_matieres: 0,
            matieres_obligatoires: 0
        };
    }
    
    /**
     * Assigner plusieurs matières à une filière en une seule opération
     */
    static async assignMultiple(filiereId, matieres) {
        const connection = getConnection();
        
        // matieres est un tableau de { matiere_id, coefficient, obligatoire }
        const values = matieres.map(m => [
            filiereId,
            m.matiere_id,
            m.coefficient || 1.0,
            m.obligatoire !== undefined ? m.obligatoire : 1
        ]);
        
        if (values.length === 0) {
            return [];
        }
        
        const [result] = await connection.query(
            `INSERT INTO filiere_matieres (filiere_id, matiere_id, coefficient, obligatoire)
             VALUES ?
             ON DUPLICATE KEY UPDATE 
                coefficient = VALUES(coefficient),
                obligatoire = VALUES(obligatoire),
                updated_at = NOW()`,
            [values]
        );
        
        return {
            success: true,
            affected: result.affectedRows,
            inserted: result.affectedRows - result.changedRows
        };
    }
}

module.exports = FiliereMatiere;
