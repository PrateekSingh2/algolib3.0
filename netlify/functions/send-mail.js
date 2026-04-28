const nodemailer = require('nodemailer');
const { admin } = require('./utils/firebase-admin');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    try {
        // 1. Verify Admin Clearance
        const authHeader = event.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
        }
        const token = authHeader.split('Bearer ')[1];
        await admin.auth().verifyIdToken(token);

        // 2. Parse Payload
        // Note: 'attachments' should be an array of objects: { filename, content, contentType }
        const { to, cc, bcc, subject, message, attachments } = JSON.parse(event.body);
        if (!to || !subject || !message) {
            return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields (To, Subject, Message).' }) };
        }

        // 3. Configure Transporter to lock sender to teamalgolib@gmail.com
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        // 4. Map attachments for Nodemailer
        let mailAttachments = [];
        if (attachments && attachments.length > 0) {
            mailAttachments = attachments.map(att => ({
                filename: att.filename,
                content: att.content, // Base64 string
                encoding: 'base64',
                contentType: att.contentType
            }));
        }

        // 5. Dispatch Email
        await transporter.sendMail({
            from: `"AlgoLib Team" <${process.env.GMAIL_USER}>`, // Locks the sender name and ID
            to: to,
            cc: cc || undefined,
            bcc: bcc || undefined,
            subject: subject,
            text: message, 
            attachments: mailAttachments
        });

        return { statusCode: 200, body: JSON.stringify({ success: true, message: "Transmission delivered." }) };
    } catch (error) {
        console.error("Mail Error:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};