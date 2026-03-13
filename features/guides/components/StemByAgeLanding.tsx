// Copyright 2025 TechTots STEM Toys
"use client";

import {
  ArrowRight,
  Compass,
  Lightbulb,
  ListChecks,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

const surfaceBase =
  "rounded-3xl border border-slate-200/80 bg-white/90 p-6 shadow-lg shadow-slate-900/10 backdrop-blur-sm sm:p-8";

interface AgeSectionLink {
  href: string;
  label: string;
}

interface AgeSection {
  id: string;
  badge: string;
  title: string;
  highlights: string[];
  linkIntro: string;
  links: AgeSectionLink[];
  insight: string;
}

export function StemByAgeLanding() {
  const { t } = useTranslation();
  const publishedOn = useMemo(() => new Date().toLocaleDateString("ro-RO"), []);

  const translate = (key: string) => {
    const value = t(key);
    return typeof value === "string" && value.trim().length > 0 ? value : key;
  };

  const quickSummaryKeys = [
    "byAgeQuickSummary1",
    "byAgeQuickSummary2",
    "byAgeQuickSummary3",
    "byAgeQuickSummary4",
    "byAgeQuickSummary5",
  ] as const;

  const quickSummaryItems = quickSummaryKeys.map(key => ({
    key,
    label: translate(key),
  }));

  const tableOfContentsKeys = [
    { href: "#3-5", key: "byAge3to5" },
    { href: "#6-8", key: "byAge6to8" },
    { href: "#9-12", key: "byAge9to12" },
    { href: "#13plus", key: "byAge13plus" },
    { href: "#sfaturi", key: "byAgeSelectionTips" },
  ] as const;

  const tableOfContents = tableOfContentsKeys.map(item => ({
    href: item.href,
    label: translate(item.key),
  }));

  const ageSections: AgeSection[] = [
    {
      id: "3-5",
      badge: translate("byAge3to5"),
      title: translate("age3to5H2"),
      highlights: [
        translate("byAge3to5Content1"),
        translate("byAge3to5Content2"),
        translate("byAge3to5Content3"),
      ],
      linkIntro: translate("byAge3to5Explore"),
      links: [
        {
          href: "/categories/mathematics",
          label: translate("guide2025MathematicsCategory"),
        },
        {
          href: "/categories/engineering",
          label: translate("guide2025EngineeringCategory"),
        },
      ],
      insight: translate("byAge3to5Content4"),
    },
    {
      id: "6-8",
      badge: translate("byAge6to8"),
      title: translate("age6to8H2"),
      highlights: [
        translate("byAge6to8Content1"),
        translate("byAge6to8Content2"),
        translate("byAge6to8Content3"),
      ],
      linkIntro: translate("byAge6to8See"),
      links: [
        {
          href: "/categories/technology",
          label: translate("guide2025TechnologyCategory"),
        },
        {
          href: "/categories/science",
          label: translate("guide2025ScienceCategory"),
        },
      ],
      insight: translate("byAge6to8Content4"),
    },
    {
      id: "9-12",
      badge: translate("byAge9to12"),
      title: translate("age9to12H2"),
      highlights: [
        translate("byAge9to12Content1"),
        translate("byAge9to12Content2"),
        translate("byAge9to12Content3"),
      ],
      linkIntro: translate("byAge9to12Recommend"),
      links: [
        {
          href: "/categories/engineering",
          label: translate("guide2025EngineeringCategory"),
        },
        {
          href: "/categories/mathematics",
          label: translate("guide2025MathematicsCategory"),
        },
      ],
      insight: translate("byAge9to12Content4"),
    },
    {
      id: "13plus",
      badge: translate("byAge13plus"),
      title: translate("age13plusH2"),
      highlights: [
        translate("byAge13plusContent1"),
        translate("byAge13plusContent2"),
        translate("byAge13plusContent3"),
      ],
      linkIntro: translate("byAge13plusDiscover"),
      links: [
        {
          href: "/categories/technology",
          label: translate("guide2025TechnologyCategory"),
        },
        {
          href: "/categories/engineering",
          label: translate("guide2025EngineeringCategory"),
        },
      ],
      insight: translate("byAge13plusContent4"),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/70 text-slate-900">
      <section className="container relative z-10 mx-auto px-4 pb-12 pt-20 sm:px-6 lg:px-12 lg:pb-16 lg:pt-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-indigo-900/75 to-slate-950/90 p-6 shadow-2xl shadow-black/40 sm:p-10">
          <div className="absolute -right-16 top-10 hidden h-72 w-72 rounded-full bg-emerald-500/25 blur-3xl lg:block" />
          <div className="absolute -left-24 bottom-10 hidden h-80 w-80 rounded-full bg-sky-500/20 blur-3xl md:block" />
          <div className="relative flex flex-col items-center text-center">
            <Badge className="mb-4 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200 sm:text-sm">
              <Sparkles className="h-4 w-4" />
              TechTots Roadmaps
            </Badge>
            <h1 className="max-w-4xl bg-gradient-to-r from-emerald-300 via-sky-300 to-indigo-300 bg-clip-text text-3xl font-bold leading-tight text-transparent sm:text-4xl lg:text-5xl">
              {translate("byAgeTitle")}
            </h1>
            <p className="mt-4 text-xs text-slate-300 sm:text-sm">
              {translate("guide2025Byline")} {publishedOn}
            </p>
            <p className="mt-5 max-w-3xl text-sm text-slate-200 sm:text-base lg:text-lg">
              {translate("byAgeDescription")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400 sm:text-base"
              >
                <Link href="#3-5">
                  {translate("byAge3to5")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border border-white/40 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10 sm:text-base"
              >
                <Link href="/products">
                  {translate("byAgeExploreProducts")}
                </Link>
              </Button>
            </div>
            <div className="mt-10 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickSummaryItems.map(item => (
                <div
                  key={item.key}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left shadow-inner shadow-black/30 transition hover:border-emerald-400/40 hover:bg-white/10"
                >
                  <p className="text-sm text-slate-200 sm:text-base">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12 sm:px-6 lg:px-12 lg:pb-16">
        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <Card className={cn(surfaceBase, "border-slate-200/80 bg-white/95")}>
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-3 text-base text-slate-900 sm:text-lg lg:text-xl">
                <ListChecks className="h-5 w-5 text-emerald-500" />
                {translate("guide2025QuickSummary")}
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-slate-600">
                {translate("byAgeSelectionTips")}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-6 grid gap-3">
              {quickSummaryItems.map(item => (
                <div
                  key={`summary-${item.key}`}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 p-4 shadow-inner shadow-slate-900/5"
                >
                  <Lightbulb className="mt-1 h-5 w-5 text-amber-500" />
                  <p className="text-sm text-slate-700 sm:text-base">
                    {item.label}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card
            className={cn(
              surfaceBase,
              "bg-gradient-to-br from-indigo-900/60 via-slate-950/80 to-slate-950/90"
            )}
          >
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-3 text-base text-white sm:text-lg">
                <Compass className="h-5 w-5 text-sky-300" />
                {translate("byAgeTableOfContents")}
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-slate-200">
                {translate("byAgeDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-6 space-y-3">
              {tableOfContents.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-slate-100 transition hover:border-sky-400/40 hover:bg-white/10 sm:text-base"
                >
                  {link.label}
                  <ArrowRight className="h-4 w-4 text-sky-300" />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      {ageSections.map(section => (
        <AgeSectionCard key={section.id} section={section} />
      ))}

      <section
        id="sfaturi"
        className="container mx-auto px-4 pb-16 sm:px-6 lg:px-12"
        aria-labelledby="sfaturi-title"
      >
        <div
          className={cn(
            surfaceBase,
            "relative overflow-hidden border-white/10 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white shadow-2xl shadow-slate-950/25"
          )}
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/70 to-transparent" />
          <div className="absolute -left-20 top-12 h-48 w-48 rounded-full bg-sky-400/10 blur-3xl" />
          <div className="absolute -right-24 bottom-0 h-56 w-56 rounded-full bg-indigo-400/15 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)] lg:items-start">
            <div className="space-y-6">
              <div className="space-y-3">
                <Badge className="w-fit rounded-full border border-sky-300/25 bg-white/[0.08] px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-sky-100">
                  Ghid de alegere
                </Badge>
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-sky-300" />
                  <h2
                    id="sfaturi-title"
                    className="text-2xl font-semibold tracking-tight text-white sm:text-3xl"
                  >
                    {translate("byAgeSelectionTips")}
                  </h2>
                </div>
                <p className="max-w-2xl text-sm leading-7 text-slate-200 sm:text-base">
                  Repere rapide pentru a alege kituri STEM potrivite, fără să
                  sacrifici claritatea, siguranța sau motivația copilului.
                </p>
              </div>

              <ol className="grid gap-3 sm:grid-cols-2">
                <ListItem
                  as="li"
                  tone="inverse"
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-inner shadow-black/20"
                >
                  {translate("byAgeSelectionTipsContent1")}
                </ListItem>
                <ListItem
                  as="li"
                  tone="inverse"
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-inner shadow-black/20"
                >
                  {translate("byAgeSelectionTipsContent2")}
                </ListItem>
                <ListItem
                  as="li"
                  tone="inverse"
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-inner shadow-black/20"
                >
                  {translate("byAgeSelectionTipsContent3")}
                </ListItem>
                <ListItem
                  as="li"
                  tone="inverse"
                  className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-inner shadow-black/20"
                >
                  {translate("byAgeSelectionTipsContent4")}
                </ListItem>
              </ol>
            </div>

            <div className="space-y-5 rounded-3xl border border-white/10 bg-white/[0.08] p-5 shadow-inner shadow-black/20 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
                  Cum menții interesul
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-100 sm:text-base">
                  {translate("byAgeSelectionTipsContent5")}
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-1">
                <Button
                  asChild
                  size="lg"
                  className="w-full rounded-2xl bg-white px-7 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-950/30 transition hover:bg-slate-100 sm:text-base"
                >
                  <Link href="/products">
                    {translate("byAgeExploreProducts")}
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full rounded-2xl border border-white/25 bg-transparent px-7 py-3 text-sm font-semibold text-white transition hover:border-sky-200/60 hover:bg-white/10 sm:text-base"
                >
                  <Link href="/contact">{translate("contactUs")}</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function AgeSectionCard({ section }: { section: AgeSection }) {
  return (
    <section
      id={section.id}
      className="container mx-auto px-4 pb-12 sm:px-6 lg:px-12 lg:pb-16"
      aria-labelledby={`${section.id}-title`}
    >
      <div className={cn(surfaceBase, "space-y-6 bg-white/90")}>
        <Badge className="w-fit rounded-full border border-slate-200 bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-700">
          {section.badge}
        </Badge>
        <h2
          id={`${section.id}-title`}
          className="text-2xl font-semibold text-slate-900 sm:text-3xl"
        >
          {section.title}
        </h2>
        <ul className="space-y-3">
          {section.highlights.map(item => (
            <ListItem key={`${section.id}-${item}`}>{item}</ListItem>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 sm:text-sm">
            {section.linkIntro}
          </span>
          {section.links.map(link => (
            <Link
              key={`${section.id}-${link.href}`}
              href={link.href}
              className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100 sm:text-sm"
            >
              {link.label}
              <ArrowRight className="h-4 w-4" />
            </Link>
          ))}
        </div>
        <p className="text-sm text-slate-700 sm:text-base">{section.insight}</p>
      </div>
    </section>
  );
}

function ListItem({
  children,
  as: Component = "div",
  tone = "default",
  className,
}: {
  children: React.ReactNode;
  as?: "div" | "li";
  tone?: "default" | "inverse";
  className?: string;
}) {
  return (
    <Component
      className={cn(
        "flex items-start gap-3 text-left",
        Component === "li" ? "list-none" : undefined,
        className
      )}
    >
      <span
        className={cn(
          "mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-br shadow-md",
          tone === "inverse"
            ? "from-sky-200 via-cyan-300 to-indigo-300 shadow-sky-500/30"
            : "from-emerald-300 via-sky-300 to-indigo-300 shadow-emerald-500/40"
        )}
      />
      <span
        className={cn(
          "pl-3 text-left text-sm sm:text-base",
          tone === "inverse" ? "text-slate-100" : "text-slate-700"
        )}
      >
        {children}
      </span>
    </Component>
  );
}
