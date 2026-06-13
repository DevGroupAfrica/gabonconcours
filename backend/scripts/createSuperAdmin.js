const {createConnection} = require('../config/database');
const Admin = require('../models/Admin');

async function createSuperAdmin() {
    try {
        console.log('🔄 Initialisation de la connexion à la base de données...');
        await createConnection();
        console.log('✅ Base de données connectée');

        const superAdminEmail = 'supadmin@gabconcours.ga';

        // Vérifier si un super admin existe déjà
        const existingAdmin = await Admin.findByEmail(superAdminEmail);
        if (existingAdmin) {
            console.log('ℹ️  Le super admin existe déjà');
            console.log('📧 Email:', superAdminEmail);
            console.log('🔐 Mot de passe: admin123');
            return;
        }

        // Créer le super admin par défaut
        const adminData = {
            nom: 'Super',
            prenom: 'Admin',
            email: superAdminEmail,
            role: 'super_admin',
            statut: 'actif'
        };

        const newAdmin = await Admin.create(adminData);
        console.log('✅ Super admin créé avec succès:');
        console.log('📧 Email:', superAdminEmail);
        console.log('🔐 Mot de passe: admin123');
        console.log('👤 Nom complet: Super Admin');
        console.log('⚡ Statut: Actif');

        console.log('\n🎯 Vous pouvez maintenant vous connecter avec ces identifiants sur l\'interface d\'administration.');

    } catch (error) {
        console.error('❌ Erreur lors de la création du super admin:', error.message);
    } finally {
        process.exit(0);
    }
}

// Exécuter le script
createSuperAdmin();
