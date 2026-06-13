-- Script de mise à jour des tables pour GabConcours

-- Ajout de la table messages si elle n'existe pas
CREATE TABLE IF NOT EXISTS messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    candidat_nupcan VARCHAR(50) NOT NULL,
    admin_id INT NULL,
    sujet VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    expediteur ENUM('candidat', 'admin') NOT NULL,
    statut ENUM('lu', 'non_lu') DEFAULT 'non_lu',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (candidat_nupcan) REFERENCES candidats(nupcan) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES administrateurs(id) ON DELETE SET NULL,
    INDEX idx_candidat (candidat_nupcan),
    INDEX idx_statut (statut),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table participations améliorée
CREATE TABLE IF NOT EXISTS participations (
    id INT PRIMARY KEY AUTO_INCREMENT,
    candidat_id INT NOT NULL,
    concours_id INT NOT NULL,
    filiere_id INT NOT NULL,
    statut ENUM('en_attente', 'admis', 'non_admis', 'liste_attente') DEFAULT 'en_attente',
    moyenne_generale DECIMAL(5,2) NULL,
    rang INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (candidat_id) REFERENCES candidats(id) ON DELETE CASCADE,
    FOREIGN KEY (concours_id) REFERENCES concours(id) ON DELETE CASCADE,
    FOREIGN KEY (filiere_id) REFERENCES filieres(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participation (candidat_id, concours_id),
    INDEX idx_concours (concours_id),
    INDEX idx_statut (statut)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table notes améliorée
CREATE TABLE IF NOT EXISTS notes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    participation_id INT NOT NULL,
    matiere_id INT NOT NULL,
    note DECIMAL(5,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (participation_id) REFERENCES participations(id) ON DELETE CASCADE,
    FOREIGN KEY (matiere_id) REFERENCES matieres(id) ON DELETE CASCADE,
    UNIQUE KEY unique_note (participation_id, matiere_id),
    INDEX idx_participation (participation_id),
    CHECK (note >= 0 AND note <= 20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table user_roles (SÉCURITÉ)
CREATE TABLE IF NOT EXISTS user_roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    role ENUM('super_admin', 'admin_etablissement', 'admin', 'moderator', 'user') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_user_role (user_id, role),
    INDEX idx_user (user_id),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table admin_logs pour l'audit
CREATE TABLE IF NOT EXISTS admin_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    admin_id INT NOT NULL,
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES administrateurs(id) ON DELETE CASCADE,
    INDEX idx_admin (admin_id),
    INDEX idx_action (action),
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajout d'index manquants pour optimiser les performances
ALTER TABLE candidats ADD INDEX idx_concours (concours_id);
ALTER TABLE candidats ADD INDEX idx_filiere (filiere_id);
ALTER TABLE candidats ADD INDEX idx_created (created_at);

ALTER TABLE documents ADD INDEX idx_candidat (nupcan);
ALTER TABLE documents ADD INDEX idx_statut (statut);

ALTER TABLE paiements ADD INDEX idx_candidat (nupcan);
ALTER TABLE paiements ADD INDEX idx_statut (statut);
ALTER TABLE paiements ADD INDEX idx_concours (concours_id);

ALTER TABLE notifications ADD INDEX idx_user (user_id, user_type);
ALTER TABLE notifications ADD INDEX idx_lu (lu);

-- Remplir la table user_roles pour les admins existants
INSERT IGNORE INTO user_roles (user_id, role)
SELECT id, role FROM administrateurs
WHERE role IN ('super_admin', 'admin_etablissement');

-- Ajouter des participations pour les candidats existants qui n'en ont pas
INSERT INTO participations (candidat_id, concours_id, filiere_id, statut, created_at)
SELECT c.id, c.concours_id, c.filiere_id, 'en_attente', c.created_at
FROM candidats c
LEFT JOIN participations p ON c.id = p.candidat_id AND c.concours_id = p.concours_id
WHERE p.id IS NULL;

-- Message de confirmation
SELECT 'Tables mises à jour avec succès!' as message;
