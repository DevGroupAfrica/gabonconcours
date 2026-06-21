-- Messagerie interne admin/candidat
-- Ajoute les pieces jointes et garde une base compatible avec les anciennes installations.

ALTER TABLE messages
  ADD COLUMN pieces_jointes JSON NULL AFTER message;

ALTER TABLE messages
  ADD COLUMN parent_message_id INT NULL AFTER statut;

CREATE INDEX idx_messages_conversation_date
  ON messages (candidat_nupcan, created_at, id);
