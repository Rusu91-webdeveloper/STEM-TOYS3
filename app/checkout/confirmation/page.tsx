import { Check, Gift, Mail, Sparkles } from "lucide-react";
import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Confirmare Comandă | TechTots",
  description: "Comanda dvs. a fost plasată cu succes.",
};

const CONFETTI_BITS = [
  "left-8 top-24 rotate-12 bg-rose-400",
  "left-16 top-16 -rotate-[18deg] bg-amber-400",
  "left-2 top-32 rotate-45 bg-sky-400",
  "right-8 top-20 rotate-12 bg-emerald-400",
  "right-12 top-32 -rotate-[16deg] bg-violet-400",
  "right-3 top-28 rotate-45 bg-rose-300",
  "left-20 top-36 bg-emerald-300",
  "right-20 top-36 bg-amber-300",
  "left-12 top-10 bg-fuchsia-300",
  "right-16 top-10 bg-cyan-300",
];

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const params = await searchParams;
  const orderId = params.orderId;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#c7852a] px-4 py-8 sm:px-6 sm:py-12">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,240,196,0.45),transparent_18%),radial-gradient(circle_at_74%_18%,rgba(255,236,179,0.35),transparent_20%),radial-gradient(circle_at_58%_52%,rgba(120,58,12,0.16),transparent_34%),linear-gradient(180deg,rgba(129,74,22,0.12),rgba(82,46,14,0.24))]" />
      <div className="pointer-events-none absolute right-[-2rem] top-28 hidden h-56 w-56 rounded-full border border-white/20 bg-[radial-gradient(circle_at_35%_35%,rgba(255,255,255,0.95),rgba(245,245,245,0.82)_45%,rgba(226,232,240,0.65)_72%,rgba(255,255,255,0)_76%)] shadow-[0_20px_50px_-25px_rgba(15,23,42,0.35)] blur-[1px] sm:block" />
      <div className="pointer-events-none absolute left-[-5rem] bottom-[-5rem] h-56 w-56 rounded-full bg-[radial-gradient(circle_at_40%_30%,rgba(255,214,170,0.65),rgba(251,146,60,0.2)_48%,rgba(194,65,12,0)_72%)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-md items-center justify-center">
        <div className="relative w-full max-w-[19rem] rounded-[2.5rem] bg-[#111827] p-2.5 shadow-[0_40px_90px_-30px_rgba(15,23,42,0.75)] sm:max-w-[20rem]">
          <div className="absolute left-1/2 top-3 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />
          <div className="absolute left-3 top-28 h-14 w-1 rounded-full bg-white/10" />
          <div className="absolute right-3 top-32 h-20 w-1 rounded-full bg-white/10" />

          <div className="overflow-hidden rounded-[2rem] bg-white px-6 pb-7 pt-9 text-center">
            <div className="flex items-center justify-between text-[10px] font-medium text-slate-400">
              <span>19:22</span>
              <span className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                <span className="h-1.5 w-4 rounded-full border border-slate-300" />
              </span>
            </div>

            <div className="mx-auto mt-7 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_14px_26px_-14px_rgba(34,197,94,0.8)]">
              <Check className="h-6 w-6" strokeWidth={3.2} />
            </div>

            <div className="relative mx-auto mt-5 flex h-44 w-40 items-center justify-center">
              {CONFETTI_BITS.map(bit => (
                <span
                  key={bit}
                  className={`absolute h-2.5 w-1 rounded-full opacity-90 ${bit}`}
                />
              ))}

              <div className="absolute left-[3.35rem] top-[4.55rem] flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-700 shadow-[0_12px_24px_-14px_rgba(15,23,42,0.35)]">
                <Gift className="h-4.5 w-4.5 text-fuchsia-500" />
              </div>
              <div className="absolute right-[3.25rem] top-[4.2rem] flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-600 shadow-[0_10px_20px_-12px_rgba(14,165,233,0.45)]">
                <Sparkles className="h-4 w-4" />
              </div>

              <div className="absolute inset-x-10 bottom-8 h-4 rounded-full bg-sky-100/80 blur-md" />
              <div className="relative mt-5 h-24 w-24 rounded-[1.35rem] bg-[#12b5ea] shadow-[0_28px_40px_-22px_rgba(14,165,233,0.75)]">
                <div className="absolute left-1/2 top-[1.05rem] h-8 w-10 -translate-x-1/2 rounded-[999px] border-[3px] border-[#086f8f] border-b-0" />
                <div className="absolute inset-x-0 top-[2.15rem] h-px bg-[#0891b2]/30" />
                <div className="absolute left-1/2 top-[2.95rem] h-2.5 w-2.5 -translate-x-1/2 rounded-full border-2 border-[#086f8f]" />
              </div>
            </div>

            <h1 className="mt-1 text-[1.55rem] font-bold tracking-tight text-slate-900">
              Comanda a fost plasată!
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
              Veți primi un email de confirmare imediat.
            </p>

            {orderId && (
              <p className="mt-3 text-[11px] font-medium text-slate-400">
                Comanda #{orderId}
              </p>
            )}

            <div className="mt-8 space-y-3">
              <Link
                href="/products"
                className="inline-flex w-full items-center justify-center rounded-full bg-[#1683ff] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_28px_-18px_rgba(22,131,255,0.9)] transition-colors hover:bg-[#0f74e8]"
              >
                Înapoi la magazin
              </Link>
              <Link
                href="/account/orders"
                className="inline-flex items-center justify-center gap-2 text-[13px] font-medium text-slate-400 transition-colors hover:text-slate-600"
              >
                <Mail className="h-3.5 w-3.5" />
                Vezi comenzile mele
              </Link>
            </div>

            <div className="mx-auto mt-7 h-1.5 w-24 rounded-full bg-slate-900/8" />
          </div>
        </div>
      </div>
    </div>
  );
}
