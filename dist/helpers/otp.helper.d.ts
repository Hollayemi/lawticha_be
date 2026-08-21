export declare function generateOtpCode(): string;
export declare function createOtp(phone: string): Promise<string>;
export declare function sendOtpSms(phone: string, code: string): Promise<void>;
export declare function verifyOtpCode(phone: string, code: string): Promise<void>;
//# sourceMappingURL=otp.helper.d.ts.map