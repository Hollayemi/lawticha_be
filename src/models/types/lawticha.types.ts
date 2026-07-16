import { ObjectId } from 'mongoose';

//  Enums 

export enum LawTichaRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN       = 'admin',
  LAWYER      = 'lawyer',
  CITIZEN     = 'citizen',
}

export enum CitizenStatus {
  ACTIVE   = 'active',
  INACTIVE = 'inactive',
  WARNING  = 'warning',
}

export enum LawyerStatus {
  ACTIVE   = 'active',
  INACTIVE = 'inactive',
  PENDING  = 'pending',
}

export enum VerificationStatus {
  PENDING        = 'pending',
  APPROVED       = 'approved',
  REJECTED       = 'rejected',
  INFO_REQUESTED = 'info_requested',
}

export enum LawyerBadge {
  VERIFIED   = 'Verified',
  TOP_RATED  = 'Top Rated',
  RESPONSIVE = 'Responsive',
}

export enum ConsultationType {
  MESSAGE = 'message',
  CALL    = 'call',
  VIDEO   = 'video',
}

//  Base 

export interface BaseModel {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

//  Admin User 

export interface IAdminUser extends BaseModel {
  name: string;
  email: string;
  passwordHash: string;
  role: LawTichaRole.SUPER_ADMIN | LawTichaRole.ADMIN;
  isActive: boolean;
  lastLogin?: Date;
  removedAt?: Date;
  removedBy?: ObjectId;
}

//  Citizen 

export interface ICitizen extends BaseModel {
  name: string;
  email: string;
  phone?: string;
  state?: string;
  status: CitizenStatus;
  color: string;               // avatar gradient colour
  passwordHash?: string;
  googleId?: string;
  topicsRead: number;
  consultations: number;
  reportCount: number;
  modulesEnrolled: ObjectId[];
  bookmarkedTopics: number;
  communityPosts: number;
  lastActiveAt?: Date;
  removedAt?: Date;
  removedBy?: ObjectId;
}

//  Lawyer 

export interface IVerificationDocument {
  label: string;
  filename: string;
  fileUrl: string;
  uploadedAt: Date;
  sizeBytes: number;
  verified: boolean | null;
}

export interface ILawyerFee {
  message: number;
  call: number;
  video: number;
}

export interface ILawyer extends BaseModel {
  name: string;
  email: string;
  phone?: string;
  state?: string;
  color: string;
  passwordHash?: string;
  googleId?: string;
  bio?: string;
  languages: string[];
  specialisms: string[];
  nbaNumber: string;
  yearsCall: number;
  status: LawyerStatus;
  available: boolean;
  rating: number;
  reviewCount: number;
  consultations: number;
  responseTimeMinutes: number;   // stored as minutes, formatted on output
  badges: LawyerBadge[];
  fee: ILawyerFee;
  lastActiveAt?: Date;
  verificationId?: ObjectId;
  removedAt?: Date;
  removedBy?: ObjectId;
}

//  Verification 

export interface IVerification extends BaseModel {
  name: string;
  email: string;
  phone?: string;
  state?: string;
  color: string;
  nbaNumber: string;
  yearsCall: number;
  calledAt: string;
  specialisms: string[];
  status: VerificationStatus;
  adminNote?: string;
  rejectionReason?: string;
  reviewedBy?: ObjectId;
  reviewedAt?: Date;
  documents: IVerificationDocument[];
  lawyerId?: ObjectId;          // set after approval
  removedAt?: Date;
  removedBy?: ObjectId;
}

//  Audit Log 

export enum AuditAction {
  CITIZEN_STATUS_CHANGED    = 'citizen_status_changed',
  CITIZEN_EMAIL_SENT        = 'citizen_email_sent',
  LAWYER_STATUS_CHANGED     = 'lawyer_status_changed',
  LAWYER_EMAIL_SENT         = 'lawyer_email_sent',
  VERIFICATION_APPROVED     = 'verification_approved',
  VERIFICATION_REJECTED     = 'verification_rejected',
  VERIFICATION_INFO_REQUEST = 'verification_info_request',
  DOCUMENT_VERIFIED         = 'document_verified',
}

export interface IAuditLog extends BaseModel {
  adminId: ObjectId;
  adminName: string;
  action: AuditAction;
  targetType: 'citizen' | 'lawyer' | 'verification' | 'document';
  targetId: ObjectId | string;
  meta?: Record<string, unknown>;
}
