import type { OrderStatusEmailNotification } from "./order-status-notification";

interface OrderStatusUpdate {
  status: string;
  cancellationReason?: string;
}

async function fetchStatusCsrfToken(): Promise<string> {
  try {
    const response = await fetch("/api/csrf-token", {
      credentials: "include",
      cache: "no-store",
    });
    const data = response.ok ? await response.json() : null;
    if (typeof data?.csrfToken !== "string" || !data.csrfToken) {
      throw new Error("Missing CSRF token");
    }
    return data.csrfToken;
  } catch {
    throw new Error(
      "Verificarea de securitate nu a putut fi inițializată. Reîncarcă pagina și încearcă din nou."
    );
  }
}

export async function updateAdminOrderStatus(
  orderId: string,
  update: OrderStatusUpdate
): Promise<{ emailNotification?: OrderStatusEmailNotification }> {
  // Fetch on submission: a token loaded with the page may already have expired.
  const token = await fetchStatusCsrfToken();

  const response = await fetch(
    `/api/admin/orders/${encodeURIComponent(orderId)}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": token,
      },
      body: JSON.stringify(update),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(
      response.status === 403
        ? "Sesiunea sau verificarea de securitate nu mai este validă. Reîncarcă pagina și autentifică-te din nou dacă este necesar."
        : "Starea comenzii nu a putut fi actualizată. Încearcă din nou."
    );
  }
  const data = await response.json();
  return { emailNotification: data.emailNotification };
}
