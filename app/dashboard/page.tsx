import { redirect } from "next/navigation";

export default function DashboardRedirect() {
  redirect("/admin");
  // This will never be rendered
  return null;
}
