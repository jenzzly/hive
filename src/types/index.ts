export type UserRole = 'visitor' | 'tenant' | 'owner' | 'admin' | 'superAdmin';
export type Language = 'en' | 'fr' | 'rw';
export type Currency = 'USD' | 'RWF';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  language?: Language;
  currency?: Currency;
  location?: string;
  platformFee?: number; // Custom platform fee for owners (e.g. 5 for 5%)
  services?: string[]; // Array of services e.g. ['Legal', 'Maintenance', 'Tax']
  photoURL?: string;
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
  | 'Apartment' | 'House' | 'Shared Living' | 'Multi-Unit Residence'
  | 'Office' | 'Retail' | 'Food & Hospitality' | 'Industrial'
  | 'Storage' | 'Parking' | 'Specialized Storage'
  | 'Land' | 'Outdoor Space'
  | 'Short Stay'
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
  currency: Currency;            // USD or RWF
  location: string;
  amenities: string[];
  images: string[];
  ownerId: string;
  tenantId?: string;
  status: PropertyStatus;
  isPublic: boolean;
  createdAt: string;
}

export interface Unit {
  id: string;
  propertyId: string;
  ownerId: string;
  title: string;
  description: string;
  price: number;
  currency: Currency;
  status: PropertyStatus;
  images: string[];
  amenities?: string[];
  createdAt: string;
}

export type ContractStatus = 'active' | 'expired' | 'on_notice';

export interface Contract {
  id: string;
  propertyId: string;
  tenantId: string;
  ownerId: string;
  rentAmount: number;
  depositAmount: number;
  currency: Currency;
  startDate: string;
  endDate: string;
  contractDocumentURL?: string;
  status: ContractStatus;
  noticeDate?: string;
  noticePeriodDays?: number; // e.g. 15 for 15-day notice
  lateFeePercent?: number; // e.g. 2 for 2%
  lateFeeGraceDays?: number; // e.g. 5 days after due date
  createdAt: string;
}

export type MaintenancePriority = 'low' | 'medium' | 'high' | 'urgent';
export type MaintenanceStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

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
  repairCost?: number;
  ownerComment?: string;
  timeline?: string; // Estimated timeline, e.g. "Expected completion: Friday"
}

export type BookingStatus = 'pending' | 'approved' | 'rejected';

export interface BookingRequest {
  id: string;
  propertyId: string;
  unitId?: string; // Optional if booking a specific unit
  tenantId: string;
  ownerId: string;
  message: string;
  status: BookingStatus;
  createdAt: string;
}

export interface PlatformSettings {
  serviceFeePercent: number;
  serviceFeeFixed: number;
  serviceFeeType: 'percent' | 'fixed';
  defaultCurrency: Currency;
  defaultLanguage: Language;
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
  month: string;
  amount: number;
  currency: Currency;
  proofUrl: string;
  notes: string;
  status: PaymentStatus;
  ebmUrl?: string; // Owner receipt
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
  currency: Currency;
  receiptUrls: string[];
  status: ReimbursementStatus;
  ownerNote?: string;
  createdAt: string;
  resolvedAt?: string;
}