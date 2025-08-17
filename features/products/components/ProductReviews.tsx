"use client";

import { StarIcon } from "lucide-react";
import React, { useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

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
            "h-5 w-5 transition-colors",
            interactive && "cursor-pointer",
            (interactive ? star <= (hoverRating || rating) : star <= rating)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
          )}
          onClick={interactive ? () => setRating(star) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
        />
      ))}
    </div>
  );

  return (
    <div className={cn("space-y-6", className)}>
      <h2 className="text-2xl font-semibold">Customer Reviews</h2>

      {/* Rating summary */}
      {reviews.length > 0 ? (
        <div className="flex flex-col md:flex-row gap-8 p-4 bg-muted/30 rounded-lg">
          {/* Average rating */}
          <div className="flex flex-col items-center justify-center">
            <div className="text-4xl font-bold">{averageRating.toFixed(1)}</div>
            <div className="mt-1">{renderStars(averageRating)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Based on {reviews.length}{" "}
              {reviews.length === 1 ? "review" : "reviews"}
            </div>
          </div>

          {/* Rating distribution */}
          <div className="flex-1 space-y-1">
            {ratingDistribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="flex items-center gap-2">
                <div className="w-12 text-sm">{stars} stars</div>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-10 text-xs text-right">{percentage}%</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-4 text-muted-foreground">
          No reviews yet. Be the first to review this product!
        </div>
      )}

      {/* Write review button */}
      {!showReviewForm && (
        <Button
          onClick={() => setShowReviewForm(true)}
          disabled={!userLoggedIn}
          className="mt-4"
        >
          Write a Review
        </Button>
      )}

      {!userLoggedIn && (
        <div className="text-sm text-muted-foreground">
          You need to be logged in to write a review.
        </div>
      )}

      {/* Review form */}
      {showReviewForm && userLoggedIn && (
        <form
          onSubmit={handleSubmitReview}
          className="space-y-4 p-4 border rounded-lg"
        >
          <h3 className="text-lg font-medium">Write Your Review</h3>

          <div className="space-y-1">
            <Label htmlFor="rating">Rating</Label>
            <div className="flex items-center gap-2">
              {renderStars(rating, true)}
              {rating > 0 && (
                <span className="text-sm text-muted-foreground">
                  ({rating} {rating === 1 ? "star" : "stars"})
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="title">Review Title</Label>
            <input
              id="title"
              type="text"
              value={reviewTitle}
              onChange={e => setReviewTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="Summarize your experience"
              required
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="content">Review</Label>
            <Textarea
              id="content"
              value={reviewContent}
              onChange={e => setReviewContent(e.target.value)}
              placeholder="Share your experience with this product"
              rows={4}
              required
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={!rating || submitting}>
              {submitting ? "Submitting..." : "Submit Review"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={resetForm}
              disabled={submitting}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Review list */}
      <div className="space-y-6 pt-4">
        <Separator />
        {reviews.length > 0
          ? reviews.map(review => (
              <div key={review.id} className="space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={review.userImage} />
                      <AvatarFallback>
                        {review.userName.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{review.userName}</div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        {review.verified && (
                          <span className="text-xs bg-green-100 text-green-800 px-1.5 py-0.5 rounded-full">
                            Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(review.date).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium">{review.title}</h4>
                  <p className="text-sm mt-1">{review.content}</p>
                </div>

                <Separator className="mt-4" />
              </div>
            ))
          : null}
      </div>
    </div>
  );
}
