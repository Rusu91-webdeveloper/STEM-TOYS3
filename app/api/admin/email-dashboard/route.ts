import { emailJson, emailApiError } from "@/lib/admin/email-api";
import { getEmailDashboard } from "@/lib/admin/email-dashboard";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    if ((await auth())?.user?.role !== "ADMIN")
      return emailJson({ error: "Unauthorized" }, 401);
    return emailJson(await getEmailDashboard());
  } catch (error) {
    return emailApiError(error, "Datele email nu au putut fi încărcate");
  }
}
