"use client";

import React from "react";
import { ShoppingCart } from "lucide-react";

interface CartIconProps {
  className?: string;
  showCount?: boolean;
}

export function CartIcon({ className = "" }: CartIconProps) {
  return (
    <div className={`relative ${className}`}>
      <ShoppingCart className={`h-6 w-6 ${className}`} />
    </div>
  );
}
