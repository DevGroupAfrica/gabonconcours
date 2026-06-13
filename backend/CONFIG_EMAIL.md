# Configuration Email Gmail

## Étapes pour configurer l'envoi d'emails via Gmail

### 1. Activer la validation en 2 étapes
1. Allez sur https://myaccount.google.com/security
2. Activez la "Validation en 2 étapes"

### 2. Créer un mot de passe d'application
1. Allez sur https://myaccount.google.com/apppasswords
2. Sélectionnez "Application" : Autre (nom personnalisé)
3. Entrez : "GabConcours Backend"
4. Cliquez sur "Générer"
5. **Copiez le mot de passe de 16 caractères généré**

### 3. Mettre à jour le fichier .env
Remplacez dans `backend/.env` :

```env
SMTP_HOST=smtp.gmail.com
SMTP_USER=votre.email@gmail.com
SMTP_PASS="le_mot_de_passe_16_caracteres"
```

### 4. Redémarrer le serveur
```bash
cd backend
node server.js
```

## Variables utilisées
- `SMTP_HOST` : smtp.gmail.com
- `SMTP_USER` : Votre adresse Gmail complète
- `SMTP_PASS` : Le mot de passe d'application (16 caractères)
- `SMTP_PORT` : 587 (par défaut)

## Dépannage
- ❌ **Error 535**: Mot de passe incorrect → Créer un nouveau mot de passe d'application
- ❌ **Error 534**: Validation en 2 étapes non activée
- ✅ **Test réussi**: "Email envoyé avec succès"
