"use client";

import React from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { gradientButtonClass } from "@/features/home/components/homeTheme";
import { cn } from "@/lib/utils";

import { productMutedTextClass, productTitleClass } from "./productTheme";

interface ProductReviewFormProps {
  rating: number;
  reviewTitle: string;
  reviewContent: string;
  submitting: boolean;
  onRatingStars: React.ReactNode;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}

export function ProductReviewForm({
  rating,
  reviewTitle,
  reviewContent,
  submitting,
  onRatingStars,
  onTitleChange,
  onContentChange,
  onSubmit,
  onCancel,
}: ProductReviewFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6"
    >
      <h3 className={`${productTitleClass} text-base sm:text-lg`}>
        Scrie recenzia
      </h3>

      <div className="space-y-2">
        <Label
          htmlFor="rating"
          className={`${productMutedTextClass} text-xs uppercase tracking-[0.35em]`}
        >
          Notă
        </Label>
        <div className="flex items-center gap-3">
          {onRatingStars}
          {rating > 0 && (
            <span className={`${productMutedTextClass} text-xs`}>
              ({rating === 1 ? "1 stea" : `${rating} stele`})
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="title"
          className={`${productMutedTextClass} text-xs uppercase tracking-[0.35em]`}
        >
          Titlul recenziei
        </Label>
        <input
          id="title"
          type="text"
          value={reviewTitle}
          onChange={event => onTitleChange(event.target.value)}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          placeholder="Rezumatul experienței"
          required
        />
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="content"
          className={`${productMutedTextClass} text-xs uppercase tracking-[0.35em]`}
        >
          Recenzie
        </Label>
        <Textarea
          id="content"
          value={reviewContent}
          onChange={event => onContentChange(event.target.value)}
          placeholder="Descrie experiența cu acest produs"
          rows={4}
          className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
          {submitting ? "Se trimite…" : "Trimite recenzia"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-2xl border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
        >
          Anulează
        </Button>
      </div>
    </form>
  );
}
