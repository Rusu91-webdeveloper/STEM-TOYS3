import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Truck, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

interface OrderTrackingProps {
  searchParams: Promise<{ orderNumber?: string; email?: string }>;
}

async function getOrderTracking(orderNumber: string, email: string) {
  try {
    const order = await db.order.findFirst({
      where: {
        orderNumber: orderNumber,
        user: { email: email },
      },
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            product: { select: { name: true, images: true } },
          },
        },
        statusHistory: {
          orderBy: { createdAt: "desc" },
        },
        shippingAddress: true,
      },
    });

    return order;
  } catch (error) {
    console.error("Error fetching order:", error);
    return null;
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "DELIVERED":
    case "COMPLETED":
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case "SHIPPED":
      return <Truck className="h-5 w-5 text-blue-500" />;
    case "PROCESSING":
      return <Package className="h-5 w-5 text-yellow-500" />;
    case "CANCELLED":
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    default:
      return <Clock className="h-5 w-5 text-gray-500" />;
  }
}

function getStatusBadge(status: string) {
  const variants = {
    PROCESSING: "bg-yellow-100 text-yellow-800",
    SHIPPED: "bg-blue-100 text-blue-800",
    DELIVERED: "bg-green-100 text-green-800",
    COMPLETED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  return (
    <Badge
      variant="outline"
      className={variants[status as keyof typeof variants]}
    >
      {getStatusIcon(status)}
      <span className="ml-2">{status.replace("_", " ")}</span>
    </Badge>
  );
}

async function OrderTrackingContent({
  orderNumber,
  email,
}: {
  orderNumber: string;
  email: string;
}) {
  const order = await getOrderTracking(orderNumber, email);

  if (!order) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
            <p className="text-muted-foreground">
              We couldn't find an order with that number and email address.
              Please check your information and try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order #{order.orderNumber}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Order Status</h4>
              {getStatusBadge(order.status)}
            </div>
            <div>
              <h4 className="font-medium mb-2">Order Date</h4>
              <p className="text-muted-foreground">
                {formatDate(order.createdAt)}
              </p>
            </div>
            {order.trackingNumber && (
              <div>
                <h4 className="font-medium mb-2">Tracking Number</h4>
                <p className="font-mono text-sm bg-muted px-2 py-1 rounded">
                  {order.trackingNumber}
                </p>
              </div>
            )}
            {order.carrier && (
              <div>
                <h4 className="font-medium mb-2">Carrier</h4>
                <p className="text-muted-foreground">{order.carrier}</p>
              </div>
            )}
          </div>

          {order.estimatedDelivery && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-1">
                Estimated Delivery
              </h4>
              <p className="text-blue-700">
                {formatDate(order.estimatedDelivery)}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {order.items.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 border rounded-lg"
              >
                {item.product.images[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-12 h-12 object-cover rounded"
                  />
                )}
                <div className="flex-1">
                  <h4 className="font-medium">{item.product.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    Quantity: {item.quantity} × €{item.price}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">
                    €{(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shipping Address */}
      {order.shippingAddress && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              <p className="font-medium">{order.shippingAddress.fullName}</p>
              <p>{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p>{order.shippingAddress.addressLine2}</p>
              )}
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.state}{" "}
                {order.shippingAddress.postalCode}
              </p>
              <p>{order.shippingAddress.country}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order History */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Order History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {order.statusHistory.map((history, index) => (
                <div key={history.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        {history.fromStatus} → {history.toStatus}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(history.createdAt)}
                      </span>
                    </div>
                    {history.reason && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Reason:</strong> {history.reason}
                      </p>
                    )}
                    {history.notes && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Notes:</strong> {history.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default async function OrderTrackingPage({
  searchParams,
}: OrderTrackingProps) {
  const params = await searchParams;
  const orderNumber = params.orderNumber;
  const email = params.email;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Track Your Order</h1>
        <p className="text-muted-foreground">
          Enter your order number and email address to track your package
        </p>
      </div>

      {/* Search Form */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <form method="GET" className="flex gap-4">
            <Input
              name="orderNumber"
              placeholder="Order Number (e.g., ORD-12345)"
              defaultValue={orderNumber}
              className="flex-1"
            />
            <Input
              name="email"
              type="email"
              placeholder="Email Address"
              defaultValue={email}
              className="flex-1"
            />
            <Button type="submit">Track Order</Button>
          </form>
        </CardContent>
      </Card>

      {/* Order Details */}
      {orderNumber && email && (
        <Suspense
          fallback={
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                  <p>Loading order details...</p>
                </div>
              </CardContent>
            </Card>
          }
        >
          <OrderTrackingContent orderNumber={orderNumber} email={email} />
        </Suspense>
      )}

      {!orderNumber && !email && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Track Your Package</h3>
              <p className="text-muted-foreground">
                Enter your order number and email address above to see the
                current status of your order.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
