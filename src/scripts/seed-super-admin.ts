/**
 * Seed script — creates the Super Admin user.
 *
 * A super admin is simply a User with role: 'super_admin'.
 * There is no separate profile document — the User record IS the super admin.
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

import mongoose from 'mongoose';
import { UserModel } from '../models';
import { UserRole } from '../models/types';

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌  MONGODB_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('✅  Connected to MongoDB');

  const phone    = (process.env.SUPER_ADMIN_PHONE || '08000000000').trim();
  const fullName = (process.env.SUPER_ADMIN_NAME  || 'NURTW Super Admin').trim();

  // Check if super admin already exists
  const existing = await UserModel.findOne({ phone });

  if (existing) {
    console.log(`\n⚠️   User with phone ${phone} already exists.`);
    console.log(`    Role: ${existing.role} | Active: ${existing.isActive}`);

    if (existing.role !== UserRole.SUPER_ADMIN) {
      console.error('    ❌  That phone belongs to a non-super-admin user. Use a different number.');
    } else {
      console.log('    ✅  Super admin already seeded — nothing to do.');
    }

    await mongoose.disconnect();
    return;
  }

  // Create the super admin user — no password, no separate profile doc
  const user = await UserModel.create({
    phone,
    fullName,
    role: UserRole.SUPER_ADMIN,
    isActive: true,
  });

  console.log(`
  ✅  Super Admin created successfully
  ─────────────────────────────────────
  ID:     ${user._id}
  Name:   ${fullName}
  Phone:  ${phone}
  Role:   ${user.role}
  ─────────────────────────────────────
  To log in, hit POST /api/v1/auth/send-otp with { "phone": "${phone}" }
  then POST /api/v1/auth/verify-otp with the 6-digit code.
  `);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
