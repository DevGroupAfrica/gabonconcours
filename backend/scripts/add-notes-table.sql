-- Script pour ajouter la table des notes
USE `gabconcoursv5`;

-- Table des notes
CREATE TABLE IF NOT EXISTS `notes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidat_id` INT NOT NULL,
  `concours_id` INT NOT NULL,
  `matiere_id` INT NOT NULL,
  `note` DECIMAL(5,2) NOT NULL CHECK (note >= 0 AND note <= 20),
  `coefficient` DECIMAL(3,1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidat_id`) REFERENCES `candidats`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`concours_id`) REFERENCES `concours`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`matiere_id`) REFERENCES `matieres`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_note` (`candidat_id`, `concours_id`, `matiere_id`),
  INDEX `idx_candidat` (`candidat_id`),
  INDEX `idx_concours` (`concours_id`),
  INDEX `idx_matiere` (`matiere_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Ajouter des matières de test si aucune n'existe
INSERT IGNORE INTO `matieres` (`nom_matiere`, `coefficient`, `duree`, `description`) VALUES
('Mathématiques', 3, 3, 'Épreuve de mathématiques'),
('Français', 2, 2, 'Épreuve de français'),
('Anglais', 2, 2, 'Épreuve d\'anglais'),
('Sciences', 2, 2, 'Épreuve de sciences'),
('Culture Générale', 1, 1, 'Épreuve de culture générale');
