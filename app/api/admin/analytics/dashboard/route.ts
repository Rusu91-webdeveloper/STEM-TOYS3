import { emailJson } from "@/lib/admin/email-api";
import { auth } from "@/lib/auth";
export async function GET() {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Unauthorized" }, 403);
    return emailJson(
      {
        error:
          "Raportul nu are o sursă verificată. Folosește raportul de vânzări bazat pe comenzi.",
      },
      503
    );
  } catch {
    return emailJson({ error: "Raportul nu poate fi încărcat" }, 500);
  }
}
