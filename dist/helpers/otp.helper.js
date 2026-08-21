"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateOtpCode = generateOtpCode;
exports.createOtp = createOtp;
exports.sendOtpSms = sendOtpSms;
exports.verifyOtpCode = verifyOtpCode;
const crypto_1 = __importDefault(require("crypto"));
const models_1 = require("../models");
const error_1 = require("../middleware/error");
const OTP_TTL_MINUTES = 10;
const MAX_ATTEMPTS = 5;
//  Generate a 6-digit OTP 
function generateOtpCode() {
    // Cryptographically random 6-digit string
    return String(crypto_1.default.randomInt(100000, 999999));
}
//  Save OTP to DB (invalidates previous unused ones for this phone) 
async function createOtp(phone) {
    // Mark any existing unused OTPs as used so old codes can't be replayed
    await models_1.OtpModel.updateMany({ phone, used: false }, { used: true });
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
    await models_1.OtpModel.create({ phone, code, expiresAt, used: false, attempts: 0 });
    return code;
}
//  Deliver OTP (Twilio stub,  swap in real SDK call here) 
async function sendOtpSms(phone, code) {
    if (process.env.NODE_ENV === 'development') {
        console.log(`[OTP] ${phone} → ${code}`);
        return;
    }
    //  Production: Twilio / Termii / any SMS provider 
    // const client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
    // await client.messages.create({
    //   body: `Your NURTW verification code is ${code}. Valid for ${OTP_TTL_MINUTES} minutes.`,
    //   from: process.env.TWILIO_FROM,
    //   to: `+234${phone.replace(/^0/, '')}`,
    // });
    //
    // Alternatively,  Termii:
    // await axios.post('https://api.ng.termii.com/api/sms/send', {
    //   to: phone, from: 'NURTW', sms: `Your code: ${code}`,
    //   type: 'plain', channel: 'generic', api_key: process.env.TERMII_KEY,
    // });
    console.warn('[OTP] SMS provider not configured,  code:', code);
}
//  Verify OTP 
async function verifyOtpCode(phone, code) {
    const otp = await models_1.OtpModel.findOne({ phone, used: false }).sort({ createdAt: -1 });
    if (!otp) {
        throw new error_1.AppError('No active OTP found for this number. Please request a new one.', 400, 'OTP_NOT_FOUND');
    }
    if (otp.expiresAt < new Date()) {
        await models_1.OtpModel.updateOne({ _id: otp._id }, { used: true });
        throw new error_1.AppError('OTP has expired. Please request a new one.', 400, 'OTP_EXPIRED');
    }
    if (otp.attempts >= MAX_ATTEMPTS) {
        await models_1.OtpModel.updateOne({ _id: otp._id }, { used: true });
        throw new error_1.AppError('Too many incorrect attempts. Please request a new OTP.', 429, 'OTP_MAX_ATTEMPTS');
    }
    if (otp.code !== code) {
        await models_1.OtpModel.updateOne({ _id: otp._id }, { $inc: { attempts: 1 } });
        const remaining = MAX_ATTEMPTS - (otp.attempts + 1);
        throw new error_1.AppError(`Incorrect OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`, 400, 'OTP_INVALID');
    }
    // Mark as used
    await models_1.OtpModel.updateOne({ _id: otp._id }, { used: true });
}
//# sourceMappingURL=otp.helper.js.map