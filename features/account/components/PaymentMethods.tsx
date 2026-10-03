"use client";

import { CreditCard, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

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
import { PaymentCardNotice } from "@/features/account/components/PaymentCardNotice";
import { useTranslation } from "@/lib/i18n";

interface LegacyCard {
  id: string;
  cardType: string;
  lastFourDigits: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
}

export function PaymentMethods() {
  const { language } = useTranslation();
  const [cards, setCards] = useState<LegacyCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const copy =
    language === "ro"
      ? {
          loading: "Se încarcă…",
          loadError:
            "Cardurile nu au putut fi încărcate. Reîncarcă pagina pentru a încerca din nou.",
          deleteError: "Cardul nu a putut fi eliminat. Încearcă din nou.",
          empty: "Nu ai carduri salvate în cont.",
          legacy:
            "Cardurile salvate anterior nu sunt utilizate la finalizarea comenzii. Le poți elimina de aici.",
          expiry: "Expiră",
          remove: "Elimină cardul",
          confirm: "Elimini cardul salvat?",
          description:
            "Înregistrarea acestui card va fi eliminată din cont. Operațiunea nu poate fi anulată.",
          cancel: "Anulează",
        }
      : {
          loading: "Loading…",
          loadError: "Unable to load cards. Reload the page to try again.",
          deleteError: "Unable to remove the card. Please try again.",
          empty: "You have no saved cards in your account.",
          legacy:
            "Previously saved cards are not used at checkout. You can remove them here.",
          expiry: "Expires",
          remove: "Remove card",
          confirm: "Remove saved card?",
          description:
            "This card record will be removed from your account. This cannot be undone.",
          cancel: "Cancel",
        };

  useEffect(() => {
    let active = true;
    async function loadCards() {
      try {
        const response = await fetch("/api/account/payment-cards", {
          cache: "no-store",
        });
        if (!response.ok) throw new Error("Card metadata unavailable");
        const data: LegacyCard[] = await response.json();
        if (active) setCards(data);
      } catch {
        if (active) setError("load");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void loadCards();
    return () => {
      active = false;
    };
  }, []);

  async function removeCard(id: string) {
    setRemovingId(id);
    setError(null);
    try {
      const response = await fetch(
        `/api/account/payment-cards/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) throw new Error("Card removal failed");
      setCards(previous => previous.filter(card => card.id !== id));
    } catch {
      setError("delete");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="space-y-4 text-slate-100">
      <PaymentCardNotice />
      {isLoading && <p role="status">{copy.loading}</p>}
      {error && (
        <p role="alert">
          {error === "load" ? copy.loadError : copy.deleteError}
        </p>
      )}
      {!isLoading && !error && cards.length === 0 && <p>{copy.empty}</p>}
      {cards.length > 0 && (
        <p className="text-sm text-slate-300">{copy.legacy}</p>
      )}
      {cards.map(card => (
        <div
          key={card.id}
          className="rounded-2xl border border-white/15 bg-slate-900/70 p-5"
        >
          <h3 className="flex items-center gap-2 font-semibold">
            <CreditCard className="h-5 w-5" aria-hidden="true" />
            {card.cardType} •••• {card.lastFourDigits}
          </h3>
          <p className="mt-2 text-sm text-slate-300">{card.cardholderName}</p>
          <p className="text-sm text-slate-300">
            {copy.expiry} {card.expiryMonth}/{card.expiryYear}
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="mt-3"
                disabled={removingId !== null}
              >
                <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                {copy.remove}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{copy.confirm}</AlertDialogTitle>
                <AlertDialogDescription>
                  {copy.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{copy.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={() => void removeCard(card.id)}>
                  {copy.remove}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      ))}
    </div>
  );
}
