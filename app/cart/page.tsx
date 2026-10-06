import type { Metadata } from "next";

import CartPage from "@/features/cart/components/CartPage";
import { getCODSettings } from "@/lib/utils/store-settings";

export const metadata: Metadata = {
  title: "Coșul tău | TechTots",
  robots: { index: false, follow: false },
};

export default async function Cart() {
  return <CartPage codSettings={await getCODSettings()} />;
}
