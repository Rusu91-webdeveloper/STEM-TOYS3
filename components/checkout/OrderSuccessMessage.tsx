"use client";

import React from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Package, CreditCard } from "lucide-react";

interface OrderSuccessMessageProps {
  orderId: string;
  orderNumber: string;
  paymentMethod?: string;
}

export function OrderSuccessMessage({ 
  orderId, 
  orderNumber, 
  paymentMethod = "Custom Payment Form" 
}: OrderSuccessMessageProps) {
  return (
    <div className="space-y-4">
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-5 w-5 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Order Placed Successfully! 🎉</strong>
        </AlertDescription>
      </Alert>

      <div className="bg-white rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Package className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm font-medium">Order Number</p>
            <p className="text-lg font-bold text-blue-600">{orderNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-sm font-medium">Payment Method</p>
            <p className="text-sm text-gray-600">{paymentMethod}</p>
          </div>
        </div>

        <div className="pt-3 border-t">
          <p className="text-sm text-gray-600">
            <strong>Order ID:</strong> {orderId}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            You will receive an email confirmation shortly.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">
          What happens next?
        </h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• You'll receive an order confirmation email</li>
          <li>• Your order will be processed within 24 hours</li>
          <li>• You'll get shipping updates via email</li>
          <li>• Track your order in your account dashboard</li>
        </ul>
      </div>
    </div>
  );
}
