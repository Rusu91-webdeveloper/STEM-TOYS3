/**
 * Critical CSS Component
 * Inlines essential above-the-fold styles to eliminate render-blocking CSS
 * Dramatically improves LCP and FCP
 */

export function CriticalCSS() {
  return (
    <style
      dangerouslySetInnerHTML={{
        __html: `
          /* Critical above-the-fold styles for LCP optimization */

          /* Reset and base styles */
          *, *::before, *::after {
            box-sizing: border-box;
          }

          html {
            line-height: 1.15;
            -webkit-text-size-adjust: 100%;
            scroll-behavior: smooth;
          }

          body {
            margin: 0;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background-color: #ffffff;
            color: #333333;
            line-height: 1.6;
            font-display: swap;
          }

          /* Hero section - Most critical for LCP */
          .hero-section {
            min-height: 75vh;
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }

          @media (min-width: 640px) {
            .hero-section {
              min-height: 80vh;
            }
          }

          @media (min-width: 768px) {
            .hero-section {
              min-height: 85vh;
            }
          }

          /* Hero content */
          .hero-content {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 1200px;
            padding: 0 1rem;
            text-align: center;
            color: white;
          }

          .hero-title {
            font-size: 2rem;
            font-weight: 800;
            line-height: 1.1;
            margin-bottom: 1.5rem;
            text-shadow: 0 2px 4px rgba(0,0,0,0.3);
          }

          @media (min-width: 640px) {
            .hero-title {
              font-size: 2.5rem;
            }
          }

          @media (min-width: 768px) {
            .hero-title {
              font-size: 3rem;
            }
          }

          @media (min-width: 1024px) {
            .hero-title {
              font-size: 3.5rem;
            }
          }

          .hero-subtitle {
            font-size: 1rem;
            opacity: 0.9;
            max-width: 600px;
            margin: 0 auto 2rem;
            text-shadow: 0 1px 2px rgba(0,0,0,0.3);
          }

          @media (min-width: 640px) {
            .hero-subtitle {
              font-size: 1.125rem;
            }
          }

          /* CTA Buttons */
          .cta-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 2rem;
            border-radius: 0.5rem;
            font-weight: 700;
            font-size: 0.875rem;
            text-decoration: none;
            transition: all 0.2s ease;
            border: none;
            cursor: pointer;
            min-height: 48px;
          }

          .cta-primary {
            background: #ffffff;
            color: #667eea;
          }

          .cta-primary:hover {
            background: #f8f9fa;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          }

          .cta-secondary {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 1px solid rgba(255,255,255,0.3);
          }

          .cta-secondary:hover {
            background: rgba(255,255,255,0.3);
          }

          /* Loading states */
          .loading-skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
          }

          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }

          /* Performance optimizations */
          .gpu-accelerated {
            transform: translateZ(0);
            backface-visibility: hidden;
            perspective: 1000px;
          }
        `,
      }}
    />
  );
}

/**
 * Font preloading component
 */
export function FontPreload() {
  return (
    <>
      {/* Preload critical fonts */}
      <link
        rel="preload"
        href="/fonts/inter-var.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/inter-400.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      <link
        rel="preload"
        href="/fonts/inter-700.woff2"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
    </>
  );
}
