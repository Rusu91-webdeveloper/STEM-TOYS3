"use client";

import {
  ShoppingCart,
  Check,
  Info,
  AlertCircle,
  X,
  Heart,
} from "lucide-react";

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";

export function Toaster() {
  const { toasts } = useToast();

  // Helper to get appropriate icon for toast variant
  const getToastIcon = (variant: string | undefined) => {
    switch (variant) {
      case "destructive":
        return <X className="h-5 w-5 text-red-600" />;
      case "success":
        return <Check className="h-5 w-5 text-green-600" />;
      case "cart":
        return <ShoppingCart className="h-5 w-5 text-indigo-600" />;
      case "wishlist":
        return (
          <Heart className="h-5 w-5 shrink-0 fill-rose-500 text-rose-500 drop-shadow-sm" />
        );
      case "info":
        return <Info className="h-5 w-5 text-blue-600" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      default:
        return <Info className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <ToastProvider>
      {toasts.map(
        ({ id, title, description, action, variant, icon, ...props }) => {
        // Ensure variant is a string or undefined to satisfy type constraints
        const safeVariant = variant ? String(variant) : undefined;

        return (
          <Toast
            key={id}
            variant={
              safeVariant as
                | "default"
                | "destructive"
                | "success"
                | "cart"
                | "wishlist"
                | "info"
                | "warning"
                | undefined
            }
            {...props}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {icon ?? getToastIcon(safeVariant)}
              </div>
              <div className="grid gap-1 flex-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      }
      )}
      <ToastViewport />
    </ToastProvider>
  );
}
