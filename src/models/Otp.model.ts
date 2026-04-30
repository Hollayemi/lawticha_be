import { Schema, model, models } from 'mongoose';
import { IOtp } from './types';

const OtpSchema = new Schema<IOtp>(
    {
        phone: {
            type: String,
            required: [true, 'Phone number is required'],
            index: true,
            trim: true
        },
        code: {
            type: String,
            required: [true, 'OTP code is required'],
            trim: true
        },
        expiresAt: {
            type: Date,
            required: [true, 'Expiration time is required'],
            index: true
        },
        used: {
            type: Boolean,
            default: false,
            index: true
        },
        attempts: {
            type: Number,
            default: 0
        }
    },
    {
        timestamps: true,
        collection: 'otps'
    }
);

// Index to quickly find valid OTPs for a phone number
OtpSchema.index({ phone: 1, code: 1, expiresAt: 1, used: 1 });

export const OtpModel = models.Otp || model<IOtp>('Otp', OtpSchema);