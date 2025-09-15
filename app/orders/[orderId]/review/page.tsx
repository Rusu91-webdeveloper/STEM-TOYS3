import { notFound, redirect } from "next/navigation";
import React from "react";

import { ProductReviewForm } from "@/features/account/components/ProductReviewForm";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n/server";

interface PageProps {
  params: Promise<{
    orderId: string;
  }>;
  searchParams: Promise<{
    itemId?: string;
    productId?: string;
    email?: string;
  }>;
}

export async function generateMetadata({ params: _params }: PageProps) {
  const t = await getTranslations("ro");
  return {
    title: `${t("writeReview")} | ${t("siteTitle")}`,
    description: t("shareYourExperience"),
  };
}

export default async function PublicReviewPage({
  params,
  searchParams,
}: PageProps) {
  const t = await getTranslations("ro");
  const { orderId } = await params;
  const { itemId, productId, email } = await searchParams;

  // Validate required parameters
  if (!itemId || !productId || !email) {
    redirect(`/orders/${orderId}?email=${encodeURIComponent(email || "")}`);
  }

  // Verify the order and order item
  const orderItem = await db.orderItem.findFirst({
    where: {
      id: itemId,
      productId,
      order: {
        id: orderId,
        user: {
          email,
        },
        status: "DELIVERED",
      },
    },
    include: {
      order: {
        select: {
          orderNumber: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      },
      product: {
        select: {
          name: true,
          images: true,
        },
      },
      reviews: {
        where: {
          orderItemId: itemId,
        },
      },
    },
  });

  if (!orderItem) {
    return notFound();
  }

  // If user already submitted a review, redirect back to order details
  if (orderItem.reviews.length > 0) {
    redirect(
      `/orders/${orderId}?email=${encodeURIComponent(email)}&alreadyReviewed=true`
    );
  }

  return (
    <div className="container max-w-2xl py-10">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <a
          href={`/orders/${orderId}?email=${encodeURIComponent(email)}`}
          className="inline-flex items-center text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
        >
          ← Back to Order
        </a>

        <h2 className="text-2xl font-semibold tracking-tight mb-6">
          {t("writeReview")}
        </h2>

        <div className="flex items-center gap-4 mb-8">
          <div className="h-16 w-16 rounded bg-muted overflow-hidden relative shrink-0">
            {orderItem.product?.images?.[0] && (
              <img
                src={orderItem.product.images[0]}
                alt={orderItem.product?.name || "Product"}
                className="object-cover h-full w-full"
              />
            )}
          </div>
          <div>
            <h3 className="font-medium">{orderItem.product?.name}</h3>
            <p className="text-sm text-muted-foreground">
              {t("fromOrder")} #{orderItem.order.orderNumber}
            </p>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> You're writing this review as a guest. If you
            create an account later, your review will be associated with your
            account.
          </p>
        </div>

        <ProductReviewForm
          productId={productId}
          orderItemId={itemId}
          orderId={orderId}
        />
      </div>
    </div>
  );
}
