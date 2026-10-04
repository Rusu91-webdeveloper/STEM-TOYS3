import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { getUserCache } from "@/lib/cache/user-cache";
import { withCsrfProtection } from "@/lib/csrf";
import { db } from "@/lib/db";
import { eraseCustomerAccount } from "@/lib/privacy/account-erasure";

const headers = { "Cache-Control": "private, no-store" };

export async function DELETE(request: NextRequest) {
  const session = await auth().catch(() => null);
  if (!session?.user?.id)
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 403, headers }
    );
  const response = await withCsrfProtection(
    request.clone() as NextRequest,
    async () => {
      const body = await request.json().catch(() => null);
      if (body?.confirmDeletion !== true) {
        return NextResponse.json(
          { error: "Confirmă explicit ștergerea contului." },
          { status: 400, headers }
        );
      }
      try {
        // Identity comes exclusively from the authenticated session.
        const result = await eraseCustomerAccount(db, session.user.id);
        if (result.status === "not_found")
          return NextResponse.json(
            { error: "Cont inexistent." },
            { status: 404, headers }
          );
        if (result.status === "staff_review")
          return NextResponse.json(
            {
              error:
                "Pentru ștergerea unui cont administrativ sau de furnizor, contactează info@techtots.ro.",
            },
            { status: 409, headers }
          );
        if (result.status === "pending_review") {
          return NextResponse.json(
            {
              status: result.status,
              message:
                "Cererea a fost înregistrată pentru verificare deoarece există comenzi sau retururi în curs. Contactează info@techtots.ro; răspundem în cel mult o lună. Contul rămâne disponibil pentru gestionarea lor.",
            },
            { status: 202, headers }
          );
        }
        try {
          await getUserCache().invalidateUser(session.user.id);
        } catch {
          console.error("Unable to invalidate erased account cache");
        }
        return NextResponse.json(
          {
            status: "completed",
            message:
              "Datele contului au fost eliminate și accesul a fost închis. Evidențele tranzacțiilor și dovada minimă a solicitării sunt păstrate numai pentru obligații legale și apărarea drepturilor.",
            retained: result.retained,
          },
          { headers }
        );
      } catch {
        console.error("Account erasure transaction failed");
        return NextResponse.json(
          {
            error:
              "Ștergerea nu a fost finalizată. Încearcă din nou sau contactează info@techtots.ro.",
          },
          { status: 500, headers }
        );
      }
    }
  );
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
