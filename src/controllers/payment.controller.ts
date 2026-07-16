import { Request, Response } from 'express';
import logger from '../utils/logger';
import PaymentGateway from '../services/payment/payment';


class PurchaseController {
    static async paystackCallBackVerify(req: Request, res: Response): Promise<void> {
        const { reference, provider = 'paystack', platform = 'browser' } = req.query;

        logger.info('Payment callback received:', { reference, provider, platform });

        const redirectTo = process.env.FRONTEND_URL || 'http://localhost:3000';
        try {
            if (!reference) {
                logger.error('Payment callback: No reference provided');
                return res.redirect(`${redirectTo}/dashboard/library?payment=error&message=No payment reference provided`);
            }

            const paymentGateway = new PaymentGateway();
            const verificationResult = await paymentGateway.verifyPayment(
                provider as string,
                reference as string
            );

            logger.info('Payment verification result:', verificationResult);

            if (verificationResult.success) {
                const orderSlug = verificationResult.data?.orderSlug || [];
                const redirect = verificationResult.data?.redirect || '';
                const slugsParam = orderSlug > 0 ? `&slugs=${orderSlug}` : '';
                return res.redirect(
                    `${redirectTo}/dashboard/${redirect}?payment=success&message=Payment verified successfully${slugsParam}&coreId=${verificationResult.data?.coreId || ''}`
                );
            } else {
                logger.error('Payment verification failed:', verificationResult.error);
                return res.redirect(
                    `${redirectTo}/dashboard/library?payment=error&message=${encodeURIComponent(verificationResult.error || 'Payment verification failed')}`
                );
            }
        } catch (error: any) {
            logger.error('Payment callback error:', error);
            return res.redirect(
                `${redirectTo}/dashboard/library?payment=error&message=${encodeURIComponent(error.message || 'Server Error')}`
            );
        }
    }


    static async handleWebhook(req: Request, res: Response): Promise<Response> {
        const { provider } = req.params;
        const signature = req.headers['x-paystack-signature'] as string;

        try {
            const paymentGateway = new PaymentGateway();
            // Verify webhook signature
            let isValid = false;
            switch (provider.toLowerCase()) {
                case 'paystack':
                    isValid = paymentGateway.verifyPaystackWebhook(req.body, signature);
                    break;
                case 'flutterwave':
                    const timestamp = req.headers['x-timestamp'] as string;
                    isValid = paymentGateway.verifyFlutterwaveWebhook(req.body, signature);
                    break;
                default:
                    return res.status(400).json({ error: 'Unsupported provider' });
            }

            if (!isValid) {
                logger.warn(`Invalid webhook signature for ${provider}`);
                return res.status(401).json({ error: 'Invalid signature' });
            }
            // Process the webhook event
            const event = req.body;
            if (event.event === 'charge.success') {
                const reference = event.data.reference;
                await paymentGateway.verifyPayment(provider, reference);
            }
            return res.status(200).json({ status: 'success' });
        } catch (error: any) {
            logger.error('Webhook processing error:', error);
            return res.status(500).json({ error: 'Webhook processing failed' });
        }
    }

   
  


    static async verifyPayment(req: Request, res: Response): Promise<Response> {
        try {
            const { reference, provider = 'paystack' } = req.body;

            if (!reference) {
                return res.status(400).json({ error: 'Reference is required' });
            }

            const paymentGateway = new PaymentGateway();
            const verificationResult = await paymentGateway.verifyPayment(
                provider as string,
                reference as string
            );

            if (verificationResult.success) {
                return res.status(200).json({
                    success: true,
                    message: 'Payment verified successfully',
                    data: verificationResult.data
                });
            } else {
                return res.status(400).json({
                    success: false,
                    error: verificationResult.error
                });
            }
        } catch (error: any) {
            logger.error('Payment verification error:', error);
            return res.status(500).json({
                error: 'Payment verification failed',
                message: error.message
            });
        }
    }
}

export default PurchaseController;
