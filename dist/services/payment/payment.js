"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const crypto_1 = __importDefault(require("crypto"));
const paymentLogging_1 = __importDefault(require("./paymentLogging"));
const BookOrder_model_1 = require("../../models/BookOrder.model");
const models_1 = require("../../models");
const subscription_service_1 = require("../subscription.service");
const error_1 = require("../../middleware/error");
class PaymentGateway extends paymentLogging_1.default {
    constructor() {
        super();
        this.paystack = {
            secretKey: process.env.PAYSTACK_SECRET_KEY || '',
            publicKey: process.env.PAYSTACK_PUBLIC_KEY || '',
            baseURL: 'https://api.paystack.co'
        };
        this.flutterwave = {
            publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || '',
            secretKey: process.env.FLUTTERWAVE_SECRET_KEY || '',
            encryptionKey: process.env.FLUTTERWAVE_ENCRYPTION_KEY || '',
            baseURL: process.env.FLUTTERWAVE_BASE_URL || 'https://api.flutterwave.com/v3'
        };
    }
    generateFlutterwaveSignature(data) {
        const jsonString = JSON.stringify(data);
        return crypto_1.default
            .createHmac('sha256', this.flutterwave.secretKey)
            .update(jsonString)
            .digest('hex');
    }
    async initializePaystackPayment(paymentData) {
        try {
            const response = await axios_1.default.post(`${this.paystack.baseURL}/transaction/initialize`, {
                email: paymentData.email,
                amount: paymentData.amount * 100, // Convert to kobo
                reference: paymentData.reference,
                currency: paymentData.currency || 'NGN',
                callback_url: `${process.env.API_URL}/payment/callback?provider=paystack&platform=browser`,
                return_url: `${process.env.API_URL}/payment/callback?provider=paystack&platform=browser`,
                metadata: {
                    type: 'purchase',
                    coreId: paymentData.coreId,
                    userId: paymentData.userId,
                    ...paymentData.metadata
                }
            }, {
                headers: {
                    Authorization: `Bearer ${this.paystack.secretKey}`,
                    'Content-Type': 'application/json'
                }
            });
            await this.logPurchasePending({
                paymentChannel: 'PAYSTACK',
                transaction_ref: response.data.data.reference,
                meta: paymentData,
                amount: paymentData.amount,
                userId: paymentData.userId
            });
            return {
                success: true,
                data: response.data.data,
                provider: 'paystack'
            };
        }
        catch (error) {
            console.error('', error.response?.data || error.message);
            throw new error_1.AppError('Paystack initialization error:', 404, 'NOT_FOUND');
            // this.initializationFailed({ meta: paymentData });
            // return {
            //     success: false,
            //     error: error.response?.data?.message || 'Payment initialization failed',
            //     provider: 'paystack'
            // };
        }
    }
    async initializeFlutterwavePayment(paymentData) {
        try {
            const requestData = {
                tx_ref: paymentData.reference,
                amount: paymentData.amount,
                currency: paymentData.currency || 'NGN',
                redirect_url: `${process.env.API_URL}/payment/callback?provider=flutterwave&platform=browser`,
                payment_options: 'card,ussd, banktransfer, mobilemoney',
                customer: {
                    email: paymentData.email,
                    phonenumber: paymentData.phone || '08012345678',
                    name: paymentData.metadata?.customerName || 'Customer'
                },
                customizations: {
                    title: 'Order Payment',
                    description: paymentData.description || 'Payment for order',
                    logo: process.env.COMPANY_LOGO_URL || ''
                },
                meta: {
                    coreId: paymentData.coreId,
                    userId: paymentData.userId,
                    ...paymentData.metadata
                }
            };
            console.log('Initializing Flutterwave payment with data:', requestData);
            const response = await axios_1.default.post(`${this.flutterwave.baseURL}/payments`, requestData, {
                headers: {
                    Authorization: `Bearer ${this.flutterwave.secretKey}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log('Flutterwave initialization response:', response.data, paymentData);
            await this.logPurchasePending({
                paymentChannel: 'FLUTTERWAVE',
                transaction_ref: paymentData.reference,
                meta: paymentData,
                amount: paymentData.amount,
                userId: paymentData.userId
            });
            if (response.data.status === 'success') {
                return {
                    success: true,
                    data: {
                        authorization_url: response.data.data.link,
                        reference: response.data.data.tx_ref,
                        ...response.data.data
                    },
                    provider: 'flutterwave'
                };
            }
            else {
                return {
                    success: false,
                    error: response.data.message || 'Payment initialization failed',
                    provider: 'flutterwave'
                };
            }
        }
        catch (error) {
            console.error('Flutterwave initialization error:', error.response?.data || error.message);
            this.initializationFailed({ meta: paymentData });
            return {
                success: false,
                error: error.response?.data?.message || 'Payment initialization failed',
                provider: 'flutterwave'
            };
        }
    }
    async verifyPaystackPayment(reference) {
        try {
            const response = await axios_1.default.get(`${this.paystack.baseURL}/transaction/verify/${reference}`, {
                headers: {
                    Authorization: `Bearer ${this.paystack.secretKey}`
                }
            });
            if (!response.data || !response.data.data) {
                return {
                    success: false,
                    error: 'Invalid response from payment gateway',
                    provider: 'paystack'
                };
            }
            const transactionData = response.data.data;
            // Check if transaction was successful
            if (transactionData.status !== 'success') {
                return {
                    success: false,
                    error: `Payment ${transactionData.status}`,
                    provider: 'paystack',
                    data: {
                        status: transactionData.status,
                        message: transactionData.gateway_response
                    }
                };
            }
            // Extract metadata
            const metadata = transactionData.metadata || {};
            // Verify the payment in our database
            const verified = await this.VerifyPaymentLogging({
                metadata,
                response: transactionData
            });
            if (!verified) {
                return {
                    success: false,
                    error: 'Payment verification failed',
                    provider: 'paystack'
                };
            }
            if (reference?.startsWith("PAY_ORD")) {
                const order = await BookOrder_model_1.BookOrderModel.findOne({ _id: metadata.coreId });
                if (!order) {
                    return {
                        success: false,
                        error: 'Order not found for this payment',
                        provider: 'paystack'
                    };
                }
                await order?.updateStatus("processing", 'Payment completed successfully');
            }
            if (reference?.startsWith("PAY_CST")) {
                const consultation = await models_1.ConsultationModel.findOne({ _id: metadata.coreId });
                if (!consultation) {
                    return {
                        success: false,
                        error: 'consultation not found for this payment',
                        provider: 'paystack'
                    };
                }
                await consultation?.updateStatus("paid", 'Payment completed successfully');
                await consultation?.updateStatus("awaiting_lawyer", 'Wait for lawyer to accept the consultation request');
            }
            if (reference?.startsWith("PAY_RST")) {
                const lawyerRequest = await models_1.LawyerRequestModel.findOne({ _id: metadata.coreId });
                if (!lawyerRequest) {
                    return {
                        success: false,
                        error: 'consultation not found for this payment',
                        provider: 'paystack'
                    };
                }
                await lawyerRequest?.updateStatus("paid", 'Payment completed successfully');
                await lawyerRequest?.updateStatus("unassigned", 'Wait for out team to review your request');
            }
            if (reference?.startsWith("PAY_SUB")) {
                const activation = await (0, subscription_service_1.activateSubscriptionFromPayment)({
                    subscriptionId: metadata.coreId,
                    transactionId: transactionData.reference,
                    amount: transactionData.amount / 100,
                    channel: 'paystack',
                });
                if (!activation.success) {
                    return {
                        success: false,
                        error: activation.error || 'Subscription activation failed',
                        provider: 'paystack'
                    };
                }
            }
            return {
                success: true,
                data: {
                    ...metadata,
                    orderSlug: metadata.orderSlug,
                    redirect: metadata.redirect,
                    deliveryPin: metadata.pin,
                    reference: transactionData.reference,
                    amount: transactionData.amount / 100, // Convert from kobo
                    paidAt: transactionData.paid_at,
                    channel: transactionData.channel
                },
                provider: 'paystack'
            };
        }
        catch (error) {
            console.error('Paystack verification error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Payment verification failed',
                provider: 'paystack'
            };
        }
    }
    async verifyFlutterwavePayment(reference) {
        try {
            const response = await axios_1.default.get(`${this.flutterwave.baseURL}/transactions/${reference}/verify`, {
                headers: {
                    Authorization: `Bearer ${this.flutterwave.secretKey}`,
                    'Content-Type': 'application/json'
                }
            });
            if (!response.data || !response.data.data) {
                return {
                    success: false,
                    error: 'Invalid response from payment gateway',
                    provider: 'flutterwave'
                };
            }
            const transactionData = response.data.data;
            // Check if transaction was successful
            if (transactionData.status !== 'successful') {
                return {
                    success: false,
                    error: `Payment ${transactionData.status}`,
                    provider: 'flutterwave',
                    data: {
                        status: transactionData.status,
                        message: transactionData.processor_response
                    }
                };
            }
            // Extract metadata
            const metadata = transactionData.meta || {};
            // Verify the payment in our database
            const verified = await this.VerifyPaymentLogging({
                metadata,
                response: transactionData
            });
            if (!verified) {
                return {
                    success: false,
                    error: 'Payment verification failed',
                    provider: 'flutterwave'
                };
            }
            if (reference?.startsWith("PAY_ORD")) {
                const order = await BookOrder_model_1.BookOrderModel.findOne({ _id: metadata.coreId });
                if (!order) {
                    return {
                        success: false,
                        error: 'Order not found for this payment',
                        provider: 'flutterwave'
                    };
                }
                await order?.updateStatus("paid", 'Payment completed successfully');
            }
            if (reference?.startsWith("PAY_SUB")) {
                const activation = await (0, subscription_service_1.activateSubscriptionFromPayment)({
                    subscriptionId: metadata.coreId,
                    transactionId: transactionData.tx_ref,
                    amount: transactionData.amount,
                    channel: 'flutterwave',
                });
                if (!activation.success) {
                    return {
                        success: false,
                        error: activation.error || 'Subscription activation failed',
                        provider: 'flutterwave'
                    };
                }
            }
            return {
                success: true,
                data: {
                    ...metadata,
                    orderSlug: metadata.orderSlug,
                    deliveryPin: metadata.pin,
                    reference: transactionData.tx_ref,
                    amount: transactionData.amount,
                    paidAt: transactionData.created_at,
                    channel: transactionData.payment_type
                },
                provider: 'flutterwave'
            };
        }
        catch (error) {
            console.error('Flutterwave verification error:', error.response?.data || error.message);
            return {
                success: false,
                error: error.response?.data?.message || 'Payment verification failed',
                provider: 'flutterwave'
            };
        }
    }
    async initializePayment(provider, paymentData) {
        switch (provider.toLowerCase()) {
            case 'paystack':
                return await this.initializePaystackPayment(paymentData);
            case 'flutterwave':
                return await this.initializeFlutterwavePayment(paymentData);
            default:
                return {
                    success: false,
                    error: 'Unsupported payment provider',
                    provider: provider
                };
        }
    }
    async verifyPayment(provider, reference) {
        switch (provider.toLowerCase()) {
            case 'paystack':
                return await this.verifyPaystackPayment(reference);
            case 'flutterwave':
                return await this.verifyFlutterwavePayment(reference);
            default:
                return {
                    success: false,
                    error: 'Unsupported payment provider',
                    provider: provider
                };
        }
    }
    generatePaymentReference(coreId) {
        const timestamp = Date.now();
        return `PAY_${coreId}_${timestamp}`;
    }
    verifyPaystackWebhook(payload, signature) {
        const hash = crypto_1.default
            .createHmac('sha512', this.paystack?.secretKey || '')
            .update(JSON.stringify(payload))
            .digest('hex');
        return hash === signature;
    }
    verifyFlutterwaveWebhook(payload, signature) {
        const hash = crypto_1.default
            .createHmac('sha256', this.flutterwave.secretKey)
            .update(JSON.stringify(payload))
            .digest('hex');
        return hash === signature;
    }
    getPaymentFees(provider, amount) {
        const fees = {
            paystack: {
                percentage: 1.5,
                cap: 200000,
                fixed: 0
            },
            flutterwave: {
                percentage: 1.4,
                cap: 200000,
                fixed: 0
            },
            cash_on_delivery: {
                percentage: 0,
                cap: 0,
                fixed: 0
            }
        };
        const providerFees = fees[provider.toLowerCase()];
        if (!providerFees)
            return 0;
        const percentageFee = (amount * providerFees.percentage) / 100;
        const totalFee = Math.min(percentageFee, providerFees.cap) + providerFees.fixed;
        return Math.round(totalFee);
    }
}
exports.default = PaymentGateway;
//# sourceMappingURL=payment.js.map