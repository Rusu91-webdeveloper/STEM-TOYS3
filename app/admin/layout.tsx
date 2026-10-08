import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";

import AdminShell from "./components/admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN")
    redirect("/auth/login?callbackUrl=/admin");
  return (
    <AdminShell user={{ name: session.user.name, role: session.user.role }}>
      {children}
    </AdminShell>
  );
}
