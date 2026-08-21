"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedSubscriptionPlans = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const SubscriptionPlan_model_1 = require("../models/SubscriptionPlan.model");
const billing_types_1 = require("../models/types/billing.types");
dotenv_1.default.config();
const seedSubscriptionPlans = async () => {
    try {
        await mongoose_1.default.connect(process.env.NODE_ENV === 'production'
            ? process.env.MONGODB_URI_PROD
            : process.env.MONGODB_URI);
        console.log('MongoDB connected...');
        await SubscriptionPlan_model_1.SubscriptionPlanModel.deleteMany({});
        console.log('Cleared existing subscription plans');
        const plans = [
            {
                name: 'Basic',
                description: 'Essential legal support for everyday needs.',
                price: 2500,
                interval: billing_types_1.BillingInterval.MONTHLY,
                features: [
                    '2 lawyer consultations per month',
                    'Access to legal library',
                    'Community forum access',
                    'Email support',
                ],
                isActive: true,
            },
            {
                name: 'Basic',
                description: 'Essential legal support for everyday needs.',
                price: 25000,
                interval: billing_types_1.BillingInterval.YEARLY,
                features: [
                    '2 lawyer consultations per month',
                    'Access to legal library',
                    'Community forum access',
                    'Email support',
                ],
                isActive: true,
            },
            {
                name: 'Pro',
                description: 'For citizens who need more frequent legal guidance.',
                price: 6000,
                interval: billing_types_1.BillingInterval.MONTHLY,
                features: [
                    '5 lawyer consultations per month',
                    'Priority matching to verified lawyers',
                    'Access to legal library',
                    'Document review (1 per month)',
                    'Priority support',
                ],
                isPopular: true,
                badge: 'Most Popular',
                isActive: true,
            },
            {
                name: 'Pro',
                description: 'For citizens who need more frequent legal guidance.',
                price: 60000,
                interval: billing_types_1.BillingInterval.YEARLY,
                features: [
                    '5 lawyer consultations per month',
                    'Priority matching to verified lawyers',
                    'Access to legal library',
                    'Document review (1 per month)',
                    'Priority support',
                ],
                isPopular: true,
                badge: 'Most Popular',
                isActive: true,
            },
            {
                name: 'Premium',
                description: 'Unlimited access for individuals and small businesses.',
                price: 15000,
                interval: billing_types_1.BillingInterval.MONTHLY,
                features: [
                    'Unlimited lawyer consultations',
                    'Dedicated lawyer matching',
                    'Document review (unlimited)',
                    'Video consultations',
                    '24/7 priority support',
                ],
                badge: 'Best Value',
                isActive: true,
            },
            {
                name: 'Premium',
                description: 'Unlimited access for individuals and small businesses.',
                price: 150000,
                interval: billing_types_1.BillingInterval.YEARLY,
                features: [
                    'Unlimited lawyer consultations',
                    'Dedicated lawyer matching',
                    'Document review (unlimited)',
                    'Video consultations',
                    '24/7 priority support',
                ],
                badge: 'Best Value',
                isActive: true,
            },
        ];
        const created = await SubscriptionPlan_model_1.SubscriptionPlanModel.insertMany(plans);
        console.log('Subscription plans created successfully:');
        created.forEach((plan) => {
            console.log(`- ${plan.name} (${plan.interval}) — NGN ${plan.price}`);
        });
        console.log('\nDatabase seeded successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('Error seeding subscription plans:', error);
        process.exit(1);
    }
};
exports.seedSubscriptionPlans = seedSubscriptionPlans;
// Run seed
// seedSubscriptionPlans();
//# sourceMappingURL=seed-subscription-plans.js.map