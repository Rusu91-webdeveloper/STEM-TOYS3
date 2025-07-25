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

  // Render stars for rating
  const renderStars = () => (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <StarIcon
          key={star}
          className={cn(
            "h-8 w-8 cursor-pointer transition-colors",
            star <= (hoverRating || rating)
              ? "text-yellow-400 fill-yellow-400"
              : "text-gray-300"
          )}
          onClick={() => setRating(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(0)}
        />
      ))}
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="rating">
          {t("rating", "Evaluare")} <span className="text-red-500">*</span>
        </Label>
        <div>
          {renderStars()}
          {rating > 0 && (
            <p className="mt-1 text-sm">
              {rating} {rating === 1 ? t("star", "stea") : t("stars", "stele")}
            </p>
          )}
          {errors.rating && (
            <p className="mt-1 text-sm text-red-500">{errors.rating}</p>
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder", "Rezumă experiența ta")}
          className={errors.title ? "border-red-500" : ""}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">
          {t("reviewContent", "Recenzie")}{" "}
          <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t(
            "reviewPlaceholder",
            "Împărtășește detalii despre experiența ta cu acest produs"
          )}
          rows={6}
          className={errors.content ? "border-red-500" : ""}
        />
        {errors.content && (
          <p className="mt-1 text-sm text-red-500">{errors.content}</p>
        )}
      </div>

      <div className="flex gap-4 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}>
          {isSubmitting
            ? t("submitting", "Se trimite...")
            : t("submitReview", "Trimite recenzia")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/account/orders/${orderId}`)}
          disabled={isSubmitting}>
          {t("cancel", "Anulează")}
        </Button>
      </div>
    </form>
  );
}
