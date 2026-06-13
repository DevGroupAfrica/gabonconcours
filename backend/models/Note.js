const { getConnection } = require('../config/database');

class Note {
    static async create(noteData) {
        const connection = getConnection();
        
        const [result] = await connection.execute(
            `INSERT INTO notes (candidat_id, concours_id, matiere_id, note, coefficient, created_at)
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [
                noteData.candidat_id,
                noteData.concours_id,
                noteData.matiere_id,
                noteData.note,
                noteData.coefficient || 1
            ]
        );
        
        return {
            id: result.insertId,
            ...noteData,
            created_at: new Date().toISOString()
        };
    }
    
    static async findByCandidatAndConcours(candidat_id, concours_id) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            `SELECT n.*, m.nom_matiere, m.duree
             FROM notes n
             LEFT JOIN matieres m ON n.matiere_id = m.id
             WHERE n.candidat_id = ? AND n.concours_id = ?
             ORDER BY m.nom_matiere`,
            [candidat_id, concours_id]
        );
        
        return rows;
    }
    
    static async findByCandidat(candidat_id) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            `SELECT n.*, m.nom_matiere, c.libcnc
             FROM notes n
             LEFT JOIN matieres m ON n.matiere_id = m.id
             LEFT JOIN concours c ON n.concours_id = c.id
             WHERE n.candidat_id = ?
             ORDER BY c.libcnc, m.nom_matiere`,
            [candidat_id]
        );
        
        return rows;
    }
    
    static async findByNupcan(nupcan) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            `SELECT n.*, m.nom_matiere, m.coefficient as coef_matiere, c.libcnc
             FROM notes n
             LEFT JOIN matieres m ON n.matiere_id = m.id
             LEFT JOIN concours c ON n.concours_id = c.id
             LEFT JOIN candidats cand ON n.candidat_id = cand.id
             WHERE cand.nupcan = ?
             ORDER BY c.libcnc, m.nom_matiere`,
            [nupcan]
        );
        
        return rows;
    }
    
    static async update(id, noteData) {
        const connection = getConnection();
        
        await connection.execute(
            `UPDATE notes SET note = ?, coefficient = ?, updated_at = NOW() WHERE id = ?`,
            [noteData.note, noteData.coefficient || 1, id]
        );
        
        return this.findById(id);
    }
    
    static async findById(id) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            'SELECT * FROM notes WHERE id = ?',
            [id]
        );
        
        return rows[0] || null;
    }
    
    static async delete(id) {
        const connection = getConnection();
        
        await connection.execute('DELETE FROM notes WHERE id = ?', [id]);
        
        return { success: true };
    }
    
    static async calculateMoyenne(candidat_id, concours_id) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            `SELECT 
                SUM(n.note * n.coefficient) / SUM(n.coefficient) as moyenne,
                COUNT(*) as nombre_notes,
                SUM(n.coefficient) as total_coefficients
             FROM notes n
             WHERE n.candidat_id = ? AND n.concours_id = ?`,
            [candidat_id, concours_id]
        );
        
        return rows[0];
    }
    
    // Calculer la moyenne pour tous les candidats d'un concours
    static async calculateMoyennesByConcours(concours_id) {
        const connection = getConnection();
        
        const [rows] = await connection.execute(
            `SELECT 
                n.candidat_id,
                cand.nomcan,
                cand.prncan,
                cand.nupcan,
                SUM(n.note * n.coefficient) / SUM(n.coefficient) as moyenne,
                COUNT(*) as nombre_notes
             FROM notes n
             LEFT JOIN candidats cand ON n.candidat_id = cand.id
             WHERE n.concours_id = ?
             GROUP BY n.candidat_id, cand.nomcan, cand.prncan, cand.nupcan
             ORDER BY moyenne DESC`,
            [concours_id]
        );
        
        return rows;
    }
}

module.exports = Note;
