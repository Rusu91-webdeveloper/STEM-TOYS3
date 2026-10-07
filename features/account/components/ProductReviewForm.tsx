"use client";

import { StarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface ProductReviewFormProps {
  productId: string;
  orderItemId: string;
  orderId: string;
}

export function ProductReviewForm({
  productId,
  orderItemId,
  orderId,
}: ProductReviewFormProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    rating?: string;
    title?: string;
    content?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: { rating?: string; title?: string; content?: string } = {};

    if (rating === 0) {
      newErrors.rating = t("pleaseSelectRating");
    }

    if (!title.trim()) {
      newErrors.title = t("pleaseEnterTitle");
    } else if (title.length < 3) {
      newErrors.title = t("titleTooShort");
    }

    if (!content.trim()) {
      newErrors.content = t("pleaseEnterReview");
    } else if (content.length < 10) {
      newErrors.content = t("reviewTooShort");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          orderItemId,
          rating,
          title,
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit review");
      }

      toast.success(
        t("reviewSubmittedSuccess", "Recenzia a fost trimisă cu succes!")
      );
      router.push(`/account/orders/${orderId}?reviewSubmitted=true`);
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : t(
              "errorSubmittingReview",
              "Eroare la trimiterea recenziei. Te rugăm să încerci din nou."
            )
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <span id="rating-label" className="text-sm font-medium">
          {t("rating", "Evaluare")} <span className="text-red-500">*</span>
        </span>
        <div>
          <div
            role="radiogroup"
            aria-labelledby="rating-label"
            aria-required="true"
            aria-invalid={Boolean(errors.rating)}
            aria-describedby={errors.rating ? "rating-error" : undefined}
            className="flex"
          >
            {[1, 2, 3, 4, 5].map(star => (
              <label
                key={star}
                className="relative flex h-11 w-11 cursor-pointer items-center justify-center"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <input
                  type="radio"
                  name="rating"
                  value={star}
                  checked={rating === star}
                  onChange={() => setRating(star)}
                  aria-label={star === 1 ? "1 stea" : `${star} stele`}
                  className="peer sr-only"
                  disabled={isSubmitting}
                />
                <StarIcon
                  aria-hidden
                  className={cn(
                    "h-8 w-8 rounded transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-600",
                    star <= (hoverRating || rating)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-gray-400"
                  )}
                />
              </label>
            ))}
          </div>
          {rating > 0 && (
            <p className="mt-1 text-sm">
              {rating} {rating === 1 ? t("star", "stea") : t("stars", "stele")}
            </p>
          )}
          {errors.rating && (
            <p
              id="rating-error"
              role="alert"
              className="mt-1 text-sm text-red-500"
            >
              {errors.rating}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">
          {t("reviewTitle", "Titlu recenzie")}{" "}
          <span className="text-red-500">*</span>
        </Label>
        <Input
          id="title"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "title-error" : undefined}
          maxLength={100}
          disabled={isSubmitting}
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder", "Rezumă experiența ta")}
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && (
          <p
            id="title-error"
            role="alert"
            className="mt-1 text-sm text-red-500"
          >
            {errors.title}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">
          {t("reviewContent", "Recenzie")}{" "}
          <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="content"
          aria-invalid={Boolean(errors.content)}
          aria-describedby={errors.content ? "content-error" : undefined}
          maxLength={1000}
          disabled={isSubmitting}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder={t(
            "reviewPlaceholder",
            "Împărtășește detalii despre experiența ta cu acest produs"
          )}
          rows={6}
          className={errors.content ? "border-red-500" : ""}
        />
        {errors.content && (
          <p
            id="content-error"
            role="alert"
            className="mt-1 text-sm text-red-500"
          >
            {errors.content}
          </p>
        )}
      </div>

      <div className="flex gap-4 pt-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? t("submitting", "Se trimite...")
            : t("submitReview", "Trimite recenzia")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/account/orders/${orderId}`)}
          disabled={isSubmitting}
        >
          {t("cancel", "Anulează")}
        </Button>
      </div>
    </form>
  );
}
