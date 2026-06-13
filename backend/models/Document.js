const { getConnection } = require('../config/database');

class Document {
    static async create(data) {
        const connection = getConnection();
        const sanitized = {
            nomdoc: data.nomdoc || data.nom_fichier || 'Document',
            type: data.type || 'document',
            nom_fichier: data.nom_fichier || '',
            statut: data.statut || 'en_attente'
        };

        const [result] = await connection.execute(
            `INSERT INTO documents (nomdoc, type, nom_fichier, statut, created_at, updated_at)
       VALUES (?, ?, ?, ?, NOW(), NOW())`,
            [sanitized.nomdoc, sanitized.type, sanitized.nom_fichier, sanitized.statut]
        );

        return { id: result.insertId, ...sanitized };
    }

    static async findById(id) {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM documents WHERE id = ?', [id]);
        return rows[0] || null;
    }

    static async findByNupcan(nupcan) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT d.*, dos.nupcan, dos.candidat_id, dos.concours_id
       FROM documents d
       JOIN dossiers dos ON d.id = dos.document_id
       WHERE dos.nupcan = ?
       ORDER BY d.created_at DESC`,
            [nupcan]
        );
        return rows;
    }

    static async updateStatus(id, statut, commentaire = null) {
        const connection = getConnection();
        if (commentaire) {
            await connection.execute(
                'UPDATE documents SET statut = ?, commentaire_validation = ?, validated_at = NOW(), updated_at = NOW() WHERE id = ?',
                [statut, commentaire, id]
            );
        } else {
            await connection.execute(
                'UPDATE documents SET statut = ?, commentaire_validation = NULL, validated_at = NOW(), updated_at = NOW() WHERE id = ?',
                [statut, id]
            );
        }

        // Vérifier et mettre à jour le statut du candidat
        await this.checkAndUpdateCandidatStatus(id);

        return this.findById(id);
    }

    static async checkAndUpdateCandidatStatus(documentId) {
        const connection = getConnection();

        try {
            // Récupérer le candidat associé à ce document
            const [dossiers] = await connection.execute(`
                SELECT dos.nupcan, c.id as candidat_id
                FROM dossiers dos
                JOIN candidats c ON dos.nupcan = c.nupcan
                WHERE dos.document_id = ?
            `, [documentId]);

            if (dossiers.length === 0) return;

            const { nupcan, candidat_id } = dossiers[0];

            // Vérifier tous les documents du candidat
            const [documents] = await connection.execute(`
                SELECT d.statut
                FROM documents d
                JOIN dossiers dos ON d.id = dos.document_id
                WHERE dos.nupcan = ?
            `, [nupcan]);

            // Vérifier le paiement
            const [paiements] = await connection.execute(
                'SELECT statut FROM paiements WHERE nupcan = ?',
                [nupcan]
            );

            // Si tous les documents sont validés ET le paiement est validé
            const allDocsValid = documents.length > 0 && documents.every(d => d.statut === 'valide');
            const paiementValid = paiements.length > 0 && paiements[0].statut === 'valide';

            if (allDocsValid && paiementValid) {
                // Mettre à jour le statut du candidat à "valide"
                await connection.execute(
                    'UPDATE candidats SET statut = ?, updated_at = NOW() WHERE id = ?',
                    ['valide', candidat_id]
                );

                // Créer une notification
                const Notification = require('./Notification');
                await Notification.create({
                    candidat_id: candidat_id,
                    type: 'validation',
                    titre: 'Dossier validé',
                    message: 'Félicitations ! Votre dossier a été entièrement validé. Vous recevrez prochainement votre convocation par email.',
                    lu: false
                });

                // Envoyer un email au candidat
                const [candidats] = await connection.execute(
                    'SELECT nomcan, prncan, maican FROM candidats WHERE id = ?',
                    [candidat_id]
                );

                if (candidats.length > 0) {
                    const candidat = candidats[0];
                    const nodemailer = require('nodemailer');
                    const transporter = nodemailer.createTransporter({
                        host: process.env.SMTP_HOST || 'smtp.gmail.com',
                        port: process.env.SMTP_PORT || 587,
                        secure: false,
                        auth: {
                            user: process.env.SMTP_USER || process.env.EMAIL_USER,
                            pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD
                        }
                    });

                    await transporter.sendMail({
                        from: process.env.SMTP_USER || 'noreply@gabconcours.ga',
                        to: candidat.maican,
                        subject: ' Dossier Validé - GABConcours',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: linear-gradient(135deg, #10b981, #059669); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                                    <h1 style="color: white; margin: 0;">🎉 Félicitations !</h1>
                                </div>
                                <div style="background: #f8fafc; padding: 30px; border: 1px solid #e2e8f0;">
                                    <p>Bonjour <strong>${candidat.prncan} ${candidat.nomcan}</strong>,</p>
                                    <p>Nous avons le plaisir de vous informer que <strong>votre dossier de candidature a été entièrement validé</strong> !</p>
                                    <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                                        <h3 style="margin: 0; color: #065f46;"> Statut : VALIDE</h3>
                                        <p style="margin: 10px 0 0 0; color: #065f46;">
                                            Tous vos documents ont été vérifiés et approuvés.
                                        </p>
                                    </div>
                                    <p><strong>Prochaines étapes :</strong></p>
                                    <ul>
                                        <li>Vous recevrez votre convocation par email</li>
                                        <li>Consultez régulièrement votre dashboard</li>
                                        <li>Préparez-vous pour le jour du concours</li>
                                    </ul>
                                    <div style="text-align: center; margin: 30px 0;">
                                        <a href="${process.env.APP_URL || 'http://localhost:8001'}/dashboard/${nupcan}"
                                           style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                                            📱 Accéder à mon dashboard
                                        </a>
                                    </div>
                                    <p>Bonne chance pour le concours !</p>
                                    <p>Cordialement,<br><strong>L'équipe GABConcours</strong></p>
                                </div>
                            </div>
                        `
                    });
                }
            }
        } catch (error) {
            console.error('Erreur vérification statut candidat:', error);
            // Non bloquant
        }
    }



    static async replace(id, newFileName) {
        const connection = getConnection();
        const doc = await this.findById(id);
        if (!doc) throw new Error('Document non trouvé');

        // Remplacement pour documents rejetés ou en_attente
        if (doc.statut !== 'rejete' && doc.statut !== 'en_attente') {
            throw new Error('Seuls les documents rejetés ou en attente peuvent être remplacés');
        }

        // Conserver le nomdoc et le type existants, seul le fichier change
        await connection.execute(
            `UPDATE documents
             SET nom_fichier = ?,
                 statut = 'en_attente',
                 commentaire_validation = 'Document remplacé - en attente de validation',
                 updated_at = NOW()
             WHERE id = ?`,
            [newFileName, id]
        );

        return this.findById(id);
    }

    static async countByNupcan(nupcan) {
        const connection = getConnection();
        const [rows] = await connection.execute(
            `SELECT COUNT(*) as total
             FROM documents d
             JOIN dossiers dos ON d.id = dos.document_id
             WHERE dos.nupcan = ?`,
            [nupcan]
        );
        return rows[0].total;
    }

    static async canAddDocument(nupcan) {
        const total = await this.countByNupcan(nupcan);
        return total < 6; // Maximum 6 documents (3 requis + 3 optionnels)
    }
    static async findAll() {
        const connection = getConnection();
        const [rows] = await connection.execute('SELECT * FROM documents ORDER BY created_at DESC');
        return rows;
    }

    static async findAllWithCandidatInfo() {
        const connection = getConnection();
        const [rows] = await connection.execute(`
      SELECT d.*, dos.nupcan, c.nomcan, c.prncan, c.maican, con.libcnc
      FROM documents d
      LEFT JOIN dossiers dos ON d.id = dos.document_id
      LEFT JOIN candidats c ON dos.candidat_id = c.id
      LEFT JOIN concours con ON dos.concours_id = con.id
      ORDER BY d.created_at DESC
    `);
        return rows;
    }

    static async deleteById(id) {
        const connection = getConnection();
        const [result] = await connection.execute('DELETE FROM documents WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }

    static async getStatsByStatus() {
        const connection = getConnection();
        const [rows] = await connection.execute(`
      SELECT statut, COUNT(*) as count FROM documents GROUP BY statut
    `);
        return rows;
    }
}

module.exports = Document;
