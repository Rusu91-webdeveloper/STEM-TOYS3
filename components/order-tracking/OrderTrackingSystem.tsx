"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";

interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location: string;
  timestamp: string;
  isEstimated?: boolean;
}

interface OrderTrackingProps {
  orderId: string;
  orderNumber: string;
  status: string;
  trackingNumber?: string;
  shippingAddress: {
    city: string;
    state: string;
  };
  createdAt: string;
}

export function OrderTrackingSystem({
  orderId,
  orderNumber,
  status,
  trackingNumber,
  shippingAddress,
  createdAt,
}: OrderTrackingProps) {
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTrackingEvents();
  }, [orderId]);

  const loadTrackingEvents = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mockEvents = generateMockEvents(status, createdAt);
    setTrackingEvents(mockEvents);
    setIsLoading(false);
  };

  const generateMockEvents = (
    currentStatus: string,
    orderDate: string
  ): TrackingEvent[] => {
    const baseDate = new Date(orderDate);
    const events: TrackingEvent[] = [];

    events.push({
      id: "1",
      status: "CONFIRMED",
      description: "Order confirmed and payment processed",
      location: "Online",
      timestamp: baseDate.toISOString(),
    });

    if (["PROCESSING", "SHIPPED", "DELIVERED"].includes(currentStatus)) {
      const processingDate = new Date(baseDate);
      processingDate.setHours(baseDate.getHours() + 2);
      events.push({
        id: "2",
        status: "PROCESSING",
        description: "Order is being prepared",
        location: "Fulfillment Center",
        timestamp: processingDate.toISOString(),
      });
    }

    if (["SHIPPED", "DELIVERED"].includes(currentStatus)) {
      const shippedDate = new Date(baseDate);
      shippedDate.setDate(baseDate.getDate() + 1);
      events.push({
        id: "3",
        status: "SHIPPED",
        description: "Package shipped",
        location: "Fulfillment Center",
        timestamp: shippedDate.toISOString(),
      });
    }

    if (currentStatus === "DELIVERED") {
      const deliveredDate = new Date(baseDate);
      deliveredDate.setDate(baseDate.getDate() + 2);
      events.push({
        id: "4",
        status: "DELIVERED",
        description: "Package delivered",
        location: `${shippingAddress.city}, ${shippingAddress.state}`,
        timestamp: deliveredDate.toISOString(),
      });
    }

    return events;
  };

  const getEventIcon = (eventStatus: string) => {
    switch (eventStatus) {
      case "CONFIRMED":
      case "PROCESSING":
        return Package;
      case "SHIPPED":
        return Truck;
      case "DELIVERED":
        return CheckCircle;
      default:
        return Package;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Order Tracking</CardTitle>
          <Badge>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            {trackingEvents.map((event, index) => {
              const EventIcon = getEventIcon(event.status);
              const isLast = index === trackingEvents.length - 1;

              return (
                <div
                  key={event.id}
                  className="relative flex items-start space-x-4"
                >
                  {!isLast && (
                    <div className="absolute left-4 top-10 w-0.5 h-16 bg-gray-200" />
                  )}

                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center z-10">
                    <EventIcon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 pb-8">
                    <h4 className="font-medium">{event.description}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <MapPin className="w-3 h-3 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {event.location}
                      </span>
                      <span className="text-sm text-gray-600">
                        {formatDate(new Date(event.timestamp))}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
