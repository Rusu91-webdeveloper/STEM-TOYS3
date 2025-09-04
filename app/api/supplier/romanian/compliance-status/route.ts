import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Check if user is a supplier
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
      select: {
        id: true,
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
        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      supplierId: supplier.id,
      status: supplier.status,
      anpcApproval: supplier.anpcApproval,
      iscApproval: supplier.iscApproval,
      educationalCertification: supplier.educationalCertification,
      romanianComplianceStatus: supplier.romanianComplianceStatus,
      userEmail: supplier.user?.email,
      // Additional fields needed for compliance dashboard
      cui: supplier.cui,
      nrRegCom: supplier.nrRegCom,
      codFiscal: supplier.codFiscal,
      romanianVatNumber: supplier.romanianVatNumber,
      romanianBankAccount: supplier.romanianBankAccount,
    });
  } catch (error) {
    console.error("Error fetching compliance status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { complianceStatus, approvalType, certificationNumber } = body;

    // Check if user is a supplier
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id },
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Update compliance status based on approval type
    const updateData: any = {};

    if (approvalType === "anpc") {
      updateData.anpcApproval = complianceStatus === "approved";
    } else if (approvalType === "isc") {
      updateData.iscApproval = complianceStatus === "approved";
    } else if (approvalType === "educational") {
      updateData.educationalCertification = certificationNumber;
    }

    if (complianceStatus === "approved") {
      updateData.romanianComplianceStatus = "APPROVED";
    } else if (complianceStatus === "pending") {
      updateData.romanianComplianceStatus = "PENDING";
    } else if (complianceStatus === "rejected") {
      updateData.romanianComplianceStatus = "REJECTED";
    }

    const updatedSupplier = await db.supplier.update({
      where: { id: supplier.id },
      data: updateData,
      select: {
        id: true,
        status: true,
        anpcApproval: true,
        iscApproval: true,
        educationalCertification: true,
        romanianComplianceStatus: true,
      },
    });

    return NextResponse.json({
      success: true,
      supplier: updatedSupplier,
    });
  } catch (error) {
    console.error("Error updating compliance status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
