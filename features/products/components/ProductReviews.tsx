"use client";

import { StarIcon } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { gradientButtonClass } from "@/features/home/components/homeTheme";
import { cn } from "@/lib/utils";

import {
  productAccentPillClass,
  productBodyTextClass,
  productDividerClass,
  productMutedTextClass,
  productSubSectionCardClass,
  productTitleClass,
} from "./productTheme";

export interface Review {
  id: string;
  productId: string;
  userId?: string;
  userName: string;
  userImage?: string;
  rating: number;
  title: string;
  content: string;
  date: string;
  verified?: boolean;
}

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
  unavailable?: boolean;
  className?: string;
  userLoggedIn?: boolean;
  onSubmitReview?: (review: Omit<Review, "id" | "userId" | "date">) => void;
}

export function ProductReviews({
  reviews,
  unavailable = false,
  className,
}: ProductReviewsProps) {
  // Calculate average rating
  const averageRating = reviews.length
    ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length
    : 0;

  // Rating distribution (percentage of 5-star, 4-star, etc.)
  const ratingDistribution = reviews.length
    ? Array.from({ length: 5 }, (_, i) => {
        const starsCount = 5 - i;
        const count = reviews.filter(r => r.rating === starsCount).length;
        return {
          stars: starsCount,
          count,
          percentage: Math.round((count / reviews.length) * 100),
        };
      })
    : [];

  const renderStars = (rating: number) => (
    <div className="flex" role="img" aria-label={`${rating.toFixed(1)} din 5`}>
      {[1, 2, 3, 4, 5].map(star => (
        <StarIcon
          key={star}
          aria-hidden
          className={cn(
            "h-5 w-5",
            star <= rating
              ? "text-yellow-500 fill-yellow-500"
              : "text-slate-300"
          )}
        />
      ))}
    </div>
  );

  return (
    <section
      className={cn(
        productSubSectionCardClass,
        "space-y-6 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 lg:p-8 shadow-sm",
        className
      )}
    >
      <header className="space-y-2">
        <span className={productAccentPillClass}>Recenzii</span>
        <h2 className={`${productTitleClass} text-lg sm:text-xl md:text-2xl`}>
          Recenzii clienți
        </h2>
        {reviews.length > 0 ? (
          <p className={`${productMutedTextClass} text-xs sm:text-sm`}>
            Păreri lăsate de clienți pentru acest produs.
          </p>
        ) : null}
      </header>
      <div className={`${productDividerClass} border-slate-200`} aria-hidden />

      {reviews.length > 0 ? (
        <div className="grid gap-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-6 text-center">
            <span className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              {averageRating.toFixed(1)}
            </span>
            <div className="mt-2">{renderStars(averageRating)}</div>
            <div className={`${productMutedTextClass} mt-2 text-xs sm:text-sm`}>
              {reviews.length === 1
                ? "Pe baza unei recenzii"
                : `Pe baza a ${reviews.length} recenzii`}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-3">
                <div
                  className={`${productBodyTextClass} w-16 text-xs sm:text-sm`}
                >
                  {stars === 1 ? "1 stea" : `${stars} stele`}
                </div>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full border border-slate-200 bg-slate-200">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-500"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div
                  className={`${productMutedTextClass} w-12 text-right text-xs`}
                >
                  {count > 0 ? `${percentage}%` : "0%"}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div
          data-testid={unavailable ? "reviews-unavailable" : "reviews-empty"}
          className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center"
        >
          <p className={`${productBodyTextClass} text-sm`}>
            {unavailable
              ? "Recenziile nu sunt disponibile momentan. Reîncearcă mai târziu."
              : "Încă nu există recenzii"}
          </p>
        </div>
      )}

      <Button
        asChild
        className={cn(gradientButtonClass, "min-h-11 w-full rounded-2xl")}
      >
        <Link href="/auth/login?callbackUrl=%2Faccount%2Forders">
          Scrie o recenzie
        </Link>
      </Button>
      <p className={`${productMutedTextClass} text-xs sm:text-sm`}>
        Intră în cont și alege produsul dintr-o comandă livrată. Recenzia este
        legată de produsul cumpărat.
      </p>

      <div className="space-y-5 pt-4">
        <Separator className="bg-slate-200" />
        {reviews.length > 0 &&
          reviews.map(review => (
            <div
              key={review.id}
              className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-slate-300 hover:bg-slate-50"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 bg-slate-100 ring-1 ring-slate-200">
                    <AvatarImage src={review.userImage} />
                    <AvatarFallback className="text-xs font-semibold uppercase text-slate-700">
                      {review.userName.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">
                      {review.userName}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {renderStars(review.rating)}
                      {review.verified && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-700">
                          Achiziție verificată
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`${productMutedTextClass} text-xs sm:text-sm`}>
                  {new Date(review.date).toLocaleDateString("ro-RO")}
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-900 sm:text-base">
                  {review.title}
                </h4>
                <p className={`${productBodyTextClass} text-sm`}>
                  {review.content}
                </p>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
}
