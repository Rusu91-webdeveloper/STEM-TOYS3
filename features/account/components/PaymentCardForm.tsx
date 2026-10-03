import { PaymentCardNotice } from "@/features/account/components/PaymentCardNotice";

// Compatibility entry point: this component must never collect card details.
export function PaymentCardForm() {
  return <PaymentCardNotice />;
}
