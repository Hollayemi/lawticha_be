"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransporter = getTransporter;
exports.createZeptoMailTransporter = createZeptoMailTransporter;
const zeptomail_1 = require("zeptomail");
const ZOHO_ACCOUNT_TOKEN = process.env.ZOHO_ACCOUNT_TOKEN;
const FROM_ADDRESS = process.env.SMTP_EMAIL;
const FROM_NAME = process.env.SMTP_FROM_NAME || 'LawTicha';
let client = null;
function getTransporter() {
    if (!client) {
        if (!ZOHO_ACCOUNT_TOKEN) {
            throw new Error('ZOHO_ACCOUNT_TOKEN is required for ZeptoMail');
        }
        if (!FROM_ADDRESS) {
            throw new Error('SMTP_EMAIL is required for ZeptoMail');
        }
        client = new zeptomail_1.SendMailClient({
            url: "https://api.zeptomail.com/v1.1/email",
            token: ZOHO_ACCOUNT_TOKEN
        });
    }
    return client;
}
// Optional: Create a wrapper that matches your existing sendMail interface
function createZeptoMailTransporter() {
    const client = getTransporter();
    return {
        sendMail: async (options) => {
            // Parse the "Name" <email@domain.com> format
            const fromMatch = options.from.match(/"(.*?)"\s*<(.*?)>/);
            const fromName = fromMatch ? fromMatch[1] : FROM_NAME;
            const fromEmail = fromMatch ? fromMatch[2] : FROM_ADDRESS;
            return client.sendMail({
                from: {
                    address: 'info@lawticha.com',
                    name: fromName
                },
                to: [
                    {
                        email_address: {
                            address: options.to,
                            name: options.to.split('@')[0] // Optional: use part before @ as name
                        }
                    }
                ],
                subject: options.subject,
                htmlbody: options.html,
                textbody: options.text
            });
        }
    };
}
//# sourceMappingURL=transporter.js.map