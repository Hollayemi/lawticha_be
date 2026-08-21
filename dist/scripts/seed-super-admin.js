"use strict";
/**
 * Seed script,  creates the Super Admin user.
 *
 * A super admin is simply a User with role: 'super_admin'.
 * There is no separate profile document,  the User record IS the super admin.
 * They log in via OTP like every other role.
 *
 * Usage:
 *   npm run seed:admin
 *   or
 *   ts-node src/scripts/seed-super-admin.ts
 *
 * Required env vars (copy .env.example → .env and fill in):
 *   MONGODB_URI
 *   SUPER_ADMIN_PHONE
 *   SUPER_ADMIN_NAME
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedAdmin = seedAdmin;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const types_1 = require("../models/types");
async function seedAdmin() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌  MONGODB_URI is not set in .env');
        process.exit(1);
    }
    await mongoose_1.default.connect(uri);
    console.log('✅  Connected to MongoDB');
    const email = (process.env.SUPER_ADMIN_EMAIL || 'admin@lawticha.com').trim();
    const fullName = (process.env.SUPER_ADMIN_NAME || 'Lawticha Admin').trim();
    const salt = await bcryptjs_1.default.genSalt(12);
    const password = await bcryptjs_1.default.hash("access123", salt);
    // Check if super admin already exists
    const existing = await models_1.AdminUserModel.findOne({ email });
    if (existing) {
        console.log(`\n⚠️   Admin with email ${email} already exists.`);
        console.log(`    Role: ${existing.role} | Active: ${existing.isActive}`);
        if (existing.role !== types_1.AdminRole.SUPER_ADMIN) {
            console.error('    ❌  That phone belongs to a non-super-admin user. Use a different number.');
        }
        else {
            console.log('    ✅  Super admin already Admined,  nothing to do.');
        }
        await mongoose_1.default.disconnect();
        return;
    }
    // Create the super admin user,  no password, no separate profile doc
    const user = await models_1.AdminUserModel.create({
        email,
        name: fullName,
        passwordHash: password,
        role: types_1.AdminRole.SUPER_ADMIN,
        isActive: true,
    });
    console.log(`
  ✅  Super Admin created successfully
  
  ID:     ${user._id}
  Name:   ${fullName}
  Phone:  ${email}
  Role:   ${user.role}
  
  To log in, hit POST /api/v1/auth/send-otp with { "phone": "${email}" }
  then POST /api/v1/auth/verify-otp with the 6-digit code.
  `);
    await mongoose_1.default.disconnect();
}
seedAdmin().catch((err) => {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
});
//# sourceMappingURL=seed-super-admin.js.map