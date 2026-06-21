const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { getConnection } = require('../config/database');
const { sendEmail } = require('../services/emailService');

const MAX_MESSAGES_PER_CONVERSATION = 100;
const uploadDir = path.join(__dirname, '..', 'uploads', 'messages');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedMimeTypes = new Set([
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]);

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, uploadDir),
        filename: (req, file, cb) => {
            const safeExt = path.extname(file.originalname || '').toLowerCase();
            cb(null, `message-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
        }
    }),
    limits: {
        fileSize: 10 * 1024 * 1024,
        files: 5
    },
    fileFilter: (req, file, cb) => {
        if (allowedMimeTypes.has(file.mimetype)) return cb(null, true);
        cb(new Error('Type de fichier non autorisé. Formats acceptés: photo, PDF, DOC, DOCX, XLS, XLSX.'));
    }
});

let schemaReady = false;

const ensureMessageSchema = async (connection) => {
    if (schemaReady) return;

    const columns = [
        ['pieces_jointes', 'ALTER TABLE messages ADD COLUMN pieces_jointes JSON NULL AFTER message'],
        ['parent_message_id', 'ALTER TABLE messages ADD COLUMN parent_message_id INT NULL AFTER statut']
    ];

    for (const [, sql] of columns) {
        try {
            await connection.execute(sql);
        } catch (error) {
            if (error.code !== 'ER_DUP_FIELDNAME') throw error;
        }
    }

    schemaReady = true;
};

const cleanupUploadedFiles = (files = []) => {
    for (const file of files) {
        fs.unlink(file.path, () => {});
    }
};

const normalizeAttachments = (files = []) => files.map((file) => ({
    original_name: file.originalname,
    filename: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    url: `/uploads/messages/${file.filename}`
}));

const pruneOldMessages = async (connection, nupcan) => {
    const [oldMessages] = await connection.execute(
        `SELECT id
         FROM messages
         WHERE candidat_nupcan = ?
         ORDER BY created_at DESC, id DESC
         LIMIT 18446744073709551615 OFFSET ?`,
        [nupcan, MAX_MESSAGES_PER_CONVERSATION]
    );

    if (oldMessages.length === 0) return;

    const ids = oldMessages.map((message) => message.id);
    const placeholders = ids.map(() => '?').join(',');
    await connection.execute(`DELETE FROM messages WHERE id IN (${placeholders})`, ids);
};

const getConversation = async (connection, nupcan) => {
    const [messages] = await connection.execute(
        `SELECT *
         FROM (
             SELECT m.*,
                    c.nomcan, c.prncan, c.maican,
                    a.nom as admin_nom, a.prenom as admin_prenom
             FROM messages m
             LEFT JOIN candidats c ON m.candidat_nupcan = c.nupcan
             LEFT JOIN administrateurs a ON m.admin_id = a.id
             WHERE m.candidat_nupcan = ?
             ORDER BY m.created_at DESC, m.id DESC
             LIMIT ?
         ) recent_messages
         ORDER BY created_at ASC, id ASC`,
        [nupcan, MAX_MESSAGES_PER_CONVERSATION]
    );

    return messages.map((message) => ({
        ...message,
        pieces_jointes: typeof message.pieces_jointes === 'string'
            ? JSON.parse(message.pieces_jointes || '[]')
            : message.pieces_jointes || []
    }));
};

// Récupérer les 100 derniers messages d'un candidat
router.get('/candidat/:nupcan', async (req, res) => {
    try {
        const { nupcan } = req.params;
        const connection = getConnection();
        await ensureMessageSchema(connection);

        const messages = await getConversation(connection, nupcan);

        await connection.execute(
            `UPDATE messages
             SET statut = 'lu', updated_at = NOW()
             WHERE candidat_nupcan = ? AND expediteur = 'admin' AND statut = 'non_lu'`,
            [nupcan]
        );

        res.json({ success: true, data: messages, total: messages.length, limit: MAX_MESSAGES_PER_CONVERSATION });
    } catch (error) {
        console.error('Erreur récupération messages:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Récupérer les messages pour l'admin
router.get('/admin', async (req, res) => {
    try {
        const connection = getConnection();
        await ensureMessageSchema(connection);
        const { concours_id, etablissement_id } = req.query;

        let query = `
            SELECT m.*,
                   c.nomcan, c.prncan, c.maican, c.concours_id,
                   a.nom as admin_nom, a.prenom as admin_prenom,
                   con.libcnc,
                   con.etablissement_id
            FROM messages m
            LEFT JOIN candidats c ON m.candidat_nupcan = c.nupcan
            LEFT JOIN administrateurs a ON m.admin_id = a.id
            LEFT JOIN concours con ON c.concours_id = con.id
            WHERE 1=1
        `;

        const params = [];

        if (etablissement_id) {
            query += ' AND con.etablissement_id = ?';
            params.push(etablissement_id);
        }

        if (concours_id) {
            query += ' AND c.concours_id = ?';
            params.push(concours_id);
        }

        query += ' ORDER BY m.created_at DESC, m.id DESC LIMIT 100';

        const [messages] = await connection.execute(query, params);
        res.json({
            success: true,
            data: messages.map((message) => ({
                ...message,
                pieces_jointes: typeof message.pieces_jointes === 'string'
                    ? JSON.parse(message.pieces_jointes || '[]')
                    : message.pieces_jointes || []
            }))
        });
    } catch (error) {
        console.error('Erreur récupération messages admin:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Envoyer un message candidat -> admin
router.post('/candidat', upload.array('pieces_jointes', 5), async (req, res) => {
    try {
        const { nupcan, sujet, message, admin_id } = req.body;
        const piecesJointes = normalizeAttachments(req.files);

        if (!nupcan || !sujet || !message) {
            cleanupUploadedFiles(req.files);
            return res.status(400).json({ success: false, message: 'NUPCAN, sujet et message requis' });
        }

        const connection = getConnection();
        await ensureMessageSchema(connection);

        const [candidats] = await connection.execute('SELECT * FROM candidats WHERE nupcan = ?', [nupcan]);

        if (candidats.length === 0) {
            cleanupUploadedFiles(req.files);
            return res.status(404).json({ success: false, message: 'Candidat non trouvé' });
        }

        const candidat = candidats[0];

        const [result] = await connection.execute(
            `INSERT INTO messages
                (candidat_nupcan, sujet, message, pieces_jointes, admin_id, expediteur, statut, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'candidat', 'non_lu', NOW(), NOW())`,
            [nupcan, sujet.trim(), message.trim(), JSON.stringify(piecesJointes), admin_id || null]
        );

        await pruneOldMessages(connection, nupcan);

        try {
            await sendEmail(
                process.env.SMTP_USER || process.env.ADMIN_EMAIL || 'admin@gabconcours.ga',
                `Nouveau message de ${candidat.prncan} ${candidat.nomcan}`,
                `<p><strong>De:</strong> ${candidat.prncan} ${candidat.nomcan} (${nupcan})</p>
                 <p><strong>Sujet:</strong> ${sujet}</p>
                 <p>${message}</p>
                 <p>Pièce(s) jointe(s): ${piecesJointes.length}</p>`
            );
        } catch (emailError) {
            console.error('Erreur envoi email admin:', emailError.message);
        }

        res.json({ success: true, message: 'Message envoyé avec succès', data: { id: result.insertId } });
    } catch (error) {
        cleanupUploadedFiles(req.files);
        console.error('Erreur envoi message:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Répondre à un message admin -> candidat
router.post('/admin/repondre', upload.array('pieces_jointes', 5), async (req, res) => {
    try {
        const { message_id, nupcan, sujet, message, admin_id } = req.body;
        const piecesJointes = normalizeAttachments(req.files);

        if (!nupcan || !message) {
            cleanupUploadedFiles(req.files);
            return res.status(400).json({ success: false, message: 'NUPCAN et message requis' });
        }

        if (!admin_id) {
            cleanupUploadedFiles(req.files);
            return res.status(400).json({ success: false, message: 'admin_id requis' });
        }

        const connection = getConnection();
        await ensureMessageSchema(connection);

        const [candidats] = await connection.execute('SELECT * FROM candidats WHERE nupcan = ?', [nupcan]);

        if (candidats.length === 0) {
            cleanupUploadedFiles(req.files);
            return res.status(404).json({ success: false, message: 'Candidat non trouvé' });
        }

        const candidat = candidats[0];
        const finalSubject = sujet?.trim() || 'Réponse à votre message';

        const [result] = await connection.execute(
            `INSERT INTO messages
                (candidat_nupcan, admin_id, sujet, message, pieces_jointes, expediteur, statut, parent_message_id, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'admin', 'non_lu', ?, NOW(), NOW())`,
            [nupcan, admin_id, finalSubject, message.trim(), JSON.stringify(piecesJointes), message_id || null]
        );

        if (message_id) {
            await connection.execute('UPDATE messages SET statut = "lu", updated_at = NOW() WHERE id = ?', [message_id]);
        }

        await pruneOldMessages(connection, nupcan);

        try {
            await connection.execute(
                `INSERT INTO notifications
                    (candidat_nupcan, type, titre, message, statut, priority, created_at, updated_at)
                 VALUES (?, 'message', 'Nouvelle réponse', ?, 'non_lu', 'high', NOW(), NOW())`,
                [nupcan, 'Vous avez reçu une réponse de l\'administration']
            );
        } catch (notifError) {
            console.error('Erreur notification message:', notifError.message);
        }

        try {
            await connection.execute(
                `INSERT INTO admin_actions
                    (admin_id, action_type, entity_type, entity_id, candidat_nupcan, description, details, ip_address, created_at)
                 VALUES (?, 'reponse_message', 'message', ?, ?, ?, ?, ?, NOW())`,
                [
                    admin_id,
                    result.insertId,
                    nupcan,
                    `Réponse au message: ${finalSubject}`,
                    JSON.stringify({ message_id: message_id || null, pieces_jointes: piecesJointes.length }),
                    req.ip || null
                ]
            );
        } catch (auditError) {
            console.error('Erreur journalisation réponse admin:', auditError.message);
        }

        try {
            await sendEmail(
                candidat.maican,
                'Réponse à votre message - GabConcours',
                `<p>Bonjour ${candidat.prncan} ${candidat.nomcan},</p>
                 <p>Vous avez reçu une réponse dans votre messagerie interne.</p>
                 <p><strong>Sujet:</strong> ${finalSubject}</p>
                 <p>${message}</p>`
            );
        } catch (emailError) {
            console.error('Erreur envoi email candidat:', emailError.message);
        }

        res.json({ success: true, message: 'Réponse envoyée avec succès', data: { id: result.insertId } });
    } catch (error) {
        cleanupUploadedFiles(req.files);
        console.error('Erreur réponse message:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Marquer un message comme lu
router.put('/:id/marquer-lu', async (req, res) => {
    try {
        const { id } = req.params;
        const connection = getConnection();
        await connection.execute('UPDATE messages SET statut = "lu", updated_at = NOW() WHERE id = ?', [id]);
        res.json({ success: true, message: 'Message marqué comme lu' });
    } catch (error) {
        console.error('Erreur marquage message:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Statistiques messages (admin)
router.get('/stats', async (req, res) => {
    try {
        const connection = getConnection();
        await ensureMessageSchema(connection);

        const [stats] = await connection.execute(`
            SELECT
                COUNT(*) as total,
                SUM(CASE WHEN statut = 'non_lu' THEN 1 ELSE 0 END) as non_lus,
                SUM(CASE WHEN expediteur = 'candidat' THEN 1 ELSE 0 END) as de_candidats,
                SUM(CASE WHEN expediteur = 'admin' THEN 1 ELSE 0 END) as de_admins,
                COUNT(DISTINCT candidat_nupcan) as conversations
            FROM messages
        `);

        res.json({ success: true, data: stats[0] });
    } catch (error) {
        console.error('Erreur stats messages:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
