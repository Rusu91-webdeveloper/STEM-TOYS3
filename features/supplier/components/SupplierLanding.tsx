"use client";

import {
  ArrowRight,
  Building2,
  Globe,
  Shield,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const metrics = [
  { value: "500+", label: "Active Suppliers", accent: "text-emerald-300" },
  { value: "50K+", label: "Families Reached", accent: "text-sky-300" },
  { value: "10K+", label: "Products Listed", accent: "text-indigo-300" },
  { value: "98%", label: "Satisfaction Score", accent: "text-purple-300" },
] as const;

const benefits = [
  {
    icon: Building2,
    title: "Professional Infrastructure",
    description:
      "Enterprise-grade storefronts, curated merchandising, and a premium brand experience designed for STEM innovators.",
  },
  {
    icon: TrendingUp,
    title: "Accelerated Growth",
    description:
      "Suppliers report up to 300% revenue uplift by leveraging seasonal launches, co-branded campaigns, and data-driven recommendations.",
  },
  {
    icon: Users,
    title: "Dedicated Success Team",
    description:
      "From onboarding to optimization, specialists support catalog fine-tuning, pricing strategy, and educational storytelling.",
  },
  {
    icon: Shield,
    title: "Secure Operations",
    description:
      "Robust payment flows, fraud protection, and transparent performance analytics keep your business secure and predictable.",
  },
] as const;

const steps = [
  {
    badge: "01",
    title: "Apply",
    description:
      "Share your catalog overview, certifications, and distribution capabilities through our guided form.",
  },
  {
    badge: "02",
    title: "Review",
    description:
      "Compliance and merchandising teams validate quality, safety, fulfilment, and educational alignment.",
  },
  {
    badge: "03",
    title: "Launch",
    description:
      "Receive a tailored go-live plan, marketing toolkit, and access to performance dashboards.",
  },
  {
    badge: "04",
    title: "Scale",
    description:
      "Collaborate on quarterly campaigns, unlock analytics insights, and expand into new STEM categories.",
  },
] as const;

const testimonials = [
  {
    name: "Maria Popescu",
    company: "EduTech Solutions",
    quote:
      "TechTots delivered nationwide visibility in weeks. Their analytics-first approach tripled our monthly revenue.",
    growth: "+300%",
  },
  {
    name: "Alexandru Ionescu",
    company: "Science Toys Pro",
    quote:
      "Launch playbooks, seasonal promos, and constant coaching make the partnership feel like an extension of our team.",
    growth: "+250%",
  },
  {
    name: "Elena Dumitrescu",
    company: "Learning Innovations",
    quote:
      "Compliance, copywriting, photography—everything was handled with precision. Our STEM kits have never looked better.",
    growth: "+400%",
  },
] as const;

export function SupplierLanding() {
  return (
    <>
      <section className="container relative z-10 mx-auto px-4 pb-12 pt-20 sm:px-6 lg:px-12 lg:pb-16 lg:pt-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/85 via-indigo-900/70 to-slate-950/90 p-6 shadow-2xl shadow-black/40 sm:p-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 rounded-full bg-sky-500/20 blur-3xl lg:block" />
          <div className="relative flex flex-col items-center text-center">
            <Badge className="mb-4 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200 sm:text-sm">
              <Globe className="mr-2 h-4 w-4" />
              TechTots Supplier Network
            </Badge>
            <h1 className="max-w-4xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Scale your STEM toy brand with Romania&apos;s{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                most trusted marketplace
              </span>
            </h1>
            <p className="mt-4 max-w-3xl text-sm text-slate-200 sm:text-base lg:text-lg">
              Tap into a curated ecosystem of families, schools, and learning communities. We combine premium positioning,
              analytics, and strategic marketing to grow your revenue with clarity and confidence.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400 sm:text-base"
              >
                <Link href="/supplier/apply">
                  Start Your Application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border border-white/40 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10 sm:text-base"
              >
                <Link href="/supplier/benefits">Explore Benefits</Link>
              </Button>
            </div>
            <div className="mt-10 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {metrics.map(metric => (
                <div
                  key={metric.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left shadow-inner shadow-black/30"
                >
                  <p className={`text-2xl font-semibold sm:text-3xl ${metric.accent}`}>
                    {metric.value}
                  </p>
                  <p className="mt-1 text-sm text-slate-200 sm:text-base">{metric.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12 sm:px-6 lg:px-12 lg:pb-16">
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className="rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-base text-white sm:text-lg lg:text-xl">
                <Shield className="h-5 w-5 text-sky-300" />
                Why suppliers choose TechTots
              </CardTitle>
              <CardDescription className="text-sm text-slate-300">
                Partnerships rooted in pedagogy, compliance, and long-term value creation.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {benefits.map(benefit => (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-emerald-400/40 hover:bg-white/10"
                >
                  <benefit.icon className="mb-3 h-6 w-6 text-emerald-300" />
                  <h3 className="text-base font-semibold text-white">{benefit.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{benefit.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className="flex flex-col justify-between rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/20 via-indigo-900/50 to-slate-950/70 p-6 shadow-xl shadow-black/25">
            <div>
              <CardTitle className="flex items-center gap-3 text-base text-white sm:text-lg">
                <Star className="h-5 w-5 text-amber-300" />
                Growth Snapshot
              </CardTitle>
              <CardDescription className="mt-3 text-sm text-slate-200">
                72% of partners expand catalog depth within the first 90 days post-launch.
              </CardDescription>
            </div>
            <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200 shadow-inner shadow-black/30">
              <p className="font-semibold text-white">Key Highlights</p>
              <ul className="mt-3 space-y-2 text-xs sm:text-sm">
                <li>• Concierge onboarding and compliance support</li>
                <li>• Assisted photography, copywriting, and SEO optimization</li>
                <li>• Quarterly joint planning with merchandising specialists</li>
              </ul>
            </div>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12 sm:px-6 lg:px-12 lg:pb-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <Badge className="mb-3 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                Supplier Journey
              </Badge>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                From application to launch in under four weeks
              </h2>
              <p className="mt-3 text-sm text-slate-200 sm:text-base">
                A streamlined path that keeps momentum high while ensuring every product meets TechTots quality and educational standards.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400"
            >
              <Link href="/supplier/requirements">
                View Detailed Requirements
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(step => (
              <div
                key={step.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:border-sky-400/40 hover:bg-white/10"
              >
                <Badge className="mb-3 rounded-full border border-white/20 bg-white/10 text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
                  {step.badge}
                </Badge>
                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-200">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 sm:px-6 lg:px-12">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/70 via-slate-950/80 to-slate-950/90 p-6 shadow-2xl shadow-black/30 sm:p-10">
          <div className="mb-8 text-center">
            <Badge className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 sm:text-sm">
              Partner Voices
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
              Built in partnership with leading STEM creators
            </h2>
            <p className="mt-3 text-sm text-slate-200 sm:text-base">
              Collaborative merchandising, customer insights, and continuous experimentation drive measurable growth.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-3">
            {testimonials.map(testimonial => (
              <div
                key={testimonial.name}
                className="flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 text-left shadow-inner shadow-black/20"
              >
                <p className="text-sm italic text-slate-200">“{testimonial.quote}”</p>
                <div className="mt-6 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">{testimonial.name}</p>
                    <p className="text-xs text-slate-300">{testimonial.company}</p>
                  </div>
                  <Badge className="rounded-full border border-emerald-400/40 bg-emerald-500/15 text-xs font-semibold text-emerald-200">
                    {testimonial.growth}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-2xl bg-white/90 px-7 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-white/20 transition hover:bg-white sm:text-base"
            >
              <Link href="/supplier/apply">Apply to become a supplier</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-2xl border border-white/40 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10 sm:text-base"
            >
              <Link href="/supplier/registration-success">See onboarding timeline</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
