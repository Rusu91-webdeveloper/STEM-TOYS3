import { orderStatusLabels } from "./dashboard-metrics";

const labels: Record<string, string> = {
  PENDING: "În așteptare",
  CREATED: "Creată",
  IN_TRANSIT: "În tranzit",
  READY_TO_PLACE: "De plasat la furnizor",
  PLACED_TO_SUPPLIER: "Plasată la furnizor",
  AWB_PENDING: "AWB în așteptare",
  AWB_UPLOADED: "AWB înregistrat",
  READY_TO_SHIP: "Pregătită de expediere",
  ISSUE_OOS: "Stoc indisponibil",
  ISSUE_DELAYED: "Întârziere la furnizor",
  PARTIALLY_SHIPPED: "Expediată parțial",
  PARTIALLY_DELIVERED: "Livrată parțial",
  IN_PRODUCTION: "În pregătire",
  CONFIRMED: "Confirmată",
  WAIT_RESTOCK: "Așteaptă reaprovizionarea",
  SUBSTITUTE: "Înlocuiește produsul",
  CANCEL_REFUND: "Anulează și rambursează",
  "Monitor fulfillment": "Urmărește procesarea",
  "Closed (cancelled)": "Închisă · anulată",
  Completed: "Finalizată",
  "Manual shipping review required": "Verifică expedierea",
  "Create supplier lines": "Alocă produsele la furnizori",
  "Resolve supplier issue": "Rezolvă problema la furnizor",
  "Set supplier line status after AWB upload":
    "Actualizează starea după înregistrarea AWB-ului",
  "Mark supplier line as shipped": "Confirmă expedierea la furnizor",
  "Upload supplier AWB / tracking": "Înregistrează AWB-ul furnizorului",
  "Place order to supplier": "Plasează comanda la furnizor",
  "In transit / awaiting delivery": "În tranzit · așteaptă livrarea",
  "Digital / no supplier action": "Digitală · fără procesare la furnizor",
};
export function adminOrderLabel(value?: string | null) {
  if (!value) return "Stare necunoscută";
  return (
    labels[value] ??
    orderStatusLabels[value.toUpperCase()] ??
    value.replaceAll("_", " ")
  );
}
