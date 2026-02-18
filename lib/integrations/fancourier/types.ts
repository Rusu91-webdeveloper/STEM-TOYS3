/**
 * FAN Courier TypeScript Type Definitions
 *
 * Based on FAN Courier SelfAWB API documentation + Postman collection.
 */

export interface FanCourierAddress {
    county: string;
    locality: string;
    street: string;
    streetNo?: string;
    zipCode?: string;
    building?: string;
    entrance?: string;
    floor?: string;
    apartment?: string;
    pickupLocation?: string;
}

/**
 * Sender information (optional for "ocazional" requests)
 */
export interface FanCourierSender {
    name: string;
    contactperson?: string;
    email?: string;
    phone: string;
    secondaryPhone?: string;
    address: FanCourierAddress;
}

/**
 * Recipient information
 */
export interface FanCourierRecipient {
    name: string;
    phone: string;
    secondaryPhone?: string;
    email?: string;
    address: FanCourierAddress;
}

/**
 * FAN Courier service types
 */
export type FanCourierServiceType =
    | "Standard"
    | "FANbox"
    | "Express"
    | "RedCode"
    | "Cont Colector"
    | "Express Loco 1h"
    | "Express Loco 2h"
    | "Express Loco 4h"
    | "Express Loco 6h"
    | "Export"
    | "CollectPoint"
    | "Produse Albe"
    | "Transport Marfa";

/**
 * Payment party for shipping costs
 */
export type FanCourierPaymentParty = "sender" | "recipient";

export interface FanCourierPackagesInfo {
    parcel: number;
    envelope?: number;
    envelopes?: number;
}

export interface FanCourierDimensions {
    length: number;
    height: number;
    width: number;
}

export interface FanCourierShipmentInfo {
    service: FanCourierServiceType;
    bank?: string;
    bankAccount?: string;
    packages: FanCourierPackagesInfo;
    weight: number;
    cod: number;
    declaredValue: number;
    payment: FanCourierPaymentParty;
    refund?: number | null;
    returnPayment?: number | null;
    observation?: string | null;
    content?: string | null;
    length?: number;
    width?: number;
    height?: number;
    dimensions?: FanCourierDimensions;
    costCenter?: string | null;
    options?: string[];
}

export interface FanCourierShipment {
    info: FanCourierShipmentInfo;
    recipient: FanCourierRecipient;
    sender?: FanCourierSender;
}

/**
 * Full AWB creation payload
 */
export interface FanCourierAwbPayload {
    clientId: number;
    shipments: FanCourierShipment[];
}

/**
 * AWB creation response from FAN Courier
 */
export interface FanCourierAwbResponse {
    success?: boolean;
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
    data?: Record<string, unknown>;
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
    contactPerson?: string;
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
        contactPerson: process.env.FANCOURIER_SENDER_CONTACT_PERSON,
    };
}
