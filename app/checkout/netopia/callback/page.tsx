"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NetopiaCallback() {
  const router = useRouter();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "processing"
  >("loading");
  const [message, setMessage] = useState("Verificare plată...");
  const [isForcing, setIsForcing] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [isSandbox, setIsSandbox] = useState(false);

  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1");

  // Max attempts: 15 attempts x 3 seconds = ~45 seconds of polling
  const MAX_ATTEMPTS = 15;
  // After showing an error in production, gently redirect
  // back to checkout so the customer can retry.
  const ERROR_REDIRECT_DELAY_MS = 8000;

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

        // Update sandbox mode from API response
        if (result.sandboxMode !== undefined) {
          setIsSandbox(result.sandboxMode);
        }

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
            "Plata nu a fost finalizată. Tranzacția a fost respinsă și nu s-a efectuat nicio taxare pe cardul tău."
          );
        } else if (result.status === "pending" || paymentStatus === "pending") {
          attemptRef += 1;
          setAttemptCount(attemptRef);

          // After max attempts, stop polling and show appropriate message
          if (attemptRef >= MAX_ATTEMPTS) {
            // In sandbox mode (including production with sandbox credentials) or localhost,
            // show processing state since webhooks are unreliable in sandbox
            const isSandboxEnv = result.sandboxMode || isSandbox;
            if (isLocalhost || isSandboxEnv) {
              setStatus("processing");
              setMessage(
                "Plata a fost înregistrată de Netopia, dar confirmarea webhook-ului nu a sosit încă. Aceasta este o comportare normală în modul sandbox. Poți folosi butonul de mai jos pentru a marca plata ca efectuată."
              );
            } else {
              // On the live site, if we still don't have a final status after
              // all polling attempts, treat this as a *visible* failure for UX.
              // The order remains PENDING in the backend and will be corrected
              // by the webhook if it eventually arrives.
              setStatus("error");
              setMessage(
                "Nu am reușit să confirmăm plata în timpul alocat. Dacă pe pagina Netopia ai văzut un mesaj de eroare de la bancă, tranzacția NU a fost efectuată. Te rugăm să revii la checkout și să încerci din nou cu același sau cu un alt card."
              );
            }
            return;
          }

          setStatus("loading");
          setMessage(
            `Plata este în curs de confirmare. Vă rugăm să așteptați... (${attemptRef}/${MAX_ATTEMPTS})`
          );

          setTimeout(() => {
            if (!cancelled) {
              handleCallback();
            }
          }, 3000); // Poll every 3 seconds
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

  // In production, when we reach a terminal error state, gently
  // auto-redirect the customer back to checkout after a short delay.
  useEffect(() => {
    if (status !== "error") return;
    if (!orderId) return;

    // Keep sandbox / localhost fully manual for easier debugging.
    if (isLocalhost || isSandbox) return;

    const timer = setTimeout(() => {
      router.push(`/checkout?payment=failed&orderId=${orderId}`);
    }, ERROR_REDIRECT_DELAY_MS);

    return () => clearTimeout(timer);
  }, [status, orderId, isLocalhost, isSandbox, router]);

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
    window.location.href = `mailto:support@techtots.com?subject=${subject}&body=${body}`;
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

        {status === "processing" && (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-amber-600">
              <Clock className="h-7 w-7" />
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Plată în procesare
            </h1>
            <p className="text-gray-600 mb-4">{message}</p>
            {orderId && (
              <div className="mb-5 text-xs text-gray-500">
                ID comandă:{" "}
                <span className="font-mono text-gray-700">{orderId}</span>
              </div>
            )}
            <div className="rounded-lg border border-amber-100 bg-amber-50/40 p-4 text-left text-sm text-gray-700">
              <p className="font-medium text-gray-900 mb-2">Ce urmează</p>
              <ul className="space-y-2">
                <li>✓ Plata a fost trimisă către Netopia</li>
                <li>
                  ✓ Vei primi un email de confirmare când plata este procesată
                </li>
                <li>✓ Poți verifica statusul comenzii în contul tău</li>
              </ul>
            </div>
            <div className="space-y-3 mt-6">
              {(isLocalhost || isSandbox) && orderId && (
                <Button
                  onClick={handleForceComplete}
                  variant="secondary"
                  disabled={isForcing}
                  className="w-full"
                >
                  {isForcing
                    ? "Marchez plata..."
                    : "Marchează ca plătit (sandbox/dev)"}
                </Button>
              )}
              <Button onClick={() => router.push("/")} className="w-full">
                Înapoi la magazin
              </Button>
              <Button
                onClick={() => router.push("/account/orders")}
                variant="outline"
                className="w-full"
              >
                Vezi comenzile mele
              </Button>
            </div>
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
                <li>
                  Dacă pe pagina Netopia ai văzut mesajul{" "}
                  <span className="font-semibold">
                    „Tranzacția nu a fost finalizată / Eroare la banca emitentă”
                  </span>
                  , tranzacția a fost respinsă de bancă și cardul nu a fost
                  debitat.
                </li>
                <li>
                  Poți reveni în siguranță la checkout pentru a încerca din nou
                  plata sau pentru a alege o altă metodă de plată.
                </li>
                <li>
                  Dacă problema persistă, contactează banca emitentă a cardului
                  sau scrie-ne și menționează ID-ul comenzii pentru verificare
                  rapidă.
                </li>
              </ul>
            </div>
            <div className="space-y-3 mt-6">
              {(isLocalhost || isSandbox) && orderId && (
                <Button
                  onClick={handleForceComplete}
                  variant="secondary"
                  disabled={isForcing}
                  className="w-full"
                >
                  {isForcing
                    ? "Marchez plata..."
                    : "Marchează ca plătit (sandbox/dev)"}
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
