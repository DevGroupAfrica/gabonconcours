// mailer.js
const nodemailer = require('nodemailer');
require('./config/environment');

/**
 * Configuration du transporteur SMTP (ici Gmail)
 * Assure-toi d’avoir bien généré un mot de passe d’application :
 * 👉 https://myaccount.google.com/apppasswords
 */
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
    secure: false, // true pour port 465, false pour 587
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false // utile pour éviter les erreurs de certificat en dev
    }
});

/**
 * Vérifie la connexion SMTP au démarrage
 */
transporter.verify((error, success) => {
    if (error) {
        if (error.code === 'EAUTH' || error.responseCode === 535) {
            console.error(
                '❌ Authentification SMTP refusée. Vérifiez SMTP_USER et remplacez SMTP_PASS par un nouveau mot de passe d’application Google.'
            );
            return;
        }
        console.error('❌ Erreur connexion SMTP:', error.message);
    } else {
        console.log('✅ SMTP prêt à envoyer les emails.');
    }
});

/**
 * Fonction générique d’envoi d’email
 * @param {string} to - Destinataire
 * @param {string} subject - Objet du mail
 * @param {string} htmlContent - Contenu HTML
 * @param {Array} attachments - Pièces jointes (optionnelles)
 */
async function sendEmail(to, subject, htmlContent, attachments = []) {
    try {
        const mailOptions = {
            from: {
                name: 'GABConcours',
                address: process.env.EMAIL_FROM || process.env.EMAIL_USER
            },
            to,
            subject,
            html: htmlContent,
            attachments
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`📩 Email envoyé à ${to} | MessageID: ${info.messageId}`);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Erreur envoi email:', error.message);
        return { success: false, message: error.message };
    }
}

module.exports = { sendEmail };
