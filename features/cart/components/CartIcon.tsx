"use client";

import { ShoppingCart } from "lucide-react";
import React from "react";

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
