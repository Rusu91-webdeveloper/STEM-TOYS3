"use client";

import React, { forwardRef } from "react";

import { cn } from "@/lib/utils";

interface MobileOptimizedInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const MobileOptimizedInput = forwardRef<
  HTMLInputElement,
  MobileOptimizedInputProps
>(
  (
    { label, error, helperText, leftIcon, rightIcon, className, ...props },
    ref
  ) => {
    return (
      <div className="space-y-2">
        {label && (
          <label className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">{leftIcon}</div>
            </div>
          )}

          <input
            ref={ref}
            className={cn(
              // Base styles
              "block w-full rounded-md border-0 py-4 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6",

              // Mobile optimizations
              "text-base", // Larger text for mobile
              "min-h-[44px]", // Minimum touch target size
              "leading-tight", // Better line height for mobile

              // Icon spacing
              leftIcon && "pl-10",
              rightIcon && "pr-10",

              // Error state
              error && "ring-red-300 focus:ring-red-500",

              // Disabled state
              props.disabled && "bg-gray-50 text-gray-500 cursor-not-allowed",

              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <div className="h-5 w-5 text-gray-400">{rightIcon}</div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {helperText && !error && (
          <p className="text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

MobileOptimizedInput.displayName = "MobileOptimizedInput";
