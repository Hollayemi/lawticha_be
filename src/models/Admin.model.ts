import { Schema, model, models } from 'mongoose';
import { IAuditLog, IAdminUser, LawTichaRole, AuditAction } from './types/lawticha.types';

//  Admin User 

const AdminUserSchema = new Schema<IAdminUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: [LawTichaRole.SUPER_ADMIN, LawTichaRole.ADMIN],
      default: LawTichaRole.ADMIN,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    removedAt: {
      type: Date,
      default: null,
    },
    removedBy: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'admin_users',
  }
);

export const AdminUserModel =
  models.AdminUser || model<IAdminUser>('AdminUser', AdminUserSchema);

//  Audit Log 

const AuditLogSchema = new Schema<IAuditLog>(
  {
    adminId: {
      type: Schema.Types.ObjectId,
      ref: 'AdminUser',
      required: true,
      index: true,
    },
    adminName: {
      type: String,
      required: true,
    },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: ['citizen', 'lawyer', 'verification', 'document'],
      required: true,
    },
    targetId: {
      type: Schema.Types.Mixed,
      required: true,
    },
    meta: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'audit_logs',
  }
);

AuditLogSchema.index({ createdAt: -1 });

export const AuditLogModel =
  models.AuditLog || model<IAuditLog>('AuditLog', AuditLogSchema);
