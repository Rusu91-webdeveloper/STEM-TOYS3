import { Metadata } from "next";
import { CommunicationHub } from "@/features/communication/components/CommunicationHub";

export const metadata: Metadata = {
  title: "Communication Hub | Admin Dashboard",
  description:
    "Manage supplier communications, support tickets, and notifications",
};

export default function AdminCommunicationPage() {
  return <CommunicationHub />;
}
