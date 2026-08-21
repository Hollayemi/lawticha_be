"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpModel = void 0;
const mongoose_1 = require("mongoose");
const OtpSchema = new mongoose_1.Schema({
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
}, {
    timestamps: true,
    collection: 'otps'
});
// Index to quickly find valid OTPs for a phone number
OtpSchema.index({ phone: 1, code: 1, expiresAt: 1, used: 1 });
exports.OtpModel = mongoose_1.models.Otp || (0, mongoose_1.model)('Otp', OtpSchema);
//# sourceMappingURL=Otp.model.js.map