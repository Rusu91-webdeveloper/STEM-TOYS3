"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Edit,
  Save,
  X,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { type SupplierOrder, type SupplierOrderStatus } from "@/features/supplier/types/supplier";
import { ShippingLabelGenerator } from "./ShippingLabelGenerator";

interface OrderDetailData {
  order: SupplierOrder & {
    order: {
      orderNumber: string;
      total: number;
      status: string;
      paymentStatus: string;
      paymentMethod: string;
      createdAt: Date;
      deliveredAt?: Date;
      shippingAddress: {
        fullName: string;
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
        phone: string;
      };
      user: {
        name: string;
        email: string;
      };
    };
    product: {
      name: string;
      images: string[];
      sku?: string;
    };
  };
}

const statusConfig = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
    nextStatuses: ["CONFIRMED", "CANCELLED"]
  },
  CONFIRMED: {
    label: "Confirmed",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Package,
    nextStatuses: ["IN_PRODUCTION", "CANCELLED"]
  },
  IN_PRODUCTION: {
    label: "In Production",
    color: "bg-purple-100 text-purple-800 border-purple-200",
    icon: RefreshCw,
    nextStatuses: ["READY_TO_SHIP", "CANCELLED"]
  },
  READY_TO_SHIP: {
    label: "Ready to Ship",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: Package,
    nextStatuses: ["SHIPPED", "CANCELLED"]
  },
  SHIPPED: {
    label: "Shipped",
    color: "bg-indigo-100 text-indigo-800 border-indigo-200",
    icon: Truck,
    nextStatuses: ["DELIVERED"]
  },
  DELIVERED: {
    label: "Delivered",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
    nextStatuses: []
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
    nextStatuses: []
  }
};

interface SupplierOrderDetailProps {
  orderId: string;
}

export function SupplierOrderDetail({ orderId }: SupplierOrderDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [orderData, setOrderData] = useState<OrderDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStatus, setEditingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState<SupplierOrderStatus | "">("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [showShippingLabel, setShowShippingLabel] = useState(false);

  useEffect(() => {
    fetchOrderDetail();
  }, [orderId]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/supplier/orders/${orderId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch order details");
      }

      const data = await response.json();
      setOrderData(data);
      setTrackingNumber(data.order.trackingNumber || "");
      setNotes(data.order.notes || "");
    } catch (err) {
      console.error("Error fetching order details:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      toast({
        title: "Error",
        description: "Failed to load order details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!newStatus) return;

    try {
      const response = await fetch(`/api/supplier/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: trackingNumber || undefined,
          notes: notes || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      toast({
        title: "Success",
        description: "Order status updated successfully",
      });

      setEditingStatus(false);
      setNewStatus("");
      fetchOrderDetail();
    } catch (err) {
      console.error("Error updating order status:", err);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const handleLabelGenerated = (newTrackingNumber: string) => {
    setTrackingNumber(newTrackingNumber);
    setNewStatus("SHIPPED");
    handleStatusUpdate();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64" />
            <Skeleton className="h-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-48" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error || "Order not found"}</AlertDescription>
      </Alert>
    );
  }

  const { order } = orderData;
  const currentStatusInfo = statusConfig[order.status as keyof typeof statusConfig];
  const StatusIcon = currentStatusInfo?.icon || Clock;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/supplier/orders")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
          <div>
            <h2 className="text-2xl font-bold">Order #{order.order.orderNumber}</h2>
            <p className="text-muted-foreground">
              Created on {formatDate(order.createdAt)}
            </p>
          </div>
        </div>
        <Badge className={currentStatusInfo?.color}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {currentStatusInfo?.label}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Information */}
          <Card>
            <CardHeader>
              <CardTitle>Order Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Order Number</label>
                  <p className="font-medium">#{order.order.orderNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Order Date</label>
                  <p className="font-medium">{formatDate(order.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Status</label>
                  <Badge variant={order.order.paymentStatus === "PAID" ? "default" : "secondary"}>
                    {order.order.paymentStatus}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Payment Method</label>
                  <p className="font-medium">{order.order.paymentMethod}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-4">
                {order.product.images[0] && (
                  <img
                    src={order.product.images[0]}
                    alt={order.product.name}
                    className="w-20 h-20 object-cover rounded-md"
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-medium">{order.product.name}</h3>
                  {order.product.sku && (
                    <p className="text-sm text-muted-foreground">SKU: {order.product.sku}</p>
                  )}
                  <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="ml-1 font-medium">{order.quantity}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Unit Price:</span>
                      <span className="ml-1 font-medium">{formatCurrency(order.unitPrice)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-1 font-medium">{formatCurrency(order.totalPrice)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Customer Name</label>
                  <p className="font-medium">{order.order.user.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="font-medium">{order.order.user.email}</p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">Shipping Address</label>
                <div className="mt-1 p-3 bg-muted rounded-md">
                  <p className="font-medium">{order.order.shippingAddress.fullName}</p>
                  <p>{order.order.shippingAddress.addressLine1}</p>
                  {order.order.shippingAddress.addressLine2 && (
                    <p>{order.order.shippingAddress.addressLine2}</p>
                  )}
                  <p>
                    {order.order.shippingAddress.city}, {order.order.shippingAddress.state} {order.order.shippingAddress.postalCode}
                  </p>
                  <p>{order.order.shippingAddress.country}</p>
                  <p className="mt-2">{order.order.shippingAddress.phone}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>Status Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingStatus ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">New Status</label>
                    <Select value={newStatus} onValueChange={(value) => setNewStatus(value as SupplierOrderStatus)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {currentStatusInfo?.nextStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            {statusConfig[status as keyof typeof statusConfig]?.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Tracking Number</label>
                    <Input
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Enter tracking number"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Notes</label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this order"
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={handleStatusUpdate} disabled={!newStatus}>
                      <Save className="h-4 w-4 mr-2" />
                      Update
                    </Button>
                    <Button variant="outline" onClick={() => setEditingStatus(false)}>
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Current Status</label>
                    <Badge className={currentStatusInfo?.color}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {currentStatusInfo?.label}
                    </Badge>
                  </div>
                  
                  {order.trackingNumber && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tracking Number</label>
                      <p className="font-medium">{order.trackingNumber}</p>
                    </div>
                  )}
                  
                  {order.notes && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Notes</label>
                      <p className="text-sm">{order.notes}</p>
                    </div>
                  )}
                  
                                     {currentStatusInfo?.nextStatuses.length > 0 && (
                     <Button onClick={() => setEditingStatus(true)} className="w-full">
                       <Edit className="h-4 w-4 mr-2" />
                       Update Status
                     </Button>
                   )}
                   
                   {order.status === "READY_TO_SHIP" && (
                     <Button 
                       onClick={() => setShowShippingLabel(true)} 
                       className="w-full mt-2"
                       variant="outline"
                     >
                       <Truck className="h-4 w-4 mr-2" />
                       Generate Shipping Label
                     </Button>
                   )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Total:</span>
                  <span className="font-medium">{formatCurrency(order.totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Commission ({order.commissionRate}%):</span>
                  <span className="font-medium">{formatCurrency(order.commission)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Your Revenue:</span>
                  <span className="font-bold text-green-600">{formatCurrency(order.supplierRevenue)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Order Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">Order Created</p>
                    <p className="text-xs text-muted-foreground">{formatDate(order.createdAt)}</p>
                  </div>
                </div>
                {order.shippedAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Order Shipped</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.shippedAt)}</p>
                    </div>
                  </div>
                )}
                {order.order.deliveredAt && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">Order Delivered</p>
                      <p className="text-xs text-muted-foreground">{formatDate(order.order.deliveredAt)}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Shipping Label Generator Modal */}
      {showShippingLabel && orderData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Generate Shipping Label</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShippingLabel(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <ShippingLabelGenerator
                orderId={orderId}
                customerAddress={orderData.order.order.shippingAddress}
                customerName={orderData.order.order.user.name}
                customerEmail={orderData.order.order.user.email}
                productName={orderData.order.product.name}
                quantity={orderData.order.quantity}
                weight={1} // Default weight, can be made configurable
                onLabelGenerated={handleLabelGenerated}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
