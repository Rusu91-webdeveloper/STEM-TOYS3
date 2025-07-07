"use client";

import Image from "next/image";

import { useTranslation } from "@/lib/i18n";

export default function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="relative h-[250px] rounded-lg overflow-hidden mb-12">
        <Image
          src="/images/homepage_hero_banner_01.png"
          alt="Terms of Service"
          fill
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white">
            {t("termsOfService" as any, "Terms of Service")}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="prose prose-lg max-w-none">
          <p>Last Updated: August 9, 2024</p>

          <h2>1. Introduction</h2>
          <p>
            Welcome to TechTots ("we," "our," or "us"). These Terms of Service
            ("Terms") govern your access to and use of the TechTots website,
            products, and services (collectively, the "Services").
          </p>
          <p>
            By accessing or using our Services, you agree to be bound by these
            Terms and our Privacy Policy. If you do not agree to these Terms,
            you must not access or use our Services.
          </p>

          <h2>2. Use of Services</h2>
          <p>
            You may use our Services only for lawful purposes and in accordance
            with these Terms. You agree not to use our Services:
          </p>
          <ul>
            <li>
              In any way that violates any applicable federal, state, local, or
              international law or regulation
            </li>
            <li>
              To engage in any conduct that restricts or inhibits anyone's use
              or enjoyment of the Services
            </li>
            <li>
              To impersonate or attempt to impersonate TechTots, a TechTots
              employee, or another user
            </li>
            <li>
              To attempt to gain unauthorized access to any parts of the
              Services
            </li>
          </ul>

          <h2>3. User Accounts</h2>
          <p>
            When you create an account with us, you must provide accurate,
            complete, and current information. You are responsible for
            safeguarding your account and for all activities that occur under
            your account.
          </p>
          <p>
            We reserve the right to disable any user account at any time if, in
            our opinion, you have violated any provisions of these Terms.
          </p>

          <h2>4. Intellectual Property</h2>
          <p>
            The Services and their entire contents, features, and functionality
            (including but not limited to all information, software, text,
            displays, images, video, and audio) are owned by TechTots, its
            licensors, or other providers and are protected by copyright,
            trademark, and other intellectual property laws.
          </p>

          <h2>5. Products and Purchases</h2>
          <p>
            All products are subject to availability. We reserve the right to
            discontinue any product at any time.
          </p>
          <p>
            Prices for products are subject to change without notice. We reserve
            the right to refuse any order placed with us.
          </p>

          <h2>6. Shipping and Delivery</h2>
          <p>
            Shipping and delivery timeframes are estimates only. TechTots is not
            responsible for shipping delays beyond our control.
          </p>

          <h2>7. Returns and Refunds</h2>
          <p>
            Our return and refund policy is designed to ensure your
            satisfaction. Please refer to our dedicated Returns Policy page for
            detailed information.
          </p>

          <h2>8. Warranty Disclaimer</h2>
          <p>
            THE SERVICES AND PRODUCTS ARE PROVIDED "AS IS" AND "AS AVAILABLE"
            WITHOUT ANY WARRANTY OF ANY KIND. TECHTOTS DISCLAIMS ALL WARRANTIES,
            EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS
            FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
          </p>

          <h2>9. Limitation of Liability</h2>
          <p>
            IN NO EVENT WILL TECHTOTS BE LIABLE FOR ANY INDIRECT, SPECIAL,
            INCIDENTAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING OUT OF OR
            RELATED TO YOUR USE OF THE SERVICES OR PRODUCTS.
          </p>

          <h2>10. Changes to Terms</h2>
          <p>
            We may revise these Terms at any time by updating this page. By
            continuing to access or use our Services after any revisions become
            effective, you agree to be bound by the revised Terms.
          </p>

          <h2>11. Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with
            the laws of the State of California, without regard to its conflict
            of law principles.
          </p>

          <h2>12. Contact Information</h2>
          <p>
            For questions about these Terms, please contact us at
            legal@techtots.com.
          </p>
        </div>
      </div>
    </div>
  );
}
