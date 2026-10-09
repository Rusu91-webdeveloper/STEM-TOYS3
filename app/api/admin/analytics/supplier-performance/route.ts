import { emailApiError, emailJson } from "@/lib/admin/email-api";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Admin access required" }, 403);
    return emailJson(
      {
        error:
          "Scorul avansat de performanță nu are toate sursele de date necesare. Consultă comenzile și rapoartele reale din administrare.",
        code: "SOURCE_UNAVAILABLE",
      },
      503
    );
  } catch (error) {
    return emailApiError(
      error,
      "Sursele de performanță nu au putut fi verificate"
    );
  }
}
