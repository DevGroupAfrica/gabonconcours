const { getConnection } = require('../config/database');

class ParticipationService {
    /**
     * Recalculer la moyenne générale d'un candidat pour un concours
     */
    static async updateMoyenneGenerale(candidatId, concoursId) {
        const connection = getConnection();
        
        try {
            // Récupérer la participation
            const [participations] = await connection.execute(
                'SELECT id FROM participations WHERE candidat_id = ? AND concours_id = ?',
                [candidatId, concoursId]
            );
            
            if (participations.length === 0) {
                console.log('Participation non trouvée');
                return null;
            }
            
            const participationId = participations[0].id;
            
            // Calculer la moyenne avec les notes et coefficients
            const [notes] = await connection.execute(`
                SELECT n.note, m.coefmat
                FROM notes n
                LEFT JOIN matieres m ON n.matiere_id = m.id
                WHERE n.participation_id = ?
            `, [participationId]);
            
            if (notes.length === 0) {
                console.log('Aucune note trouvée');
                return null;
            }
            
            let totalPoints = 0;
            let totalCoefficients = 0;
            
            notes.forEach(note => {
                if (note.note !== null && note.coefmat) {
                    totalPoints += note.note * note.coefmat;
                    totalCoefficients += note.coefmat;
                }
            });
            
            const moyenneGenerale = totalCoefficients > 0 
                ? (totalPoints / totalCoefficients).toFixed(2) 
                : null;
            
            // Mettre à jour la moyenne dans la table participations
            await connection.execute(
                'UPDATE participations SET moyenne_generale = ? WHERE id = ?',
                [moyenneGenerale, participationId]
            );
            
            console.log(`Moyenne mise à jour: ${moyenneGenerale} pour participation ${participationId}`);
            
            // Recalculer les rangs pour ce concours
            await this.updateRangs(concoursId);
            
            // Mettre à jour le statut selon la moyenne
            await this.updateStatut(participationId, moyenneGenerale);
            
            // 🔔 Créer une notification push pour le candidat
            const [participation] = await connection.execute(
                'SELECT candidat_id, rang FROM participations WHERE id = ?',
                [participationId]
            );
            
            if (participation.length > 0) {
                const Notification = require('../models/Notification');
                await Notification.create({
                    candidat_id: participation[0].candidat_id,
                    type: 'resultat',
                    titre: 'Notes mises à jour',
                    message: `Votre moyenne générale est de ${moyenneGenerale}/20. Rang: ${participation[0].rang || 'En attente'}`,
                    lu: false
                });
            }
            
            return moyenneGenerale;
        } catch (error) {
            console.error('Erreur mise à jour moyenne:', error);
            throw error;
        }
    }
    
    /**
     * Recalculer les rangs pour tous les candidats d'un concours
     */
    static async updateRangs(concoursId) {
        const connection = getConnection();
        
        try {
            // Récupérer toutes les participations avec leur moyenne, triées par moyenne décroissante
            const [participations] = await connection.execute(`
                SELECT id, moyenne_generale 
                FROM participations 
                WHERE concours_id = ? AND moyenne_generale IS NOT NULL
                ORDER BY moyenne_generale DESC
            `, [concoursId]);
            
            // Attribuer les rangs
            let currentRank = 1;
            for (const participation of participations) {
                await connection.execute(
                    'UPDATE participations SET rang = ? WHERE id = ?',
                    [currentRank, participation.id]
                );
                currentRank++;
            }
            
            console.log(`${participations.length} rangs mis à jour pour le concours ${concoursId}`);
        } catch (error) {
            console.error('Erreur mise à jour rangs:', error);
            throw error;
        }
    }
    
    /**
     * Mettre à jour le statut d'une participation selon la moyenne
     */
    static async updateStatut(participationId, moyenne) {
        const connection = getConnection();
        
        try {
            if (moyenne === null) return;
            
            let statut = 'non_admis';
            if (parseFloat(moyenne) >= 10) {
                statut = 'admis';
            }
            
            await connection.execute(
                'UPDATE participations SET statut = ? WHERE id = ?',
                [statut, participationId]
            );
            
            console.log(`Statut mis à jour: ${statut} pour participation ${participationId}`);
        } catch (error) {
            console.error('Erreur mise à jour statut:', error);
            throw error;
        }
    }
    
    /**
     * Vérifier et mettre à jour le statut de participation selon documents et paiement
     */
    static async checkAndUpdateParticipationStatus(candidatId, concoursId) {
        const connection = getConnection();
        
        try {
            // Récupérer la participation
            const [participations] = await connection.execute(
                'SELECT id FROM participations WHERE candidat_id = ? AND concours_id = ?',
                [candidatId, concoursId]
            );
            
            if (participations.length === 0) {
                console.log('Participation non trouvée');
                return null;
            }
            
            const participationId = participations[0].id;
            
            // Vérifier si tous les documents sont validés
            const [documents] = await connection.execute(`
                SELECT COUNT(*) as total, 
                       SUM(CASE WHEN statut = 'valide' THEN 1 ELSE 0 END) as valides
                FROM candidat_documents
                WHERE candidat_id = ?
            `, [candidatId]);
            
            const allDocsValid = documents[0].total > 0 && 
                                 documents[0].total === documents[0].valides;
            
            // Vérifier si le paiement est validé
            const [paiements] = await connection.execute(`
                SELECT statut FROM paiements
                WHERE candidat_id = ? AND concours_id = ?
                ORDER BY created_at DESC LIMIT 1
            `, [candidatId, concoursId]);
            
            const paymentValid = paiements.length > 0 && paiements[0].statut === 'valide';
            
            // Si documents et paiement validés, mettre à jour le statut
            if (allDocsValid && paymentValid) {
                await connection.execute(
                    'UPDATE participations SET statut = ? WHERE id = ?',
                    ['en_attente', participationId]
                );
                
                console.log(`✅ Participation ${participationId} mise à jour: documents et paiement validés`);
                
                // Créer une notification
                const Notification = require('../models/Notification');
                await Notification.create({
                    candidat_id: candidatId,
                    type: 'validation',
                    titre: 'Dossier complet validé',
                    message: 'Votre dossier de candidature est complet et validé. Vous êtes maintenant en attente des résultats.',
                    lu: false
                });
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Erreur vérification statut participation:', error);
            throw error;
        }
    }
    
    /**
     * Récupérer les informations complètes d'une participation par NUPCAN
     */
    static async getParticipationByNupcan(nupcan) {
        const connection = getConnection();
        
        try {
            const [participations] = await connection.execute(`
                SELECT 
                    p.*,
                    c.nomcan, c.prncan,
                    con.libcnc,
                    f.libfil,
                    e.nomets
                FROM participations p
                LEFT JOIN candidats c ON p.candidat_id = c.id
                LEFT JOIN concours con ON p.concours_id = con.id
                LEFT JOIN filieres f ON p.filiere_id = f.id
                LEFT JOIN etablissements e ON con.etablissement_id = e.id
                WHERE c.nupcan = ?
            `, [nupcan]);
            
            return participations[0] || null;
        } catch (error) {
            console.error('Erreur récupération participation:', error);
            throw error;
        }
    }
}

module.exports = ParticipationService;
