import { SendMailClient } from "zeptomail";

const ZOHO_ACCOUNT_TOKEN = process.env.ZOHO_ACCOUNT_TOKEN;
const FROM_ADDRESS = process.env.SMTP_EMAIL;
const FROM_NAME = process.env.SMTP_FROM_NAME || 'LawTicha';

let client: SendMailClient | null = null;

export function getTransporter() {
    if (!client) {
        if (!ZOHO_ACCOUNT_TOKEN) {
            throw new Error('ZOHO_ACCOUNT_TOKEN is required for ZeptoMail');
        }
        if (!FROM_ADDRESS) {
            throw new Error('SMTP_EMAIL is required for ZeptoMail');
        }
        
        client = new SendMailClient({
            url: "https://api.zeptomail.com/v1.1/email",
            token: ZOHO_ACCOUNT_TOKEN
        });
    }
    return client;
}

// Optional: Create a wrapper that matches your existing sendMail interface
export function createZeptoMailTransporter() {
    const client = getTransporter();
    
    return {
        sendMail: async (options: {
            from: string;
            to: string;
            subject: string;
            html: string;
            text?: string;
        }) => {
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