"use client";

import Script from "next/script";
import { GA4_CONFIG } from "@/lib/analytics/ga4";

interface GoogleAnalyticsProps {
  measurementId?: string;
}

export default function GoogleAnalytics({
  measurementId = GA4_CONFIG.MEASUREMENT_ID,
}: GoogleAnalyticsProps) {
  // Don't load GA4 in development
  if (process.env.NODE_ENV === "development") {
    return null;
  }

  return (
    <>
      <Script
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
      />
      <Script
        id="google-analytics"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_title: document.title,
              page_location: window.location.href,
              custom_map: {
                '${GA4_CONFIG.CUSTOM_DIMENSIONS.USER_TYPE}': 'user_type',
                '${GA4_CONFIG.CUSTOM_DIMENSIONS.PRODUCT_CATEGORY}': 'product_category',
                '${GA4_CONFIG.CUSTOM_DIMENSIONS.LANGUAGE}': 'language',
                '${GA4_CONFIG.CUSTOM_DIMENSIONS.AGE_GROUP}': 'age_group',
                '${GA4_CONFIG.CUSTOM_DIMENSIONS.STEM_FOCUS}': 'stem_focus',
              },
              enhanced_measurement: {
                scrolls: ${GA4_CONFIG.ENHANCED_MEASUREMENT.SCROLLS},
                outbound_clicks: ${GA4_CONFIG.ENHANCED_MEASUREMENT.OUTBOUND_CLICKS},
                site_search: ${GA4_CONFIG.ENHANCED_MEASUREMENT.SITE_SEARCH},
                video_engagement: ${GA4_CONFIG.ENHANCED_MEASUREMENT.VIDEO_ENGAGEMENT},
                file_downloads: ${GA4_CONFIG.ENHANCED_MEASUREMENT.FILE_DOWNLOADS},
              },
              send_page_view: true,
            });
          `,
        }}
      />
    </>
  );
}
