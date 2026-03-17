export type UserRole = 'visitor' | 'tenant' | 'owner' | 'admin' | 'superAdmin';
export type Language = 'en' | 'fr' | 'rw';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  language?: Language;
  location?: string;
  createdAt: string;
}

export type PropertyCategory =
  | 'Residential'
  | 'Commercial'
  | 'Storage / Utility'
  | 'Land / Outdoor'
  | 'Hospitality'
  | 'Mixed Use';

export type PropertyType =
  // Residential
  | 'Apartment'
  | 'House'
  | 'Shared Living'
  | 'Multi-Unit Residence'
  // Commercial
  | 'Office'
  | 'Retail'
  | 'Food & Hospitality'
  | 'Industrial'
  // Storage / Utility
  | 'Storage'
  | 'Parking'
  | 'Specialized Storage'
  // Land / Outdoor
  | 'Land'
  | 'Outdoor Space'
  // Hospitality
  | 'Short Stay'
  // Mixed Use
  | 'Hybrid Property';

export type PropertySubcategory = string;
export type PropertyStatus = 'available' | 'occupied';

export interface Property {
  id: string;
  title: string;
  description: string;
  category: PropertyCategory;
  type: PropertyType;
  subcategory: PropertySubcategory;
  price: number;
  location: string;
  amenities: string[];
  images: string[];
  ownerId: string;
  tenantId?: string;
  status: PropertyStatus;
  isPublic: boolean;
  createdAt: string;
}

export type ContractStatus = 'active' | 'expired';

export interface Contract {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  rentAmount: number;
  depositAmount: number;         // security deposit held by owner
  startDate: string;
  endDate: string;
  contractDocumentURL?: string;
  status: ContractStatus;
  createdAt: string;
}

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved';

export interface MaintenanceRequest {
  id: string;
  propertyId: string;
  tenantId: string;
  title: string;
  description: string;
  images: string[];
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  createdAt: string;
  resolvedAt?: string;
  repairCost?: number;           // cost recorded by owner after resolution
}

export type BookingStatus = 'pending' | 'approved' | 'rejected';

export interface BookingRequest {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  message: string;
  status: BookingStatus;
  createdAt: string;
}

export interface PlatformSettings {
  serviceFeePercent: number;   // e.g. 5 = 5%
  serviceFeeFixed: number;     // e.g. 10 = $10 flat per month
  serviceFeeType: 'percent' | 'fixed';
  updatedAt: string;
  updatedBy: string;
}

export interface PropertyFilters {
  location: string;
  category: string;
  type: string;
  subcategory: string;
  minPrice: number;
  maxPrice: number;
}

export interface Conversation {
  id: string;
  propertyId: string;
  propertyTitle: string;
  ownerId: string;
  tenantId: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadOwner: number;
  unreadTenant: number;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  recipientRole: 'owner' | 'tenant';
  text: string;
  createdAt: string;
}

// ── Rent Payments ──────────────────────────────────────────────────────
export type PaymentStatus = 'pending' | 'verified' | 'rejected';

export interface RentPayment {
  id: string;
  propertyId: string;
  contractId: string;
  tenantId: string;
  ownerId: string;
  month: string;             // "2025-03" ISO year-month
  amount: number;
  proofUrl: string;          // Cloudinary URL for receipt / bank screenshot
  notes: string;
  status: PaymentStatus;
  createdAt: string;
  verifiedAt?: string;
}

// ── Reimbursement Requests ─────────────────────────────────────────────
export type ReimbursementStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface ReimbursementRequest {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  title: string;
  description: string;
  amount: number;
  receiptUrls: string[];     // proof files tenant paid out of pocket
  status: ReimbursementStatus;
  ownerNote?: string;
  createdAt: string;
  resolvedAt?: string;
}