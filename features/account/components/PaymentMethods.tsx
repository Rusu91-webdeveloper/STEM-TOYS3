"use client";

import {
  CreditCard,
  Trash,
  Edit,
  CheckCircle,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  glassCardClass,
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

type CardType = "visa" | "mastercard" | "amex" | "discover";

interface PaymentCard {
  id: string;
  cardType: CardType;
  lastFourDigits: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  isDefault: boolean;
}

const getCardLogo = (cardType: CardType) => {
  switch (cardType) {
    case "visa":
      return (
        <div className="rounded px-1.5 py-0.5 text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg,#2563eb,#60a5fa)" }}>
          VISA
        </div>
      );
    case "mastercard":
      return (
        <div className="rounded bg-gradient-to-r from-orange-500 to-red-500 px-1.5 py-0.5 text-xs font-semibold text-white">
          MC
        </div>
      );
    case "amex":
      return (
        <div className="rounded bg-gradient-to-r from-sky-500 to-blue-700 px-1.5 py-0.5 text-xs font-semibold text-white">
          AMEX
        </div>
      );
    case "discover":
      return (
        <div className="rounded bg-gradient-to-r from-amber-500 to-orange-600 px-1.5 py-0.5 text-xs font-semibold text-white">
          DISC
        </div>
      );
    default:
      return null;
  }
};

export function PaymentMethods() {
  const [isLoading, setIsLoading] = useState(true);
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [cardToDelete, setCardToDelete] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        const response = await fetch("/api/account/payment-cards");

        if (!response.ok) {
          throw new Error("Failed to fetch payment cards");
        }

        const data = await response.json();
        setCards(data);
      } catch (error) {
        console.error("Error fetching payment methods:", error);
        toast({
          title: "Error",
          description: "Failed to load payment methods. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentMethods();
  }, []);

  const handleSetDefault = async (id: string) => {
    try {
      const response = await fetch(`/api/account/payment-cards/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isDefault: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to update default payment method");
      }

      setCards(prev =>
        prev.map(card => ({
          ...card,
          isDefault: card.id === id,
        }))
      );

      toast({
        title: "Default payment method updated",
        description: "Your default payment method has been updated.",
      });
    } catch (error) {
      console.error("Error setting default payment method:", error);
      toast({
        title: "Error",
        description: "Failed to update default payment method.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/account/payment-cards/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove payment method");
      }

      setCards(prev => prev.filter(card => card.id !== id));
      setCardToDelete(null);

      toast({
        title: "Payment method removed",
        description: "Your payment method has been removed.",
      });

      router.refresh();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast({
        title: "Error",
        description: "Failed to remove payment method.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 text-slate-100">
        {[1, 2].map(i => (
          <Card
            key={i}
            className={cn(
              glassCardClass,
              "border-white/10 bg-slate-900/60 p-0 shadow-lg shadow-black/30"
            )}
          >
            <CardHeader className="flex items-center justify-between pb-2">
              <Skeleton className="h-6 w-32 rounded bg-white/10" />
              <Skeleton className="h-5 w-16 rounded bg-white/10" />
            </CardHeader>
            <CardContent className="space-y-2 pb-2">
              <Skeleton className="h-4 w-48 rounded bg-white/10" />
              <Skeleton className="h-4 w-32 rounded bg-white/10" />
            </CardContent>
            <CardFooter className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded bg-white/10" />
              <Skeleton className="h-9 w-24 rounded bg-white/10" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div
        className={cn(
          glassPanelClass,
          "space-y-4 rounded-3xl border-white/10 bg-slate-900/70 p-10 text-center text-slate-100 shadow-xl shadow-black/30"
        )}
      >
        <CreditCard className="mx-auto h-12 w-12 text-slate-400" />
        <h3 className="text-lg font-semibold">No payment methods</h3>
        <p className="text-slate-300">
          You haven't added any payment methods yet.
        </p>
        <Button
          onClick={() => router.push("/account/payment-methods/new")}
          className={cn(
            "mx-auto inline-flex min-w-[220px] items-center gap-2 transition hover:scale-[1.02]",
            gradientButtonClass
          )}
        >
          <PlusCircle className="h-4 w-4" />
          Add Payment Method
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-100">
      <div className="grid gap-4">
        {cards.map(card => (
          <Card
            key={card.id}
            className={cn(
              glassCardClass,
              "border-white/10 bg-slate-900/60 text-slate-100 shadow-lg shadow-black/30"
            )}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getCardLogo(card.cardType)}
                  <CardTitle className="text-base">
                    •••• •••• •••• {card.lastFourDigits}
                  </CardTitle>
                </div>
                {card.isDefault && (
                  <div className="flex items-center gap-1 text-sm text-emerald-200">
                    <CheckCircle className="h-4 w-4" />
                    Default
                  </div>
                )}
              </div>
              <CardDescription className="text-slate-300">
                Expires {card.expiryMonth}/{card.expiryYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-slate-200">{card.cardholderName}</p>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              {!card.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-sky-400/40 bg-sky-500/20 text-sky-100 transition hover:border-sky-400/60 hover:bg-sky-500/25"
                  onClick={() => handleSetDefault(card.id)}
                >
                  Set as Default
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 bg-white/10 text-slate-100 transition hover:border-white/30 hover:bg-white/15"
                onClick={() =>
                  router.push(`/account/payment-methods/${card.id}/edit`)
                }
              >
                <Edit className="mr-1 h-4 w-4" />
                Edit
              </Button>
              <AlertDialog
                open={cardToDelete === card.id}
                onOpenChange={open => !open && setCardToDelete(null)}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-rose-400/40 bg-rose-500/15 text-rose-200 transition hover:border-rose-400/60 hover:bg-rose-500/25"
                    onClick={() => setCardToDelete(card.id)}
                  >
                    <Trash className="mr-1 h-4 w-4" />
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="border-white/15 bg-slate-900/85 text-slate-100 backdrop-blur">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove payment method</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-300">
                      Are you sure you want to remove this payment method? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="border-white/20 bg-white/10 text-slate-100 hover:border-white/30 hover:bg-white/15">
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(card.id)}
                      className="bg-rose-500 text-white hover:bg-rose-600"
                    >
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <Button
          className={cn(
            "inline-flex items-center gap-2 transition hover:scale-[1.02]",
            gradientButtonClass
          )}
          onClick={() => router.push("/account/payment-methods/new")}
        >
          <PlusCircle className="h-4 w-4" />
          Add New Payment Method
        </Button>
      </div>

      <div
        className={cn(
          glassPanelClass,
          "flex items-center gap-3 border-white/10 bg-slate-900/70 px-5 py-4 text-sm text-slate-200 shadow-lg shadow-black/30"
        )}
      >
        <ShieldCheck className="h-5 w-5 text-emerald-300" />
        <p>Your payment information is stored securely and encrypted.</p>
      </div>
    </div>
  );
}
