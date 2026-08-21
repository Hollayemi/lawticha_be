"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const productPurchaseLog_1 = __importDefault(require("../../models/billing/productPurchaseLog"));
const BookOrder_model_1 = require("../../models/BookOrder.model");
const logger_1 = __importDefault(require("../../utils/logger"));
const library_types_1 = require("../../models/types/library.types");
class PaymentLogging {
    constructor() {
        this.paystack = {
            secretKey: process.env.PAYSTACK_SECRET_KEY || '',
            publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
            baseURL: 'https://api.paystack.co'
        };
    }
    async logPurchasePending({ paymentChannel, userId, meta, amount, transaction_ref }) {
        try {
            await productPurchaseLog_1.default.create({
                userId,
                payment_status: 'PENDING_PAYMENT_CONFIRMATION',
                amount,
                meta,
                date: new Date(),
                paymentChannel,
                transaction_ref,
            });
            logger_1.default.info(`Payment log created: ${transaction_ref}`);
        }
        catch (error) {
            logger_1.default.error('Error logging purchase pending:', error);
            throw error;
        }
    }
    async initializationFailed({ meta }) {
        try {
            if (meta.orderIds && Array.isArray(meta.orderIds)) {
                await Promise.all(meta.orderIds.map(async (orderId) => {
                    await BookOrder_model_1.BookOrderModel.findByIdAndUpdate(orderId, {
                        $set: {
                            orderStatus: library_types_1.OrderStatus.CANCELLED,
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
                }));
                logger_1.default.info('Orders marked as failed due to initialization failure');
            }
        }
        catch (error) {
            logger_1.default.error('Error marking orders as failed:', error);
        }
    }
    async VerifyPaymentLogging({ metadata, response }) {
        try {
            logger_1.default.info('Verifying payment logging:', { metadata, response, responseData: response.data });
            const { type, orderId, userId } = metadata;
            // Find the purchase log by transaction reference
            const fromLog = await productPurchaseLog_1.default.findOne({
                transaction_ref: response.reference
            });
            if (!fromLog) {
                logger_1.default.error('No purchase log found for transaction reference:', response.reference);
                return false;
            }
            // Verify the amount matches (Paystack returns amount in kobo)
            const expectedAmount = fromLog.amount * 100;
            const receivedAmount = response.amount;
            if (expectedAmount !== receivedAmount) {
                logger_1.default.error('Amount mismatch:', {
                    expected: expectedAmount,
                    received: receivedAmount
                });
                return false;
            }
            // Check if payment was successful
            if (response.status !== 'success') {
                logger_1.default.error('Payment status not successful:', response.status);
                await this.handleFailedPayment(fromLog);
                return false;
            }
            // Update purchase log
            await productPurchaseLog_1.default.updateOne({ _id: fromLog._id }, {
                $set: {
                    payment_status: 'PAYMENT_CONFIRMED',
                    date: new Date()
                }
            });
            // Get order slugs for redirect
            const orderSlugs = [];
            // Update orders if this is a purchase
            if (type === 'purchase' && fromLog.meta?.orderIds) {
                const orderIds = fromLog.meta.orderIds;
                for (const orderId of orderIds) {
                    try {
                        const order = await BookOrder_model_1.BookOrderModel.findByIdAndUpdate(orderId, {
                            $set: {
                                status: library_types_1.OrderStatus.PROCESSING,
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
                        }, { new: true });
                        if (order) {
                            orderSlugs.push(order.orderSlug);
                            logger_1.default.info(`Order ${order.orderNumber} payment confirmed`);
                        }
                    }
                    catch (error) {
                        logger_1.default.error(`Error updating order ${orderId}:`, error);
                    }
                }
            }
            metadata.orderSlugs = orderSlugs;
            logger_1.default.info('Payment verification completed successfully');
            return true;
        }
        catch (error) {
            logger_1.default.error('Payment verification error:', error);
            return false;
        }
    }
    async handleFailedPayment(purchaseLog) {
        try {
            await productPurchaseLog_1.default.updateOne({ _id: purchaseLog._id }, {
                $set: {
                    payment_status: 'FAILED',
                    date: new Date()
                }
            });
            if (purchaseLog.meta?.orderIds) {
                await Promise.all(purchaseLog.meta.orderIds.map(async (orderId) => {
                    await BookOrder_model_1.BookOrderModel.findByIdAndUpdate(orderId, {
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
                }));
            }
            logger_1.default.info('Failed payment handled');
        }
        catch (error) {
            logger_1.default.error('Error handling failed payment:', error);
        }
    }
}
exports.default = PaymentLogging;
//# sourceMappingURL=paymentLogging.js.map