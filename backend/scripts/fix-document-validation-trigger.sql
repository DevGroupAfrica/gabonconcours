DROP TRIGGER IF EXISTS `after_document_update`;

DELIMITER $$

CREATE TRIGGER `after_document_update`
AFTER UPDATE ON `documents`
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
                CONCAT('Document ', IF(NEW.statut = 'valide', 'validé', 'rejeté')),
                CONCAT('Votre document "', NEW.nomdoc, '" a été ', IF(NEW.statut = 'valide', 'validé', 'rejeté'), '.'),
                'non_lu',
                IF(NEW.statut = 'valide', 'normal', 'high'),
                NOW()
            );
        END IF;
    END IF;
END$$

DELIMITER ;
