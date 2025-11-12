import Link from "next/link";
import React from "react";
import { ArrowRight, Heart, Sparkles } from "lucide-react";

import { Wishlist } from "@/features/account/components/Wishlist";
import {
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";
import { auth } from "@/lib/server/auth";
import { getWishlistItems } from "@/lib/server/wishlist";

export default async function WishlistPage() {
  const session = await auth();

  if (!session?.user) {
    // This should never happen since layout handles auth check
    return null;
  }

  const wishlistItems = await getWishlistItems();

  const totalItems = wishlistItems.length;
  const itemsLabel = totalItems === 1 ? "articol" : "articole";

  return (
    <div className="space-y-8">
      <section
        className={`${glassPanelClass} relative overflow-hidden border-white/10 bg-slate-950/70 px-5 py-8 text-slate-100 shadow-2xl shadow-black/40 sm:px-8 sm:py-10`}
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-emerald-500/15 via-sky-500/10 to-indigo-500/25 opacity-90"
          aria-hidden
        />
        <div
          className="absolute -bottom-24 -right-20 h-52 w-52 rounded-full bg-emerald-400/15 blur-3xl"
          aria-hidden
        />
        <div
          className="absolute -top-24 -left-10 h-44 w-44 rounded-full bg-sky-400/20 blur-3xl"
          aria-hidden
        />

        <div className="relative z-10 flex flex-col gap-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-emerald-200">
                Wishlist Lab
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <h1 className="text-3xl font-extrabold leading-tight text-white drop-shadow-[0_24px_60px_rgba(2,6,23,0.7)] sm:text-4xl">
                Idei pregătite de lansare pentru următoarea sesiune STEM
              </h1>
              <p className="max-w-2xl text-sm text-slate-200 sm:text-base">
                Păstrează într-un singur loc kiturile care declanșează curiozitatea
                copilului tău. Actualizăm disponibilitatea în timp real și îți
                sugerăm alternative atunci când stocul se epuizează.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-left text-xs text-slate-200 shadow-inner shadow-black/30 sm:min-w-[220px] sm:text-sm">
              <div className="flex items-center gap-2 text-white">
                <Heart className="h-4 w-4 text-emerald-200" />
                <span className="font-semibold">
                  {totalItems} {itemsLabel} favorite
                </span>
              </div>
              <p>
                Conectăm recomandările cu obiceiurile de învățare și obiectivele
                familiei tale.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 text-xs text-slate-300 sm:flex-row sm:items-center sm:justify-between sm:text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-inner shadow-black/25 sm:max-w-xl">
              <p>
                Synced cu profilul copilului tău: vârstă, interese STEM și nivelul
                actual de autonomie. Primești notificări proactive când un produs
                revine în stoc sau apare o versiune avansată.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Link
                href="/products"
                className={`${gradientButtonClass} flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold shadow-lg shadow-emerald-500/20 transition hover:scale-[1.02] sm:text-base`}
              >
                Explorează kiturile recomandate
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/categories"
                className="flex items-center justify-center rounded-2xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:border-white/35 hover:bg-white/15"
              >
                Vezi colecțiile STEM
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Wishlist initialItems={wishlistItems} />
    </div>
  );
}
