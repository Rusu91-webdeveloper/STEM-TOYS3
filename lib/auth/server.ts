import { auth } from "@/lib/server/auth";

export async function getServerSession() {
  return auth();
}
