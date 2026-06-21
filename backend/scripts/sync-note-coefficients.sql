-- Synchronise les coefficients déjà enregistrés dans notes avec les coefficients
-- configurés pour la filière du candidat.
UPDATE notes n
JOIN candidats c
  ON c.id = n.candidat_id
JOIN filiere_matieres fm
  ON fm.filiere_id = c.filiere_id
 AND fm.matiere_id = n.matiere_id
SET n.coefficient = fm.coefficient,
    n.updated_at = NOW();

-- Vérification rapide.
SELECT
  c.nupcan,
  m.nom_matiere,
  n.note,
  n.coefficient
FROM notes n
JOIN candidats c ON c.id = n.candidat_id
JOIN matieres m ON m.id = n.matiere_id
ORDER BY c.nupcan, m.nom_matiere;
