import { ObjectId } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  GOVERNMENT  = 'government',
  LGA         = 'lga',
  UNION       = 'union',
  SELLER      = 'seller',
  RIDER       = 'rider',
}

export enum VehicleType {
  OKADA    = 'okada',
  TRICYCLE = 'tricycle',
}

export enum ComplianceStatus {
  COMPLIANT = 'compliant',
  WARNING   = 'warning',
  VIOLATION = 'violation',
}

export enum TransferStatus {
  NONE                 = 'none',
  PENDING              = 'pending',
  CLEARANCE_CHECK      = 'clearance_check',
  APPROVED_BY_UNION_A  = 'approved_by_union_a',
  APPROVED_BY_UNION_B  = 'approved_by_union_b',
  LGA_APPROVED         = 'lga_approved',
  COMPLETED            = 'completed',
  REJECTED             = 'rejected',
}

export enum PaymentMethod {
  CASH     = 'cash',
  WALLET   = 'wallet',
  TRANSFER = 'transfer',
}

export enum SyncStatus {
  PENDING_SYNC = 'pending_sync',
  SYNCED       = 'synced',
}

export enum EntityType {
  UNION = 'union',
  LGA   = 'lga',
}

// ─── Base ─────────────────────────────────────────────────────────────────────

export interface BaseModel {
  _id?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface GPSLocation {
  type: 'Point';
  coordinates: [number, number];
}

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface IUser extends BaseModel {
  phone: string;
  role: UserRole;
  fullName: string;
  isActive: boolean;
  lastLogin?: Date;
}

export interface IOtp extends BaseModel {
  phone: string;
  code: string;
  expiresAt: Date;
  used: boolean;
  attempts: number;
}

export interface ISuperAdmin extends BaseModel {
  userId: ObjectId;
  email?: string;
}

export interface IGovernment extends BaseModel {
  userId: ObjectId;
  stateName: string;
  code: string;
  totalTicketsAllocated: number;
  totalRevenueCollected: number;
}

export interface ILGA extends BaseModel {
  userId: ObjectId;
  govId: ObjectId;
  lgaName: string;
  code: string;
  ticketQuota: number;
  ticketsSold: number;
  expectedRevenue: number;
  actualRevenue: number;
  complianceRate: number;
}

export interface IUnion extends BaseModel {
  userId: ObjectId;
  lgaId: ObjectId;
  unionCode: string;
  unionName: string;
  govBasePrice: number;
  unionLevy: number;
  finalTicketPrice: number;
  ticketAllocation: number;
  ticketsSold: number;
  govWalletBalance: number;
  unionWalletBalance: number;
  lastRemittanceDate?: Date;
}

export interface IRider extends BaseModel {
  userId: ObjectId;
  riderCode: string;
  unionId: ObjectId;
  originalUnionId: ObjectId;
  vehicleType: VehicleType;
  vehicleNumber: string;
  vehicleMake?: string;
  nin?: string;
  complianceStatus: ComplianceStatus;
  lastPaymentDate?: Date;
  outstandingBalance: number;
  transferStatus: TransferStatus;
  phone: string;
  fullName: string;
}

export interface ISeller extends BaseModel {
  userId: ObjectId;
  unionId: ObjectId;
  ticketAllocation: number;
  ticketsSoldToday: number;
  totalTicketsSold: number;
  nin?: string;
  address?: string;
  lastSyncTime?: Date;
}

export interface ITicketTransaction extends BaseModel {
  riderId: ObjectId;
  sellerId: ObjectId;
  unionId: ObjectId;
  lgaId: ObjectId;
  amountPaid: number;
  govPortion: number;
  unionPortion: number;
  paymentMethod: PaymentMethod;
  paymentDate: Date;
  gpsLocation?: GPSLocation;
  receiptNumber: string;
  syncStatus: SyncStatus;
  riderCode: string;
  unionCode: string;
}

export interface ITransferRequest extends BaseModel {
  riderId: ObjectId;
  fromUnionId: ObjectId;
  toUnionId: ObjectId;
  lgaId: ObjectId;
  status: TransferStatus;
  clearanceCertificate?: string;
  requestDate: Date;
  completionDate?: Date;
  gracePeriodEnd?: Date;
  rejectionReason?: string;
  riderCode: string;
  fromUnionName: string;
  toUnionName: string;
}

export interface IRevenueRemittance extends BaseModel {
  fromEntityType: EntityType;
  fromEntityId: ObjectId;
  toEntityType: EntityType;
  toEntityId: ObjectId;
  amount: number;
  paymentReference: string;
  remittanceDate: Date;
  ticketTransactionsIncluded: ObjectId[];
  fromEntityName: string;
  toEntityName: string;
}
