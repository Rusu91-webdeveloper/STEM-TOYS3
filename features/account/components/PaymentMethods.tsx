"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Trash,
  Edit,
  CheckCircle,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
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
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";

// Define card type
type CardType = "visa" | "mastercard" | "amex" | "discover";

// Define card interface
interface PaymentCard {
  id: string;
  cardType: CardType;
  lastFourDigits: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  isDefault: boolean;
}

// Sample payment cards
const SAMPLE_CARDS: PaymentCard[] = [
  {
    id: "card1",
    cardType: "visa",
    lastFourDigits: "4242",
    expiryMonth: "12",
    expiryYear: "2025",
    cardholderName: "John Doe",
    isDefault: true,
  },
  {
    id: "card2",
    cardType: "mastercard",
    lastFourDigits: "5678",
    expiryMonth: "09",
    expiryYear: "2024",
    cardholderName: "John Doe",
    isDefault: false,
  },
];

// Get card logo component based on card type
const getCardLogo = (cardType: CardType) => {
  switch (cardType) {
    case "visa":
      return (
        <div className="flex items-center">
          <div className="bg-blue-500 text-white font-bold text-xs px-1.5 py-0.5 rounded">
            VISA
          </div>
        </div>
      );
    case "mastercard":
      return (
        <div className="flex items-center">
          <div className="bg-red-500 text-white font-bold text-xs px-1.5 py-0.5 rounded">
            MC
          </div>
        </div>
      );
    case "amex":
      return (
        <div className="flex items-center">
          <div className="bg-blue-700 text-white font-bold text-xs px-1.5 py-0.5 rounded">
            AMEX
          </div>
        </div>
      );
    case "discover":
      return (
        <div className="flex items-center">
          <div className="bg-orange-500 text-white font-bold text-xs px-1.5 py-0.5 rounded">
            DISC
          </div>
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

      // Update local state
      setCards(
        cards.map((card) => ({
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

      // Update local state
      setCards(cards.filter((card) => card.id !== id));
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

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-5 w-16" />
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  // Empty state
  if (cards.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <CreditCard className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No payment methods</h3>
        <p className="text-gray-500 mb-6">
          You haven't added any payment methods yet.
        </p>
        <Button onClick={() => router.push("/account/payment-methods/new")}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {cards.map((card) => (
          <Card key={card.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  {getCardLogo(card.cardType)}
                  <CardTitle className="text-base">
                    •••• •••• •••• {card.lastFourDigits}
                  </CardTitle>
                </div>
                {card.isDefault && (
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Default
                  </div>
                )}
              </div>
              <CardDescription>
                Expires {card.expiryMonth}/{card.expiryYear}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm">{card.cardholderName}</p>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              {!card.isDefault && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSetDefault(card.id)}>
                  Set as Default
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="flex items-center"
                onClick={() =>
                  router.push(`/account/payment-methods/${card.id}/edit`)
                }>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
              <AlertDialog
                open={cardToDelete === card.id}
                onOpenChange={(open) => !open && setCardToDelete(null)}>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-500"
                    onClick={() => setCardToDelete(card.id)}>
                    <Trash className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove payment method</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove this payment method? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleDelete(card.id)}
                      className="bg-red-500 hover:bg-red-600">
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
          className="flex items-center"
          onClick={() => router.push("/account/payment-methods/new")}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add New Payment Method
        </Button>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-6 bg-gray-50 p-4 rounded-lg">
        <ShieldCheck className="h-5 w-5 text-green-600" />
        <p>Your payment information is stored securely and encrypted.</p>
      </div>
    </div>
  );
}
