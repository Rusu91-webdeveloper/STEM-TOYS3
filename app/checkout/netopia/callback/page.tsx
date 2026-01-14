"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NetopiaCallback() {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verificare plată...");
  const [isForcing, setIsForcing] = useState(false);
  const [, setAttempts] = useState(0);

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");
  const MAX_ATTEMPTS = 6;

  useEffect(() => {
    let cancelled = false;
    let attemptRef = 0;

    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const storedPendingOrderId =
          sessionStorage.getItem("pendingOrderId") ||
          sessionStorage.getItem("netopia_order_id");
        const currentOrderId =
          urlParams.get("orderId") || storedPendingOrderId || null;
        const paymentStatus = urlParams.get("status");

        if (!currentOrderId) {
          setStatus("error");
          setMessage("Lipsesc informațiile despre comandă.");
          return;
        }

        setOrderId(currentOrderId);

        // Verify payment status with our backend
        const response = await fetch(
          `/api/payments/netopia/status?orderId=${currentOrderId}`,
          {
            cache: "no-store",
          }
        );
        const result = await response.json();

        if (result.status === "paid" || result.status === "refunded") {
          setStatus("success");
          setMessage("Plata a fost procesată cu succes!");

          // Clear session storage
          sessionStorage.removeItem("netopia_order_id");
          sessionStorage.removeItem("netopia_payment_method");
          sessionStorage.removeItem("pendingOrderId");
          sessionStorage.removeItem("pendingPaymentMethod");
          sessionStorage.removeItem("pendingPaymentProvider");
          sessionStorage.setItem("orderCompleted", "true");
          sessionStorage.setItem("orderId", currentOrderId);

          // Redirect to success page after a short delay
          setTimeout(() => {
            if (!cancelled) {
              router.push(`/checkout/confirmation?orderId=${currentOrderId}`);
            }
          }, 2000);
        } else if (result.status === "failed" || paymentStatus === "failed") {
          setStatus("error");
          setMessage(
            "Plata nu a fost finalizată. Nu s-a efectuat nicio taxare."
          );
        } else if (result.status === "pending" || paymentStatus === "pending") {
          // After a few attempts on localhost, stop looping and offer a manual dev override.
          attemptRef += 1;
          if (attemptRef >= MAX_ATTEMPTS && isLocalhost) {
            setStatus("error");
            setMessage(
              "Plata este încă în curs de confirmare. Pe localhost, webhook-ul Netopia nu poate ajunge aici. Finalizează manual sau încearcă din nou."
            );
            return;
          }

          setStatus("loading");
          setMessage(
            "Plata este în curs de confirmare. Vă rugăm să așteptați..."
          );
          setAttempts(prev => prev + 1);

          setTimeout(() => {
            if (!cancelled) {
              handleCallback();
            }
          }, 4000);
        } else {
          setStatus("error");
          setMessage("Statusul plății este necunoscut. Contactați suportul.");
        }
      } catch (error) {
        console.error("Error handling Netopia callback:", error);
        setStatus("error");
        setMessage(
          "Nu am reușit să verificăm plata în acest moment. Te rugăm să încerci din nou."
        );
      }
    };

    handleCallback();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleRetry = () => {
    router.push("/checkout");
  };

  const handleForceComplete = async () => {
    if (!orderId) return;
    setIsForcing(true);
    try {
      const response = await fetch(
        `/api/payments/netopia/status?orderId=${orderId}&force=1`,
        { cache: "no-store" }
      );
      const result = await response.json();

      if (result.status === "paid" || result.status === "refunded") {
        setStatus("success");
        setMessage("Plata a fost marcată ca plătită pentru testare locală.");
        sessionStorage.removeItem("netopia_order_id");
        sessionStorage.removeItem("netopia_payment_method");
        sessionStorage.removeItem("pendingOrderId");
        sessionStorage.removeItem("pendingPaymentMethod");
        sessionStorage.removeItem("pendingPaymentProvider");
        sessionStorage.setItem("orderCompleted", "true");
        sessionStorage.setItem("orderId", orderId);

        setTimeout(() => {
          router.push(`/checkout/confirmation?orderId=${orderId}`);
        }, 1200);
      } else {
        setMessage(
          "Încă nu am putut confirma plata. Verifică consola și configurarea tunelului."
        );
      }
    } catch (error) {
      console.error("Error forcing Netopia status:", error);
      setMessage("Nu am putut forța confirmarea plății.");
    } finally {
      setIsForcing(false);
    }
  };

  const handleContactSupport = () => {
    // You could open a support chat, email, or redirect to support page
    const subject = encodeURIComponent(
      orderId
        ? `Problemă plată Netopia - Comanda ${orderId}`
        : "Problemă plată Netopia"
    );
    const body = encodeURIComponent(
      orderId
        ? `Bună ziua,\n\nAcesta este un raport automat pentru comanda ${orderId}.\nDescriere problemă:\n`
        : "Bună ziua,\n\nDescriere problemă:\n"
    );
    window.location.href =
      `mailto:support@techtots.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-12 w-12 text-blue-600 animate-spin mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Procesare plată Netopia
            </h1>
            <p className="text-gray-600">{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Plată reușită!
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <p className="text-sm text-gray-500">
              Veți fi redirecționat către pagina de succes...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600">
              <XCircle className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-2">
              Plată nefinalizată
            </h1>
            <p className="text-gray-600 mb-4">{message}</p>
            {orderId && (
              <div className="mb-5 text-xs text-gray-500">
                ID comandă:{" "}
                <span className="font-mono text-gray-700">{orderId}</span>
              </div>
            )}
            <div className="rounded-lg border border-red-100 bg-red-50/40 p-4 text-left text-sm text-gray-700">
              <p className="font-medium text-gray-900 mb-2">
                Ce poți face acum
              </p>
              <ul className="space-y-2">
                <li>Încearcă din nou sau alege o altă metodă de plată.</li>
                <li>Verifică dacă banca a autorizat tranzacția.</li>
                <li>
                  Contactează suportul și menționează ID-ul comenzii pentru
                  verificare rapidă.
                </li>
              </ul>
            </div>
            <div className="space-y-3 mt-6">
              {isLocalhost && orderId && (
                <Button
                  onClick={handleForceComplete}
                  variant="secondary"
                  disabled={isForcing}
                  className="w-full"
                >
                  {isForcing
                    ? "Marchez plata..."
                    : "Finalizează manual (dev localhost)"}
                </Button>
              )}
              <Button onClick={handleRetry} className="w-full">
                Înapoi la checkout
              </Button>
              <Button
                onClick={handleContactSupport}
                variant="outline"
                className="w-full"
              >
                Contactează suportul
              </Button>
            </div>
          </>
        )}

        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>🔒</span>
            <span>Plați securizate de Netopia Payments</span>
          </div>
        </div>
      </div>
    </div>
  );
}
