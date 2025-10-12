"use client";

import Link from "next/link";
import {
  CheckCircle,
  AlertTriangle,
  Shield,
  Award,
  Globe,
  Clock,
  FileText,
  Users,
  TrendingUp,
  Star,
  ArrowRight,
  Building2,
  Truck,
  Zap,
  Euro,
  MapPin,
  Target,
  BarChart3,
  Heart,
  Eye,
  Package,
  CreditCard,
  Phone,
  Mail,
  Calendar,
  CheckSquare,
  XCircle,
  Info,
  Languages,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/lib/i18n";

export function SupplierRequirements() {
  const { t, language, setLanguage } = useTranslation();

  const eligibilityCriteria = [
    {
      icon: Building2,
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
      icon: Users,
      title: t("customerService"),
      description: t("customerServiceDescription"),
      required: true,
      details: t("customerServiceDetails"),
    },
    {
      icon: TrendingUp,
      title: t("growthPotential"),
      description: t("growthPotentialDescription"),
      required: false,
      details: t("growthPotentialDetails"),
    },
    {
      icon: Star,
      title: t("innovationFocus"),
      description: t("innovationFocusDescription"),
      required: false,
      details: t("innovationFocusDetails"),
    },
  ];

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
      icon: Building2,
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
      duration: "30-45 minutes",
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
      duration: "3-5 business days",
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
      duration: "5-7 business days",
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
      duration: "3-5 business days",
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
      duration: "2-3 business days",
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
      duration: "1-2 weeks",
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
      color: "bg-gray-100",
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
      color: "bg-blue-50",
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
      color: "bg-purple-50",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Floating Language Toggle - Compact on Mobile */}
      <div className="fixed top-20 sm:top-24 right-2 sm:right-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLanguage(language === "ro" ? "en" : "ro")}
          className="flex items-center gap-1 sm:gap-2 border-2 bg-white/90 backdrop-blur-sm hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl px-2 py-1 sm:px-3 sm:py-2 text-xs sm:text-sm"
        >
          <Languages className="w-3 h-3 sm:w-4 sm:h-4" />
          {language === "ro" ? "🇬🇧 EN" : "🇷🇴 RO"}
        </Button>
      </div>
      {/* Hero Section - Compact on Mobile */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
        <div className="relative container mx-auto px-3 sm:px-4 py-8 sm:py-12 md:py-16 lg:py-24 xl:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
              <Badge variant="secondary" className="text-[10px] sm:text-xs px-2 py-1">
                <Shield className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                {t("qualityStandards")} 2025
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === "ro" ? "en" : "ro")}
                className="hidden sm:flex items-center gap-2 border-2 hover:bg-blue-50 transition-colors text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-2"
              >
                <Languages className="w-3 h-3 sm:w-4 sm:h-4" />
                {language === "ro" ? "🇬🇧 English" : "🇷🇴 Română"}
              </Button>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-3 sm:mb-4 md:mb-6">
              {t("supplierRequirements")}{" "}
              <span className="text-blue-600">2025</span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-600 mb-4 sm:mb-6 md:mb-8 max-w-3xl mx-auto leading-snug sm:leading-normal">
              {t("supplierRequirements2025Description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center">
              <Button size="lg" asChild className="text-sm sm:text-base py-2 sm:py-2.5 md:py-3 px-4 sm:px-6">
                <Link href="/supplier/apply">
                  {t("startApplication")}
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-sm sm:text-base py-2 sm:py-2.5 md:py-3 px-4 sm:px-6">
                <Link href="/supplier/benefits">{t("viewBenefits")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Key Requirements Summary - Compact on Mobile */}
      <section className="py-6 sm:py-10 md:py-16 bg-white">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-8 md:mb-12">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
              {t("keyRequirements2025")}
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 max-w-3xl mx-auto">
              {t("keyRequirementsDescription")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                  <MapPin className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                  {t("euBased")}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {t("euBasedDescription")}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                  <Truck className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-green-600" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                  {t("sevenDayShipping")}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {t("sevenDayShippingDescription")}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                  <Award className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-purple-600" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                  {t("premiumQuality")}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {t("premiumQualityDescription")}
                </p>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg text-center">
              <CardContent className="p-3 sm:p-4 md:p-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                  <Shield className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-orange-600" />
                </div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 mb-1 sm:mb-2">
                  {t("fullCompliance")}
                </h3>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {t("fullComplianceDescription")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Eligibility Criteria - Compact on Mobile */}
      <section className="py-8 sm:py-12 md:py-16 lg:py-20 bg-gray-50">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-10 md:mb-16">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 md:mb-4">
              {t("eligibilityCriteria")}
            </h2>
            <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-600 max-w-3xl mx-auto">
              {t("eligibilityCriteriaDescription")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-5 md:gap-8">
            {eligibilityCriteria.map((criterion, index) => (
              <Card
                key={index}
                className="border-0 shadow-lg hover:shadow-xl transition-shadow"
              >
                <CardHeader className="text-center p-3 sm:p-4 md:p-6">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-3 md:mb-4">
                    <criterion.icon className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-blue-600" />
                  </div>
                  <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl flex items-center justify-center gap-1 sm:gap-2">
                    {criterion.title}
                    {criterion.required && (
                      <Badge variant="destructive" className="text-[10px] sm:text-xs px-1 py-0.5 sm:px-2">
                        {t("required")}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  <CardDescription className="text-xs sm:text-sm md:text-base text-gray-600 mb-2 sm:mb-3">
                    {criterion.description}
                  </CardDescription>
                  <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 p-2 sm:p-3 rounded-lg">
                    <strong>{t("details")}:</strong> {criterion.details}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Shipping Requirements */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {t("shippingRequirements")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("shippingRequirementsDescription")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {shippingRequirements.map((region, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Truck className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl">{region.region}</CardTitle>
                  <Badge variant="secondary" className="w-fit mx-auto">
                    <Clock className="w-3 h-3 mr-1" />
                    {t("maxDays")} {region.maxDays}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {region.requirements.map((requirement, reqIndex) => (
                      <li
                        key={reqIndex}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quality Standards */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {t("qualityStandardsSection")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("qualityStandardsSectionDescription")}
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {qualityStandards.map((standard, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <standard.icon className="w-5 h-5 text-blue-600" />
                    {standard.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {standard.requirements.map((requirement, reqIndex) => (
                      <li key={reqIndex} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Requirements */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {t("complianceRequirements")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("complianceRequirementsDescription")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {complianceRequirements.map((compliance, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    {compliance.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {compliance.requirements.map((requirement, reqIndex) => (
                      <li
                        key={reqIndex}
                        className="flex items-start gap-2 text-sm"
                      >
                        <CheckSquare className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{requirement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Application Process */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {t("applicationProcess")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("applicationProcessDescription")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {applicationProcess.map((step, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-xl">
                      {step.step}
                    </span>
                  </div>
                  <CardTitle className="text-xl">{step.title}</CardTitle>
                  <Badge variant="secondary" className="w-fit mx-auto">
                    <Clock className="w-3 h-3 mr-1" />
                    {step.duration}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">{step.description}</p>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">
                      {t("requirements")}
                    </h4>
                    <ul className="space-y-1">
                      {step.requirements.map((req, reqIndex) => (
                        <li
                          key={reqIndex}
                          className="flex items-center gap-2 text-sm text-blue-800"
                        >
                          <CheckCircle className="w-3 h-3" />
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Commission Structure */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              {t("commissionStructure")}
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t("commissionStructureDescription")}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {commissionStructure.map((tier, index) => (
              <Card
                key={index}
                className={`border-0 shadow-lg ${tier.color} ${index === 1 ? "ring-2 ring-blue-500" : ""}`}
              >
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{tier.tier}</CardTitle>
                  <div className="text-4xl font-bold text-blue-600">
                    {tier.rate}
                  </div>
                  <CardDescription className="text-sm">
                    {tier.requirements}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {tier.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Important Notes */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                  {t("importantNotes2025")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {t("applicationTimeline")}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {t("applicationTimelineDescription")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      {t("qualityAssurance")}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {t("qualityAssuranceDescription")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Euro className="w-4 h-4" />
                      {t("euCompliance")}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {t("euComplianceDescription")}
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      {t("shippingStandards")}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {t("shippingStandardsDescription")}
                    </p>
                  </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <h4 className="font-semibold text-orange-900 mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {t("newFor2025")}
                  </h4>
                  <p className="text-orange-800 text-sm">
                    {t("newFor2025Description")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - Compact on Mobile with Visible Buttons */}
      <section className="py-6 sm:py-10 md:py-16 lg:py-20 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

        <div className="container mx-auto px-3 sm:px-4 text-center relative z-10">
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl xl:text-4xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
            {t("readyToJoinPremium")}
          </h2>
          <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-emerald-100 mb-4 sm:mb-6 md:mb-8 max-w-2xl mx-auto">
            {t("readyToJoinDescription")}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 justify-center">
            <Button
              size="lg"
              className="bg-white text-emerald-700 hover:bg-emerald-50 border-2 border-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base py-2 sm:py-2.5 md:py-3 px-4 sm:px-6"
              asChild
            >
              <Link href="/supplier/apply">
                {t("startApplication")}
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1.5 sm:ml-2" />
              </Link>
            </Button>
            <Button
              size="lg"
              className="bg-white/90 backdrop-blur-sm text-emerald-700 border-2 border-white hover:bg-white hover:text-emerald-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base py-2 sm:py-2.5 md:py-3 px-4 sm:px-6"
              asChild
            >
              <Link href="/supplier/benefits">{t("viewBenefits")}</Link>
            </Button>
            <Button
              size="lg"
              className="bg-white/90 backdrop-blur-sm text-emerald-700 border-2 border-white hover:bg-white hover:text-emerald-800 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base py-2 sm:py-2.5 md:py-3 px-4 sm:px-6"
              asChild
            >
              <Link href="/contact">{t("contactUs")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
