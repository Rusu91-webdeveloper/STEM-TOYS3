import { emailApiError, emailJson } from "@/lib/admin/email-api";
import { auth } from "@/lib/auth";

export async function POST() {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Admin access required" }, 403);
    return emailJson(
      {
        error:
          "Trimiterea facturii către furnizor nu este implementată. Starea facturii nu a fost schimbată și nu a fost trimis un email.",
        code: "SOURCE_UNAVAILABLE",
      },
      503
    );
  } catch (error) {
    return emailApiError(error, "Trimiterea facturii nu a putut fi verificată");
  }
}
