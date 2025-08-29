import { Metadata } from "next";
import { SupplierMessaging } from "@/features/supplier/components/communication/SupplierMessaging";

export const metadata: Metadata = {
  title: "Messages | Supplier Portal",
  description: "Communicate with TechTots team and manage your messages",
};

export default function SupplierMessagesPage() {
  return <SupplierMessaging />;
}
