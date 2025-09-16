"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Shield, Users, Star, Clock } from "lucide-react";

import { useTranslation } from "@/lib/i18n";

export default function FAQPage() {
  const { t } = useTranslation();

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      {/* Hero Section with Transformation Focus */}
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          {t("faqH1")}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          {t("faqSubtitle")}
        </p>

        {/* Social Proof Badges */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            <Users className="w-4 h-4 mr-2" />
            10,000+ Parents Transformed
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            <Star className="w-4 h-4 mr-2" />
            4.9/5 Stars Rating
          </Badge>
          <Badge variant="secondary" className="px-4 py-2 text-sm">
            <Shield className="w-4 h-4 mr-2" />
            30-Day Guarantee
          </Badge>
        </div>

        {/* Primary CTA */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
          >
            <Link href="/contact">
              {t("faqGetPersonalizedRecommendations")}
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/products">{t("faqSeeSuccessStories")}</Link>
          </Button>
        </div>
      </div>

      {/* FAQ Sections with Hormozi Principles */}
      <div className="space-y-12">
        {/* Question 1: Will STEM toys actually help? */}
        <section className="bg-gradient-to-r from-blue-50 to-green-50 p-8 rounded-2xl border border-blue-100">
          <div className="flex items-start gap-4">
            <CheckCircle className="w-8 h-8 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                {t("faqWhatAreStemH2")}
              </h2>
              <p className="text-lg leading-relaxed text-gray-700 mb-6">
                {t("faqWhatAreStemAnswer")}
              </p>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="font-semibold text-green-800 mb-2">
                  🎯 Real Results:
                </p>
                <p className="text-gray-700">
                  "My 8-year-old went from crying over math homework to asking
                  for more experiments. The transformation happened in just 3
                  weeks!" - Sarah M., Parent
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Question 2: Choosing the right toy */}
        <section className="bg-gradient-to-r from-orange-50 to-red-50 p-8 rounded-2xl border border-orange-100">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-orange-600 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                {t("faqAgeAppropriateH2")}
              </h2>
              <p className="text-lg leading-relaxed text-gray-700 mb-6">
                {t("faqAgeAppropriateAnswer")}
              </p>
              <div className="bg-white p-4 rounded-lg border border-orange-200">
                <p className="font-semibold text-orange-800 mb-2">
                  🛡️ Our Promise:
                </p>
                <p className="text-gray-700">
                  If you're not 100% satisfied with your choice, we'll not only
                  refund you but also personally help you find the perfect toy
                  for your child's specific needs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Question 3: Safety concerns */}
        <section className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-2xl border border-green-100">
          <div className="flex items-start gap-4">
            <Shield className="w-8 h-8 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                {t("faqSafetyH2")}
              </h2>
              <p className="text-lg leading-relaxed text-gray-700 mb-6">
                {t("faqSafetyAnswer")}
              </p>
              <div className="bg-white p-4 rounded-lg border border-green-200">
                <p className="font-semibold text-green-800 mb-2">
                  🔒 Safety Certifications:
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">CE Certified</div>
                    <div className="text-gray-600">European Standards</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">ASTM F963</div>
                    <div className="text-gray-600">US Safety Standard</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">EN71</div>
                    <div className="text-gray-600">EU Toy Safety</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">0 Incidents</div>
                    <div className="text-gray-600">50,000+ Toys Sold</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Question 4: Educational effectiveness */}
        <section className="bg-gradient-to-r from-purple-50 to-pink-50 p-8 rounded-2xl border border-purple-100">
          <div className="flex items-start gap-4">
            <Star className="w-8 h-8 text-purple-600 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                {t("faqEducationalH2")}
              </h2>
              <p className="text-lg leading-relaxed text-gray-700 mb-6">
                {t("faqEducationalAnswer")}
              </p>
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <p className="font-semibold text-purple-800 mb-2">
                  📈 Proven Results:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      87%
                    </div>
                    <div className="text-sm text-gray-600">
                      Improved Math Scores
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      92%
                    </div>
                    <div className="text-sm text-gray-600">
                      Increased Engagement
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      30 Days
                    </div>
                    <div className="text-sm text-gray-600">
                      Average Transformation
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Question 5: Guarantee and satisfaction */}
        <section className="bg-gradient-to-r from-red-50 to-orange-50 p-8 rounded-2xl border border-red-100">
          <div className="flex items-start gap-4">
            <Clock className="w-8 h-8 text-red-600 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">
                {t("faqPurchaseH2")}
              </h2>
              <p className="text-lg leading-relaxed text-gray-700 mb-6">
                {t("faqReturnPolicyAnswer")}
              </p>
              <div className="bg-white p-4 rounded-lg border border-red-200">
                <p className="font-semibold text-red-800 mb-2">
                  💯 Risk-Free Guarantee:
                </p>
                <div className="space-y-2 text-gray-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Full refund within 30 days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Keep the toy even if you return</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>Personal consultation to find perfect fit</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span>No questions asked policy</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Final CTA Section */}
      <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-green-600 text-white p-12 rounded-2xl">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Transform Your Child's Learning?
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Join 10,000+ parents who've already seen the transformation. Start
          today with our risk-free guarantee.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="text-blue-600 hover:text-blue-700"
          >
            <Link href="/products">{t("faqStartTransformation")}</Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white hover:text-blue-600"
          >
            <Link href="/contact">{t("faqBookFreeConsultation")}</Link>
          </Button>
        </div>
        <p className="text-sm mt-4 opacity-75">
          ⚡ Limited time: Free consultation worth €50 - Only 50 spots this
          month
        </p>
      </div>
    </div>
  );
}
