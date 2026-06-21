const {getConnection} = require('../config/database');

const normalizeDocumentName = (value = '') => value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase();

const parseRequiredDocuments = (value) => {
    if (!value) return [];

    let documents = value;
    if (typeof documents === 'string') {
        try {
            documents = JSON.parse(documents);
        } catch {
            return [];
        }
    }

    if (!Array.isArray(documents)) return [];

    return documents
        .filter(document => document && typeof document.nom === 'string' && document.nom.trim())
        .map(document => ({
            nom: document.nom.trim(),
            obligatoire: Boolean(document.obligatoire),
            description: document.description || '',
        }));
};

const getRequiredDocumentsForConcours = async (concoursId) => {
    const connection = getConnection();
    const [rows] = await connection.execute(
        'SELECT documents_requis FROM concours WHERE id = ? LIMIT 1',
        [concoursId]
    );
    return rows.length ? parseRequiredDocuments(rows[0].documents_requis) : [];
};

const getRequiredDocumentsForNupcan = async (nupcan) => {
    const connection = getConnection();
    const [rows] = await connection.execute(
        `SELECT c.concours_id, co.documents_requis
         FROM candidats c
         LEFT JOIN concours co ON co.id = c.concours_id
         WHERE c.nupcan = ?
         LIMIT 1`,
        [nupcan]
    );

    if (!rows.length) return null;
    return {
        concoursId: rows[0].concours_id,
        documents: parseRequiredDocuments(rows[0].documents_requis),
    };
};

const isDocumentAllowed = (documentName, requiredDocuments) => {
    const normalizedName = normalizeDocumentName(documentName);
    return requiredDocuments.some(document => normalizeDocumentName(document.nom) === normalizedName);
};

module.exports = {
    getRequiredDocumentsForConcours,
    getRequiredDocumentsForNupcan,
    isDocumentAllowed,
    normalizeDocumentName,
    parseRequiredDocuments,
};
