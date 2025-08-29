import { Metadata } from "next";
import { AdminMessagesList } from "@/features/supplier/components/admin/AdminMessagesList";

export const metadata: Metadata = {
  title: "Supplier Messages | Admin Dashboard",
  description: "View and manage messages from suppliers",
};

export default function AdminMessagesPage() {
  return <AdminMessagesList />;
}
