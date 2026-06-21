const dotenv = require('dotenv');

dotenv.config();

// Les intégrations de paiement lisent également leurs secrets depuis backend/.env.
const smtpHost = (process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com').toLowerCase();

// Google displays app passwords in groups of four, but SMTP expects them without spaces.
if (smtpHost.includes('gmail.com')) {
    ['SMTP_PASS', 'EMAIL_PASSWORD'].forEach((key) => {
        if (process.env[key]) {
            process.env[key] = process.env[key].replace(/\s+/g, '');
        }
    });
}
