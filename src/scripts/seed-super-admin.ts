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

import dotenv from 'dotenv';
dotenv.config();
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { AdminUserModel } from '../models';
import { AdminRole } from '../models/types';

 export async function seedAdmin() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅  Connected to MongoDB');

  const email    = (process.env.SUPER_ADMIN_EMAIL || 'admin@lawticha.com').trim();
  const fullName = (process.env.SUPER_ADMIN_NAME  || 'Lawticha Admin').trim();
  const salt    = await bcrypt.genSalt(12);
  const password = await bcrypt.hash("access123", salt);

  // Check if super admin already exists
  const existing = await AdminUserModel.findOne({ email });

  if (existing) {
    console.log(`\n⚠️   Admin with email ${email} already exists.`);
    console.log(`    Role: ${existing.role} | Active: ${existing.isActive}`);

    if (existing.role !== AdminRole.SUPER_ADMIN) {
      console.error('    ❌  That phone belongs to a non-super-admin user. Use a different number.');
    } else {
      console.log('    ✅  Super admin already Admined,  nothing to do.');
    }

    await mongoose.disconnect();
    return;
  }

  // Create the super admin user,  no password, no separate profile doc
  const user = await AdminUserModel.create({
    email,
    name: fullName,
    passwordHash: password,
    role: AdminRole.SUPER_ADMIN,
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

  await mongoose.disconnect();
}

seedAdmin().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
