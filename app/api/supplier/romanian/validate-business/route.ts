import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { 
  validateRomanianCUI, 
  validateRomanianIBAN,
  romanianBusinessValidation 
} from "@/types/romanian";

// Romanian business validation schema
const romanianBusinessValidationSchema = z.object({
  cui: z.string().optional(),
  nrRegCom: z.string().optional(),
  codFiscal: z.string().optional(),
  vatNumber: z.string().optional(),
  bankAccount: z.string().optional(),
  iban: z.string().optional(),
});

export const POST = async (request: NextRequest) => {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is a supplier
    if (session.user.role !== "SUPPLIER") {
      return NextResponse.json(
        { error: "Access denied. Supplier role required." },
        { status: 403 }
      );
    }

    // Get supplier data
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        businessCountry: true,
        status: true,
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier profile not found" },
        { status: 404 }
      );
    }

    // Check if supplier is from Romania
    if (supplier.businessCountry !== "România" && supplier.businessCountry !== "Romania") {
      return NextResponse.json(
        { error: "Romanian business validation is only available for Romanian suppliers" },
        { status: 400 }
      );
    }

    // Check if supplier is approved
    if (supplier.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Supplier account must be approved to use Romanian features" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validationResult = romanianBusinessValidationSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request data",
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;
    const errors: Array<{ field: string; message: string; code: string }> = [];
    const warnings: Array<{ field: string; message: string; code: string }> = [];

    // Validate CUI
    if (data.cui) {
      if (!validateRomanianCUI(data.cui)) {
        errors.push({
          field: "cui",
          message: romanianBusinessValidation.cui.message,
          code: "INVALID_CUI_FORMAT"
        });
      } else {
        // Check if CUI already exists in database
        const existingSupplier = await db.supplier.findFirst({
          where: {
            cui: data.cui,
            id: { not: supplier.id }
          }
        });
        
        if (existingSupplier) {
          errors.push({
            field: "cui",
            message: "This CUI is already registered with another supplier",
            code: "CUI_ALREADY_EXISTS"
          });
        }
      }
    }

    // Validate Nr. Reg. Com.
    if (data.nrRegCom) {
      if (!romanianBusinessValidation.nrRegCom.pattern.test(data.nrRegCom)) {
        errors.push({
          field: "nrRegCom",
          message: romanianBusinessValidation.nrRegCom.message,
          code: "INVALID_NR_REG_COM_FORMAT"
        });
      }
    }

    // Validate Cod Fiscal
    if (data.codFiscal) {
      if (!romanianBusinessValidation.codFiscal.pattern.test(data.codFiscal)) {
        errors.push({
          field: "codFiscal",
          message: romanianBusinessValidation.codFiscal.message,
          code: "INVALID_COD_FISCAL_FORMAT"
        });
      }
    }

    // Validate VAT Number
    if (data.vatNumber) {
      if (!romanianBusinessValidation.vatNumber.pattern.test(data.vatNumber)) {
        errors.push({
          field: "vatNumber",
          message: romanianBusinessValidation.vatNumber.message,
          code: "INVALID_VAT_NUMBER_FORMAT"
        });
      } else {
        // Check if VAT number already exists
        const existingSupplier = await db.supplier.findFirst({
          where: {
            romanianVatNumber: data.vatNumber,
            id: { not: supplier.id }
          }
        });
        
        if (existingSupplier) {
          errors.push({
            field: "vatNumber",
            message: "This VAT number is already registered with another supplier",
            code: "VAT_NUMBER_ALREADY_EXISTS"
          });
        }
      }
    }

    // Validate IBAN
    if (data.iban) {
      if (!validateRomanianIBAN(data.iban)) {
        errors.push({
          field: "iban",
          message: romanianBusinessValidation.iban.message,
          code: "INVALID_IBAN_FORMAT"
        });
      }
    }

    // Validate Bank Account (basic format check)
    if (data.bankAccount) {
      if (!/^RO\d{2}[A-Z]{4}[A-Z0-9]{16}$/.test(data.bankAccount)) {
        warnings.push({
          field: "bankAccount",
          message: "Bank account should be in Romanian IBAN format (RO + 2 digits + 4 letters + 16 alphanumeric)",
          code: "BANK_ACCOUNT_FORMAT_WARNING"
        });
      }
    }

    // Log validation attempt
    logger.info("Romanian business validation performed", {
      supplierId: supplier.id,
      fieldsValidated: Object.keys(data),
      errorCount: errors.length,
      warningCount: warnings.length,
    });

    return NextResponse.json({
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        totalFields: Object.keys(data).length,
        validFields: Object.keys(data).length - errors.length,
        errorCount: errors.length,
        warningCount: warnings.length,
      }
    });

  } catch (error) {
    logger.error("Error in Romanian business validation", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
