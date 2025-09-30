/**
 * Facebook Pixel Component for Romanian Viral Content Tracking
 *
 * Injects Facebook Pixel script and provides tracking functions
 * optimized for Romanian market and viral content spread
 */

"use client";

import { useEffect } from "react";
import Script from "next/script";

interface FacebookPixelProps {
  children?: React.ReactNode;
}

declare global {
  interface Window {
    fbq: any;
    trackViralShare: (blogId: string, platform?: string) => void;
    trackBlogEngagement: (
      blogId: string,
      engagementType: string,
      timeSpent?: number
    ) => void;
    trackProductViewFromBlog: (blogId: string, productId: string) => void;
    trackRomanianPurchase: (
      orderId: string,
      value: number,
      productIds: string[],
      blogId?: string
    ) => void;
  }
}

export default function FacebookPixel({ children }: FacebookPixelProps) {
  useEffect(() => {
    // Initialize global tracking functions
    if (typeof window !== "undefined") {
      // Track viral shares from Romanian social media
      window.trackViralShare = (
        blogId: string,
        platform: string = "facebook"
      ) => {
        if (window.fbq) {
          window.fbq("trackCustom", "ViralShare", {
            blog_id: blogId,
            platform: platform,
            market: "romania",
            viral_content: true,
            timestamp: Date.now(),
          });
        }

        // Server-side tracking would go here if needed
      };

      // Track Romanian blog engagement
      window.trackBlogEngagement = (
        blogId: string,
        engagementType: string,
        timeSpent?: number
      ) => {
        if (window.fbq) {
          window.fbq("trackCustom", "BlogEngagement", {
            blog_id: blogId,
            engagement_type: engagementType,
            time_spent: timeSpent,
            romanian_audience: true,
            market: "romania",
            timestamp: Date.now(),
          });
        }

        // Server-side tracking would go here if needed
      };

      // Track product views from Romanian blog traffic
      window.trackProductViewFromBlog = (blogId: string, productId: string) => {
        if (window.fbq) {
          window.fbq("track", "ViewContent", {
            content_ids: [productId],
            content_type: "product",
            content_name: "STEM Toy from Blog",
            value: 0,
            currency: "RON",
            custom_data: {
              source: "blog_traffic",
              blog_id: blogId,
              market: "romania",
              conversion_potential: "high",
              timestamp: Date.now(),
            },
          });
        }

        // Server-side tracking would go here if needed
      };

      // Romanian purchase tracking
      window.trackRomanianPurchase = (
        orderId: string,
        value: number,
        productIds: string[],
        blogId?: string
      ) => {
        if (window.fbq) {
          window.fbq("track", "Purchase", {
            content_ids: productIds,
            content_type: "product",
            value: value,
            currency: "RON",
            custom_data: {
              order_id: orderId,
              source: blogId ? "blog_traffic" : "direct",
              blog_id: blogId,
              market: "romania",
              viral_conversion: !!blogId,
              timestamp: Date.now(),
            },
          });
        }

        // Server-side tracking would go here if needed
      };
    }
  }, []);

  // Facebook Pixel ID from environment
  const FACEBOOK_PIXEL_ID =
    process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID || "123456789012345";

  // Only render pixel if configured
  if (!FACEBOOK_PIXEL_ID || FACEBOOK_PIXEL_ID === "123456789012345") {
    return <>{children}</>;
  }

  return (
    <>
      {/* Facebook Pixel Base Code */}
      <Script
        id="facebook-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FACEBOOK_PIXEL_ID}');
            fbq('track', 'PageView');

            // Romanian market specific tracking
            fbq('trackCustom', 'RomanianSTEMView', {
              content_type: 'stem_education',
              market: 'romania',
              language: 'ro',
              timezone: 'Europe/Bucharest',
              timestamp: ${Date.now()}
            });
          `,
        }}
      />

      {/* NoScript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${FACEBOOK_PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>

      {/* Romanian-specific tracking functions */}
      <Script
        id="facebook-pixel-romanian"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Enhanced Romanian viral tracking
            window.addEventListener('load', function() {
              // Track page view with Romanian context
              if (window.fbq) {
                // Track time spent on page for Romanian users
                let startTime = Date.now();
                window.addEventListener('beforeunload', function() {
                  let timeSpent = Math.round((Date.now() - startTime) / 1000);
                  if (timeSpent > 10) { // Only track if spent more than 10 seconds
                    window.fbq('trackCustom', 'RomanianPageEngagement', {
                      time_spent: timeSpent,
                      market: 'romania',
                      page_type: window.location.pathname.includes('/blog') ? 'blog' : 'other',
                      timestamp: Date.now()
                    });
                  }
                });

                // Track Romanian social shares
                document.addEventListener('click', function(e) {
                  const target = e.target as HTMLElement;
                  if (target.matches('[data-share]') || target.closest('[data-share]')) {
                    const shareElement = target.matches('[data-share]') ? target : target.closest('[data-share]');
                    const platform = shareElement?.getAttribute('data-platform') || 'unknown';
                    const blogId = shareElement?.getAttribute('data-blog-id');

                    if (blogId && window.trackViralShare) {
                      window.trackViralShare(blogId, platform);
                    }
                  }
                });

                // Track Romanian blog reading engagement
                if (window.location.pathname.includes('/blog/')) {
                  let readingTime = 0;
                  const readingInterval = setInterval(() => {
                    readingTime += 5; // Track every 5 seconds
                    if (readingTime >= 30 && window.trackBlogEngagement) { // Track after 30 seconds
                      const blogId = window.location.pathname.split('/blog/')[1]?.split('/')[0];
                      if (blogId) {
                        window.trackBlogEngagement(blogId, 'reading', readingTime);
                      }
                    }
                  }, 5000);

                  // Clear interval on page leave
                  window.addEventListener('beforeunload', () => clearInterval(readingInterval));
                }
              }
            });
          `,
        }}
      />

      {children}
    </>
  );
}

// Hook for using Facebook Pixel in components
export function useFacebookPixel() {
  return {
    trackViralShare: (blogId: string, platform?: string) => {
      if (typeof window !== "undefined" && window.trackViralShare) {
        window.trackViralShare(blogId, platform);
      }
    },

    trackBlogEngagement: (
      blogId: string,
      engagementType: string,
      timeSpent?: number
    ) => {
      if (typeof window !== "undefined" && window.trackBlogEngagement) {
        window.trackBlogEngagement(blogId, engagementType, timeSpent);
      }
    },

    trackProductViewFromBlog: (blogId: string, productId: string) => {
      if (typeof window !== "undefined" && window.trackProductViewFromBlog) {
        window.trackProductViewFromBlog(blogId, productId);
      }
    },

    trackRomanianPurchase: (
      orderId: string,
      value: number,
      productIds: string[],
      blogId?: string
    ) => {
      if (typeof window !== "undefined" && window.trackRomanianPurchase) {
        window.trackRomanianPurchase(orderId, value, productIds, blogId);
      }
    },
  };
}
