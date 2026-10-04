// Store settings express the percentage in percent; calculators use a fraction.
// Fallback matches the live StoreSettings verified on 2026-10-04.
export const DEFAULT_COD_SETTINGS = {
  percentage: "0.01",
  fixedFee: "5.00",
  active: true,
} as const;

export type PublicCODSettings = {
  active?: boolean;
  percentage?: string;
  fixedFee?: string;
};

/**
 * Format COD fee label for display (e.g., "9,90 lei" or "1% + 7,00 lei")
 */
export function formatCodFeeLabel(settings: PublicCODSettings): string {
  const percentage = Number(settings.percentage);
  const fixedFee = Number(settings.fixedFee);

  if (
    !settings.active ||
    !Number.isFinite(percentage) ||
    percentage < 0 ||
    !Number.isFinite(fixedFee) ||
    fixedFee < 0
  ) {
    return "";
  }

  const formatNumber = (value: number) =>
    new Intl.NumberFormat("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  if (percentage === 0) {
    return `${formatNumber(fixedFee)} lei`;
  }

  return `${formatNumber(percentage)}% + ${formatNumber(fixedFee)} lei`;
}

export function codFeeExplanation(settings: PublicCODSettings) {
  const percentage = Number(settings.percentage);
  const fixedFee = Number(settings.fixedFee);
  if (!settings.active)
    return "Taxa ramburs este afișată înainte de confirmarea comenzii.";
  if (
    !Number.isFinite(percentage) ||
    percentage < 0 ||
    !Number.isFinite(fixedFee) ||
    fixedFee < 0
  ) {
    return "Taxa ramburs este afișată înainte de confirmarea comenzii.";
  }
  const format = (value: number) =>
    new Intl.NumberFormat("ro-RO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  if (percentage === 0) {
    return `Pentru livrarea la adresă, taxa ramburs este ${format(fixedFee)} lei. La FANbox plata ramburs nu este disponibilă; alegi plata online cu cardul. Taxa se achită odată cu comanda la primirea coletului și este afișată înainte de confirmare.`;
  }

  return `Pentru livrarea la adresă, taxa ramburs este ${format(fixedFee)} lei + ${format(percentage)}% din suma de plată înainte de taxa ramburs (produse și livrare, după reduceri). La FANbox plata ramburs nu este disponibilă; alegi plata online cu cardul. Taxa se achită odată cu comanda la primirea coletului și este afișată înainte de confirmare.`;
}

export const COD_HOLD_EXPLANATION_RO =
  "Fiecare comandă ramburs necesită o autorizare temporară pe card pentru transportul tur, indiferent de valoarea comenzii sau de comenzile anterioare. Produsele se plătesc la primire; autorizarea nu este o plată și nu salvează cardul în cont. La refuz sau nepreluare putem încasa cel mult suma autorizată pentru transportul tur; TechTots suportă returul la expeditor. Pentru FANbox alegi plata online, deoarece rambursul nu este disponibil.";
