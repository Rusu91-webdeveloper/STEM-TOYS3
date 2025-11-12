"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  BarChart3,
  CheckCircle,
  DollarSign,
  MessageSquare,
  Settings,
  Shield,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const mainBenefits = [
  {
    icon: Users,
    stats: "50K+ families",
    title: "Growing Customer Base",
    description:
      "Tap into a loyal STEM audience seeking premium products with educational impact.",
    accent:
      "from-emerald-400/80 via-emerald-500/80 to-teal-500/80 text-emerald-100",
  },
  {
    icon: TrendingUp,
    stats: "300% growth",
    title: "Revenue Acceleration",
    description:
      "Unlock promotional calendars, launch playbooks, and co-marketing support that multiplies reach.",
    accent: "from-sky-400/80 via-sky-500/80 to-indigo-500/80 text-sky-100",
  },
  {
    icon: Shield,
    stats: "99.9% uptime",
    title: "Professional Platform",
    description:
      "Enterprise-grade infrastructure, localized storefronts, and end-to-end performance analytics.",
    accent:
      "from-indigo-400/80 via-indigo-500/80 to-purple-500/80 text-indigo-100",
  },
  {
    icon: CheckCircle,
    stats: "1-2 weeks",
    title: "Guided Onboarding",
    description:
      "Concierge support handles compliance, merchandising, content, and launch readiness.",
    accent: "from-amber-400/80 via-amber-500/80 to-orange-500/80 text-amber-100",
  },
] as const;

const platformFeatures = [
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description:
      "Real-time dashboards, cohort analysis, and merchandising insights to optimize performance.",
  },
  {
    icon: MessageSquare,
    title: "Dedicated Success Team",
    description:
      "Quarterly planning, campaign reviews, and hands-on merchandising guidance.",
  },
  {
    icon: Settings,
    title: "Operational Efficiency",
    description:
      "Streamlined catalog management, documentation workflows, and automated QA checks.",
  },
  {
    icon: Target,
    title: "Marketing Engine",
    description:
      "Email, social, and on-site activations built around learning milestones and STEM seasons.",
  },
] as const;

const supportFeatures = [
  {
    title: "24/7 Platform Access",
    description:
      "Monitor sales, manage inventory, and adjust pricing whenever you need.",
  },
  {
    title: "Training & Resources",
    description:
      "Video walkthroughs, STEM positioning templates, and best-practice guides.",
  },
  {
    title: "Technical Support",
    description:
      "Priority incident response, integration help, and launch QA coverage.",
  },
  {
    title: "Business Consulting",
    description:
      "Assistance with assortment strategy, pricing elasticity, and packaging alignment.",
  },
] as const;

const testimonials = [
  {
    name: "Maria Popescu",
    company: "EduTech Solutions",
    quote:
      "TechTots transformed our go-to-market approach. Their merchandising and analytics drove a 3x uplift in 90 days.",
    growth: "+300%",
  },
  {
    name: "Alexandru Ionescu",
    company: "Science Toys Pro",
    quote:
      "From photography to launch campaigns, every touchpoint felt premium. The team is deeply invested in our success.",
    growth: "+250%",
  },
  {
    name: "Elena Dumitrescu",
    company: "Learning Innovations",
    quote:
      "Compliance and storytelling support made our STEM kits stand out. We gained national visibility almost instantly.",
    growth: "+400%",
  },
] as const;

const successStats = [
  {
    metric: "500+",
    label: "Active STEM Suppliers",
    description: "Curated network of verified partners",
  },
  {
    metric: "62%",
    label: "Conversion Lift",
    description: "Average uplift from TechTots merchandising",
  },
  {
    metric: "18",
    label: "Launch Playbooks",
    description: "Seasonal and thematic activation templates",
  },
  {
    metric: "72%",
    label: "Catalog Expansion",
    description: "Partners expanding SKUs within 6 months",
  },
] as const;

export function SupplierBenefits() {
  return (
    <>
      <section className="container mx-auto px-4 pb-12 pt-20 sm:px-6 lg:px-12 lg:pb-16 lg:pt-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-indigo-900/70 to-slate-950/90 p-6 shadow-2xl shadow-black/40 sm:p-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 rounded-full bg-emerald-500/15 blur-3xl lg:block" />
          <div className="relative mx-auto max-w-4xl text-center">
            <Badge className="mb-4 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200 sm:text-sm">
              Partnership Benefits
            </Badge>
            <h1 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              Why STEM creators partner with{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                TechTots
              </span>
            </h1>
            <p className="mt-4 text-sm text-slate-200 sm:text-base lg:text-lg">
              Access a premium marketplace engineered for experiential learning. We
              combine pedagogy, performance marketing, and collaborative merchandising
              to accelerate your business with clarity.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                asChild
                size="lg"
                className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400 sm:text-base"
              >
                <Link href="/supplier/apply">
                  Start Application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border border-white/40 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10 sm:text-base"
              >
                <Link href="/supplier/requirements">View Requirements</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12 sm:px-6 lg:px-12 lg:pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {mainBenefits.map(benefit => (
            <Card
              key={benefit.title}
              className="rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/25"
            >
              <CardHeader className="space-y-4">
                <div
                  className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${benefit.accent} shadow-lg shadow-black/30`}
                >
                  <benefit.icon className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <CardTitle className="text-lg text-white">{benefit.title}</CardTitle>
                  <Badge className="mt-1 rounded-full border border-white/20 bg-white/10 text-xs text-white">
                    {benefit.stats}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm text-slate-200">
                  {benefit.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12 sm:px-6 lg:px-12 lg:pb-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/25 sm:p-10">
          <div className="text-center">
            <Badge className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 sm:text-sm">
              Platform Advantages
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
              Everything you need to scale in one operating system
            </h2>
            <p className="mt-3 text-sm text-slate-200 sm:text-base">
              Data, creative, and operations work in concert to tell your STEM story and
              maximise repeat purchase potential.
            </p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {platformFeatures.map(feature => (
              <Card
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/5 shadow-inner shadow-black/20"
              >
                <CardHeader className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/20 text-sky-200">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg text-white">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm text-slate-200">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12 sm:px-6 lg:px-12 lg:pb-16">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/70 via-slate-950/80 to-slate-950/90 p-6 shadow-2xl shadow-black/30 sm:p-10">
          <div className="text-center">
            <Badge className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 sm:text-sm">
              Revenue Engine
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
              Proven compounding impact for STEM specialists
            </h2>
            <p className="mt-3 text-sm text-slate-200 sm:text-base">
              Your growth is fuelled by collaborative campaigns, cross-category expansion,
              and retention journeys tuned for experiential learning.
            </p>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {successStats.map(stat => (
              <div
                key={stat.label}
                className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center shadow-inner shadow-black/25"
              >
                <p className="text-3xl font-semibold text-sky-200 sm:text-4xl">
                  {stat.metric}
                </p>
                <p className="mt-2 text-sm font-semibold text-white">{stat.label}</p>
                <p className="mt-1 text-xs text-slate-200">{stat.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-2xl bg-white/90 px-7 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-white/20 transition hover:bg-white sm:text-base"
            >
              <Link href="/supplier/apply">Start earning today</Link>
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

      <section className="container mx-auto px-4 pb-12 sm:px-6 lg:px-12 lg:pb-16">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 sm:p-10">
          <div className="text-center">
            <Badge className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 sm:text-sm">
              Support Ecosystem
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
              Dedicated experts from day zero through scale
            </h2>
            <p className="mt-3 text-sm text-slate-200 sm:text-base">
              Every supplier receives human support plus a full content library tailored to STEM
              product excellence.
            </p>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            {supportFeatures.map(feature => (
              <Card
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/40 to-slate-950/60 shadow-inner shadow-black/25"
              >
                <CardContent className="flex items-start gap-4 p-6">
                  <CheckCircle className="h-6 w-6 text-emerald-300" />
                  <div>
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                    <p className="mt-2 text-sm text-slate-200">{feature.description}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16 sm:px-6 lg:px-12">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/70 via-slate-950/80 to-slate-950/90 p-6 shadow-2xl shadow-black/30 sm:p-10">
          <div className="text-center">
            <Badge className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 sm:text-sm">
              Partner Voices
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
              “More than a marketplace—TechTots is a growth partner.”
            </h2>
            <p className="mt-3 text-sm text-slate-200 sm:text-base">
              Real stories from brands scaling experiential learning across Romania and beyond.
            </p>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {testimonials.map(testimonial => (
              <Card
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
              </Card>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-2xl bg-white/90 px-7 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-white/20 transition hover:bg-white sm:text-base"
            >
              <Link href="/supplier/apply">Become a TechTots supplier</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-2xl border border-white/40 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10 sm:text-base"
            >
              <Link href="/supplier/registration-success">Understand the review process</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 py-12 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-black/10" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
        <div className="container relative mx-auto px-4 text-center sm:px-6 lg:px-12">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
            Ready to join the TechTots supplier ecosystem?
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-emerald-100 sm:text-base lg:text-lg">
            Submit your application and we’ll schedule an introductory call within 48 hours.
            Let’s build the future of experiential learning together.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 border-2 border-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base px-6 py-3 rounded-2xl"
            >
              <Link href="/supplier/apply">
                Apply now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white/10 rounded-2xl px-6 py-3 text-sm sm:text-base"
            >
              <Link href="/supplier/requirements">Review eligibility</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
