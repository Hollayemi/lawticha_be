import { Types } from 'mongoose';
import PurchaseLog from '../../models/billing/productPurchaseLog';
import {BookOrderModel} from '../../models/BookOrder.model';
import logger from '../../utils/logger';
import { OrderStatus } from '../../models/types/library.types';

interface LogPurchaseParams {
    paymentChannel: string;
    userId?: string;
    meta: any;
    amount: number;
    transaction_ref: string;
}

interface VerifyPaymentParams {
    metadata: any;
    response: any;
}

class PaymentLogging {
    protected paystack: {
        secretKey: string;
        publicKey: string;
        baseURL: string;
    };

  

    constructor() {
        this.paystack = {
            secretKey: process.env.PAYSTACK_SECRET_KEY || '',
            publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
            baseURL: 'https://api.paystack.co'
        };
    }

    async logPurchasePending({ paymentChannel, userId, meta, amount, transaction_ref }: LogPurchaseParams): Promise<void> {
        try {
            await PurchaseLog.create({
                userId,
                payment_status: 'PENDING_PAYMENT_CONFIRMATION',
                amount,
                meta,
                date: new Date(),
                paymentChannel,
                transaction_ref,
            });
            logger.info(`Payment log created: ${transaction_ref}`);
        } catch (error) {
            logger.error('Error logging purchase pending:', error);
            throw error;
        }
    }

    async initializationFailed({ meta }: { meta: any }): Promise<void> {
        try {
            if (meta.orderIds && Array.isArray(meta.orderIds)) {
                await Promise.all(
                    meta.orderIds.map(async (orderId: string) => {
                        await BookOrderModel.findByIdAndUpdate(orderId, {
                            $set: {
                                orderStatus: OrderStatus.CANCELLED,
                                paymentStatus: 'failed'
                            },
                            $push: {
                                statusHistory: {
                                    status: 'cancelled',
                                    timestamp: new Date(),
                                    note: 'Payment initialization failed'
                                }
                            }
                        });
                    })
                );
                logger.info('Orders marked as failed due to initialization failure');
            }
        } catch (error) {
            logger.error('Error marking orders as failed:', error);
        }
    }

    async VerifyPaymentLogging({ metadata, response }: VerifyPaymentParams): Promise<boolean> {
        try {
            logger.info('Verifying payment logging:', { metadata,response, responseData: response.data });

            const { type, orderId, userId } = metadata;

            // Find the purchase log by transaction reference
            const fromLog = await PurchaseLog.findOne({
                transaction_ref: response.reference
            });

            if (!fromLog) {
                logger.error('No purchase log found for transaction reference:', response.reference);
                return false;
            }

            // Verify the amount matches (Paystack returns amount in kobo)
            const expectedAmount = fromLog.amount * 100;
            const receivedAmount = response.amount;

            if (expectedAmount !== receivedAmount) {
                logger.error('Amount mismatch:', {
                    expected: expectedAmount,
                    received: receivedAmount
                });
                return false;
            }

            // Check if payment was successful
            if (response.status !== 'success') {
                logger.error('Payment status not successful:', response.status);
                await this.handleFailedPayment(fromLog);
                return false;
            }

            // Update purchase log
            await PurchaseLog.updateOne(
                { _id: fromLog._id },
                {
                    $set: {
                        payment_status: 'PAYMENT_CONFIRMED',
                        date: new Date()
                    }
                }
            );

            // Get order slugs for redirect
            const orderSlugs: string[] = [];

            // Update orders if this is a purchase
            if (type === 'purchase' && fromLog.meta?.orderIds) {
                const orderIds = fromLog.meta.orderIds;

                for (const orderId of orderIds) {
                    try {
                        const order = await BookOrderModel.findByIdAndUpdate(
                            orderId,
                            {
                                $set: {
                                    status: OrderStatus.PROCESSING,
                                    'paymentStatus': 'paid',
                                    'paidAt': new Date(),
                                    'transactionId': response.id,
                                    'paymentRef': response.reference
                                },
                                $push: {
                                    statusHistory: {
                                        status: 'confirmed',
                                        timestamp: new Date(),
                                        note: 'Payment confirmed'
                                    }
                                }
                            },
                            { new: true }
                        );

                        if (order) {
                            orderSlugs.push(order.orderSlug);
                            logger.info(`Order ${order.orderNumber} payment confirmed`);
                        }
                    } catch (error) {
                        logger.error(`Error updating order ${orderId}:`, error);
                    }
                }
            }

            metadata.orderSlugs = orderSlugs;

            logger.info('Payment verification completed successfully');
            return true;

        } catch (error) {
            logger.error('Payment verification error:', error);
            return false;
        }
    }

    private async handleFailedPayment(purchaseLog: any): Promise<void> {
        try {
            await PurchaseLog.updateOne(
                { _id: purchaseLog._id },
                {
                    $set: {
                        payment_status: 'FAILED',
                        date: new Date()
                    }
                }
            );

            if (purchaseLog.meta?.orderIds) {
                await Promise.all(
                    purchaseLog.meta.orderIds.map(async (orderId: string) => {
                        await BookOrderModel.findByIdAndUpdate(orderId, {
                            $set: {
                                status: 'cancelled',
                                paymentStatus: 'failed'
                            },
                            $push: {
                                statusHistory: {
                                    status: 'cancelled',
                                    timestamp: new Date(),
                                    note: 'Payment failed'
                                }
                            }
                        });
                    })
                );
            }

            logger.info('Failed payment handled');
        } catch (error) {
            logger.error('Error handling failed payment:', error);
        }
    }
}

export default PaymentLogging;