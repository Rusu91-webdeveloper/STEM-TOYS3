import React from "react";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTranslations, TranslationKey } from "@/lib/i18n/server";

// Import the client component
import { OrderDetailsClient } from "./OrderDetailsClient";

interface PageProps {
  params: {
    orderId: string;
  };
}

// Helper function to safely serialize dates and objects for client component
function serializeOrder(order: any) {
  return JSON.parse(
    JSON.stringify(order, (key, value) => {
      // Convert Date objects to ISO strings
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    })
  );
}

export async function generateMetadata({ params }: PageProps) {
  const t = await getTranslations();
  const resolvedParams = await params;
  const orderId = resolvedParams.orderId;
  return {
    title: `${t("orderNumber" as TranslationKey)} ${orderId} | ${t("siteTitle" as TranslationKey)}`,
  };
}

export default async function OrderDetailsPage({ params }: PageProps) {
  const t = await getTranslations();
  const session = await auth();
  const resolvedParams = await params;
  const orderId = resolvedParams.orderId;

  if (!session?.user) {
    return notFound();
  }

  const order = await db.order.findUnique({
    where: {
      id: orderId,
      userId: session.user.id,
    },
    include: {
      items: {
        include: {
          product: {
            select: {
              slug: true,
              images: true,
              name: true,
            },
          },
          book: {
            select: {
              slug: true,
              coverImage: true,
              name: true,
              author: true,
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
    },
  });

  if (!order) {
    return notFound();
  }

  // Serialize the order to avoid date serialization issues
  const serializedOrder = serializeOrder(order);

  return (
    <div className="container py-10">
      <OrderDetailsClient order={serializedOrder} />
    </div>
  );
}
