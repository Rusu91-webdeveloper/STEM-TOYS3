/**
 * One COD guarantee PaymentIntent per checkout estimate.
 * The server amount is authoritative: a client shipping estimate that
 * differs from the hold must not start a second create call.
 */
export function shouldCreateCodGuaranteeIntent(input: {
  clientSecret: string | null;
  paymentIntentId?: string;
  serverAmountMinor: number | null;
  requestedAmountMinor: number;
  sessionRequestedAmountMinor: number | null;
}): boolean {
  if (input.requestedAmountMinor <= 0) return false;

  const hasServerAmount =
    input.serverAmountMinor !== null && input.serverAmountMinor > 0;
  const hasSessionIntent =
    Boolean(input.clientSecret) &&
    Boolean(input.paymentIntentId) &&
    hasServerAmount &&
    input.sessionRequestedAmountMinor === input.requestedAmountMinor;

  return !hasSessionIntent;
}

/** Major-unit amount returned by the server, or null until that response arrives. */
export function displayedCodGuaranteeAmount(
  serverAmountMinor: number | null
): number | null {
  if (serverAmountMinor === null || !Number.isFinite(serverAmountMinor)) {
    return null;
  }
  if (serverAmountMinor <= 0) return null;
  return serverAmountMinor / 100;
}
