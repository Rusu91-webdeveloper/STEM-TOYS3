import { trackEvent } from "@/lib/analytics/ga4";

export const HOMEPAGE_CONVERSION_EVENTS = {
  HERO_IMPRESSION: "homepage_hero_impression",
  HERO_PRIMARY_CTA_CLICK: "homepage_hero_primary_cta_click",
  HERO_SECONDARY_CTA_CLICK: "homepage_hero_secondary_cta_click",
  HERO_AGE_CHIP_CLICK: "homepage_hero_age_chip_click",
  FIVE_SECOND_STEP_CLICK: "homepage_five_second_step_click",
  FIVE_SECOND_PRIMARY_CTA_CLICK: "homepage_five_second_primary_cta_click",
  FIVE_SECOND_SECONDARY_CTA_CLICK: "homepage_five_second_secondary_cta_click",
  BUNDLE_CARD_CLICK: "homepage_bundle_card_click",
  BUNDLE_LIST_CTA_CLICK: "homepage_bundle_list_cta_click",
  TRUST_BADGE_CLICK: "homepage_trust_badge_click",
} as const;

export type HomepageConversionEvent =
  (typeof HOMEPAGE_CONVERSION_EVENTS)[keyof typeof HOMEPAGE_CONVERSION_EVENTS];

const DASHBOARD_MIRRORED_EVENTS = new Set<HomepageConversionEvent>([
  HOMEPAGE_CONVERSION_EVENTS.HERO_IMPRESSION,
]);

function getSessionId() {
  if (typeof window === "undefined") return undefined;

  try {
    const existingSessionId = sessionStorage.getItem("homepage_conversion_session_id");
    if (existingSessionId) return existingSessionId;

    const sessionId = `hp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem("homepage_conversion_session_id", sessionId);
    return sessionId;
  } catch {
    return undefined;
  }
}

function mirrorForAdminDashboard(
  eventName: HomepageConversionEvent,
  params: Record<string, unknown>
) {
  if (typeof window === "undefined") return;
  if (!DASHBOARD_MIRRORED_EVENTS.has(eventName)) return;

  const conversion = {
    id: `homepage_${eventName}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    type: "time_on_page",
    category: "engagement",
    action: eventName,
    element: {
      id: "homepage_hero",
      tagName: "section",
      text: "hero_impression",
    },
    page: {
      url: window.location.href,
      title: document.title,
      referrer: document.referrer || "",
    },
    user: {
      isAuthenticated: false,
      sessionId: getSessionId(),
      userAgent: navigator.userAgent,
    },
    context: {
      timeOnPage: 0,
    },
    metadata: {
      page_type: "homepage",
      funnel_stage: "consideration",
      ...params,
      tracking_source: "homepage_conversion_helper",
    },
  };

  void fetch("/api/analytics/conversions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ conversions: [conversion] }),
    keepalive: true,
  }).catch(() => null);
}

export function trackHomepageConversionEvent(
  eventName: HomepageConversionEvent,
  params: Record<string, unknown> = {}
) {
  trackEvent(eventName, {
    page_type: "homepage",
    funnel_stage: "consideration",
    ...params,
  });

  mirrorForAdminDashboard(eventName, params);
}
