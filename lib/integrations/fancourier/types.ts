/**
 * FAN Courier TypeScript Type Definitions
 *
 * Based on FAN Courier SelfAWB API documentation
 */

/**
 * Sender information for AWB
 */
export interface FanCourierSender {
    name: string;
    phone: string;
    email?: string;
    county: string;
    locality: string;
    street: string;
    number?: string;
    postalCode?: string;
    companyName?: string;
    cui?: string;
}

/**
 * Recipient information for AWB
 */
export interface FanCourierRecipient {
    name: string;
    phone: string;
    email?: string;
    county: string;
    locality: string;
    street: string;
    number?: string;
    postalCode?: string;
    companyName?: string;
    cui?: string;
}

/**
 * Package dimensions and weight
 */
export interface FanCourierPackage {
    weight: number; // kg
    width?: number; // cm
    height?: number; // cm
    length?: number; // cm
}

/**
 * FAN Courier service types
 */
export type FanCourierServiceType =
    | "Standard"
    | "Express"
    | "RedCode"
    | "Cont Colector"
    | "Express Loco 1h"
    | "Express Loco 2h"
    | "Express Loco 4h"
    | "Express Loco 6h";

/**
 * Payment party for shipping costs
 */
export type FanCourierPaymentParty = "sender" | "recipient";

/**
 * Reimbursement (COD) type
 */
export type FanCourierReimbursementType = "cash" | "bank";

/**
 * Full AWB creation payload
 */
export interface FanCourierAwbPayload {
    // Sender info
    sender: FanCourierSender;
    // Recipient info
    recipient: FanCourierRecipient;
    // Package details
    packages: FanCourierPackage[];
    // Shipping options
    service: FanCourierServiceType;
    content: string;
    envelopes: number;
    parcels: number;
    weight: number;
    // Payment
    payment: FanCourierPaymentParty;
    // COD / Reimbursement
    reimbursement?: number;
    reimbursementType?: FanCourierReimbursementType;
    // Insurance
    declaredValue?: number;
    // Reference
    clientReference: string;
    observation?: string;
    // Additional options
    openPackage?: boolean;
    saturday?: boolean;
    morning?: boolean;
    returnDocuments?: boolean;
    returnDocumentsNumber?: number;
}

/**
 * AWB creation response from FAN Courier
 */
export interface FanCourierAwbResponse {
    success: boolean;
    awbNumber?: string;
    awb_number?: string;
    awb?: string;
    message?: string;
    info?: string;
    error?: string;
    extra_km?: boolean;
    extraKm?: boolean;
    remote_locality?: boolean;
    remoteLocality?: boolean;
    out_of_network?: boolean;
    outOfNetwork?: boolean;
    data?: {
        awbNumber?: string;
        awb_number?: string;
    };
}

/**
 * AWB tracking status
 */
export interface FanCourierTrackingStatus {
    awbNumber: string;
    status: string;
    statusCode: string;
    statusDate: string;
    location?: string;
    signature?: string;
}

/**
 * Configuration for FAN Courier sender (from environment)
 */
export interface FanCourierSenderConfig {
    name: string;
    phone: string;
    email?: string;
    county: string;
    locality: string;
    street: string;
    number: string;
    postalCode?: string;
}

/**
 * Get sender configuration from environment variables
 */
export function getFanCourierSenderConfig(): FanCourierSenderConfig {
    return {
        name: process.env.FANCOURIER_SENDER_NAME || "TechTots SRL",
        phone: process.env.FANCOURIER_SENDER_PHONE || "",
        email: process.env.FANCOURIER_SENDER_EMAIL,
        county: process.env.FANCOURIER_SENDER_COUNTY || "Cluj",
        locality: process.env.FANCOURIER_SENDER_LOCALITY || "Cluj-Napoca",
        street: process.env.FANCOURIER_SENDER_STREET || "Mehedinți",
        number: process.env.FANCOURIER_SENDER_NUMBER || "54-56",
        postalCode: process.env.FANCOURIER_SENDER_POSTAL_CODE,
    };
}
