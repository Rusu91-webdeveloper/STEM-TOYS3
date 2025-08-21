import { auth } from "@/lib/server/auth";

export function getServerSession() {
  return auth();
}
