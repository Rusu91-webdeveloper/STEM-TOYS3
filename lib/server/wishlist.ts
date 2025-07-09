import { auth } from "./auth";

export async function getWishlistItems() {
  const session = await auth();
  if (!session?.user) return [];

  // TODO: Implement actual wishlist fetching from database
  return [];
}
