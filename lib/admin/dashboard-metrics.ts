const TIMEZONE = "Europe/Bucharest";

export function bucharestDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function shiftDate(key: string, days: number): string {
  const date = new Date(`${key}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function localMidnight(key: string): Date {
  const utc = new Date(`${key}T00:00:00Z`).getTime();
  let candidate = utc;
  // Re-evaluate the offset to handle daylight-saving transition days.
  for (let attempt = 0; attempt < 2; attempt++) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TIMEZONE,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date(candidate));
    const offset = parts.find(part => part.type === "timeZoneName")?.value;
    const hours = Number(offset?.replace("GMT", "") || 0);
    candidate = utc - hours * 60 * 60 * 1000;
  }
  return new Date(candidate);
}

export function dashboardRange(days: number, now = new Date()) {
  const today = bucharestDate(now);
  const firstDay = shiftDate(today, -(days - 1));
  return {
    start: localMidnight(firstDay),
    end: now,
    previousStart: localMidnight(shiftDate(firstDay, -days)),
    dates: Array.from({ length: days }, (_, index) =>
      shiftDate(firstDay, index)
    ),
  };
}

export function percentageChange(
  current: number,
  previous: number
): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

export function formatRon(value: number): string {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: "RON",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatOrderAmount(value: number, currency: string): string {
  return new Intl.NumberFormat("ro-RO", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(value);
}

export const orderStatusLabels: Record<string, string> = {
  PROCESSING: "În procesare",
  SHIPPED: "Expediată",
  DELIVERED: "Livrată",
  CANCELLED: "Anulată",
  COMPLETED: "Finalizată",
  PENDING_REVIEW: "De verificat",
  READY_FOR_SHIPPING: "Pregătită de expediere",
  FULFILLED: "Pregătită",
};

export const paymentStatusLabels: Record<string, string> = {
  PAID: "Achitată",
  COMPLETED: "Achitată",
  PENDING: "Plată în așteptare",
  PROCESSING: "Plată în procesare",
  FAILED: "Plată eșuată",
  REFUNDED: "Rambursată",
  CANCELLED: "Plată anulată",
};
