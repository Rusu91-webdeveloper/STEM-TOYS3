"use client";

import { useState } from "react";

export default function GiftIdeasEmailCapture() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email || status === "submitting") return;

    setStatus("submitting");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        setStatus("error");
        return;
      }

      setEmail("");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  }

  return (
    <section
      id="idei-cadou-email"
      className="scroll-mt-24 rounded-[2rem] border border-indigo-200/70 bg-gradient-to-br from-indigo-950 via-slate-900 to-sky-950 px-6 py-10 text-white shadow-[0_30px_80px_-45px_rgba(30,64,175,0.8)] sm:px-10"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-sky-300">
          Selecții TechTots
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          Idei de cadou STEM pe vârstă, pe email
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-200">
          Selecții 6–8 ani + kituri noi. Fără spam.
        </p>

        {status === "success" ? (
          <p
            className="mt-7 rounded-2xl border border-emerald-300/40 bg-emerald-400/10 px-5 py-4 font-semibold text-emerald-100"
            role="status"
            aria-live="polite"
          >
            Mulțumim — verifică inboxul.
          </p>
        ) : (
          <form
            className="mx-auto mt-7 flex max-w-xl flex-col gap-3 sm:flex-row"
            onSubmit={handleSubmit}
          >
            <label className="sr-only" htmlFor="gift-guide-email">
              Adresa de email
            </label>
            <input
              id="gift-guide-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="email@exemplu.ro"
              className="min-h-12 flex-1 rounded-xl border border-white/20 bg-white px-4 text-slate-950 outline-none ring-sky-300 transition placeholder:text-slate-400 focus:ring-2"
            />
            <button
              type="submit"
              disabled={status === "submitting"}
              className="min-h-12 rounded-xl bg-amber-300 px-6 font-black text-slate-950 transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-70"
            >
              {status === "submitting"
                ? "Se trimite…"
                : "Vreau ideile de cadou"}
            </button>
          </form>
        )}

        <p className="mt-4 text-xs text-slate-300">
          dezabonare oricând; doar idei TechTots
        </p>
        {status === "error" ? (
          <p className="mt-3 text-sm text-rose-200" role="alert">
            Nu am putut înregistra adresa. Încearcă din nou.
          </p>
        ) : null}
      </div>
    </section>
  );
}
