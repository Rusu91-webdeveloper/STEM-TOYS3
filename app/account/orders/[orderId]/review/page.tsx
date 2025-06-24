import { ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import React from "react";

import { ProductReviewForm } from "@/features/account/components/ProductReviewForm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTranslations } from "@/lib/i18n/server";

interface PageProps {
  params: {
    orderId: string;
  };
  searchParams: {
    itemId?: string;
    productId?: string;
  };
}

export async function generateMetadata({ params: _params }: PageProps) {
  const t = await getTranslations("ro");

  return {
    title: `${t("writeReview")} | ${t("account")}`,
    description: t("shareYourExperience"),
  };
}

export default async function WriteReviewPage({
  params,
  searchParams,
}: PageProps) {
  const session = await auth();
  const t = await getTranslations("ro");

  if (!session?.user) {
    return null;
  }

  const orderId: string = params.orderId;
  const itemId: string | undefined = searchParams.itemId;
  const productId: string | undefined = searchParams.productId;

  if (!itemId || !productId) {
    redirect(`/account/orders/${orderId}`);
  }

  // Verify the order and order item
  const orderItem = await db.orderItem.findFirst({
    where: {
      id: itemId,
      productId,
      order: {
        id: orderId,
        userId: session.user.id,
        status: "DELIVERED",
      },
    },
    include: {
      order: {
        select: {
          orderNumber: true,
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
          userId: session.user.id,
        },
      },
    },
  });

  if (!orderItem) {
    return notFound();
  }

  // If user already submitted a review, redirect back to order details
  if (orderItem.reviews.length > 0) {
    redirect(`/account/orders/${orderId}?alreadyReviewed=true`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/account/orders/${orderId}`}
        className="flex items-center text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4 mr-1" />
        {t("backToOrder")}
      </Link>

      <h2 className="text-2xl font-semibold tracking-tight mb-6">
        {t("writeReview")}
      </h2>

      <div className="flex items-center gap-4 mb-8">
        <div className="h-16 w-16 rounded bg-muted overflow-hidden relative shrink-0">
          {orderItem.product?.images?.[0] && (
            <Image
              src={orderItem.product.images[0]}
              alt={orderItem.product?.name || "Product"}
              className="object-cover h-full w-full"
              width={64}
              height={64}
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

      <ProductReviewForm
        productId={productId}
        orderItemId={itemId}
        orderId={orderId}
      />
    </div>
  );
}
