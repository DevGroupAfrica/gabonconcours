const nodemailer = require('nodemailer');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    connectionTimeout: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 5000),
    greetingTimeout: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 5000),
    socketTimeout: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 10000),
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Fonction pour envoyer un reçu de paiement
async function sendPaymentReceipt(data) {
    const { to, candidat, montant, reference, concours, date } = data;

    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER,
        to,
        subject: `Reçu de paiement - ${concours}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #2563EB; color: white; padding: 20px; text-align: center; }
                    .content { background: #f9fafb; padding: 30px; margin: 20px 0; }
                    .receipt-info { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
                    .row { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; border-bottom: 1px solid #e5e7eb; }
                    .label { font-weight: bold; color: #6b7280; }
                    .value { color: #111827; }
                    .total { font-size: 1.5em; font-weight: bold; color: #2563EB; text-align: center; margin: 20px 0; }
                    .footer { text-align: center; color: #6b7280; font-size: 0.9em; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Reçu de Paiement</h1>
                        <p>GabConcours - Plateforme de Gestion des Concours</p>
                    </div>
                    
                    <div class="content">
                        <h2>Bonjour ${candidat.prenom} ${candidat.nom},</h2>
                        <p>Votre paiement a été reçu avec succès. Voici les détails de votre transaction :</p>
                        
                        <div class="receipt-info">
                            <div class="row">
                                <span class="label">Référence de paiement</span>
                                <span class="value">${reference}</span>
                            </div>
                            <div class="row">
                                <span class="label">Date</span>
                                <span class="value">${new Date(date).toLocaleDateString('fr-FR', { 
                                    year: 'numeric', 
                                    month: 'long', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</span>
                            </div>
                            <div class="row">
                                <span class="label">Candidat</span>
                                <span class="value">${candidat.prenom} ${candidat.nom}</span>
                            </div>
                            <div class="row">
                                <span class="label">NUPCAN</span>
                                <span class="value">${candidat.nupcan}</span>
                            </div>
                            <div class="row">
                                <span class="label">Email</span>
                                <span class="value">${candidat.email}</span>
                            </div>
                            <div class="row">
                                <span class="label">Concours</span>
                                <span class="value">${concours}</span>
                            </div>
                            
                            <div class="total">
                                Montant payé: ${montant.toLocaleString('fr-FR')} FCFA
                            </div>
                        </div>
                        
                        <p><strong>Important:</strong> Conservez ce reçu comme preuve de paiement. Vous pouvez également le télécharger depuis votre espace candidat.</p>
                        
                        <p>Pour toute question concernant votre paiement, n'hésitez pas à nous contacter.</p>
                    </div>
                    
                    <div class="footer">
                        <p>© ${new Date().getFullYear()} GabConcours - Tous droits réservés</p>
                        <p>Cet email a été généré automatiquement, merci de ne pas y répondre.</p>
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('📧 Reçu de paiement envoyé à:', to);
        return { success: true };
    } catch (error) {
        console.error('❌ Erreur envoi reçu de paiement:', error);
        throw error;
    }
}

module.exports = {
    sendPaymentReceipt
};
