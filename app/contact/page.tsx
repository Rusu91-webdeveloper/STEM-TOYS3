"use client";

import Image from "next/image";
import { useState } from "react";

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
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-12">
      {/* Header - Compact on Mobile */}
      <div className="relative h-[120px] sm:h-[180px] md:h-[250px] rounded-lg sm:rounded-xl overflow-hidden mb-4 sm:mb-6 md:mb-12">
        <Image
          src="/images/homepage_hero_banner_01.png"
          alt="Contact Us"
          fill
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-bold text-white px-4">
            {t("contactH1")}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-12">
        {/* Contact Form */}
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 md:mb-6">
            {t("getInTouch" as any, "Get in Touch")}
          </h2>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-4 sm:p-5 md:p-6 rounded-lg">
              <div className="flex items-center mb-3 sm:mb-4">
                <div className="text-xl sm:text-2xl mr-2 sm:mr-3">✅</div>
                <h3 className="text-base sm:text-lg md:text-xl font-semibold">
                  {t("messageSent" as any, "Message Sent!")}
                </h3>
              </div>
              <p className="text-sm sm:text-base mb-3 sm:mb-4">
                {t(
                  "thankYouMessage" as any,
                  "Thank you for contacting us. We'll get back to you as soon as possible."
                )}
              </p>
              <div className="bg-green-100 border border-green-300 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-green-800">
                  <strong>📧 Ai primit și un email de confirmare!</strong>
                  <br />
                  Verifică căsuța de email (inclusiv spam/junk) pentru
                  confirmarea că am primit mesajul tău.
                </p>
              </div>
              <Button
                className="mt-3 sm:mt-4 text-sm sm:text-base"
                onClick={() => setSubmitted(false)}
              >
                {t("sendAnotherMessage" as any, "Send Another Message")}
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 sm:p-4 rounded-lg mb-4 sm:mb-6">
                  <div className="flex items-center">
                    <div className="text-lg sm:text-xl mr-2">⚠️</div>
                    <p className="text-sm sm:text-base font-medium">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-xs sm:text-sm font-medium mb-1"
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
                    className="w-full p-2 sm:p-2.5 md:p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-xs sm:text-sm font-medium mb-1"
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
                    className="w-full p-2 sm:p-2.5 md:p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-xs sm:text-sm font-medium mb-1"
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
                    className="w-full p-2 sm:p-2.5 md:p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {t("selectSubject" as any, "Select a subject")}
                    </option>
                    <option value="general">
                      {t("generalInquiry" as any, "General Inquiry")}
                    </option>
                    <option value="order">
                      {t("orderQuestion" as any, "Order Question")}
                    </option>
                    <option value="return">
                      {t("returnQuestion" as any, "Return or Refund")}
                    </option>
                    <option value="product">
                      {t("productInfo" as any, "Product Information")}
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="message"
                    className="block text-xs sm:text-sm font-medium mb-1"
                  >
                    {t("message" as any, "Message")}*
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={4}
                    disabled={isSubmitting}
                    minLength={10}
                    maxLength={2000}
                    className="w-full p-2 sm:p-2.5 md:p-3 text-sm sm:text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                    placeholder="Te rugăm să descrii mesajul tău (minim 10 caractere)..."
                  />
                  <div className="text-xs sm:text-sm text-gray-500 mt-1">
                    {formData.message.length}/2000 caractere
                    {formData.message.length < 10 &&
                      formData.message.length > 0 && (
                        <span className="text-red-500 ml-2">
                          (minim 10 caractere necesare)
                        </span>
                      )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full py-2.5 sm:py-3 text-sm sm:text-base font-semibold"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 border-b-2 border-white mr-2"></div>
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

        {/* Contact Information - Compact on Mobile */}
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 md:mb-6">
            {t("contactInfo" as any, "Contact Information")}
          </h2>

          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <div className="bg-gray-50 p-3 sm:p-4 md:p-6 rounded-lg">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2">
                {t("address" as any, "Address")}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed">
                TechTots Educational Solutions
                <br />
                Mehedinti 54-56, Bl D5, sc 2, apt 70
                <br />
                Cluj-Napoca, Cluj
                <br />
                România
              </p>
            </div>

            <div className="bg-gray-50 p-3 sm:p-4 md:p-6 rounded-lg">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2">
                {t("customerSupport" as any, "Customer Support")}
              </h3>
              <p className="text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed">
                Email:{" "}
                <a
                  href="mailto:webira.rem.srl@gmail.com"
                  className="text-indigo-600 hover:text-indigo-800 font-medium break-all"
                >
                  webira.rem.srl@gmail.com
                </a>
                <br />
                Phone:{" "}
                <a
                  href="tel:+40771248029"
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  +40771 248 029
                </a>
                <br />
                <span className="text-xs sm:text-sm">
                  Hours: Monday-Friday, 9:00 AM - 6:00 PM CET
                </span>
              </p>
            </div>

            <div className="bg-gray-50 p-3 sm:p-4 md:p-6 rounded-lg">
              <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2">
                {t("followUs" as any, "Follow Us")}
              </h3>
              <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4">
                <a
                  href="#"
                  className="text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm md:text-base font-medium"
                >
                  Facebook
                </a>
                <a
                  href="#"
                  className="text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm md:text-base font-medium"
                >
                  Twitter
                </a>
                <a
                  href="#"
                  className="text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm md:text-base font-medium"
                >
                  Instagram
                </a>
                <a
                  href="#"
                  className="text-indigo-600 hover:text-indigo-800 text-xs sm:text-sm md:text-base font-medium"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
