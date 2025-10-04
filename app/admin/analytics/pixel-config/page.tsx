import { Metadata } from "next";

import { PixelConfigurationManager } from "@/features/admin/analytics/components/PixelConfigurationManager";

export const metadata: Metadata = {
  title: "Pixel Configuration | Admin Dashboard",
  description:
    "Configure Facebook Pixel, Instagram Pixel, and TikTok Pixel for analytics tracking",
};

export default function PixelConfigPage() {
  return <PixelConfigurationManager />;
}
