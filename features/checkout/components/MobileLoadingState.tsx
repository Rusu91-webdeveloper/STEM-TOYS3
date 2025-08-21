"use client";

import { Loader2, Smartphone } from "lucide-react";
import React from "react";

interface MobileLoadingStateProps {
  message?: string;
  showDeviceIcon?: boolean;
  size?: "sm" | "md" | "lg";
}

export function MobileLoadingState({
  message = "Loading...",
  showDeviceIcon = false,
  size = "md",
}: MobileLoadingStateProps) {
  const sizeStyles = {
    sm: {
      container: "py-8",
      icon: "h-6 w-6",
      text: "text-sm",
    },
    md: {
      container: "py-12",
      icon: "h-8 w-8",
      text: "text-base",
    },
    lg: {
      container: "py-16",
      icon: "h-12 w-12",
      text: "text-lg",
    },
  };

  const currentSize = sizeStyles[size];

  return (
    <div
      className={`flex flex-col items-center justify-center ${currentSize.container}`}
    >
      <div className="relative">
        {showDeviceIcon && (
          <Smartphone
            className={`${currentSize.icon} text-gray-400 absolute inset-0`}
          />
        )}
        <Loader2
          className={`${currentSize.icon} text-indigo-600 animate-spin ${
            showDeviceIcon ? "relative z-10" : ""
          }`}
        />
      </div>

      <p
        className={`${currentSize.text} text-gray-600 mt-4 font-medium text-center max-w-xs`}
      >
        {message}
      </p>

      {/* Mobile-optimized loading dots */}
      <div className="flex space-x-1 mt-3">
        <div
          className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <div
          className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <div
          className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

// Skeleton loading component for mobile
export function MobileSkeletonLoader({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={index}
          className="h-4 bg-gray-200 rounded animate-pulse"
          style={{
            width: `${Math.random() * 40 + 60}%`, // Random width between 60-100%
          }}
        />
      ))}
    </div>
  );
}

// Mobile-optimized progress indicator
export function MobileProgressIndicator({
  current,
  total,
  label,
}: {
  current: number;
  total: number;
  label?: string;
}) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full space-y-2">
      {label && (
        <div className="flex justify-between text-sm text-gray-600">
          <span>{label}</span>
          <span>
            {current} of {total}
          </span>
        </div>
      )}

      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
