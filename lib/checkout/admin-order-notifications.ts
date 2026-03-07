type ImmediateAdminOrderNotificationInput = {
  isCODPayment: boolean;
  isNetopiaPayment: boolean;
  requiresOnlineAuthorization: boolean;
  stripePaymentIntentStatus?: string | null;
};

export function shouldSendImmediateAdminOrderNotification(
  input: ImmediateAdminOrderNotificationInput
): boolean {
  if (input.isCODPayment) {
    return true;
  }

  if (input.isNetopiaPayment) {
    return false;
  }

  if (!input.requiresOnlineAuthorization) {
    return true;
  }

  return input.stripePaymentIntentStatus === "succeeded";
}
