import { SendMailClient } from "zeptomail";
export declare function getTransporter(): SendMailClient;
export declare function createZeptoMailTransporter(): {
    sendMail: (options: {
        from: string;
        to: string;
        subject: string;
        html: string;
        text?: string;
    }) => Promise<unknown>;
};
//# sourceMappingURL=transporter.d.ts.map