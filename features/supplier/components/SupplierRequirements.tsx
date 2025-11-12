"use client";

import Link from "next/link";
import {
  ArrowRight,
  Award,
  Calendar,
  CheckCircle,
  Euro,
  Globe,
  Info,
  Languages,
  MapPin,
  Shield,
  Target,
  Truck,
  TrendingUp,
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
import { useTranslation } from "@/lib/i18n";

const iconAccent = "from-emerald-400/80 via-sky-400/80 to-indigo-500/80";

export function SupplierRequirements() {
  const { t, language, setLanguage } = useTranslation();

  const eligibilityCriteria = [
    {
      icon: Globe,
      title: t("establishedBusiness"),
      description: t("establishedBusinessDescription"),
      required: true,
      details: t("establishedBusinessDetails"),
    },
    {
      icon: MapPin,
      title: t("geographicLocation"),
      description: t("geographicLocationDescription"),
      required: true,
      details: t("geographicLocationDetails"),
    },
    {
      icon: Shield,
      title: t("legalCompliance"),
      description: t("legalComplianceDescription"),
      required: true,
      details: t("legalComplianceDetails"),
    },
    {
      icon: Award,
      title: t("qualityStandards"),
      description: t("qualityStandardsDescription"),
      required: true,
      details: t("qualityStandardsDetails"),
    },
    {
      icon: Truck,
      title: t("shippingCapabilities"),
      description: t("shippingCapabilitiesDescription"),
      required: true,
      details: t("shippingCapabilitiesDetails"),
    },
    {
      icon: TrendingUp,
      title: t("growthPotential"),
      description: t("growthPotentialDescription"),
      required: false,
      details: t("growthPotentialDetails"),
    },
    {
      icon: Target,
      title: t("innovationFocus"),
      description: t("innovationFocusDescription"),
      required: false,
      details: t("innovationFocusDetails"),
    },
  ];

  const requiredCriteria = eligibilityCriteria.filter(item => item.required);
  const innovationCriteria = eligibilityCriteria.filter(item => !item.required);

  const qualityStandards = [
    {
      category: t("safetyCompliance"),
      icon: Shield,
      requirements: [
        t("safetyComplianceDescription"),
        t("en71Standards"),
        t("rohsCompliance"),
        t("reachCompliance"),
        t("ageAppropriate"),
        t("nonToxicMaterials"),
        t("durabilityTesting"),
        t("regularAudits"),
      ],
    },
    {
      category: t("educationalValue"),
      icon: Target,
      requirements: [
        t("educationalValueDescription"),
        t("ageAppropriateComplexity"),
        t("stemOutcomes"),
        t("educationalDocumentation"),
        t("parentEducatorMaterials"),
        t("curriculumAlignment"),
        t("assessmentTools"),
        t("multilingualContent"),
      ],
    },
    {
      category: t("productQuality"),
      icon: Award,
      requirements: [
        t("productQualityDescription"),
        t("clearInstructions"),
        t("consistentQuality"),
        t("comprehensiveWarranty"),
        t("replacementParts"),
        t("productTesting"),
        t("sustainableMaterials"),
        t("professionalPackaging"),
      ],
    },
    {
      category: t("businessStandards"),
      icon: Globe,
      requirements: [
        t("businessStandardsDescription"),
        t("professionalCustomerService"),
        t("clearPolicies"),
        t("transparentPricing"),
        t("regularUpdates"),
        t("inventoryManagement"),
        t("multilingualSupport"),
        t("dataProtection"),
      ],
    },
  ];

  const shippingRequirements = [
    {
      region: t("europeanUnion"),
      maxDays: "3-5 " + t("days"),
      requirements: [
        t("directShipping"),
        t("realTimeTracking"),
        t("freeShipping"),
        t("multipleShippingOptions"),
        t("customsHandling"),
        t("insuranceCoverage"),
      ],
    },
    {
      region: t("nonEuEurope"),
      maxDays: "5-7 " + t("days"),
      requirements: [
        t("fastShipping"),
        t("customsClearance"),
        t("trackingConfirmation"),
        t("multipleShippingOptions"),
        t("damageProtection"),
        t("importDutyInfo"),
      ],
    },
    {
      region: t("international"),
      maxDays: "7 " + t("days") + " " + t("maxDays").toLowerCase(),
      requirements: [
        t("expressShipping"),
        t("customsDocumentation"),
        t("realTimeUpdates"),
        t("damageProtection"),
        t("clearTimeframes"),
        t("internationalSupport"),
      ],
    },
  ];

  const applicationProcess = [
    {
      step: "01",
      title: t("initialApplication"),
      description: t("initialApplicationDescription"),
      duration: "30-45 min",
      requirements: [
        t("businessRegistration"),
        t("taxCompliance"),
        t("productSamples"),
        t("qualityCertificates"),
      ],
    },
    {
      step: "02",
      title: t("documentationReview"),
      description: t("documentationReviewDescription"),
      duration: "3-5 " + t("days"),
      requirements: [
        t("legalVerification"),
        t("financialAssessment"),
        t("complianceCheck"),
        t("backgroundReview"),
      ],
    },
    {
      step: "03",
      title: t("productAssessment"),
      description: t("productAssessmentDescription"),
      duration: "5-7 " + t("days"),
      requirements: [
        t("safetyTesting"),
        t("qualityEvaluation"),
        t("educationalAssessment"),
        t("marketFitAnalysis"),
      ],
    },
    {
      step: "04",
      title: t("shippingLogistics"),
      description: t("shippingLogisticsDescription"),
      duration: "3-5 " + t("days"),
      requirements: [
        t("shippingCapacity"),
        t("deliveryTimes"),
        t("trackingSystems"),
        t("customerServiceAssessment"),
      ],
    },
    {
      step: "05",
      title: t("finalDecision"),
      description: t("finalDecisionDescription"),
      duration: "2-3 " + t("days"),
      requirements: [
        t("executiveReview"),
        t("riskAssessment"),
        t("partnershipTerms"),
        t("onboardingPlan"),
      ],
    },
    {
      step: "06",
      title: t("onboardingSetup"),
      description: t("onboardingSetupDescription"),
      duration: "1-2 " + t("weeks"),
      requirements: [
        t("accountCreation"),
        t("productUpload"),
        t("trainingSessions"),
        t("goLiveSupport"),
      ],
    },
  ];

  const commissionStructure = [
    {
      tier: t("standard"),
      rate: "15%",
      requirements: t("allApprovedSuppliers"),
      features: [
        t("standardProductListing"),
        t("basicAnalyticsDashboard"),
        t("emailSupport"),
        t("standardMarketingExposure"),
        t("monthlyPaymentProcessing"),
      ],
    },
    {
      tier: t("premium"),
      rate: "12%",
      requirements: "€15k+ " + t("monthlySales"),
      features: [
        t("featuredProductPlacement"),
        t("advancedAnalytics"),
        t("prioritySupport"),
        t("enhancedMarketingCampaigns"),
        t("dedicatedAccountManager"),
        t("exclusivePromotionalEvents"),
      ],
    },
    {
      tier: t("elite"),
      rate: "10%",
      requirements: "€50k+ " + t("monthlySales"),
      features: [
        t("premiumPlacement"),
        t("customMarketingCampaigns"),
        t("exclusivePartnershipEvents"),
        t("strategicBusinessConsulting"),
        t("coBrandedMarketingMaterials"),
        t("vipCustomerAccess"),
      ],
    },
  ];

  const complianceRequirements = [
    {
      category: t("euSafetyStandards"),
      requirements: [
        t("ceMarking"),
        t("en71ToySafety"),
        t("reachChemicalRegulations"),
        t("rohsHazardousSubstances"),
        t("gdprDataProtection"),
        t("packagingWasteDirective"),
      ],
    },
    {
      category: t("businessCompliance"),
      requirements: [
        t("vatRegistration"),
        t("corporateTaxObligations"),
        t("employmentLawCompliance"),
        t("environmentalRegulations"),
        t("intellectualPropertyRights"),
        t("antiMoneyLaundering"),
      ],
    },
    {
      category: t("qualityAssurance"),
      requirements: [
        t("iso9001QualityManagement"),
        t("regularProductTesting"),
        t("supplierQualityAudits"),
        t("customerFeedbackSystems"),
        t("continuousImprovement"),
        t("riskManagementProtocols"),
      ],
    },
  ];

  return (
    <>
      <div className="fixed right-4 top-24 z-20">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLanguage(language === "ro" ? "en" : "ro")}
          className="flex items-center gap-2 rounded-full border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur transition hover:bg-white/20 sm:text-sm"
        >
          <Languages className="h-4 w-4" />
          {language === "ro" ? "EN" : "RO"}
        </Button>
      </div>

      <section className="container mx-auto px-4 pb-20 pt-24 sm:px-6 lg:px-12 lg:pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/80 via-indigo-900/70 to-slate-950/90 p-6 shadow-2xl shadow-black/40 sm:p-10">
          <div className="absolute inset-y-0 right-0 hidden w-1/3 rounded-full bg-emerald-500/15 blur-3xl lg:block" />
          <div className="relative flex flex-col items-center text-center">
            <Badge className="mb-4 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200 sm:text-sm">
              {t("qualityStandards")} 2025
            </Badge>
            <h1 className="max-w-3xl text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              {t("supplierRequirements")}{" "}
              <span className="bg-gradient-to-r from-emerald-300 via-sky-300 to-indigo-300 bg-clip-text text-transparent">
                2025
              </span>
            </h1>
            <p className="mt-4 max-w-3xl text-sm text-slate-200 sm:text-base lg:text-lg">
              {t("supplierRequirements2025Description")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 px-7 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400 sm:text-base"
              >
                <Link href="/supplier/apply">
                  {t("startApplication")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-2xl border border-white/40 bg-white/5 px-7 py-3 text-sm font-semibold text-white transition hover:border-white/60 hover:bg-white/10 sm:text-base"
              >
                <Link href="/supplier/benefits">{t("viewBenefits")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20 sm:px-6 lg:px-12">
        <div className="text-center">
          <Badge className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 sm:text-sm">
            {t("keyRequirements2025")}
          </Badge>
          <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
            {t("keyRequirementsDescription")}
          </h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {requiredCriteria.map(criterion => (
            <Card key={criterion.title} className="rounded-3xl border border-white/10 bg-white/5 shadow-lg shadow-black/25">
              <CardHeader className="space-y-4">
                <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br ${iconAccent} text-white shadow-lg shadow-black/30`}>
                  <criterion.icon className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg text-white">{criterion.title}</CardTitle>
                <CardDescription className="text-sm text-slate-200">
                  {criterion.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-300">{criterion.details}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {innovationCriteria.length > 0 && (
          <div className="mt-12 rounded-3xl border border-dashed border-white/20 bg-white/5 p-6 shadow-inner shadow-black/20 sm:p-10">
            <h3 className="text-lg font-semibold text-white sm:text-xl">{t("innovationFocus")}</h3>
            <p className="mt-3 text-sm text-slate-200 sm:text-base">{t("innovationFocusDetails")}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {innovationCriteria.map(item => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="flex items-center gap-3 text-sky-200">
                    <item.icon className="h-5 w-5" />
                    <span className="text-sm font-semibold text-white">{item.title}</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-200">{item.description}</p>
                  <p className="mt-2 text-xs text-slate-300">{item.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="container mx-auto px-4 pb-20 sm:px-6 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/70 via-slate-950/80 to-slate-950/90 p-6 shadow-2xl shadow-black/30 sm:p-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Truck className="h-5 w-5 text-sky-300" />
                {t("shippingRequirements")}
              </CardTitle>
              <CardDescription className="text-sm text-slate-300">
                {t("shippingRequirementsDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {shippingRequirements.map(region => (
                <div key={region.region} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">{region.region}</p>
                    <Badge className="rounded-full border border-sky-400/40 bg-sky-500/15 text-xs text-sky-200">
                      {t("maxDays")} {region.maxDays}
                    </Badge>
                  </div>
                  <ul className="mt-3 space-y-2 text-xs text-slate-200">
                    {region.requirements.map(requirement => (
                      <li key={requirement} className="flex items-start gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-300" />
                        <span>{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/25 sm:p-10">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-white">
                <Shield className="h-5 w-5 text-emerald-300" />
                {t("qualityStandardsSection")}
              </CardTitle>
              <CardDescription className="text-sm text-slate-300">
                {t("qualityStandardsSectionDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {qualityStandards.map(standard => (
                <div key={standard.category} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center gap-3 text-white">
                    <standard.icon className="h-4 w-4 text-sky-200" />
                    <span className="text-sm font-semibold">{standard.category}</span>
                  </div>
                  <ul className="mt-3 grid gap-2 text-xs text-slate-200 sm:grid-cols-2">
                    {standard.requirements.map(req => (
                      <li key={req} className="flex items-start gap-2">
                        <Target className="mt-0.5 h-3 w-3 text-emerald-300" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20 sm:px-6 lg:px-12">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-lg shadow-black/20 sm:p-10">
          <div className="text-center">
            <Badge className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-slate-200 sm:text-sm">
              {t("applicationProcess")}
            </Badge>
            <h2 className="mt-4 text-2xl font-semibold text-white sm:text-3xl">
              {t("applicationProcessDescription")}
            </h2>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {applicationProcess.map(step => (
              <Card key={step.step} className="rounded-2xl border border-white/10 bg-white/5 shadow-inner shadow-black/20">
                <CardHeader className="flex items-center justify-between">
                  <Badge className="rounded-full border border-sky-400/40 bg-sky-500/15 text-xs text-sky-100">
                    {step.step}
                  </Badge>
                  <Badge className="rounded-full border border-white/20 bg-white/10 text-xs text-slate-200">
                    {step.duration}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="text-xs text-slate-300">{step.description}</p>
                  <ul className="space-y-2 text-xs text-slate-200">
                    {step.requirements.map(req => (
                      <li key={req} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-3 w-3 text-emerald-300" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20 sm:px-6 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {commissionStructure.map(tier => (
            <Card key={tier.tier} className="rounded-3xl border border-white/10 bg-white/5 shadow-xl shadow-black/25">
              <CardHeader className="text-center">
                <CardTitle className="text-xl text-white">{tier.tier}</CardTitle>
                <p className="mt-2 text-3xl font-semibold text-sky-200">{tier.rate}</p>
                <CardDescription className="text-xs text-slate-300">{tier.requirements}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-slate-200">
                  {tier.features.map(feature => (
                    <li key={feature} className="flex items-start gap-2">
                      <Zap className="mt-0.5 h-3 w-3 text-emerald-300" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-20 sm:px-6 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {complianceRequirements.map(block => (
            <Card key={block.category} className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/70 via-indigo-900/60 to-slate-950/80 p-6 shadow-2xl shadow-black/30">
              <CardHeader>
                <CardTitle className="text-lg text-white">{block.category}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-xs text-slate-200">
                  {block.requirements.map(req => (
                    <li key={req} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-3 w-3 text-emerald-300" />
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-24 sm:px-6 lg:px-12">
        <Card className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-500/15 via-indigo-600/20 to-slate-950/80 p-6 shadow-2xl shadow-black/30 sm:p-10">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-white">
              <Info className="h-5 w-5 text-amber-300" />
              {t("importantNotes2025")}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Calendar className="h-4 w-4 text-sky-200" />
              <h4 className="text-sm font-semibold text-white">{t("applicationTimeline")}</h4>
              <p className="text-xs text-slate-200">{t("applicationTimelineDescription")}</p>
            </div>
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Target className="h-4 w-4 text-emerald-200" />
              <h4 className="text-sm font-semibold text-white">{t("qualityAssurance")}</h4>
              <p className="text-xs text-slate-200">{t("qualityAssuranceDescription")}</p>
            </div>
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Euro className="h-4 w-4 text-emerald-200" />
              <h4 className="text-sm font-semibold text-white">{t("euCompliance")}</h4>
              <p className="text-xs text-slate-200">{t("euComplianceDescription")}</p>
            </div>
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-4">
              <Truck className="h-4 w-4 text-sky-200" />
              <h4 className="text-sm font-semibold text-white">{t("shippingStandards")}</h4>
              <p className="text-xs text-slate-200">{t("shippingStandardsDescription")}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="container mx-auto px-4 pb-24 sm:px-6 lg:px-12">
        <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 text-center shadow-2xl shadow-emerald-900/40 sm:p-12">
          <h2 className="text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
            {t("readyToJoinPremium")}
          </h2>
          <p className="mt-3 text-sm text-emerald-100 sm:text-base lg:text-lg">
            {t("readyToJoinDescription")}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 border-2 border-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base px-6 py-3 rounded-2xl"
            >
              <Link href="/supplier/apply">
                {t("startApplication")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-2xl border-white bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20 sm:text-base"
            >
              <Link href="/supplier/benefits">{t("viewBenefits")}</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="rounded-2xl border-white bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20 sm:text-base"
            >
              <Link href="/contact">{t("contactUs")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}

