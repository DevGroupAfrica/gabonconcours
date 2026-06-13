# Configuration du Backend - GabConcours

## Configuration de l'envoi d'emails

### Étape 1: Créer le fichier .env

Copiez le fichier `.env.example` vers `.env` :

```bash
cp .env .env
```

### Étape 2: Configuration SMTP avec Gmail

#### Option A: Utiliser Gmail (Recommandé pour le développement)

1. **Activer l'authentification à deux facteurs**:
   - Allez sur https://myaccount.google.com/security
   - Activez l'authentification à deux facteurs

2. **Générer un mot de passe d'application**:
   - Allez sur https://myaccount.google.com/apppasswords
   - Sélectionnez "Autre (nom personnalisé)" et entrez "GabConcours"
   - Copiez le mot de passe généré (16 caractères)

3. **Configurer le .env**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=votre-email@gmail.com
   SMTP_PASS=mot-de-passe-application-16-caracteres
   ```

#### Option B: Utiliser un autre fournisseur SMTP

Pour d'autres fournisseurs (SendGrid, Mailgun, etc.), configurez selon leurs spécifications:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=votre-mot-de-passe
```

### Étape 3: Configuration de la base de données

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=votre_mot_de_passe
DB_NAME=gabconcoursv5
DB_PORT=3306
```

### Étape 4: Autres configurations

```env
# Email de l'administrateur pour recevoir les notifications
ADMIN_EMAIL=admin@gabconcours.ga

# URL de l'application frontend
APP_URL=http://localhost:8001
FRONTEND_URL=http://localhost:8001

# Clé secrète JWT (générez une clé unique et sécurisée)
JWT_SECRET=votre-secret-jwt-super-securise-changez-moi
```

## Installation et démarrage

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer la base de données

Exécutez les scripts SQL fournis pour créer la structure de la base de données.

### 3. Démarrer le serveur
-
```bash
npm start
```

Le serveur démarre sur http://localhost:8002

## Résolution des problèmes courants

### Erreur "getaddrinfo ENOTFOUND smtp.gmail.com"

- Vérifiez votre connexion Internet
- Assurez-vous que les variables SMTP_HOST et SMTP_PORT sont correctement configurées
- Vérifiez que votre firewall n'bloque pas la connexion SMTP

### Erreur "Invalid login"

- Assurez-vous d'utiliser un mot de passe d'application, pas votre mot de passe Gmail
- Vérifiez que l'authentification à deux facteurs est activée

### Les emails ne sont pas envoyés

- Vérifiez les logs du serveur pour plus de détails
- Testez votre configuration SMTP avec un outil comme Nodemailer Test

## Test de la configuration email

Vous pouvez tester votre configuration email en utilisant ce code Node.js:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'votre-email@gmail.com',
        pass: 'votre-mot-de-passe-application'
    }
});

transporter.sendMail({
    from: 'votre-email@gmail.com',
    to: 'email-de-test@example.com',
    subject: 'Test Configuration SMTP',
    text: 'Si vous recevez ce message, votre configuration SMTP fonctionne!'
}, (error, info) => {
    if (error) {
        console.error('Erreur:', error);
    } else {
        console.log('Email envoyé:', info.response);
    }
});
```

## Support

Pour toute question ou problème, consultez la documentation ou contactez l'équipe technique.
