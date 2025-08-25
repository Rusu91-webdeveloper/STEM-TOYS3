"use client";

import { ShoppingBag } from "lucide-react";
import React from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useShoppingCart } from "../context/CartContext";

import { MiniCart } from "./MiniCart";

export function CartDrawer() {
  const { cartCount, isCartOpen, setIsCartOpen } = useShoppingCart();

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="relative">
          <ShoppingBag className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full h-5 w-5 text-xs flex items-center justify-center">
              {cartCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="w-full max-w-lg p-0 border-l shadow-2xl"
        style={{ maxHeight: '100vh' }}
      >
        <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

export default CartDrawer;
