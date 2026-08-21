"use strict";
/**
 * Seed script,  creates the LawTicha Super Admin.
 *
 * Usage:
 *   ts-node src/scripts/seed-admin.ts
 *
 * Required env vars:
 *   MONGODB_URI
 *   ADMIN_EMAIL        (e.g. admin@lawticha.ng)
 *   ADMIN_PASSWORD     (min 8 chars)
 *   ADMIN_NAME         (e.g. "Super Admin")
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const mongoose_1 = __importDefault(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const Admin_model_1 = require("../models/Admin.model");
const lawticha_types_1 = require("../models/types/lawticha.types");
async function seed() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('❌  MONGODB_URI not set');
        process.exit(1);
    }
    await mongoose_1.default.connect(uri);
    console.log('✅  Connected to MongoDB');
    const email = (process.env.ADMIN_EMAIL || 'admin@lawticha.ng').toLowerCase().trim();
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const name = (process.env.ADMIN_NAME || 'Super Admin').trim();
    const existing = await Admin_model_1.AdminUserModel.findOne({ email });
    if (existing) {
        console.log(`⚠️   Admin with email ${email} already exists (role: ${existing.role})`);
        await mongoose_1.default.disconnect();
        return;
    }
    const passwordHash = await bcryptjs_1.default.hash(password, 12);
    const admin = await Admin_model_1.AdminUserModel.create({
        name,
        email,
        passwordHash,
        role: lawticha_types_1.LawTichaRole.SUPER_ADMIN,
        isActive: true,
    });
    console.log(`
  ✅  Super Admin created
  
  ID:     ${admin._id}
  Name:   ${name}
  Email:  ${email}
  Role:   ${admin.role}
  
  Login: POST /api/v1/auth/admin/login
  Body:  { "email": "${email}", "password": "****" }
  `);
    await mongoose_1.default.disconnect();
}
seed().catch((err) => {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
});
//# sourceMappingURL=seed-admin.js.map