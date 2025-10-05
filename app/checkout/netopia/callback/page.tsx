"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NetopiaCallback() {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Verificare plată...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const orderId =
          urlParams.get("orderId") ||
          sessionStorage.getItem("netopia_order_id");
        const paymentStatus = urlParams.get("status");

        if (!orderId) {
          setStatus("error");
          setMessage("Lipsesc informațiile despre comandă.");
          return;
        }

        // Verify payment status with our backend
        const response = await fetch(
          `/api/payments/netopia/status?orderId=${orderId}`
        );
        const result = await response.json();

        if (result.status === "paid") {
          setStatus("success");
          setMessage("Plata a fost procesată cu succes!");

          // Clear session storage
          sessionStorage.removeItem("netopia_order_id");
          sessionStorage.removeItem("netopia_payment_method");

          // Redirect to success page after a short delay
          setTimeout(() => {
            router.push("/checkout/success");
          }, 2000);
        } else if (result.status === "failed") {
          setStatus("error");
          setMessage("Plata a eșuat. Vă rugăm să încercați din nou.");
        } else {
          setStatus("error");
          setMessage("Statusul plății este necunoscut. Contactați suportul.");
        }
      } catch (error) {
        console.error("Error handling Netopia callback:", error);
        setStatus("error");
        setMessage("A apărut o eroare la verificarea plății.");
      }
    };

    handleCallback();
  }, [router]);

  const handleRetry = () => {
    router.push("/checkout");
  };

  const handleContactSupport = () => {
    // You could open a support chat, email, or redirect to support page
    window.location.href =
      "mailto:support@techtots.com?subject=Problemă cu plata Netopia";
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
            <XCircle className="mx-auto h-12 w-12 text-red-600 mb-4" />
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Problemă cu plata
            </h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="space-y-3">
              <Button onClick={handleRetry} className="w-full">
                Încearcă din nou
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
