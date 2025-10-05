"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { Loader2 } from "lucide-react";

interface Order {
  id: string;
  totalAmount: number;
  customer?: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface NetopiaPaymentFormProps {
  order: Order;
  paymentMethod: string;
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
}

export function NetopiaPaymentForm({
  order,
  paymentMethod,
  onSuccess,
  onError,
}: NetopiaPaymentFormProps) {
  const { t } = useTranslation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPaymentMethodName = (methodId: string) => {
    switch (methodId) {
      case "netopia_card":
        return "Card bancar";
      case "netopia_sms":
        return "Plată prin SMS";
      case "netopia_wallet":
        return "Portofel mobilPay";
      default:
        return "Netopia Payment";
    }
  };

  const handlePaymentSubmit = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      // Prepare payment data
      const paymentData = {
        orderId: order.id,
        amount: order.totalAmount,
        currency: "RON", // Netopia uses RON for Romanian payments
        customerData: order.customer || {
          name: "Client",
          email: "client@example.com",
        },
        paymentMethod: paymentMethod,
      };

      // Call Netopia payment creation API
      const response = await fetch("/api/payments/netopia/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Payment creation failed");
      }

      const result = await response.json();

      // Check if we got a payment URL (redirect-based flow)
      if (result.paymentUrl) {
        // Store order info in session storage for callback handling
        sessionStorage.setItem("netopia_order_id", order.id);
        sessionStorage.setItem("netopia_payment_method", paymentMethod);

        // Redirect to Netopia payment page
        window.location.href = result.paymentUrl;
        return;
      }

      // If no redirect URL, treat as success (shouldn't happen in normal flow)
      onSuccess?.(result);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Payment failed";
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="text-blue-600">
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div>
            <h3 className="font-medium text-blue-900">
              {getPaymentMethodName(paymentMethod)}
            </h3>
            <p className="text-sm text-blue-700">
              Veți fi redirecționat către Netopia pentru a finaliza plata în
              siguranță.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="text-red-600">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <Button
        onClick={handlePaymentSubmit}
        disabled={isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Procesare plată...
          </>
        ) : (
          <>Plătește cu {getPaymentMethodName(paymentMethod)}</>
        )}
      </Button>

      <div className="text-center">
        <p className="text-sm text-gray-500">
          Plata este procesată securizat de Netopia Payments. Datele tale sunt
          protejate conform standardelor PCI DSS.
        </p>
      </div>
    </div>
  );
}
