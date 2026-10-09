import { emailApiError, emailJson } from "@/lib/admin/email-api";
import { auth } from "@/lib/auth";

export async function POST() {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Admin access required" }, 403);
    return emailJson(
      {
        error:
          "Optimizarea imaginilor nu este disponibilă. Procesarea și stocarea fișierelor optimizate nu sunt implementate.",
        code: "SOURCE_UNAVAILABLE",
      },
      503
    );
  } catch (error) {
    return emailApiError(
      error,
      "Optimizarea imaginilor nu a putut fi verificată"
    );
  }
}
