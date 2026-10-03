"use client";

import { Button } from "@/components/ui/button";
import { openCookiePreferences } from "@/lib/analytics/consent";

export function CookiePreferencesButton() {
  return (
    <Button variant="outline" onClick={openCookiePreferences}>
      Setări cookie-uri
    </Button>
  );
}
