const {createConnection} = require('../config/database');
const Admin = require('../models/Admin');

async function createDefaultAdmin() {
    try {
        console.log('🔄 Création du compte Super Admin par défaut...');
        await createConnection();
        console.log('✅ Base de données connectée');

        const superAdminEmail = 'mbdaniel337@gmail.com';

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
            role: 'admin_etablissement',
            statut: 'actif'
        };

        const newAdmin = await Admin.create(adminData);
        console.log('✅ Super admin créé avec succès!');
        console.log('');
        console.log('🎯 IDENTIFIANTS DE CONNEXION :');
        console.log('📧 Email: mbdaniel337@gmail.com');
        console.log('🔐 Mot de passe: admin123');
        console.log('');
        console.log('👉 Vous pouvez maintenant vous connecter sur l\'interface d\'administration.');

    } catch (error) {
        console.error('❌ Erreur lors de la création du super admin:', error.message);
    } finally {
        process.exit(0);
    }
}

// Exécuter le script
createDefaultAdmin();
