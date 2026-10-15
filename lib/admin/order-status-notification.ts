export interface OrderStatusEmailNotification {
  status: "accepted" | "failed" | "not-required";
}

export const CANCELLATION_EMAIL_FAILED_MESSAGE =
  "Comanda a fost anulată, dar emailul de anulare nu a putut fi trimis. Verifică istoricul emailurilor înainte de o retrimitere.";
