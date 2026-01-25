import { redirect } from "next/navigation";

/**
 * Redirect /delivery to /shipping
 * Content has been merged into the shipping page
 */
export default function DeliveryPage() {
  redirect("/shipping");
}
