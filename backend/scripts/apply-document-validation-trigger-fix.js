const mysql = require('mysql2/promise');
const { dbConfig } = require('../config/database');

const triggerStatements = [
  'DROP TRIGGER IF EXISTS after_document_update',
  `
CREATE TRIGGER after_document_update
AFTER UPDATE ON documents
FOR EACH ROW
BEGIN
    DECLARE v_nupcan VARCHAR(100);

    IF NEW.statut != OLD.statut AND NEW.statut IN ('valide', 'rejete') THEN
        SELECT dos.nupcan
        INTO v_nupcan
        FROM dossiers dos
        WHERE dos.document_id = NEW.id
        LIMIT 1;

        IF v_nupcan IS NOT NULL THEN
            INSERT INTO notifications (
                candidat_nupcan,
                type,
                titre,
                message,
                statut,
                priority,
                created_at
            ) VALUES (
                v_nupcan,
                'document_validation',
                CONCAT('Document ', IF(NEW.statut = 'valide', 'valide', 'rejete')),
                CONCAT('Votre document "', NEW.nomdoc, '" a ete ', IF(NEW.statut = 'valide', 'valide', 'rejete'), '.'),
                'non_lu',
                IF(NEW.statut = 'valide', 'normal', 'high'),
                NOW()
            );
        END IF;
    END IF;
END
  `,
  'DROP TRIGGER IF EXISTS after_document_validation',
  `
CREATE TRIGGER after_document_validation
AFTER UPDATE ON documents
FOR EACH ROW
BEGIN
    DECLARE v_nupcan VARCHAR(100);

    IF NEW.statut != OLD.statut
       AND NEW.statut IN ('valide', 'rejete')
       AND NEW.validated_by IS NOT NULL THEN
        SELECT dos.nupcan
        INTO v_nupcan
        FROM dossiers dos
        WHERE dos.document_id = NEW.id
        LIMIT 1;

        INSERT INTO admin_actions (
            admin_id,
            action_type,
            entity_type,
            entity_id,
            candidat_nupcan,
            description,
            details,
            created_at
        ) VALUES (
            NEW.validated_by,
            IF(NEW.statut = 'valide', 'validation_document', 'rejet_document'),
            'document',
            NEW.id,
            v_nupcan,
            CONCAT(IF(NEW.statut = 'valide', 'Validation', 'Rejet'), ' du document: ', NEW.nomdoc),
            JSON_OBJECT(
                'statut', NEW.statut,
                'commentaire', NEW.commentaire_validation,
                'type_document', NEW.type
            ),
            NOW()
        );
    END IF;
END
  `,
];

async function main() {
  const connection = await mysql.createConnection(dbConfig);

  try {
    for (const statement of triggerStatements) {
      await connection.query(statement);
    }

    console.log('Document validation triggers fixed.');
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error('Failed to fix document validation triggers:', error.message);
  process.exit(1);
});
