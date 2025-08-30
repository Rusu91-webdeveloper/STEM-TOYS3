// Romanian market-specific types and interfaces

export interface RomanianBusinessInfo {
  cui: string;                    // Cod Unic de Înregistrare
  nrRegCom: string;              // Numărul de înregistrare la Registrul Comerțului
  codFiscal: string;             // Cod fiscal
  adresaSediu: string;           // Adresa sediului social
  reprezentantLegal: string;     // Reprezentant legal
  anpcApproval: boolean;         // ANPC approval
  iscApproval: boolean;          // ISC approval
  educationalCertification?: string; // Ministry of Education certification
  romanianVatNumber?: string;    // Romanian VAT number
  romanianBankAccount?: string;  // Romanian bank account
  romanianPaymentTerms: number;  // Payment terms in days
  romanianCurrency: string;      // Romanian currency (RON)
  romanianComplianceStatus: RomanianComplianceStatus;
}

export interface RomanianEducationalStandards {
  romanianEducationalLevel?: RomanianEducationalLevel;
  romanianCurriculumAlignment: string[];     // Romanian curriculum standards
  romanianSubjectAreas: string[];           // Romanian subject areas
  romanianCompetencies: string[];           // Romanian competencies
  romanianTeacherResources: string[];       // Romanian teacher resources
  romanianParentGuides: string[];           // Romanian parent guides
  romanianMinistryApproval: boolean;        // Ministry of Education approval
  romanianEducationalCertification?: string; // Educational certification
}

export enum RomanianComplianceStatus {
  PENDING = "PENDING",
  IN_REVIEW = "IN_REVIEW",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  EXPIRED = "EXPIRED",
  NEEDS_UPDATE = "NEEDS_UPDATE"
}

export enum RomanianEducationalLevel {
  GRADINITA = "GRADINITA",           // Kindergarten
  PRIMAR = "PRIMAR",                 // Primary school
  GIMNAZIU = "GIMNAZIU",             // Middle school
  LICEU = "LICEU",                   // High school
  UNIVERSITATE = "UNIVERSITATE"      // University
}

export enum RomanianPaymentMethod {
  BCR_TRANSFER = "BCR_TRANSFER",
  BRD_TRANSFER = "BRD_TRANSFER",
  RAIFFEISEN_TRANSFER = "RAIFFEISEN_TRANSFER",
  PAYU = "PAYU",
  NETOPIA = "NETOPIA",
  CASH_ON_DELIVERY = "CASH_ON_DELIVERY"
}

export enum RomanianBank {
  BCR = "BCR",
  BRD = "BRD",
  RAIFFEISEN = "RAIFFEISEN",
  ING = "ING",
  UNICREDIT = "UNICREDIT",
  TRANSILVANIA = "TRANSILVANIA"
}

export interface RomanianPaymentInfo {
  bank: RomanianBank;
  accountNumber: string;
  iban: string;
  swiftCode: string;
  accountHolder: string;
  paymentTerms: number; // days
}

export interface RomanianTaxInfo {
  vatNumber: string;
  fiscalCode: string;
  taxOffice: string;
  vatRate: number; // percentage
  isVatRegistered: boolean;
}

export interface RomanianComplianceDocument {
  id: string;
  type: RomanianComplianceDocumentType;
  fileName: string;
  fileUrl: string;
  uploadDate: Date;
  expiryDate?: Date;
  status: RomanianComplianceStatus;
  notes?: string;
}

export enum RomanianComplianceDocumentType {
  ANPC_APPROVAL = "ANPC_APPROVAL",
  ISC_APPROVAL = "ISC_APPROVAL",
  MINISTRY_EDUCATION = "MINISTRY_EDUCATION",
  BUSINESS_REGISTRATION = "BUSINESS_REGISTRATION",
  VAT_CERTIFICATE = "VAT_CERTIFICATE",
  FISCAL_CERTIFICATE = "FISCAL_CERTIFICATE",
  SAFETY_CERTIFICATE = "SAFETY_CERTIFICATE",
  QUALITY_CERTIFICATE = "QUALITY_CERTIFICATE"
}

export interface RomanianCurriculumStandard {
  id: string;
  level: RomanianEducationalLevel;
  subject: string;
  competency: string;
  description: string;
  grade: string;
}

export interface RomanianMarketData {
  currency: string;
  vatRate: number;
  paymentTerms: number[];
  banks: RomanianBank[];
  complianceRequirements: RomanianComplianceDocumentType[];
  educationalLevels: RomanianEducationalLevel[];
}

// Romanian validation schemas
export const romanianBusinessValidation = {
  cui: {
    pattern: /^RO\d{2,10}$/,
    message: "CUI must be in format RO followed by 2-10 digits"
  },
  nrRegCom: {
    pattern: /^J\d{2}\/\d{1,4}\/\d{4}$/,
    message: "Nr. Reg. Com. must be in format J##/####/####"
  },
  codFiscal: {
    pattern: /^\d{8,10}$/,
    message: "Cod fiscal must be 8-10 digits"
  },
  vatNumber: {
    pattern: /^RO\d{2,10}$/,
    message: "VAT number must be in format RO followed by 2-10 digits"
  },
  iban: {
    pattern: /^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$/,
    message: "IBAN must be a valid Romanian IBAN"
  }
};

// Romanian market constants
export const ROMANIAN_MARKET_CONSTANTS = {
  DEFAULT_CURRENCY: "RON",
  DEFAULT_VAT_RATE: 19,
  DEFAULT_PAYMENT_TERMS: 30,
  SUPPORTED_BANKS: [
    RomanianBank.BCR,
    RomanianBank.BRD,
    RomanianBank.RAIFFEISEN,
    RomanianBank.ING,
    RomanianBank.UNICREDIT,
    RomanianBank.TRANSILVANIA
  ],
  COMPLIANCE_REQUIREMENTS: [
    RomanianComplianceDocumentType.ANPC_APPROVAL,
    RomanianComplianceDocumentType.ISC_APPROVAL,
    RomanianComplianceDocumentType.BUSINESS_REGISTRATION,
    RomanianComplianceDocumentType.VAT_CERTIFICATE
  ],
  EDUCATIONAL_LEVELS: [
    RomanianEducationalLevel.GRADINITA,
    RomanianEducationalLevel.PRIMAR,
    RomanianEducationalLevel.GIMNAZIU,
    RomanianEducationalLevel.LICEU,
    RomanianEducationalLevel.UNIVERSITATE
  ]
};

// Romanian utility functions
export const isRomanianSupplier = (country: string): boolean => {
  return country === "România" || country === "Romania";
};

export const formatRomanianCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: 'RON'
  }).format(amount);
};

export const formatRomanianDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
};

export const validateRomanianCUI = (cui: string): boolean => {
  return romanianBusinessValidation.cui.pattern.test(cui);
};

export const validateRomanianIBAN = (iban: string): boolean => {
  return romanianBusinessValidation.iban.pattern.test(iban);
};

export const getRomanianComplianceStatusColor = (status: RomanianComplianceStatus): string => {
  switch (status) {
    case RomanianComplianceStatus.APPROVED:
      return "text-green-600 bg-green-50";
    case RomanianComplianceStatus.PENDING:
      return "text-yellow-600 bg-yellow-50";
    case RomanianComplianceStatus.IN_REVIEW:
      return "text-blue-600 bg-blue-50";
    case RomanianComplianceStatus.REJECTED:
      return "text-red-600 bg-red-50";
    case RomanianComplianceStatus.EXPIRED:
      return "text-orange-600 bg-orange-50";
    case RomanianComplianceStatus.NEEDS_UPDATE:
      return "text-purple-600 bg-purple-50";
    default:
      return "text-gray-600 bg-gray-50";
  }
};

export const getRomanianEducationalLevelLabel = (level: RomanianEducationalLevel): string => {
  switch (level) {
    case RomanianEducationalLevel.GRADINITA:
      return "Grădiniță";
    case RomanianEducationalLevel.PRIMAR:
      return "Școală Primară";
    case RomanianEducationalLevel.GIMNAZIU:
      return "Gimnaziu";
    case RomanianEducationalLevel.LICEU:
      return "Liceu";
    case RomanianEducationalLevel.UNIVERSITATE:
      return "Universitate";
    default:
      return "Necunoscut";
  }
};
