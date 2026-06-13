const bcrypt = require('bcrypt');
const { createConnection, getConnection } = require('../config/database');

async function createAdminBBS() {
    try {
        console.log('🔧 Création d\'un administrateur pour BBS...\n');

        // Initialiser la connexion à la base de données
        console.log('🔌 Connexion à la base de données...');
        await createConnection();

        const connection = getConnection();

        // Vérifier si l'établissement BBS existe
        const [etablissements] = await connection.execute(
            'SELECT id, nomets FROM etablissements WHERE id = 1'
        );

        if (etablissements.length === 0) {
            console.error('❌ Erreur: L\'établissement avec ID 1 n\'existe pas');
            process.exit(1);
        }

        console.log('✅ Établissement trouvé:', etablissements[0].nomets);

        // Vérifier si un admin existe déjà pour cet établissement
        const [existingAdmins] = await connection.execute(
            'SELECT id, email FROM administrateurs WHERE etablissement_id = 1'
        );

        if (existingAdmins.length > 0) {
            console.log('\n⚠️  Un administrateur existe déjà pour BBS:');
            existingAdmins.forEach(admin => {
                console.log(`   - ${admin.email} (ID: ${admin.id})`);
            });
            console.log('\n❓ Voulez-vous créer un nouvel administrateur? (Ctrl+C pour annuler)');
        }

        // Données de l'admin
        const adminData = {
            nom: 'Admin',
            prenom: 'BBS',
            email: 'admin@bb.ga',
            password: 'admin123',
            role: 'admin_etablissement',
            etablissement_id: 1
        };

        // Vérifier si l'email existe déjà
        const [emailCheck] = await connection.execute(
            'SELECT id, email FROM administrateurs WHERE email = ?',
            [adminData.email]
        );

        if (emailCheck.length > 0) {
            console.log('\n⚠️  Un administrateur avec cet email existe déjà');
            console.log('   Email:', emailCheck[0].email);
            console.log('   ID:', emailCheck[0].id);
            console.log('\n💡 Utilisez cet email pour vous connecter ou modifiez l\'email dans le script');
            process.exit(0);
        }

        // Hasher le mot de passe
        console.log('\n🔐 Hashage du mot de passe...');
        const hashedPassword = await bcrypt.hash(adminData.password, 12);

        // Créer l'administrateur
        console.log('📝 Création de l\'administrateur...');
        const [result] = await connection.execute(
            `INSERT INTO administrateurs (
                nom, prenom, email, password, role, etablissement_id, statut, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, 'actif', NOW(), NOW())`,
            [
                adminData.nom,
                adminData.prenom,
                adminData.email,
                hashedPassword,
                adminData.role,
                adminData.etablissement_id
            ]
        );

        // Récupérer l'admin créé
        const [newAdmin] = await connection.execute(
            `SELECT a.*, e.nomets as etablissement_nom
             FROM administrateurs a
             LEFT JOIN etablissements e ON a.etablissement_id = e.id
             WHERE a.id = ?`,
            [result.insertId]
        );

        console.log('\n✅ Administrateur créé avec succès!\n');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📋 INFORMATIONS DE CONNEXION');
        console.log('═══════════════════════════════════════════════════════');
        console.log('ID:              ', newAdmin[0].id);
        console.log('Nom:             ', newAdmin[0].prenom, newAdmin[0].nom);
        console.log('Email:           ', newAdmin[0].email);
        console.log('Mot de passe:    ', adminData.password);
        console.log('Rôle:            ', newAdmin[0].role);
        console.log('Établissement:   ', newAdmin[0].etablissement_nom);
        console.log('Statut:          ', newAdmin[0].statut);
        console.log('═══════════════════════════════════════════════════════');
        console.log('\n🌐 URL de connexion: http://localhost:8001/admin');
        console.log('\n⚠️  IMPORTANT: Changez le mot de passe après la première connexion!\n');

        process.exit(0);

    } catch (error) {
        console.error('\n❌ Erreur lors de la création de l\'administrateur:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// Exécuter le script
createAdminBBS();
