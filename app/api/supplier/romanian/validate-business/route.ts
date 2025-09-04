import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { cui, nrRegCom, codFiscal } = body;

    // Validate required fields
    if (!cui || !nrRegCom || !codFiscal) {
      return NextResponse.json(
        { error: "CUI, Nr. Reg. Com., and Cod Fiscal are required" },
        { status: 400 }
      );
    }

    // Check if user is a supplier
    const supplier = await db.supplier.findUnique({
      where: { userId: session.user.id }
    });

    if (!supplier) {
      return NextResponse.json(
        { error: "Supplier not found" },
        { status: 404 }
      );
    }

    // Update supplier with Romanian business information
    const updatedSupplier = await db.supplier.update({
      where: { id: supplier.id },
      data: {
        cui,
        nrRegCom,
        codFiscal,
        updatedAt: new Date()
      },
      select: {
        id: true,
        cui: true,
        nrRegCom: true,
        codFiscal: true,
        status: true
      }
    });

    return NextResponse.json({
      success: true,
      message: "Business information validated and updated",
      supplier: updatedSupplier
    });

  } catch (error) {
    console.error("Error validating business information:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
