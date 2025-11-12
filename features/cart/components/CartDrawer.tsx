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
import { cn } from "@/lib/utils";

import { useShoppingCart } from "../context/CartContext";

import { MiniCart } from "./MiniCart";

export function CartDrawer() {
  const { cartCount, isCartOpen, setIsCartOpen } = useShoppingCart();

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="relative border-white/20 bg-white/5 text-slate-100 hover:border-white/40 hover:bg-white/10"
        >
          <ShoppingBag className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 via-sky-400 to-indigo-400 text-xs font-semibold text-white shadow-lg shadow-emerald-500/30">
              {cartCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className={cn(
          "w-full max-w-lg border-l border-white/10 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-0 text-slate-100 shadow-[0_0_40px_rgba(76,29,149,0.45)] backdrop-blur-xl",
          "data-[state=closed]:translate-x-full data-[state=open]:translate-x-0"
        )}
        style={{ maxHeight: "100vh" }}
      >
        <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

export default CartDrawer;
