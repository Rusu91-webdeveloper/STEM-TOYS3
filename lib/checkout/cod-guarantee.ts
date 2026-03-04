export interface CodGuaranteeEvidence {
  authorizedAt: string | null;
  authorizedPaymentIntentId: string | null;
  authorizedAmount: number | null;
  capturedAt: string | null;
  capturedPaymentIntentId: string | null;
  capturedAmount: number | null;
}

const AUTHORIZATION_REGEX =
  /COD Guarantee authorized at ([^|]+?) - PI: ([^|]+?) - Amount: ([0-9]+(?:\.[0-9]+)?) RON/g;
const CAPTURE_REGEX =
  /COD Guarantee captured at ([^|]+?) - PI: ([^|]+?) - Amount: ([0-9]+(?:\.[0-9]+)?) RON/g;

const toFloatOrNull = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const formatCodGuaranteeAuthorizationNote = (input: {
  authorizedAt: string;
  paymentIntentId: string;
  amount: number;
}) =>
  `COD Guarantee authorized at ${input.authorizedAt} - PI: ${input.paymentIntentId} - Amount: ${input.amount.toFixed(2)} RON`;

export const formatCodGuaranteeCaptureNote = (input: {
  capturedAt: string;
  paymentIntentId: string;
  amount: number;
}) =>
  `COD Guarantee captured at ${input.capturedAt} - PI: ${input.paymentIntentId} - Amount: ${input.amount.toFixed(2)} RON`;

export const parseCodGuaranteeEvidence = (
  notes?: string | null
): CodGuaranteeEvidence => {
  if (!notes) {
    return {
      authorizedAt: null,
      authorizedPaymentIntentId: null,
      authorizedAmount: null,
      capturedAt: null,
      capturedPaymentIntentId: null,
      capturedAmount: null,
    };
  }

  const authorizationMatches = Array.from(
    notes.matchAll(AUTHORIZATION_REGEX)
  ).filter(match => match.length >= 4);
  const captureMatches = Array.from(notes.matchAll(CAPTURE_REGEX)).filter(
    match => match.length >= 4
  );

  const latestAuthorization =
    authorizationMatches.length > 0
      ? authorizationMatches[authorizationMatches.length - 1]
      : null;
  const latestCapture =
    captureMatches.length > 0
      ? captureMatches[captureMatches.length - 1]
      : null;

  return {
    authorizedAt: latestAuthorization?.[1]?.trim() || null,
    authorizedPaymentIntentId: latestAuthorization?.[2]?.trim() || null,
    authorizedAmount: toFloatOrNull(latestAuthorization?.[3]),
    capturedAt: latestCapture?.[1]?.trim() || null,
    capturedPaymentIntentId: latestCapture?.[2]?.trim() || null,
    capturedAmount: toFloatOrNull(latestCapture?.[3]),
  };
};
