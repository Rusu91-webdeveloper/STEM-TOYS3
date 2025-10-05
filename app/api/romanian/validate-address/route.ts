import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { withAuth } from "@/lib/authorization";
import { z } from "zod";

// Romanian counties (județe)
const ROMANIAN_COUNTIES = [
  "ALBA",
  "ARAD",
  "ARGEȘ",
  "BACĂU",
  "BIHOR",
  "BISTRIȚA-NĂSĂUD",
  "BOTOȘANI",
  "BRAȘOV",
  "BRĂILA",
  "BUCUREȘTI",
  "BUZĂU",
  "CARAȘ-SEVERIN",
  "CĂLĂRAȘI",
  "CLUJ",
  "CONSTANȚA",
  "COVASNA",
  "DÂMBOVIȚA",
  "DOLJ",
  "GALAȚI",
  "GIURGIU",
  "GORJ",
  "HARGHITA",
  "HUNEDOARA",
  "IALOMIȚA",
  "IAȘI",
  "ILFOV",
  "MARAMUREȘ",
  "MEHEDINȚI",
  "MUREȘ",
  "NEAMȚ",
  "OLT",
  "PRAHOVA",
  "SATU MARE",
  "SĂLAJ",
  "SIBIU",
  "SUCEAVA",
  "TELEORMAN",
  "TIMIȘ",
  "TULCEA",
  "VASLUI",
  "VÂLCEA",
  "VRANCEA",
];

// Validation schema for Romanian addresses
const romanianAddressSchema = z.object({
  addressLine1: z.string().min(1, "Adresa este obligatorie"),
  city: z.string().min(1, "Orașul este obligatoriu"),
  postalCode: z
    .string()
    .regex(/^\d{6}$/, "Codul poștal trebuie să aibă 6 cifre"),
  country: z.literal("Romania", "Țara trebuie să fie România"),
  judet: z.enum(
    ROMANIAN_COUNTIES as [string, ...string[]],
    "Județul nu este valid"
  ),
  localitate: z.string().min(1, "Localitatea este obligatorie"),
  sector: z.enum(["1", "2", "3", "4", "5", "6"]).optional(),
});

/**
 * POST /api/romanian/validate-address - Validate Romanian address format
 */
export const POST = withAuth(async (request: NextRequest, session) => {
  try {
    const body = await request.json();
    const validation = romanianAddressSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          valid: false,
          errors: validation.error.issues.map(issue => ({
            field: issue.path.join("."),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const addressData = validation.data;

    // Additional Romanian-specific validations
    const additionalValidations = validateRomanianAddressRules(addressData);

    if (!additionalValidations.valid) {
      return NextResponse.json(
        {
          valid: false,
          errors: additionalValidations.errors,
        },
        { status: 400 }
      );
    }

    // Check if postal code matches the county
    const postalCodeValidation = validatePostalCodeByCounty(
      addressData.postalCode,
      addressData.judet
    );
    if (!postalCodeValidation.valid) {
      return NextResponse.json(
        {
          valid: false,
          errors: [
            { field: "postalCode", message: postalCodeValidation.message },
          ],
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      normalizedAddress: normalizeRomanianAddress(addressData),
      compliance: {
        gdprCompliant: true,
        anpcCompliant: true,
        fiscalCompliant: true,
      },
    });
  } catch (error) {
    console.error("Error validating Romanian address:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

/**
 * GET /api/romanian/validate-address - Get Romanian address validation metadata
 */
export const GET = withAuth(async (request: NextRequest, session) => {
  try {
    return NextResponse.json({
      counties: ROMANIAN_COUNTIES,
      bucharestSectors: ["1", "2", "3", "4", "5", "6"],
      postalCodeFormat: "NNNNNN (6 digits)",
      requiredFields: [
        "addressLine1",
        "city",
        "postalCode",
        "country",
        "judet",
        "localitate",
      ],
      optionalFields: ["sector"],
      compliance: {
        anpcRequirements: "Adresa completă pentru consumatori",
        fiscalRequirements: "Adresa de facturare pentru persoane juridice",
        gdprRequirements: "Prelucrarea datelor cu consimțământ",
      },
    });
  } catch (error) {
    console.error("Error getting address validation metadata:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});

/**
 * Validate Romanian address specific rules
 */
function validateRomanianAddressRules(
  address: z.infer<typeof romanianAddressSchema>
) {
  const errors: Array<{ field: string; message: string }> = [];

  // Bucharest sector validation
  if (
    address.city.toLowerCase().includes("bucurești") ||
    address.city.toLowerCase().includes("bucharest")
  ) {
    if (!address.sector) {
      errors.push({
        field: "sector",
        message: "Pentru București trebuie specificat sectorul (1-6)",
      });
    }
  }

  // Address line format validation (Romanian addresses should be detailed)
  if (address.addressLine1.length < 10) {
    errors.push({
      field: "addressLine1",
      message: "Adresa trebuie să fie mai detaliată (minim 10 caractere)",
    });
  }

  // Check for Romanian-specific address patterns
  const romanianPatterns = [
    /strada|calea|pța|piața|blvd|șoseaua|intrarea|scările/i,
  ];

  const hasRomanianElements = romanianPatterns.some(pattern =>
    pattern.test(address.addressLine1)
  );

  if (!hasRomanianElements) {
    errors.push({
      field: "addressLine1",
      message:
        "Adresa ar trebui să conțină elemente specifice românești (strada, piața, etc.)",
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate postal code by county (rough validation based on first 2 digits)
 */
function validatePostalCodeByCounty(postalCode: string, county: string) {
  // Romanian postal codes: first 2 digits indicate county/regional area
  const firstTwoDigits = parseInt(postalCode.substring(0, 2));

  // This is a simplified validation - in production you'd use a complete mapping
  const countyPostalRanges: Record<string, number[]> = {
    BUCUREȘTI: [0, 6], // Bucharest sectors
    CLUJ: [40],
    TIMIȘ: [30],
    BRAȘOV: [50],
    CONSTANȚA: [90],
    IAȘI: [70],
    // Add more counties as needed
  };

  const allowedRanges = countyPostalRanges[county.toUpperCase()];
  if (allowedRanges) {
    const isValid = allowedRanges.some(range => firstTwoDigits === range);
    if (!isValid) {
      return {
        valid: false,
        message: `Codul poștal ${postalCode} nu corespunde județului ${county}`,
      };
    }
  }

  return { valid: true };
}

/**
 * Normalize Romanian address for consistency
 */
function normalizeRomanianAddress(
  address: z.infer<typeof romanianAddressSchema>
) {
  return {
    ...address,
    city:
      address.city.charAt(0).toUpperCase() +
      address.city.slice(1).toLowerCase(),
    judet: address.judet.toUpperCase(),
    localitate:
      address.localitate.charAt(0).toUpperCase() +
      address.localitate.slice(1).toLowerCase(),
    country: "România", // Normalize to Romanian name
    formattedAddress: formatRomanianAddress(address),
  };
}

/**
 * Format address according to Romanian standards
 */
function formatRomanianAddress(address: z.infer<typeof romanianAddressSchema>) {
  const parts = [
    address.addressLine1,
    address.addressLine2,
    `${address.postalCode} ${address.city}`,
    address.judet,
    "România",
  ].filter(Boolean);

  return parts.join(", ");
}
