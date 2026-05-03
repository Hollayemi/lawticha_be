/**
 * Seed script — creates the LawTicha Super Admin.
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

import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { AdminUserModel } from '../models/Admin.model';
import { LawTichaRole } from '../models/types/lawticha.types';

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('❌  MONGODB_URI not set'); process.exit(1); }

  await mongoose.connect(uri);
  console.log('✅  Connected to MongoDB');

  const email    = (process.env.ADMIN_EMAIL    || 'admin@lawticha.ng').toLowerCase().trim();
  const password =  process.env.ADMIN_PASSWORD || 'Admin@12345';
  const name     = (process.env.ADMIN_NAME     || 'Super Admin').trim();

  const existing = await AdminUserModel.findOne({ email });
  if (existing) {
    console.log(`⚠️   Admin with email ${email} already exists (role: ${existing.role})`);
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await AdminUserModel.create({
    name,
    email,
    passwordHash,
    role: LawTichaRole.SUPER_ADMIN,
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

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err.message);
  process.exit(1);
});
