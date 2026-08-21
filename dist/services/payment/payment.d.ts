import PaymentLogging from './paymentLogging';
interface PaymentData {
    email: string;
    amount: number;
    reference: string;
    currency?: string;
    coreId?: string;
    userId?: string;
    description?: string;
    phone?: string;
    userIp?: string;
    metadata?: Record<string, any>;
    coin?: number;
}
interface PaymentResponse {
    success: boolean;
    data?: any;
    error?: string;
    provider: string;
}
declare class PaymentGateway extends PaymentLogging {
    protected paystack: {
        secretKey: string;
        publicKey: string;
        baseURL: string;
    };
    protected flutterwave: {
        publicKey: string;
        secretKey: string;
        encryptionKey: string;
        baseURL: string;
    };
    constructor();
    private generateFlutterwaveSignature;
    initializePaystackPayment(paymentData: PaymentData): Promise<PaymentResponse>;
    initializeFlutterwavePayment(paymentData: PaymentData): Promise<PaymentResponse>;
    verifyPaystackPayment(reference: string): Promise<PaymentResponse>;
    verifyFlutterwavePayment(reference: string): Promise<PaymentResponse>;
    initializePayment(provider: string, paymentData: PaymentData): Promise<PaymentResponse>;
    verifyPayment(provider: string, reference: string): Promise<PaymentResponse>;
    generatePaymentReference(coreId: string): string;
    verifyPaystackWebhook(payload: any, signature: string): boolean;
    verifyFlutterwaveWebhook(payload: any, signature: string): boolean;
    getPaymentFees(provider: string, amount: number): number;
}
export default PaymentGateway;
//# sourceMappingURL=payment.d.ts.map