import { Metadata } from "next";
import { AdminTicketsList } from "@/features/supplier/components/admin/AdminTicketsList";

export const metadata: Metadata = {
  title: "Support Tickets | Admin Dashboard",
  description: "View and manage supplier support tickets",
};

export default function AdminTicketsPage() {
  return <AdminTicketsList />;
}
