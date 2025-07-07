"use client";

import { formatDistance } from "date-fns";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";

// Define return types
type ReturnReason =
  | "DOES_NOT_MEET_EXPECTATIONS"
  | "DAMAGED_OR_DEFECTIVE"
  | "WRONG_ITEM_SHIPPED"
  | "CHANGED_MIND"
  | "ORDERED_WRONG_PRODUCT"
  | "OTHER";

type ReturnStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "REFUNDED";

interface ReturnItem {
  id: string;
  reason: ReturnReason;
  details: string | null;
  status: ReturnStatus;
  createdAt: string;
  order: {
    orderNumber: string;
    createdAt: string;
  };
  orderItem: {
    name: string;
    price: number;
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      images: string[];
      sku: string;
    };
  };
}

// Define return status badges with colors
const statusBadges: Record<ReturnStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Approved", color: "bg-blue-100 text-blue-800" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
  RECEIVED: { label: "Received", color: "bg-purple-100 text-purple-800" },
  REFUNDED: { label: "Refunded", color: "bg-green-100 text-green-800" },
};

// Define reason display labels
const reasonLabels: Record<ReturnReason, string> = {
  DOES_NOT_MEET_EXPECTATIONS: "Does not meet expectations",
  DAMAGED_OR_DEFECTIVE: "Damaged or defective",
  WRONG_ITEM_SHIPPED: "Wrong item shipped",
  CHANGED_MIND: "Changed my mind",
  ORDERED_WRONG_PRODUCT: "Ordered wrong product",
  OTHER: "Other reason",
};

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/returns/user");

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setReturns(data.returns || []);
      } catch (error) {
        console.error("Error fetching returns:", error);
        toast({
          title: "Error",
          description: "Failed to load your returns. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (returns.length === 0) {
    return (
      <div className="mt-6">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <h3 className="text-lg font-medium mb-2">No returns found</h3>
          <p className="text-gray-500 mb-4">
            You haven't initiated any returns yet.
          </p>
          <Link
            href="/account/orders"
            className="text-primary hover:underline">
            View your orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Your Returns</h1>

      <div className="space-y-4">
        {returns.map((returnItem) => (
          <div
            key={returnItem.id}
            className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                {returnItem.orderItem.product.images?.[0] && (
                  <div className="relative h-16 w-16 rounded overflow-hidden">
                    <Image
                      src={returnItem.orderItem.product.images[0]}
                      alt={returnItem.orderItem.name}
                      className="object-cover"
                      fill
                    />
                  </div>
                )}

                <div>
                  <h3 className="font-medium">{returnItem.orderItem.name}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    Order #{returnItem.order.orderNumber} •
                    {formatDistance(
                      new Date(returnItem.createdAt),
                      new Date(),
                      { addSuffix: true }
                    )}
                  </div>
                  <div className="mt-1 text-sm">
                    <span className="text-gray-500">Reason:</span>{" "}
                    <span className="font-medium">
                      {reasonLabels[returnItem.reason]}
                    </span>
                    {returnItem.details && (
                      <p className="text-sm italic mt-1">
                        {returnItem.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <Badge className={statusBadges[returnItem.status].color}>
                {statusBadges[returnItem.status].label}
              </Badge>
            </div>

            {returnItem.status === "APPROVED" && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-green-600">
                  Your return has been approved. Please check your email for the
                  return shipping label.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
