import {
  WifiOff,
  Home,
  ShoppingBag,
  Heart,
  BookOpen,
  Clock,
} from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";

import { RetryButton } from "./RetryButton";

export const metadata: Metadata = {
  title: "You're Offline - TechTots",
  description:
    "You are currently offline. Check your connection and try again.",
  robots: "noindex",
};

// Quick actions for offline users
const offlineActions = [
  {
    icon: Home,
    label: "Go Home",
    href: "/",
    description: "Return to homepage",
  },
  {
    icon: ShoppingBag,
    label: "Browse Products",
    href: "/products",
    description: "View cached products",
  },
  {
    icon: Heart,
    label: "Wishlist",
    href: "/account/wishlist",
    description: "View saved items",
  },
  {
    icon: BookOpen,
    label: "Blog",
    href: "/blog",
    description: "Read educational content",
  },
];

// Tips for offline usage
const offlineTips = [
  "Some pages may still be available from your cache",
  "Check your internet connection",
  "Try refreshing the page once you're back online",
  "Your cart items are saved locally",
];

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* Offline Icon and Message */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-200 rounded-full mb-6">
          <WifiOff className="w-10 h-10 text-gray-600" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          You're Offline
        </h1>

        <p className="text-gray-600 text-base sm:text-lg max-w-md mx-auto mb-6">
          It looks like you've lost your internet connection. Don't worry, some
          content may still be available.
        </p>

        {/* Retry Button */}
        <RetryButton />
      </div>

      {/* Quick Actions */}
      <div className="w-full max-w-md mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          Quick Actions
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {offlineActions.map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className="flex flex-col items-center p-4 bg-white rounded-lg border border-gray-200 hover:border-primary hover:shadow-md transition-all min-h-[88px] active:scale-95"
            >
              <action.icon className="w-6 h-6 text-primary mb-2" />
              <span className="text-sm font-medium text-gray-900 text-center">
                {action.label}
              </span>
              <span className="text-xs text-gray-500 text-center mt-1">
                {action.description}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Offline Tips */}
      <div className="w-full max-w-md">
        <h3 className="text-base font-semibold text-gray-900 mb-3 text-center">
          Helpful Tips
        </h3>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <ul className="space-y-2">
            {offlineTips.map((tip, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-gray-600"
              >
                <Clock className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Connection Status */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span>Checking connection...</span>
        </div>
      </div>

      {/* Script for connection monitoring */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            // Monitor connection status
            function updateConnectionStatus() {
              const statusElement = document.querySelector('[data-connection-status]');
              if (navigator.onLine) {
                if (statusElement) {
                  statusElement.innerHTML = '<div class="w-2 h-2 bg-green-500 rounded-full"></div><span>Back online!</span>';
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                }
              }
            }
            
            window.addEventListener('online', updateConnectionStatus);
            window.addEventListener('offline', updateConnectionStatus);
            
            // Add connection status indicator
            const statusContainer = document.querySelector('.mt-8.text-center .inline-flex');
            if (statusContainer) {
              statusContainer.setAttribute('data-connection-status', '');
            }
          `,
        }}
      />
    </div>
  );
}
