import { notFound } from "next/navigation";
import React from "react";

import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n/server";

interface PageProps {
  params: Promise<{
    orderId: string;
  }>;
  searchParams: Promise<{
    email?: string;
  }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const t = await getTranslations("ro");
  const { orderId } = await params;
  return {
    title: `Order ${orderId} | ${t("siteTitle")}`,
    description: "Track your order status and details",
  };
}

export default async function PublicOrderPage({
  params,
  searchParams,
}: PageProps) {
  const t = await getTranslations("ro");
  const { orderId } = await params;
  const { email } = await searchParams;

  // If no email provided, show a form to enter email
  if (!email) {
    return (
      <div className="container max-w-2xl py-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-6">Track Your Order</h1>
          <p className="text-muted-foreground mb-8">
            Enter your email address to view your order details
          </p>
          
          <form method="GET" className="max-w-md mx-auto">
            <input
              type="hidden"
              name="orderId"
              value={orderId}
            />
            <div className="space-y-4">
              <input
                type="email"
                name="email"
                placeholder="Enter your email address"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Order
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Find the order by ID and email
  const order = await db.order.findFirst({
    where: {
      id: orderId,
      user: {
        email,
      },
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              images: true,
            },
          },
          book: {
            select: {
              name: true,
              slug: true,
              coverImage: true,
            },
          },
          reviews: {
            select: {
              id: true,
            },
          },
        },
      },
      shippingAddress: true,
      user: {
        select: {
          email: true,
        },
      },
    },
  });

  if (!order) {
    return notFound();
  }

  return (
    <div className="container max-w-4xl py-10">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-muted-foreground">
            Order #{order.orderNumber} • {new Date(order.createdAt).toLocaleDateString("ro-RO")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Order Status */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Order Status</h2>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                order.status === "DELIVERED" 
                  ? "bg-green-100 text-green-800"
                  : order.status === "SHIPPED"
                  ? "bg-blue-100 text-blue-800"
                  : order.status === "PROCESSING"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}>
                {order.status}
              </span>
            </div>
            
            {order.deliveredAt && (
              <p className="text-sm text-muted-foreground">
                Delivered on: {new Date(order.deliveredAt).toLocaleDateString("ro-RO")}
              </p>
            )}
          </div>

          {/* Shipping Address */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Shipping Address</h2>
            {order.shippingAddress ? (
              <div className="text-sm">
                <p className="font-medium">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            ) : (
              <p className="text-muted-foreground">No shipping address available</p>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => {
              const product = item.product || item.book;
              const isBook = !!item.book;
              
              return (
                <div key={item.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    {product?.images?.[0] || product?.coverImage ? (
                      <img
                        src={product.images?.[0] || product.coverImage}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-2xl">{isBook ? "📚" : "🧩"}</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="font-medium">{product?.name || item.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} × {item.price.toFixed(2)} RON
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-medium">{(item.price * item.quantity).toFixed(2)} RON</p>
                    
                    {/* Review Button for delivered items */}
                    {order.status === "DELIVERED" && item.reviews.length === 0 && (
                      <a
                        href={`/orders/${orderId}/review?itemId=${item.id}&productId=${item.productId}&email=${encodeURIComponent(email)}`}
                        className="inline-block mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                      >
                        Write Review
                      </a>
                    )}
                    
                    {item.reviews.length > 0 && (
                      <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-800 text-sm rounded">
                        Reviewed
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Total */}
        <div className="mt-8 pt-6 border-t">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-xl font-bold">{order.total.toFixed(2)} RON</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <a
            href="/contact"
            className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-lg text-center hover:bg-gray-200 transition-colors"
          >
            Contact Support
          </a>
          <a
            href="/products"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-center hover:bg-blue-700 transition-colors"
          >
            Continue Shopping
          </a>
        </div>
      </div>
    </div>
  );
}
