import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { SubscriptionPlanModel } from '../models/SubscriptionPlan.model';
import { BillingInterval } from '../models/types/billing.types';

dotenv.config();

export const seedSubscriptionPlans = async () => {
  try {
    await mongoose.connect(
      process.env.NODE_ENV === 'production'
        ? process.env.MONGODB_URI_PROD!
        : process.env.MONGODB_URI!
    );
    console.log('MongoDB connected...');

    await SubscriptionPlanModel.deleteMany({});
    console.log('Cleared existing subscription plans');

    const plans = [
      {
        name: 'Basic',
        description: 'Essential legal support for everyday needs.',
        price: 2500,
        interval: BillingInterval.MONTHLY,
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
        interval: BillingInterval.YEARLY,
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
        interval: BillingInterval.MONTHLY,
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
        interval: BillingInterval.YEARLY,
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
        interval: BillingInterval.MONTHLY,
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
        interval: BillingInterval.YEARLY,
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

    const created = await SubscriptionPlanModel.insertMany(plans);
    console.log('Subscription plans created successfully:');
    created.forEach((plan) => {
      console.log(`- ${plan.name} (${plan.interval}) — NGN ${plan.price}`);
    });

    console.log('\nDatabase seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding subscription plans:', error);
    process.exit(1);
  }
};

// Run seed
// seedSubscriptionPlans();
