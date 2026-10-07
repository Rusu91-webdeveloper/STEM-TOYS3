import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { validateCsrfForRequest } from "@/lib/csrf";
import { db } from "@/lib/db";
import {
  getReturnDestination,
  writeDestinationEvidence,
} from "@/lib/returns/return-destination";
import {
  destinationReviewSchema,
  reviewSupplierDestination,
  supplierReturnSelect,
} from "@/lib/returns/supplier-return-contracts";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ returnId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN")
    return NextResponse.json(
      { error: "Admin access required" },
      { status: 403 }
    );
  if (!(await validateCsrfForRequest(request)).valid)
    return NextResponse.json(
      { error: "Security validation failed" },
      { status: 403 }
    );
  try {
    const parsed = destinationReviewSchema.safeParse(await request.json());
    if (!parsed.success)
      return NextResponse.json(
        { error: "Completează verificarea destinației și dovezile necesare." },
        { status: 400 }
      );
    const { returnId } = await context.params;
    const record = await db.return.findUnique({
      where: { id: returnId },
      include: {
        orderItem: {
          include: {
            product: {
              include: { supplier: { select: supplierReturnSelect } },
            },
          },
        },
      },
    });
    if (!record)
      return NextResponse.json({ error: "Return not found" }, { status: 404 });
    // Once approval sends a durable destination, do not silently rewrite it.
    if (record.status !== "PENDING")
      return NextResponse.json(
        {
          error:
            "Destinația se verifică înainte de aprobarea returului. Pentru un retur deja aprobat, contactează clientul prin procedura de suport.",
        },
        { status: 409 }
      );
    let evidence;
    try {
      evidence = reviewSupplierDestination({
        record,
        supplier: record.orderItem.product?.supplier,
        review: parsed.data,
        reviewer: session.user.id,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: error instanceof Error ? error.message : "Verificare invalidă",
        },
        { status: 400 }
      );
    }
    const notes = writeDestinationEvidence(
      record.supplierAuthorizationNotes,
      evidence
    );
    const updated = await db.return.updateMany({
      where: { id: record.id, status: "PENDING", updatedAt: record.updatedAt },
      data: { supplierAuthorizationNotes: notes },
    });
    if (updated.count !== 1)
      return NextResponse.json(
        {
          error:
            "Returul a fost modificat între timp. Reîncarcă și verifică din nou.",
        },
        { status: 409 }
      );
    return NextResponse.json({
      success: true,
      destinationReview: evidence,
      destination: getReturnDestination({
        ...record,
        supplierAuthorizationNotes: notes,
      }),
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to save return destination" },
      { status: 500 }
    );
  }
}
