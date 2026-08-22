"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("../utils/logger"));
const payment_1 = __importDefault(require("../services/payment/payment"));
class PurchaseController {
    static async paystackCallBackVerify(req, res) {
        const { reference, provider = 'paystack', platform = 'browser' } = req.query;
        logger_1.default.info('Payment callback received:', { reference, provider, platform });
        const redirectTo = process.env.CLIENT_URL || 'https://lawticha.com';
        try {
            if (!reference) {
                logger_1.default.error('Payment callback: No reference provided');
                return res.redirect(`${redirectTo}/dashboard/library?payment=error&message=No payment reference provided`);
            }
            const paymentGateway = new payment_1.default();
            const verificationResult = await paymentGateway.verifyPayment(provider, reference);
            logger_1.default.info('Payment verification result:', verificationResult);
            if (verificationResult.success) {
                const orderSlug = verificationResult.data?.orderSlug || [];
                const redirect = verificationResult.data?.redirect || '';
                const slugsParam = orderSlug > 0 ? `&slugs=${orderSlug}` : '';
                return res.redirect(`${redirectTo}/dashboard/${redirect}?payment=success&message=Payment verified successfully${slugsParam}&coreId=${verificationResult.data?.coreId || ''}`);
            }
            else {
                logger_1.default.error('Payment verification failed:', verificationResult.error);
                return res.redirect(`${redirectTo}/dashboard/library?payment=error&message=${encodeURIComponent(verificationResult.error || 'Payment verification failed')}`);
            }
        }
        catch (error) {
            logger_1.default.error('Payment callback error:', error);
            return res.redirect(`${redirectTo}/dashboard/library?payment=error&message=${encodeURIComponent(error.message || 'Server Error')}`);
        }
    }
    static async handleWebhook(req, res) {
        const { provider } = req.params;
        const signature = req.headers['x-paystack-signature'];
        try {
            const paymentGateway = new payment_1.default();
            // Verify webhook signature
            let isValid = false;
            switch (provider.toLowerCase()) {
                case 'paystack':
                    isValid = paymentGateway.verifyPaystackWebhook(req.body, signature);
                    break;
                case 'flutterwave':
                    const timestamp = req.headers['x-timestamp'];
                    isValid = paymentGateway.verifyFlutterwaveWebhook(req.body, signature);
                    break;
                default:
                    return res.status(400).json({ error: 'Unsupported provider' });
            }
            if (!isValid) {
                logger_1.default.warn(`Invalid webhook signature for ${provider}`);
                return res.status(401).json({ error: 'Invalid signature' });
            }
            // Process the webhook event
            const event = req.body;
            if (event.event === 'charge.success') {
                const reference = event.data.reference;
                await paymentGateway.verifyPayment(provider, reference);
            }
            return res.status(200).json({ status: 'success' });
        }
        catch (error) {
            logger_1.default.error('Webhook processing error:', error);
            return res.status(500).json({ error: 'Webhook processing failed' });
        }
    }
    static async verifyPayment(req, res) {
        try {
            const { reference, provider = 'paystack' } = req.body;
            if (!reference) {
                return res.status(400).json({ error: 'Reference is required' });
            }
            const paymentGateway = new payment_1.default();
            const verificationResult = await paymentGateway.verifyPayment(provider, reference);
            if (verificationResult.success) {
                return res.status(200).json({
                    success: true,
                    message: 'Payment verified successfully',
                    data: verificationResult.data
                });
            }
            else {
                return res.status(400).json({
                    success: false,
                    error: verificationResult.error
                });
            }
        }
        catch (error) {
            logger_1.default.error('Payment verification error:', error);
            return res.status(500).json({
                error: 'Payment verification failed',
                message: error.message
            });
        }
    }
}
exports.default = PurchaseController;
//# sourceMappingURL=payment.controller.js.map