"use client";

import Image from "next/image";

import { useTranslation } from "@/lib/i18n";

export default function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto px-4 py-12">
      {/* Header */}
      <div className="relative h-[250px] rounded-lg overflow-hidden mb-12">
        <Image
          src="/images/homepage_hero_banner_01.png"
          alt="Privacy Policy"
          fill
          style={{ objectFit: "cover" }}
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <h1 className="text-4xl font-bold text-white">
            {t("privacyPolicy" as any, "Privacy Policy")}
          </h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="prose prose-lg max-w-none">
          <p>Last Updated: August 9, 2024</p>

          <h2>1. Introduction</h2>
          <p>
            At TechTots ("we," "our," or "us"), we respect your privacy and are
            committed to protecting your personal information. This Privacy
            Policy explains how we collect, use, disclose, and safeguard your
            information when you visit our website or make purchases.
          </p>
          <p>
            Please read this Privacy Policy carefully. By accessing or using our
            Services, you acknowledge that you have read and understood this
            Privacy Policy.
          </p>

          <h2>2. Information We Collect</h2>

          <h3>Personal Information</h3>
          <p>
            We may collect personal information that you voluntarily provide to
            us when you:
          </p>
          <ul>
            <li>Create an account</li>
            <li>Make a purchase</li>
            <li>Sign up for our newsletter</li>
            <li>Contact customer service</li>
            <li>Participate in surveys or promotions</li>
          </ul>
          <p>This information may include:</p>
          <ul>
            <li>Name</li>
            <li>Email address</li>
            <li>Mailing address</li>
            <li>Phone number</li>
            <li>
              Payment information (we do not store complete credit card details)
            </li>
          </ul>

          <h3>Automatically Collected Information</h3>
          <p>
            When you access our website, we may automatically collect certain
            information, including:
          </p>
          <ul>
            <li>IP address</li>
            <li>Browser type</li>
            <li>Device information</li>
            <li>Operating system</li>
            <li>Pages visited and time spent</li>
            <li>Referring website</li>
          </ul>

          <h2>3. How We Use Your Information</h2>
          <p>
            We may use the information we collect for various purposes,
            including to:
          </p>
          <ul>
            <li>Process and fulfill your orders</li>
            <li>Create and manage your account</li>
            <li>Provide customer support</li>
            <li>Send you marketing communications (with your consent)</li>
            <li>Improve our website and services</li>
            <li>Detect and prevent fraud</li>
            <li>Comply with legal obligations</li>
          </ul>

          <h2>4. Cookies and Tracking Technologies</h2>
          <p>
            We use cookies and similar tracking technologies to collect
            information about your browsing activities. You can instruct your
            browser to refuse all cookies or to indicate when a cookie is being
            sent.
          </p>

          <h2>5. Sharing Your Information</h2>
          <p>We may share your information with:</p>
          <ul>
            <li>Service providers who help us operate our business</li>
            <li>Payment processors to complete transactions</li>
            <li>Shipping partners to deliver your orders</li>
            <li>Marketing partners (with your consent)</li>
            <li>Legal authorities when required by law</li>
          </ul>

          <h2>6. Data Security</h2>
          <p>
            We implement appropriate technical and organizational measures to
            protect your personal information. However, no method of
            transmission over the Internet or electronic storage is 100% secure,
            and we cannot guarantee absolute security.
          </p>

          <h2>7. Children's Privacy</h2>
          <p>
            Our Services are not intended for children under 13 years of age. We
            do not knowingly collect personal information from children under
            13.
          </p>

          <h2>8. Your Rights</h2>
          <p>
            Depending on your location, you may have rights regarding your
            personal information, including:
          </p>
          <ul>
            <li>Access to your personal information</li>
            <li>Correction of inaccurate information</li>
            <li>Deletion of your information</li>
            <li>Restriction of processing</li>
            <li>Data portability</li>
            <li>Objection to processing</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information
            provided below.
          </p>

          <h2>9. Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify
            you of any changes by posting the new Privacy Policy on this page
            and updating the "Last Updated" date.
          </p>

          <h2>10. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact
            us at:
          </p>
          <p>
            Email: privacy@techtots.com
            <br />
            Address: TechTots, 123 Innovation Lane, Silicon Valley, CA 94024
          </p>
        </div>
      </div>
    </div>
  );
}
