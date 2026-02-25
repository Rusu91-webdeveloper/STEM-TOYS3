// Copyright 2025 TechTots STEM Toys
"use client";

import {
  ArrowRight,
  Compass,
  Lightbulb,
  ListChecks,
  Sparkles,
  Target,
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

const listBulletClass = "pl-3 text-left text-sm text-slate-700 sm:text-base";

export function StemGuideLanding() {
  const { t } = useTranslation();
  const publishedOn = useMemo(() => new Date().toLocaleDateString("ro-RO"), []);

  const translate = (key: string) => {
    const value = t(key);
    return typeof value === "string" && value.trim().length > 0 ? value : key;
  };

  const quickSummaryKeys = [
    "guide2025QuickSummary1",
    "guide2025QuickSummary2",
    "guide2025QuickSummary3",
    "guide2025QuickSummary4",
    "guide2025QuickSummary5",
  ] as const;
  const quickSummaryItems = quickSummaryKeys.map(key => ({
    key,
    label: translate(key),
  }));

  const tableOfContentsKeys = [
    { href: "#ce-sunt-stem", key: "guide2025WhatAreStem" },
    { href: "#categorii", key: "guide2025Categories" },
    { href: "#varsta", key: "guide2025AgeRecommendations" },
    { href: "#alegere", key: "guide2025HowToChoose" },
    { href: "#top", key: "guide2025TopRecommendations" },
    { href: "#faq", key: "guide2025Faq" },
  ] as const;
  const tableOfContents = tableOfContentsKeys.map(item => ({
    href: item.href,
    label: translate(item.key),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/70 text-slate-900">
      <section className="container relative z-10 mx-auto px-4 pb-12 pt-20 sm:px-6 lg:px-12 lg:pb-16 lg:pt-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-indigo-900/75 to-slate-950/90 p-6 shadow-2xl shadow-black/40 sm:p-10">
          <div className="absolute -right-16 top-10 hidden h-72 w-72 rounded-full bg-sky-500/30 blur-3xl lg:block" />
          <div className="absolute -left-24 bottom-10 hidden h-80 w-80 rounded-full bg-emerald-500/25 blur-3xl md:block" />
          <div className="relative flex flex-col items-center text-center">
            <Badge className="mb-4 flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200 sm:text-sm">
              <Sparkles className="h-4 w-4" />
              TechTots Insights
            </Badge>
            <h1 className="max-w-4xl bg-gradient-to-r from-emerald-300 via-sky-300 to-indigo-300 bg-clip-text text-3xl font-bold leading-tight text-transparent sm:text-4xl lg:text-5xl">
              {translate("guide2025H1")}
            </h1>
            <p className="mt-4 text-xs text-slate-300 sm:text-sm">
              {translate("guide2025Byline")} {publishedOn}
            </p>
            <p className="mt-5 max-w-3xl text-sm text-slate-200 sm:text-base lg:text-lg">
              {translate("guide2025Description")}
            </p>
            <p className="mt-4 max-w-2xl text-sm text-slate-200 sm:text-base">
              {translate("guide2025ReadyToChooseContent")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400 sm:text-base"
              >
                <Link href="#categorii">
                  {translate("guide2025Categories")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border border-white/40 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10 sm:text-base"
              >
                <Link href="/products">{translate("guide2025SeeProducts")}</Link>
              </Button>
            </div>
            <div className="mt-10 grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickSummaryItems.map(item => (
                <div
                  key={item.key}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 text-left shadow-inner shadow-black/30 transition hover:border-emerald-400/40 hover:bg-white/10"
                >
                  <p className="text-sm text-slate-200 sm:text-base">{item.label}</p>
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
                {translate("guide2025PracticalSuggestion")}
              </CardDescription>
            </CardHeader>
            <CardContent className="mt-6 grid gap-3">
              {quickSummaryItems.map(item => (
                <div
                  key={`summary-${item.key}`}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 p-4 shadow-inner shadow-slate-900/5"
                >
                  <Lightbulb className="mt-1 h-5 w-5 text-amber-500" />
                  <p className="text-sm text-slate-700 sm:text-base">{item.label}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className={cn(surfaceBase, "bg-gradient-to-br from-indigo-900/60 via-slate-950/80 to-slate-950/90")}>
            <CardHeader className="p-0">
              <CardTitle className="flex items-center gap-3 text-base text-white sm:text-lg">
                <Compass className="h-5 w-5 text-sky-300" />
                {translate("guide2025TableOfContents")}
              </CardTitle>
              <CardDescription className="mt-2 text-sm text-slate-200">
                {translate("guide2025HowToChooseContent5")}
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

      <section className="container mx-auto px-4 pb-12 sm:px-6 lg:px-12 lg:pb-16">
        <article
          id="ce-sunt-stem"
          className={cn(surfaceBase, "space-y-5 bg-gradient-to-br from-slate-900/80 via-indigo-900/70 to-slate-950/90")}
        >
          <Badge className="w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200">
            {translate("guide2025WhatAreStem")}
          </Badge>
          <h2 className="text-2xl font-semibold text-white sm:text-3xl">{translate("guide2025WhatAreStemH2")}</h2>
          <p className="text-sm text-slate-200 sm:text-base">{translate("guide2025WhatAreStemContent")}</p>
          <p className="text-sm text-slate-200 sm:text-base">{translate("guide2025WhatAreStemContent2")}</p>
        </article>
      </section>

      <section
        id="categorii"
        className="container mx-auto px-4 pb-12 sm:px-6 lg:px-12 lg:pb-16"
        aria-labelledby="categorii-title"
      >
        <div className={cn(surfaceBase, "bg-white/90")}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Badge className="mb-3 w-fit rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-700">
                {translate("guide2025Categories")}
              </Badge>
              <h2 id="categorii-title" className="text-2xl font-semibold text-slate-900 sm:text-3xl">
                {translate("guide2025CategoriesH2")}
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 sm:text-base">{translate("guide2025Description")}</p>
            </div>
            <Button
              asChild
              size="lg"
              className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400"
            >
              <Link href="/categories">{translate("exploreAllCategoriesLabel")}</Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <CategoryCard
              title={translate("guide2025ScienceCategory")}
              description={translate("guide2025ScienceContent")}
              href="/categories/science"
            />
            <CategoryCard
              title={translate("guide2025TechnologyCategory")}
              description={translate("guide2025TechnologyContent")}
              href="/categories/technology"
            />
            <CategoryCard
              title={translate("guide2025EngineeringCategory")}
              description={translate("guide2025EngineeringContent")}
              href="/categories/engineering"
            />
            <CategoryCard
              title={translate("guide2025MathematicsCategory")}
              description={translate("guide2025MathematicsContent")}
              href="/categories/mathematics"
            />
          </div>
        </div>
      </section>

      <section
        id="varsta"
        className="container mx-auto px-4 pb-12 sm:px-6 lg:px-12 lg:pb-16"
        aria-labelledby="varsta-title"
      >
        <div className={cn(surfaceBase, "space-y-6 bg-gradient-to-br from-slate-900/75 via-slate-950/80 to-indigo-950/75")}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Badge className="w-fit rounded-full border border-sky-400/40 bg-sky-500/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
                {translate("guide2025AgeRecommendations")}
              </Badge>
              <h2 id="varsta-title" className="mt-3 text-2xl font-semibold text-white sm:text-3xl">
                {translate("guide2025AgeRecommendationsH2")}
              </h2>
            </div>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="rounded-2xl border border-white/40 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10"
            >
              <Link href="/jucarii-stem-dupa-varsta">
                {translate("guide2025StemByAgeLink")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ul className="space-y-3">
            <ListItem>{translate("guide2025AgeRecommendationsContent")}</ListItem>
            <ListItem>{translate("guide2025AgeRecommendationsContent2")}</ListItem>
            <ListItem>{translate("guide2025AgeRecommendationsContent3")}</ListItem>
            <ListItem>{translate("guide2025AgeRecommendationsContent4")}</ListItem>
          </ul>
          <p className="text-sm text-slate-200 sm:text-base">{translate("guide2025PracticalSuggestion")}</p>
        </div>
      </section>

      <section
        id="alegere"
        className="container mx-auto px-4 pb-12 sm:px-6 lg:px-12 lg:pb-16"
        aria-labelledby="alegere-title"
      >
        <div className={cn(surfaceBase, "space-y-6 bg-white/90")}>
          <div className="flex items-center gap-3">
            <Target className="h-6 w-6 text-emerald-500" />
            <h2 id="alegere-title" className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              {translate("guide2025HowToChooseH2")}
            </h2>
          </div>
          <ol className="space-y-3 pl-4">
            <ListItem as="li">{translate("guide2025HowToChooseContent1")}</ListItem>
            <ListItem as="li">{translate("guide2025HowToChooseContent2")}</ListItem>
            <ListItem as="li">{translate("guide2025HowToChooseContent3")}</ListItem>
            <ListItem as="li">{translate("guide2025HowToChooseContent4")}</ListItem>
          </ol>
          <p className="text-sm text-slate-700 sm:text-base">{translate("guide2025HowToChooseContent5")}</p>
        </div>
      </section>

      <section
        id="top"
        className="container mx-auto px-4 pb-12 sm:px-6 lg:px-12 lg:pb-16"
        aria-labelledby="top-title"
      >
        <div className={cn(surfaceBase, "space-y-6 bg-gradient-to-br from-indigo-900/75 via-slate-950/80 to-slate-950/90")}>
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-sky-300" />
            <h2 id="top-title" className="text-2xl font-semibold text-white sm:text-3xl">
              {translate("guide2025TopRecommendationsH2")}
            </h2>
          </div>
          <p className="text-sm text-slate-200 sm:text-base">
            {translate("guide2025TopRecommendationsContent")}{" "}
            <Link href="/products" className="text-sky-300 underline underline-offset-4">
              /products
            </Link>
            .
          </p>
        </div>
      </section>

      <section
        id="faq"
        className="container mx-auto px-4 pb-16 sm:px-6 lg:px-12"
        aria-labelledby="faq-title"
      >
        <div className={cn(surfaceBase, "space-y-6 bg-slate-900/80")}>
          <div className="flex items-center gap-3">
            <BookIcon />
            <h2 id="faq-title" className="text-2xl font-semibold text-white sm:text-3xl">
              {translate("guide2025Faq")}
            </h2>
          </div>
          <p className="text-sm text-slate-200 sm:text-base">
            {translate("guide2025FaqContent")}{" "}
            <Link href="/faq" className="text-emerald-300 underline underline-offset-4">
              /faq
            </Link>
            .
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="rounded-2xl bg-white/90 px-7 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-white/20 transition hover:bg-white sm:text-base"
            >
              <Link href="/products">{translate("guide2025SeeProducts")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-2xl border border-white/40 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10 sm:text-base"
            >
              <Link href="/contact">{translate("contactUs")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function CategoryCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300/60 hover:shadow-md">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">{description}</p>
      </div>
      <Link href={href} className="mt-4 inline-flex items-center text-sm font-semibold text-emerald-700 underline underline-offset-4">
        {href}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </div>
  );
}

function ListItem({
  children,
  as: Component = "div",
}: {
  children: React.ReactNode;
  as?: "div" | "li";
}) {
  return (
    <Component
      className={cn(
        "flex items-start gap-3 text-left",
        Component === "li" ? "list-none" : undefined,
      )}
    >
      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-emerald-300 via-sky-300 to-indigo-300 shadow-md shadow-emerald-500/40" />
      <span className={listBulletClass}>{children}</span>
    </Component>
  );
}

function BookIcon() {
  return (
    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-sky-200 shadow-inner shadow-black/30">
      <Compass className="h-5 w-5" />
    </span>
  );
}
