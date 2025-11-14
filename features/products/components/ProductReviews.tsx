"use client";

import { StarIcon } from "lucide-react";
import React, { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { gradientButtonClass } from "@/features/home/components/homeTheme";
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
  className?: string;
  userLoggedIn?: boolean;
  onSubmitReview?: (review: Omit<Review, "id" | "userId" | "date">) => void;
}

export function ProductReviews({
  productId,
  reviews,
  className,
  userLoggedIn = false,
  onSubmitReview,
}: ProductReviewsProps) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  // Handle form reset
  const resetForm = () => {
    setRating(0);
    setReviewTitle("");
    setReviewContent("");
    setShowReviewForm(false);
  };

  // Handle review submission
  const handleSubmitReview = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!rating) return;

    setSubmitting(true);

    const newReview = {
      productId,
      userName: "Current User", // This would come from auth state in a real app
      rating,
      title: reviewTitle,
      content: reviewContent,
    };

    if (onSubmitReview) {
      onSubmitReview(newReview);
    }

    // This would normally happen after a successful API response
    setSubmitting(false);
    resetForm();
  };

  // Render stars for rating display
  const renderStars = (rating: number, interactive = false) => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map(star => (
        <StarIcon
          key={star}
          className={cn(
            "h-5 w-5 drop-shadow-sm transition-colors",
            interactive && "cursor-pointer",
            (interactive ? star <= (hoverRating || rating) : star <= rating)
              ? "text-yellow-300 fill-yellow-300"
              : "text-slate-500/70"
          )}
          onClick={interactive ? () => setRating(star) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        />
      ))}
    </div>
  );

  return (
    <section
      className={cn(
        productSubSectionCardClass,
        "space-y-6 rounded-3xl border-white/12 bg-slate-950/55 p-4 sm:p-6 lg:p-8 shadow-lg shadow-indigo-900/40",
        className
      )}
    >
      <header className="space-y-2">
        <span className={productAccentPillClass}>Customer Voices</span>
        <h2 className={`${productTitleClass} text-lg sm:text-xl md:text-2xl`}>
          {reviews.length > 0 ? "Customer Reviews" : "Share Your Experience"}
        </h2>
        <p className={`${productMutedTextClass} text-xs sm:text-sm`}>
          Real feedback from parents building future-ready STEM skills in Romania.
        </p>
      </header>
      <div className={`${productDividerClass} border-white/12`} aria-hidden />

      {reviews.length > 0 ? (
        <div className="grid gap-6 rounded-2xl border border-white/12 bg-white/5 p-4 sm:p-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] shadow-inner shadow-indigo-900/20">
          <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-950/60 px-4 py-6 text-center shadow-inner shadow-black/40">
            <span className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              {averageRating.toFixed(1)}
            </span>
            <div className="mt-2">{renderStars(averageRating)}</div>
            <div className={`${productMutedTextClass} mt-2 text-xs sm:text-sm`}>
              Based on {reviews.length}{" "}
              {reviews.length === 1 ? "review" : "reviews"}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-3">
                <div className={`${productBodyTextClass} w-16 text-xs sm:text-sm`}>
                  {stars} {stars === 1 ? "star" : "stars"}
                </div>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full border border-white/10 bg-white/5">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-400/80 shadow-lg shadow-emerald-500/30"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className={`${productMutedTextClass} w-12 text-right text-xs`}>
                  {count > 0 ? `${percentage}%` : "0%"}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-white/12 bg-white/5 px-4 py-6 text-center shadow-inner shadow-indigo-900/20">
          <p className={`${productBodyTextClass} text-sm`}>
            No reviews yet. Be the first to review this STEM experience and help
            other families choose with confidence.
          </p>
        </div>
      )}

      {!showReviewForm && (
        <Button
          onClick={() => setShowReviewForm(true)}
          disabled={!userLoggedIn}
          className={cn(
            gradientButtonClass,
            "w-full justify-center rounded-2xl px-5 py-2 text-sm font-semibold shadow-lg shadow-emerald-500/30 transition hover:shadow-emerald-400/20 disabled:from-slate-700 disabled:via-slate-800 disabled:to-slate-900 disabled:text-slate-200 disabled:opacity-60"
          )}
        >
          Write a Review
        </Button>
      )}

      {!userLoggedIn && (
        <p className={`${productMutedTextClass} text-xs sm:text-sm`}>
          You need to be logged in to share your experience.
        </p>
      )}

      {showReviewForm && userLoggedIn && (
        <form
          onSubmit={handleSubmitReview}
          className="space-y-4 rounded-2xl border border-white/12 bg-white/5 p-4 sm:p-6 shadow-inner shadow-indigo-900/20"
        >
          <h3 className={`${productTitleClass} text-base sm:text-lg`}>
            Write Your Review
          </h3>

          <div className="space-y-2">
            <Label
              htmlFor="rating"
              className={`${productMutedTextClass} text-xs uppercase tracking-[0.35em]`}
            >
              Rating
            </Label>
            <div className="flex items-center gap-3">
              {renderStars(rating, true)}
              {rating > 0 && (
                <span className={`${productMutedTextClass} text-xs`}>
                  ({rating} {rating === 1 ? "star" : "stars"})
                </span>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="title"
              className={`${productMutedTextClass} text-xs uppercase tracking-[0.35em]`}
            >
              Review Title
            </Label>
            <input
              id="title"
              type="text"
              value={reviewTitle}
              onChange={e => setReviewTitle(e.target.value)}
              className="w-full rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              placeholder="Summarize your experience"
              required
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="content"
              className={`${productMutedTextClass} text-xs uppercase tracking-[0.35em]`}
            >
              Review
            </Label>
            <Textarea
              id="content"
              value={reviewContent}
              onChange={e => setReviewContent(e.target.value)}
              placeholder="Share your experience with this product"
              rows={4}
              className="rounded-xl border border-white/15 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
              required
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              type="submit"
              disabled={!rating || submitting}
              className={cn(
                gradientButtonClass,
                "rounded-2xl px-5 py-2 text-sm font-semibold shadow-lg shadow-emerald-500/30 transition hover:shadow-emerald-400/20 disabled:from-slate-700 disabled:via-slate-800 disabled:to-slate-900 disabled:text-slate-200 disabled:opacity-70"
              )}
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={submitting}
              className="rounded-2xl border-white/20 bg-transparent px-5 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-5 pt-4">
        <Separator className="bg-white/10" />
        {reviews.length > 0 &&
          reviews.map(review => (
            <div
              key={review.id}
              className="space-y-3 rounded-2xl border border-white/8 bg-white/5 p-4 shadow-inner shadow-indigo-900/15 transition hover:border-white/15 hover:bg-white/8"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-11 w-11 bg-slate-900/60 ring-1 ring-white/15">
                    <AvatarImage src={review.userImage} />
                    <AvatarFallback className="text-xs font-semibold uppercase text-slate-100">
                      {review.userName.substring(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-semibold text-slate-100">
                      {review.userName}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      {renderStars(review.rating)}
                      {review.verified && (
                        <span className="rounded-full border border-emerald-300/40 bg-emerald-400/15 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-emerald-200">
                          Verified Purchase
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`${productMutedTextClass} text-xs sm:text-sm`}>
                  {new Date(review.date).toLocaleDateString()}
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-white sm:text-base">
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
