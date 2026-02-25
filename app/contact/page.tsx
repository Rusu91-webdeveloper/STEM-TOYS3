"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

import { publicConfig } from "@/lib/config/app-config";

import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";

export default function ContactPage() {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactEmail, setContactEmail] = useState(publicConfig.contactEmail);
  const [contactPhone, setContactPhone] = useState(publicConfig.storePhoneFormatted);

  // Fetch store settings for contact info
  useEffect(() => {
    async function loadContactInfo() {
      try {
        const response = await fetch("/api/store-settings");
        if (response.ok) {
          const settings = await response.json();
          if (settings?.contactEmail) {
            setContactEmail(settings.contactEmail);
          }
          if (settings?.contactPhone) {
            setContactPhone(settings.contactPhone);
          }
        }
      } catch (error) {
        console.error("Error loading contact info:", error);
        // Keep defaults
      }
    }
    loadContactInfo();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      // Success
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      console.error("Contact form error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "A apărut o eroare la trimiterea mesajului. Te rugăm să încerci din nou."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-blue-50/70 text-slate-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.08),_transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(59,130,246,0.08),_transparent_60%)]" />

      <div className="relative z-10 container mx-auto px-3 py-6 sm:px-6 sm:py-10 lg:py-16">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-indigo-900/75 to-slate-950/90 shadow-lg shadow-black/30">
          <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="relative h-[180px] w-full overflow-hidden rounded-t-3xl lg:h-full lg:rounded-l-3xl">
              <Image
                src="/images/homepage_hero_banner_01.png"
                alt="Contact TechTots"
                fill
                style={{ objectFit: "cover" }}
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-br from-slate-900/90 via-indigo-900/80 to-slate-950/90 backdrop-blur-sm" />
            </div>
            <div className="relative flex flex-col justify-center gap-4 px-6 py-8 text-white">
              <span className="inline-flex w-fit items-center rounded-full border border-white/15 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
                TechTots Support
              </span>
              <h1 className="text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
                {t("contactH1")}
              </h1>
              <p className="text-sm text-slate-200 sm:text-base">
                Suntem alături de tine pentru întrebări, recomandări personalizate sau suport rapid
                legat de comenzi și învățare STEM.
              </p>
              <div className="flex flex-wrap items-center gap-3 text-xs text-sky-200">
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
                  🛰️ Tracking în timp real
                </span>
                <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
                  ⚡ Răspuns în &lt; 12 ore
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 lg:mt-14 lg:grid-cols-[0.65fr_0.35fr] lg:gap-8">
          <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 text-slate-900 shadow-lg shadow-slate-900/10 backdrop-blur-md sm:p-8">
            <div className="flex flex-col gap-2">
              <h2 className="text-xl font-semibold sm:text-2xl">
                {t("getInTouch" as any, "Get in Touch")}
              </h2>
              <p className="text-sm text-slate-600 sm:text-base">
                Completează formularul și echipa noastră răspunde rapid cu soluții adaptate nevoilor
                tale.
              </p>
            </div>

            <div className="mt-6">
              {submitted ? (
                  <div className="rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-5 shadow-inner shadow-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">✅</div>
                      <h3 className="text-lg font-semibold text-emerald-800">
                        {t("messageSent" as any, "Message Sent!")}
                      </h3>
                    </div>
                    <p className="mt-3 text-sm text-emerald-900/80">
                    {t(
                      "thankYouMessage" as any,
                      "Thank you for contacting us. We'll get back to you as soon as possible."
                    )}
                  </p>
                  <div className="mt-4 rounded-2xl border border-emerald-300/40 bg-emerald-500/10 p-4 text-xs text-emerald-900/90">
                    <p className="font-semibold">
                      <strong>📧 Ai primit și un email de confirmare!</strong>
                    </p>
                    <p className="mt-1">
                      Verifică căsuța de email (inclusiv spam/junk) pentru confirmarea că am primit
                      mesajul tău.
                    </p>
                  </div>
                  <Button
                    className="mt-4 bg-emerald-500 text-white hover:bg-emerald-400"
                    onClick={() => setSubmitted(false)}
                  >
                    {t("sendAnotherMessage" as any, "Send Another Message")}
                  </Button>
                </div>
              ) : (
                <>
                  {error && (
                    <div className="rounded-2xl border border-red-300/50 bg-red-500/10 p-4 text-sm text-red-800 shadow-inner shadow-red-500/20">
                      <div className="flex items-center gap-2">
                        <div className="text-xl">⚠️</div>
                        <p className="font-medium">{error}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="name"
                          className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          {t("name" as any, "Name")}*
                        </label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                          placeholder="Numele tău complet"
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <label
                          htmlFor="email"
                          className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                        >
                          {t("email" as any, "Email")}*
                        </label>
                        <input
                          type="email"
                          id="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          required
                          disabled={isSubmitting}
                          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                          placeholder="nume@email.com"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="subject"
                        className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        {t("subject" as any, "Subject")}*
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        disabled={isSubmitting}
                        className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="" className="bg-white text-slate-900">
                          {t("selectSubject" as any, "Select a subject")}
                        </option>
                        <option value="general" className="bg-white text-slate-900">
                          {t("generalInquiry" as any, "General Inquiry")}
                        </option>
                        <option value="order" className="bg-white text-slate-900">
                          {t("orderQuestion" as any, "Order Question")}
                        </option>
                        <option value="return" className="bg-white text-slate-900">
                          {t("returnQuestion" as any, "Return or Refund")}
                        </option>
                        <option value="product" className="bg-white text-slate-900">
                          {t("productInfo" as any, "Product Information")}
                        </option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label
                        htmlFor="message"
                        className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                      >
                        {t("message" as any, "Message")}*
                      </label>
                      <textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        disabled={isSubmitting}
                        minLength={10}
                        maxLength={2000}
                        className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-500/40 disabled:cursor-not-allowed disabled:opacity-60"
                        placeholder="Te rugăm să descrii mesajul tău (minim 10 caractere)..."
                      />
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span>{formData.message.length}/2000 caractere</span>
                        {formData.message.length < 10 && formData.message.length > 0 && (
                          <span className="text-red-500">(minim 10 caractere necesare)</span>
                        )}
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-500/25 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white"></div>
                          {t("sending" as any, "Sending...")}
                        </div>
                      ) : (
                        t("sendMessage" as any, "Send Message")
                      )}
                    </Button>
                  </form>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 text-slate-900 shadow-lg shadow-slate-900/10 backdrop-blur-md sm:p-7">
              <h2 className="text-lg font-semibold sm:text-xl">
                {t("contactInfo" as any, "Contact Information")}
              </h2>
              <p className="mt-2 text-sm text-slate-600">
                Răspundem rapid prin toate canalele — alege ce funcționează cel mai bine pentru tine.
              </p>
              <div className="mt-4 space-y-4 text-sm text-slate-700">
                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t("address" as any, "Address")}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 sm:text-sm">
                    TechTots Educational Solutions
                    <br />
                    Mehedinti 54-56, Bl D5, sc 2, apt 70
                    <br />
                    Cluj-Napoca, Cluj
                    <br />
                    România
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t("customerSupport" as any, "Customer Support")}
                  </h3>
                  <p className="mt-2 text-xs text-slate-600 sm:text-sm leading-relaxed">
                    Email:{" "}
                    <a
                      href={`mailto:${contactEmail}`}
                      className="text-sky-700 underline decoration-sky-500/30 underline-offset-4 transition hover:text-sky-600"
                    >
                      {contactEmail}
                    </a>
                    <br />
                    Phone:{" "}
                    <a
                      href={`tel:${contactPhone.replace(/[^\d+]/g, "")}`}
                      className="text-sky-700 underline decoration-sky-500/30 underline-offset-4 transition hover:text-sky-600"
                    >
                      {contactPhone}
                    </a>
                    <br />
                    <span className="text-xs text-slate-500">
                      Hours: Monday-Friday, 9:00 AM - 6:00 PM CET
                    </span>
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200/80 bg-slate-50 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">
                    {t("followUs" as any, "Follow Us")}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600 sm:text-sm">
                    <a
                      href="#"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 transition hover:border-sky-300 hover:text-sky-700"
                    >
                      Facebook
                    </a>
                    <a
                      href="#"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 transition hover:border-sky-300 hover:text-sky-700"
                    >
                      Twitter
                    </a>
                    <a
                      href="#"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 transition hover:border-sky-300 hover:text-sky-700"
                    >
                      Instagram
                    </a>
                    <a
                      href="#"
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 transition hover:border-sky-300 hover:text-sky-700"
                    >
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200/80 bg-white/90 p-6 text-slate-900 shadow-lg shadow-slate-900/10 backdrop-blur-md">
              <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
                Preferi discuțiile rapide?
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Contactează-ne pe WhatsApp sau rezervă o sesiune video de 15 minute pentru recomandări
                personalizate de produse STEM.
              </p>
              <div className="mt-4 flex flex-wrap gap-3 text-sm">
                <a
                  href={`https://wa.me/${contactPhone.replace(/[^\d]/g, "")}`}
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-2 text-sky-700 transition hover:border-sky-300 hover:bg-sky-100"
                >
                  💬 WhatsApp Direct
                </a>
                <a
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-indigo-700 transition hover:border-indigo-300 hover:bg-indigo-100"
                >
                  🎥 Book video call
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
