export interface Supplier {
  id: string;
  userId: string;
  companyName: string;
  companySlug: string;
  description?: string;
  website?: string;
  phone: string;
  vatNumber?: string;
  taxId?: string;
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessCountry: string;
  businessPostalCode: string;
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  yearEstablished?: number;
  employeeCount?: number;
  annualRevenue?: string;
  certifications: string[];
  productCategories: string[];
  status: SupplierStatus;
  approvedAt?: Date;
  approvedBy?: string;
  rejectionReason?: string;
  commissionRate: number;
  paymentTerms: number;
  minimumOrderValue: number;
  logo?: string;
  catalogUrl?: string;
  termsAccepted: boolean;
  privacyAccepted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type SupplierStatus = 
  | "PENDING"
  | "APPROVED" 
  | "REJECTED"
  | "SUSPENDED"
  | "INACTIVE";

export type SupplierOrderStatus = 
  | "PENDING"
  | "CONFIRMED"
  | "IN_PRODUCTION"
  | "READY_TO_SHIP"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type InvoiceStatus = 
  | "DRAFT"
  | "SENT"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED";

export interface SupplierRegistrationData {
  // Company Information
  companyName: string;
  description?: string;
  website?: string;
  phone: string;
  vatNumber?: string;
  taxId?: string;
  
  // Business Address
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessCountry: string;
  businessPostalCode: string;
  
  // Contact Person
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  
  // Business Details
  yearEstablished?: number;
  employeeCount?: number;
  annualRevenue?: string;
  certifications: string[];
  productCategories: string[];
  
  // Legal
  termsAccepted: boolean;
  privacyAccepted: boolean;
  
  // Files
  logo?: File;
  catalogUrl?: string;
}

export interface SupplierStats {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  commissionEarned: number;
  pendingInvoices: number;
}

export interface SupplierOrder {
  id: string;
  supplierId: string;
  orderId: string;
  orderItemId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  commission: number;
  supplierRevenue: number;
  status: SupplierOrderStatus;
  shippedAt?: Date;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierInvoice {
  id: string;
  supplierId: string;
  invoiceNumber: string;
  periodStart: Date;
  periodEnd: Date;
  subtotal: number;
  commission: number;
  totalAmount: number;
  status: InvoiceStatus;
  dueDate: Date;
  paidAt?: Date;
  paymentMethod?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
