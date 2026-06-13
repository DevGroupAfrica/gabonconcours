-- Table pour la messagerie interne
CREATE TABLE IF NOT EXISTS `messages` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `candidat_nupcan` VARCHAR(50) NOT NULL,
  `admin_id` INT NULL,
  `sujet` VARCHAR(255) NOT NULL,
  `message` TEXT NOT NULL,
  `expediteur` ENUM('candidat', 'admin') NOT NULL,
  `statut` ENUM('non_lu', 'lu') DEFAULT 'non_lu',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`candidat_nupcan`) REFERENCES `candidats`(`nupcan`) ON DELETE CASCADE,
  FOREIGN KEY (`admin_id`) REFERENCES `administrateurs`(`id`) ON DELETE SET NULL,
  INDEX idx_candidat_messages (`candidat_nupcan`),
  INDEX idx_admin_messages (`admin_id`),
  INDEX idx_statut (`statut`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
