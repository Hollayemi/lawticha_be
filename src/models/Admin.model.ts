import { Schema, model, models, Document, Types } from 'mongoose';
import { IAdminUser, IAuditLog, AdminRole, AuditAction } from './types'; 

export interface IAdminUserDocument extends Omit<IAdminUser, '_id'>, Document {
  _id: Types.ObjectId;
}

const AdminUserSchema = new Schema<IAdminUserDocument>(
  {
    name: {
      type:     String,
      required: [true, 'Name is required'],
      trim:     true,
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
    },
    passwordHash: {
      type:     String,
      required: true,
      select:   false,
    },
    role: {
      type:    String,
      enum:    Object.values(AdminRole),
      default: AdminRole.ADMIN,
    },
    isActive:  { type: Boolean, default: true },
    lastLogin: { type: Date },
    removedAt: { type: Date, default: null },
    removedBy: {
      type:    Schema.Types.ObjectId,
      ref:     'AdminUser',
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'admin_users',
  }
);

export const AdminUserModel =
  models.AdminUser ||
  model<IAdminUserDocument>('AdminUser', AdminUserSchema);

// Audit Log 

export interface IAuditLogDocument extends Omit<IAuditLog, '_id'>, Document {
  _id: Types.ObjectId;
}

const AuditLogSchema = new Schema<IAuditLogDocument>(
  {
    adminId: {
      type:     Schema.Types.ObjectId,
      ref:      'AdminUser',
      required: true,
      index:    true,
    },
    adminName: {
      type:     String,
      required: true,
    },
    action: {
      type:     String,
      enum:     Object.values(AuditAction),
      required: true,
      index:    true,
    },
    targetType: {
      type:     String,
      enum:     ['citizen', 'lawyer', 'verification', 'document', 'book', 'plan', 'subscription'],
      required: true,
    },
    targetId: {
      type:     Schema.Types.Mixed,
      required: true,
    },
    meta: {
      type:    Schema.Types.Mixed,
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
  models.AuditLog ||
  model<IAuditLogDocument>('AuditLog', AuditLogSchema);