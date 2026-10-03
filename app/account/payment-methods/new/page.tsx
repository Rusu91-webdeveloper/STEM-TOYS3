import { redirect } from "next/navigation";

export default function AddPaymentMethodPage() {
  redirect("/account/payment-methods");
}
