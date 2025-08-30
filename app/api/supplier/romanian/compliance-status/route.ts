import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { RomanianComplianceStatus } from "@/types/romanian";

// Update compliance status schema
const updateComplianceSchema = z.object({
  anpcApproval: z.boolean().optional(),
  iscApproval: z.boolean().optional(),
  educationalCertification: z.string().optional(),
  romanianComplianceStatus: z.nativeEnum(RomanianComplianceStatus).optional(),
  notes: z.string().optional(),
});

export const GET = async (request: NextRequest) => {
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

    // Get supplier data with Romanian compliance fields
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
        businessCountry: true,
        status: true,
        anpcApproval: true,
        iscApproval: true,
        educationalCertification: true,
        romanianComplianceStatus: true,
        cui: true,
        nrRegCom: true,
        codFiscal: true,
        romanianVatNumber: true,
        romanianBankAccount: true,
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
        { error: "Romanian compliance status is only available for Romanian suppliers" },
        { status: 400 }
      );
    }

    // Calculate compliance score
    const complianceFields = [
      supplier.anpcApproval,
      supplier.iscApproval,
      supplier.educationalCertification,
      supplier.cui,
      supplier.nrRegCom,
      supplier.codFiscal,
      supplier.romanianVatNumber,
      supplier.romanianBankAccount,
    ];

    const completedFields = complianceFields.filter(field => field !== null && field !== undefined && field !== false).length;
    const totalFields = complianceFields.length;
    const complianceScore = Math.round((completedFields / totalFields) * 100);

    // Determine compliance status if not set
    let effectiveStatus = supplier.romanianComplianceStatus;
    if (!effectiveStatus) {
      if (complianceScore === 100) {
        effectiveStatus = RomanianComplianceStatus.APPROVED;
      } else if (complianceScore >= 50) {
        effectiveStatus = RomanianComplianceStatus.IN_REVIEW;
      } else {
        effectiveStatus = RomanianComplianceStatus.PENDING;
      }
    }

    // Get compliance requirements
    const complianceRequirements = [
      {
        field: "anpcApproval",
        label: "ANPC Approval",
        description: "Autoritatea Națională pentru Protecția Consumatorilor approval",
        status: supplier.anpcApproval ? "completed" : "pending",
        required: true,
      },
      {
        field: "iscApproval",
        label: "ISC Approval",
        description: "Institutul de Sănătate Publică approval",
        status: supplier.iscApproval ? "completed" : "pending",
        required: true,
      },
      {
        field: "educationalCertification",
        label: "Educational Certification",
        description: "Ministry of Education certification",
        status: supplier.educationalCertification ? "completed" : "pending",
        required: false,
      },
      {
        field: "cui",
        label: "CUI",
        description: "Cod Unic de Înregistrare",
        status: supplier.cui ? "completed" : "pending",
        required: true,
      },
      {
        field: "nrRegCom",
        label: "Nr. Reg. Com.",
        description: "Numărul de înregistrare la Registrul Comerțului",
        status: supplier.nrRegCom ? "completed" : "pending",
        required: true,
      },
      {
        field: "codFiscal",
        label: "Cod Fiscal",
        description: "Cod fiscal",
        status: supplier.codFiscal ? "completed" : "pending",
        required: true,
      },
      {
        field: "romanianVatNumber",
        label: "VAT Number",
        description: "Romanian VAT number",
        status: supplier.romanianVatNumber ? "completed" : "pending",
        required: false,
      },
      {
        field: "romanianBankAccount",
        label: "Bank Account",
        description: "Romanian bank account",
        status: supplier.romanianBankAccount ? "completed" : "pending",
        required: false,
      },
    ];

    return NextResponse.json({
      complianceStatus: effectiveStatus,
      complianceScore,
      completedFields,
      totalFields,
      requirements: complianceRequirements,
      details: {
        anpcApproval: supplier.anpcApproval,
        iscApproval: supplier.iscApproval,
        educationalCertification: supplier.educationalCertification,
        cui: supplier.cui,
        nrRegCom: supplier.nrRegCom,
        codFiscal: supplier.codFiscal,
        romanianVatNumber: supplier.romanianVatNumber,
        romanianBankAccount: supplier.romanianBankAccount,
      }
    });

  } catch (error) {
    logger.error("Error getting Romanian compliance status", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};

export const PATCH = async (request: NextRequest) => {
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
        { error: "Romanian compliance status is only available for Romanian suppliers" },
        { status: 400 }
      );
    }

    // Check if supplier is approved
    if (supplier.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Supplier account must be approved to update Romanian compliance" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validationResult = updateComplianceSchema.safeParse(body);

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

    // Update supplier compliance status
    const updatedSupplier = await db.supplier.update({
      where: { id: supplier.id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        anpcApproval: true,
        iscApproval: true,
        educationalCertification: true,
        romanianComplianceStatus: true,
      },
    });

    // Log compliance update
    logger.info("Romanian compliance status updated", {
      supplierId: supplier.id,
      updatedFields: Object.keys(data),
      newStatus: data.romanianComplianceStatus,
    });

    return NextResponse.json({
      message: "Compliance status updated successfully",
      complianceStatus: updatedSupplier.romanianComplianceStatus,
      details: {
        anpcApproval: updatedSupplier.anpcApproval,
        iscApproval: updatedSupplier.iscApproval,
        educationalCertification: updatedSupplier.educationalCertification,
      }
    });

  } catch (error) {
    logger.error("Error updating Romanian compliance status", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};
