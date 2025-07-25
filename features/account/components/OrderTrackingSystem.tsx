"use client";

import {
  Package,
  Truck,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Phone,
  Mail,
  Calendar,
  Navigation,
  Loader2,
  RefreshCw,
  ExternalLink,
  Bell,
  BellOff,
} from "lucide-react";
import React, { useState, useEffect } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCurrency } from "@/lib/currency";
import { formatDate } from "@/lib/utils";

interface TrackingEvent {
  id: string;
  status: string;
  description: string;
  location: string;
  timestamp: string;
  isEstimated?: boolean;
}

interface CarrierInfo {
  name: string;
  trackingUrl?: string;
  phone?: string;
  estimatedDelivery?: string;
}

interface OrderTrackingProps {
  orderId: string;
  orderNumber: string;
  status: string;
  trackingNumber?: string;
  carrier?: CarrierInfo;
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  estimatedDelivery?: string;
  actualDelivery?: string;
  createdAt: string;
}

const ORDER_STATUSES = {
  PENDING: {
    label: "Order Confirmed",
    color: "bg-blue-100 text-blue-800",
    icon: Package,
  },
  PROCESSING: {
    label: "Being Prepared",
    color: "bg-yellow-100 text-yellow-800",
    icon: Package,
  },
  SHIPPED: {
    label: "Shipped",
    color: "bg-purple-100 text-purple-800",
    icon: Truck,
  },
  IN_TRANSIT: {
    label: "In Transit",
    color: "bg-indigo-100 text-indigo-800",
    icon: Truck,
  },
  OUT_FOR_DELIVERY: {
    label: "Out for Delivery",
    color: "bg-orange-100 text-orange-800",
    icon: Truck,
  },
  DELIVERED: {
    label: "Delivered",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
  },
  EXCEPTION: {
    label: "Delivery Exception",
    color: "bg-red-100 text-red-800",
    icon: AlertCircle,
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-800",
    icon: AlertCircle,
  },
} as const;

export function OrderTrackingSystem({
  orderId,
  orderNumber,
  status,
  trackingNumber,
  carrier,
  shippingAddress,
  estimatedDelivery,
  actualDelivery,
  createdAt,
}: OrderTrackingProps) {
  const [trackingEvents, setTrackingEvents] = useState<TrackingEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { formatPrice } = useCurrency();

  // Load tracking events
  useEffect(() => {
    loadTrackingEvents();
  }, [orderId]);

  const loadTrackingEvents = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Simulate API call for tracking events
      // In a real app, this would fetch from a tracking API
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockEvents = generateMockTrackingEvents(status, createdAt);
      setTrackingEvents(mockEvents);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error loading tracking events:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const generateMockTrackingEvents = (
    currentStatus: string,
    orderDate: string
  ): TrackingEvent[] => {
    const baseDate = new Date(orderDate);
    const events: TrackingEvent[] = [];

    // Order confirmed
    events.push({
      id: "1",
      status: "CONFIRMED",
      description: "Order confirmed and payment processed",
      location: "Online",
      timestamp: baseDate.toISOString(),
    });

    if (
      [
        "PROCESSING",
        "SHIPPED",
        "IN_TRANSIT",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
      ].includes(currentStatus)
    ) {
      // Processing
      const processingDate = new Date(baseDate);
      processingDate.setHours(baseDate.getHours() + 2);
      events.push({
        id: "2",
        status: "PROCESSING",
        description: "Order is being prepared for shipment",
        location: "Fulfillment Center - New York, NY",
        timestamp: processingDate.toISOString(),
      });
    }

    if (
      ["SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY", "DELIVERED"].includes(
        currentStatus
      )
    ) {
      // Shipped
      const shippedDate = new Date(baseDate);
      shippedDate.setDate(baseDate.getDate() + 1);
      events.push({
        id: "3",
        status: "SHIPPED",
        description: "Package has been picked up by carrier",
        location: "Fulfillment Center - New York, NY",
        timestamp: shippedDate.toISOString(),
      });

      // In transit
      const transitDate = new Date(shippedDate);
      transitDate.setHours(shippedDate.getHours() + 6);
      events.push({
        id: "4",
        status: "IN_TRANSIT",
        description: "Package is in transit to destination",
        location: "Sorting Facility - Philadelphia, PA",
        timestamp: transitDate.toISOString(),
      });
    }

    if (["OUT_FOR_DELIVERY", "DELIVERED"].includes(currentStatus)) {
      // Out for delivery
      const deliveryDate = new Date(baseDate);
      deliveryDate.setDate(baseDate.getDate() + 2);
      deliveryDate.setHours(8, 0, 0, 0);
      events.push({
        id: "5",
        status: "OUT_FOR_DELIVERY",
        description: "Package is out for delivery",
        location: `Local Facility - ${shippingAddress.city}, ${shippingAddress.state}`,
        timestamp: deliveryDate.toISOString(),
      });
    }

    if (currentStatus === "DELIVERED") {
      // Delivered
      const deliveredDate = new Date(actualDelivery || baseDate);
      deliveredDate.setDate(deliveredDate.getDate() + 2);
      deliveredDate.setHours(14, 30, 0, 0);
      events.push({
        id: "6",
        status: "DELIVERED",
        description: "Package has been delivered",
        location: `${shippingAddress.addressLine1}, ${shippingAddress.city}`,
        timestamp: deliveredDate.toISOString(),
      });
    }

    // Add estimated future events for pending orders
    if (
      !["DELIVERED", "CANCELLED"].includes(currentStatus) &&
      estimatedDelivery
    ) {
      const estDeliveryDate = new Date(estimatedDelivery);
      events.push({
        id: "estimated",
        status: "ESTIMATED_DELIVERY",
        description: "Estimated delivery date",
        location: `${shippingAddress.addressLine1}, ${shippingAddress.city}`,
        timestamp: estDeliveryDate.toISOString(),
        isEstimated: true,
      });
    }

    return events.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  };

  const toggleNotifications = async () => {
    // In a real app, this would register/unregister for push notifications
    setNotificationsEnabled(!notificationsEnabled);
  };

  const getStatusInfo = (statusKey: string) => (
      ORDER_STATUSES[statusKey as keyof typeof ORDER_STATUSES] ||
      ORDER_STATUSES.PENDING
    );

  const getEventIcon = (eventStatus: string) => {
    switch (eventStatus) {
      case "CONFIRMED":
      case "PROCESSING":
        return Package;
      case "SHIPPED":
      case "IN_TRANSIT":
        return Truck;
      case "OUT_FOR_DELIVERY":
        return Navigation;
      case "DELIVERED":
        return CheckCircle;
      case "ESTIMATED_DELIVERY":
        return Clock;
      default:
        return Info;
    }
  };

  const currentStatusInfo = getStatusInfo(status);
  const StatusIcon = currentStatusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header with Current Status */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <StatusIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Order {orderNumber}</CardTitle>
                <CardDescription className="flex items-center space-x-2">
                  <Badge className={currentStatusInfo.color}>
                    {currentStatusInfo.label}
                  </Badge>
                  {trackingNumber && (
                    <span className="text-sm">
                      • Tracking: {trackingNumber}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleNotifications}
                className="hidden sm:flex"
              >
                {notificationsEnabled ? (
                  <>
                    <BellOff className="w-4 h-4 mr-2" />
                    Disable Alerts
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4 mr-2" />
                    Enable Alerts
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => loadTrackingEvents(true)}
                disabled={isRefreshing}
              >
                {isRefreshing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Quick Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Order Date</p>
                <p className="text-sm text-gray-600">
                  {formatDate(new Date(createdAt))}
                </p>
              </div>
            </div>

            {estimatedDelivery && !actualDelivery && (
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium">Estimated Delivery</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(new Date(estimatedDelivery))}
                  </p>
                </div>
              </div>
            )}

            {actualDelivery && (
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm font-medium">Delivered</p>
                  <p className="text-sm text-gray-600">
                    {formatDate(new Date(actualDelivery))}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <div>
                <p className="text-sm font-medium">Delivering to</p>
                <p className="text-sm text-gray-600">
                  {shippingAddress.city}, {shippingAddress.state}
                </p>
              </div>
            </div>
          </div>

          {/* Carrier Info */}
          {carrier && (
            <Alert className="mb-6">
              <Truck className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">Carrier: {carrier.name}</span>
                    {carrier.phone && (
                      <span className="ml-2 text-sm">• {carrier.phone}</span>
                    )}
                  </div>
                  {carrier.trackingUrl && trackingNumber && (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={carrier.trackingUrl.replace(
                          "{trackingNumber}",
                          trackingNumber
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Track on {carrier.name}
                      </a>
                    </Button>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Tracking Timeline */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Tracking History</CardTitle>
            <p className="text-sm text-gray-500">
              Last updated: {formatDate(lastUpdated)}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="ml-2">Loading tracking information...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {trackingEvents.map((event, index) => {
                const EventIcon = getEventIcon(event.status);
                const isCompleted = !event.isEstimated;
                const isLast = index === trackingEvents.length - 1;

                return (
                  <div
                    key={event.id}
                    className="relative flex items-start space-x-4"
                  >
                    {/* Timeline line */}
                    {!isLast && (
                      <div className="absolute left-4 top-10 w-0.5 h-16 bg-gray-200" />
                    )}

                    {/* Event icon */}
                    <div
                      className={`
                      w-8 h-8 rounded-full flex items-center justify-center z-10
                      ${isCompleted ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}
                      ${event.isEstimated ? "border-2 border-dashed border-gray-400 bg-white" : ""}
                    `}
                    >
                      <EventIcon className="w-4 h-4" />
                    </div>

                    {/* Event details */}
                    <div className="flex-1 pb-8">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`font-medium ${event.isEstimated ? "text-gray-500" : ""}`}
                        >
                          {event.description}
                        </h4>
                        <span
                          className={`text-sm ${event.isEstimated ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {event.isEstimated
                            ? "Estimated"
                            : formatDate(new Date(event.timestamp))}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span
                          className={`text-sm ${event.isEstimated ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {event.location}
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

      {/* Delivery Instructions */}
      {status === "OUT_FOR_DELIVERY" && (
        <Alert>
          <Navigation className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Your package is out for delivery!</p>
              <p className="text-sm">
                Expected delivery window: 9:00 AM - 6:00 PM today. Please ensure
                someone is available to receive the package.
              </p>
              <div className="flex space-x-2 mt-3">
                <Button variant="outline" size="sm">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Driver
                </Button>
                <Button variant="outline" size="sm">
                  <MapPin className="w-4 h-4 mr-2" />
                  Track Live
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Delivery Issues */}
      {status === "EXCEPTION" && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium text-red-800">Delivery Exception</p>
              <p className="text-sm text-red-700">
                There was an issue with your delivery. Our team is working to
                resolve it. Expected resolution: within 24 hours.
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                <Phone className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
