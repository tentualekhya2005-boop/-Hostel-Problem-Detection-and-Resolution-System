const nodemailer = require('nodemailer');

let transporter;

async function setupTransporter() {
    if (transporter) return;
    
    // Resend configuration
    transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        connectionTimeout: 5000,
        socketTimeout: 5000,
        auth: {
            user: 'resend',
            pass: process.env.RESEND_API_KEY,
        },
    });
    console.log(`✉️ Real Email Setup using Resend SMTP`);
}

async function sendEmailNotification({ to, subject, text, html }) {
    try {
        await setupTransporter();
        
        // Since Resend's free tier only allows sending to your own verified email address,
        // we will deliver all system emails to your EMAIL_USER but add the intended recipient in the subject.
        const actualRecipient = process.env.EMAIL_USER;

        const info = await transporter.sendMail({
            from: '"Hostel Portal" <onboarding@resend.dev>',
            to: actualRecipient,
            subject: `[For: ${to}] ${subject}`,
            text: `Intended Recipient: ${to}\n\n${text}`,
            html: html || `<p><b>Intended Recipient:</b> ${to}</p><br/>${text.replace(/\n/g, '<br/>')}`,
        });

        console.log("==================================================");
        console.log(`📧 Email successfully sent to your real inbox (${actualRecipient})!`);
        console.log("==================================================");
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
    }
}

module.exports = {
    sendEmailNotification
};
