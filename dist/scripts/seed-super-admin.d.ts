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
export declare function seedAdmin(): Promise<void>;
//# sourceMappingURL=seed-super-admin.d.ts.map