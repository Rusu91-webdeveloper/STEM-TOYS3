"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import Image from "next/image";

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
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="relative h-[250px] rounded-lg overflow-hidden mb-12">
        <Image
          src="/images/homepage_hero_banner_01.png"
          alt="Contact Us"
          fill
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white">
            {t("contactUs" as any, "Contact Us")}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Contact Form */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {t("getInTouch" as any, "Get in Touch")}
          </h2>

          {submitted ? (
            <div className="bg-green-50 border border-green-200 text-green-700 p-6 rounded-lg">
              <div className="flex items-center mb-4">
                <div className="text-2xl mr-3">✅</div>
                <h3 className="text-xl font-semibold">
                  {t("messageSent" as any, "Message Sent!")}
                </h3>
              </div>
              <p className="mb-4">
                {t(
                  "thankYouMessage" as any,
                  "Thank you for contacting us. We'll get back to you as soon as possible."
                )}
              </p>
              <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800">
                  <strong>📧 Ai primit și un email de confirmare!</strong>
                  <br />
                  Verifică căsuța de email (inclusiv spam/junk) pentru
                  confirmarea că am primit mesajul tău.
                </p>
              </div>
              <Button
                className="mt-4"
                onClick={() => setSubmitted(false)}>
                {t("sendAnotherMessage" as any, "Send Another Message")}
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg mb-6">
                  <div className="flex items-center">
                    <div className="text-xl mr-2">⚠️</div>
                    <p className="font-medium">{error}</p>
                  </div>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium mb-1">
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
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium mb-1">
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
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label
                    htmlFor="subject"
                    className="block text-sm font-medium mb-1">
                    {t("subject" as any, "Subject")}*
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting}
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
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
                    className="block text-sm font-medium mb-1">
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
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Te rugăm să descrii mesajul tău (minim 10 caractere)..."
                  />
                  <div className="text-sm text-gray-500 mt-1">
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
                  className="w-full py-3"
                  disabled={isSubmitting}>
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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

        {/* Contact Information */}
        <div>
          <h2 className="text-2xl font-bold mb-6">
            {t("contactInfo" as any, "Contact Information")}
          </h2>

          <div className="space-y-6">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                {t("address" as any, "Address")}
              </h3>
              <p>
                TechTots Headquarters
                <br />
                Mehedinti 54-56
                <br />
                Cluj-Napoca
                <br />
                Cluj
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                {t("customerSupport" as any, "Customer Support")}
              </h3>
              <p>
                Email:{" "}
                <a
                  href="mailto:webira.rem.srl@gmail.com"
                  className="text-indigo-600 hover:text-indigo-800">
                  webira.rem.srl@gmail.com
                </a>
                <br />
                Phone:{" "}
                <a
                  href="tel:+40771248029"
                  className="text-indigo-600 hover:text-indigo-800">
                  +40771 248 029
                </a>
                <br />
                Hours: Monday-Friday, 9am-5pm PST
              </p>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">
                {t("followUs" as any, "Follow Us")}
              </h3>
              <div className="flex space-x-4">
                <a
                  href="#"
                  className="text-indigo-600 hover:text-indigo-800">
                  Facebook
                </a>
                <a
                  href="#"
                  className="text-indigo-600 hover:text-indigo-800">
                  Twitter
                </a>
                <a
                  href="#"
                  className="text-indigo-600 hover:text-indigo-800">
                  Instagram
                </a>
                <a
                  href="#"
                  className="text-indigo-600 hover:text-indigo-800">
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
