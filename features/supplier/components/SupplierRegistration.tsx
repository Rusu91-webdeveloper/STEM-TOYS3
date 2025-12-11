"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Upload,
  Building2,
  MapPin,
  User,
  FileText,
  AlertCircle,
  PlugZap,
  Link2,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  supplierRegistrationSchema,
  type SupplierRegistrationFormData,
} from "@/features/supplier/lib/supplier-validation";
import { useCsrfForm } from "@/hooks/useCsrfToken";
import { cn } from "@/lib/utils";

const steps = [
  {
    id: 1,
    title: "Company Information",
    description: "Basic company details and contact information",
    icon: Building2,
  },
  {
    id: 2,
    title: "Business Address",
    description: "Legal business address and location details",
    icon: MapPin,
  },
  {
    id: 3,
    title: "Contact Person",
    description: "Primary contact person information",
    icon: User,
  },
  {
    id: 4,
    title: "Business Details",
    description: "Additional business information and categories",
    icon: FileText,
  },
  {
    id: 5,
    title: "Product Feed / API",
    description: "Tell us how you share products and stock",
    icon: PlugZap,
  },
  {
    id: 6,
    title: "Legal & Documents",
    description: "Terms acceptance and document upload",
    icon: FileText,
  },
];

const productCategories = [
  "Science Kits",
  "Engineering Toys",
  "Mathematics Games",
  "Technology Kits",
  "Robotics",
  "Coding & Programming",
  "Chemistry Sets",
  "Physics Toys",
  "Biology Kits",
  "Astronomy",
  "Geology",
  "Electronics",
  "Construction Sets",
  "Puzzle Games",
  "Educational Books",
  "Art & Creativity",
  "Music & Sound",
  "Environmental Science",
  "Space & Aviation",
  "Other",
];

const certifications = [
  "ISO 9001",
  "ISO 14001",
  "CE Marking",
  "RoHS Compliance",
  "REACH Compliance",
  "EN71 Safety Standard",
  "ASTM International",
  "Educational Certification",
  "Quality Management System",
  "Environmental Management",
  "Health & Safety Certification",
  "Other",
];

const inputClasses =
  "bg-slate-900/40 border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-sky-400 focus-visible:ring-offset-0";
const selectTriggerClasses =
  "bg-slate-900/40 border-white/10 text-white focus-visible:ring-sky-400 focus-visible:ring-offset-0";
const cardClasses =
  "border border-white/10 bg-white/5 shadow-lg shadow-black/25 backdrop-blur";
const fieldErrorClasses = "border-rose-400/60 focus-visible:ring-rose-400";
const labelClasses = "text-slate-200";

export function SupplierRegistration() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const { submitForm, loading: csrfLoading, error: csrfError } = useCsrfForm();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
    trigger,
  } = useForm<SupplierRegistrationFormData>({
    resolver: zodResolver(supplierRegistrationSchema),
    mode: "onChange",
    defaultValues: {
      companyName: "",
      description: "",
      website: "",
      phone: "",
      vatNumber: "",
      taxId: "",
      businessAddress: "",
      businessCity: "",
      businessState: "",
      businessCountry: "",
      businessPostalCode: "",
      contactPersonName: "",
      contactPersonEmail: "",
      contactPersonPhone: "",
      yearEstablished: undefined,
      employeeCount: undefined,
      annualRevenue: "",
      certifications: [],
      productCategories: [],
      integrationMethod: "NONE" as const,
      feedUrl: "",
      authType: "NONE",
      authKey: "",
      mappingNotes: "",
      syncPreference: "UNSURE",
      categoryFocus: "",
      termsAccepted: false,
      privacyAccepted: false,
    },
  });

  const watchedValues = watch();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Logo file must be less than 5MB");
        return;
      }
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        setError("Logo must be a JPEG, PNG, or WebP image");
        return;
      }
      setLogoFile(file);
      setError(null);
    }
  };

  const nextStep = async () => {
    const fieldsToValidate = getFieldsForStep(currentStep);
    const isStepValid = await trigger(fieldsToValidate);

    if (isStepValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const getFieldsForStep = (
    step: number
  ): (keyof SupplierRegistrationFormData)[] => {
    switch (step) {
      case 1:
        return ["companyName", "phone", "vatNumber", "taxId"];
      case 2:
        return [
          "businessAddress",
          "businessCity",
          "businessState",
          "businessCountry",
          "businessPostalCode",
        ];
      case 3:
        return [
          "contactPersonName",
          "contactPersonEmail",
          "contactPersonPhone",
        ];
      case 4:
        return ["productCategories"];
      case 5:
        return ["integrationMethod"];
      case 6:
        return ["termsAccepted", "privacyAccepted"];
      default:
        return [];
    }
  };

  const onSubmit = async (data: SupplierRegistrationFormData) => {
    // Prevent double submission
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare JSON data for API
      const jsonData = {
        ...data,
        // Ensure arrays are properly formatted
        certifications: data.certifications || [],
        productCategories: data.productCategories || [],
        // Ensure boolean values are properly set
        termsAccepted: data.termsAccepted || false,
        privacyAccepted: data.privacyAccepted || false,
      };

      const response = await submitForm(
        "/api/supplier/register-public",
        jsonData,
        { method: "POST" }
      );

      const result = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (response.status === 409) {
          if (result.error === "Company slug already exists") {
            setError(
              "A company with this name already exists. Please try a different company name."
            );
          } else if (result.error === "Contact email already registered") {
            setError(
              "This email address is already registered. Please use a different email or contact support."
            );
          } else {
            setError(result.error || "Registration failed. Please try again.");
          }
        } else {
          setError(result.error || "Registration failed. Please try again.");
        }
        return;
      }

      setSuccess(
        "Registration submitted successfully! We'll review your application and contact you within 2-3 business days."
      );

      // Redirect to success page or dashboard after a delay
      setTimeout(() => {
        router.push("/supplier/registration-success");
      }, 3000);
    } catch (error) {
      console.error("Registration error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="companyName" className={labelClasses}>
                  Company Name *
                </Label>
                <Input
                  id="companyName"
                  placeholder="Enter your company name"
                  {...register("companyName")}
                  className={cn(
                    inputClasses,
                    errors.companyName && fieldErrorClasses
                  )}
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.companyName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description" className={labelClasses}>
                  Company Description
                </Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your company and products"
                  {...register("description")}
                  rows={3}
                  className={cn(
                    inputClasses,
                    "min-h-[120px]",
                    errors.description && fieldErrorClasses
                  )}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="website" className={labelClasses}>
                  Website
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourcompany.com"
                  {...register("website")}
                  className={cn(
                    inputClasses,
                    errors.website && fieldErrorClasses
                  )}
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.website.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="phone" className={labelClasses}>
                  Phone Number *
                </Label>
                <Input
                  id="phone"
                  placeholder="07XXXXXXXX"
                  {...register("phone")}
                  className={cn(
                    inputClasses,
                    errors.phone && fieldErrorClasses
                  )}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vatNumber">VAT Number</Label>
                  <Input
                    id="vatNumber"
                    placeholder="RO12345678"
                    {...register("vatNumber")}
                  />
                  {errors.vatNumber && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.vatNumber.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="taxId">Tax ID</Label>
                  <Input
                    id="taxId"
                    placeholder="Tax identification number"
                    {...register("taxId")}
                  />
                  {errors.taxId && (
                    <p className="text-sm text-destructive mt-1">
                      {errors.taxId.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="businessAddress" className={labelClasses}>
                  Business Address *
                </Label>
                <Input
                  id="businessAddress"
                  placeholder="Street address, building number"
                  {...register("businessAddress")}
                  className={cn(
                    inputClasses,
                    errors.businessAddress && fieldErrorClasses
                  )}
                />
                {errors.businessAddress && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.businessAddress.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessCity" className={labelClasses}>
                    City *
                  </Label>
                  <Input
                    id="businessCity"
                    placeholder="City name"
                    {...register("businessCity")}
                    className={cn(
                      inputClasses,
                      errors.businessCity && fieldErrorClasses
                    )}
                  />
                  {errors.businessCity && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.businessCity.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="businessState" className={labelClasses}>
                    State/County *
                  </Label>
                  <Input
                    id="businessState"
                    placeholder="State or county"
                    {...register("businessState")}
                    className={cn(
                      inputClasses,
                      errors.businessState && fieldErrorClasses
                    )}
                  />
                  {errors.businessState && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.businessState.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessCountry" className={labelClasses}>
                    Country *
                  </Label>
                  <Input
                    id="businessCountry"
                    {...register("businessCountry")}
                    className={cn(
                      inputClasses,
                      errors.businessCountry && fieldErrorClasses
                    )}
                  />
                  {errors.businessCountry && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.businessCountry.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="businessPostalCode" className={labelClasses}>
                    Postal Code *
                  </Label>
                  <Input
                    id="businessPostalCode"
                    placeholder="123456"
                    {...register("businessPostalCode")}
                    className={cn(
                      inputClasses,
                      errors.businessPostalCode && fieldErrorClasses
                    )}
                  />
                  {errors.businessPostalCode && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.businessPostalCode.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="contactPersonName" className={labelClasses}>
                  Contact Person Name *
                </Label>
                <Input
                  id="contactPersonName"
                  placeholder="Full name of primary contact"
                  {...register("contactPersonName")}
                  className={cn(
                    inputClasses,
                    errors.contactPersonName && fieldErrorClasses
                  )}
                />
                {errors.contactPersonName && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.contactPersonName.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="contactPersonEmail" className={labelClasses}>
                  Contact Email *
                </Label>
                <Input
                  id="contactPersonEmail"
                  type="email"
                  placeholder="contact@yourcompany.com"
                  {...register("contactPersonEmail")}
                  className={cn(
                    inputClasses,
                    errors.contactPersonEmail && fieldErrorClasses
                  )}
                />
                {errors.contactPersonEmail && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.contactPersonEmail.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="contactPersonPhone" className={labelClasses}>
                  Contact Phone *
                </Label>
                <Input
                  id="contactPersonPhone"
                  placeholder="07XXXXXXXX"
                  {...register("contactPersonPhone")}
                  className={cn(
                    inputClasses,
                    errors.contactPersonPhone && fieldErrorClasses
                  )}
                />
                {errors.contactPersonPhone && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.contactPersonPhone.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="yearEstablished" className={labelClasses}>
                    Year Established
                  </Label>
                  <Input
                    id="yearEstablished"
                    type="number"
                    placeholder="2020"
                    {...register("yearEstablished", { valueAsNumber: true })}
                    className={cn(
                      inputClasses,
                      errors.yearEstablished && fieldErrorClasses
                    )}
                  />
                  {errors.yearEstablished && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.yearEstablished.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="employeeCount" className={labelClasses}>
                    Number of Employees
                  </Label>
                  <Input
                    id="employeeCount"
                    type="number"
                    placeholder="10"
                    {...register("employeeCount", { valueAsNumber: true })}
                    className={cn(
                      inputClasses,
                      errors.employeeCount && fieldErrorClasses
                    )}
                  />
                  {errors.employeeCount && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.employeeCount.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="annualRevenue" className={labelClasses}>
                    Annual Revenue
                  </Label>
                  <Input
                    id="annualRevenue"
                    placeholder="€100,000 - €500,000"
                    {...register("annualRevenue")}
                    className={cn(
                      inputClasses,
                      errors.annualRevenue && fieldErrorClasses
                    )}
                  />
                  {errors.annualRevenue && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.annualRevenue.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label className={labelClasses}>Product Categories *</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                  {productCategories.map(category => (
                    <div key={category} className="flex items-center space-x-2">
                      <Controller
                        name="productCategories"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id={category}
                            checked={field.value?.includes(category)}
                            onCheckedChange={checked => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, category]);
                              } else {
                                field.onChange(
                                  current.filter((c: string) => c !== category)
                                );
                              }
                            }}
                          />
                        )}
                      />
                      <Label
                        htmlFor={category}
                        className="text-sm text-slate-200"
                      >
                        {category}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.productCategories && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.productCategories.message}
                  </p>
                )}
              </div>

              <div>
                <Label className={labelClasses}>Certifications</Label>
                <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                  {certifications.map(cert => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Controller
                        name="certifications"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id={cert}
                            checked={field.value?.includes(cert)}
                            onCheckedChange={checked => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, cert]);
                              } else {
                                field.onChange(
                                  current.filter((c: string) => c !== cert)
                                );
                              }
                            }}
                          />
                        )}
                      />
                      <Label htmlFor={cert} className="text-sm text-slate-200">
                        {cert}
                      </Label>
                    </div>
                  ))}
                </div>
                {errors.certifications && (
                  <p className="text-sm text-destructive mt-1">
                    {errors.certifications.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        const integrationMethod = watchedValues.integrationMethod;
        const showFeedUrl =
          integrationMethod &&
          ["CSV", "XML", "API"].includes(integrationMethod);
        const showAuthFields =
          integrationMethod && integrationMethod !== "NONE";
        const showMappingNotes =
          integrationMethod && ["CSV", "XML"].includes(integrationMethod);

        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <PlugZap className="h-5 w-5 text-sky-400" />
                  <h3 className="text-lg font-semibold text-slate-200">
                    Product Integration
                  </h3>
                </div>
                <p className="text-sm text-slate-300">
                  Tell us how you currently share your product catalog.
                  Don&apos;t worry if you don&apos;t have this set up yet—we can
                  help you configure it after approval.
                </p>
              </div>

              <div>
                <Label className={labelClasses}>
                  How do you share your products? *
                </Label>
                <Select
                  value={watchedValues.integrationMethod}
                  onValueChange={value =>
                    setValue("integrationMethod", value as any)
                  }
                >
                  <SelectTrigger className={selectTriggerClasses}>
                    <SelectValue placeholder="Select your integration method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSV">CSV File / BaseLinker</SelectItem>
                    <SelectItem value="XML">XML Feed</SelectItem>
                    <SelectItem value="API">REST API</SelectItem>
                    <SelectItem value="APP">
                      E-commerce Platform (Shopify, WooCommerce, Wix, etc.)
                    </SelectItem>
                    <SelectItem value="NONE">
                      I don&apos;t have this yet
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="mt-1 space-y-1">
                  <p className="text-xs text-slate-300">
                    Choose the method you currently use. You can change this
                    later in your supplier dashboard.
                  </p>
                  <ul className="ml-4 list-disc space-y-0.5 text-xs text-slate-400">
                    <li>
                      <strong>CSV/BaseLinker:</strong> Excel export or
                      BaseLinker integration
                    </li>
                    <li>
                      <strong>XML:</strong> Standard XML product feed
                    </li>
                    <li>
                      <strong>API:</strong> JSON REST API endpoint
                    </li>
                    <li>
                      <strong>Platform App:</strong> Shopify, WooCommerce, Wix,
                      Magento, etc.
                    </li>
                    <li>
                      <strong>Don&apos;t have it yet:</strong> We&apos;ll help
                      you set it up after approval
                    </li>
                  </ul>
                </div>
                {errors.integrationMethod && (
                  <p className="mt-1 text-sm text-destructive">
                    {errors.integrationMethod.message}
                  </p>
                )}
              </div>

              {showFeedUrl && (
                <div>
                  <Label htmlFor="feedUrl" className={labelClasses}>
                    {integrationMethod === "CSV" && "CSV File URL"}
                    {integrationMethod === "XML" && "XML Feed URL"}
                    {integrationMethod === "API" && "API Endpoint URL"}
                    {!integrationMethod && "Feed/API URL"} (optional)
                  </Label>
                  <div className="relative">
                    <Link2 className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="feedUrl"
                      placeholder={
                        integrationMethod === "CSV"
                          ? "https://example.com/products.csv"
                          : integrationMethod === "XML"
                            ? "https://example.com/products.xml"
                            : "https://api.example.com/products"
                      }
                      {...register("feedUrl")}
                      className={cn(
                        "pl-10",
                        inputClasses,
                        errors.feedUrl && fieldErrorClasses
                      )}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-300">
                    {integrationMethod === "CSV" &&
                      "The direct URL to your CSV file. If using BaseLinker, provide your export URL."}
                    {integrationMethod === "XML" &&
                      "The URL where your XML product feed is hosted."}
                    {integrationMethod === "API" &&
                      "Your API endpoint that returns product data (JSON format)."}
                    {!integrationMethod &&
                      "Paste your feed or API link if you have it."}
                  </p>
                  {errors.feedUrl && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.feedUrl.message}
                    </p>
                  )}
                </div>
              )}

              {integrationMethod === "APP" && (
                <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                  <p className="text-sm text-blue-200">
                    <strong>Platform Integration:</strong> If you use Shopify,
                    WooCommerce, Wix, or similar platforms, we&apos;ll set up
                    the integration after your application is approved. You
                    don&apos;t need to provide technical details now—just let us
                    know which platform you use in the notes below.
                  </p>
                </div>
              )}

              {showAuthFields && integrationMethod !== "APP" && (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className={labelClasses}>
                        Authentication type (optional)
                      </Label>
                      <Select
                        value={watchedValues.authType || "NONE"}
                        onValueChange={value =>
                          setValue("authType", value as any)
                        }
                      >
                        <SelectTrigger className={selectTriggerClasses}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">
                            No authentication
                          </SelectItem>
                          <SelectItem value="API_KEY">
                            API Key (header)
                          </SelectItem>
                          <SelectItem value="BEARER">Bearer Token</SelectItem>
                          <SelectItem value="BASIC">
                            Basic Auth (username + password)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-xs text-slate-300">
                        How your feed/API is protected. Leave as &quot;No
                        authentication&quot; if it&apos;s public.
                      </p>
                      {errors.authType && (
                        <p className="mt-1 text-sm text-destructive">
                          {errors.authType.message}
                        </p>
                      )}
                    </div>

                    {watchedValues.authType &&
                      watchedValues.authType !== "NONE" &&
                      watchedValues.authType !== "BASIC" && (
                        <div>
                          <Label htmlFor="authKey" className={labelClasses}>
                            {watchedValues.authType === "API_KEY" && "API Key"}
                            {watchedValues.authType === "BEARER" &&
                              "Bearer Token"}
                            {!watchedValues.authType && "Key / Token"}{" "}
                            (optional)
                          </Label>
                          <div className="relative">
                            <KeyRound className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input
                              id="authKey"
                              type="password"
                              placeholder={
                                watchedValues.authType === "API_KEY"
                                  ? "Your API key"
                                  : "Your bearer token"
                              }
                              {...register("authKey")}
                              className={cn(
                                "pl-10",
                                inputClasses,
                                errors.authKey && fieldErrorClasses
                              )}
                            />
                          </div>
                          <p className="mt-1 text-xs text-slate-300">
                            Your credentials are encrypted and stored securely.
                            You can rotate them anytime.
                          </p>
                          {errors.authKey && (
                            <p className="mt-1 text-sm text-destructive">
                              {errors.authKey.message}
                            </p>
                          )}
                        </div>
                      )}
                  </div>

                  {watchedValues.authType === "BASIC" && (
                    <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-4">
                      <p className="text-sm text-blue-200">
                        <strong>Basic Authentication:</strong> For security
                        reasons, we&apos;ll contact you separately after your
                        application is approved to securely collect your
                        username and password credentials. You don&apos;t need
                        to provide them now.
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className={labelClasses}>
                    How often should we sync? (optional)
                  </Label>
                  <Select
                    value={watchedValues.syncPreference || "UNSURE"}
                    onValueChange={value =>
                      setValue("syncPreference", value as any)
                    }
                  >
                    <SelectTrigger className={selectTriggerClasses}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HOURLY">
                        Hourly (real-time inventory)
                      </SelectItem>
                      <SelectItem value="DAILY">Daily (recommended)</SelectItem>
                      <SelectItem value="WEEKLY">Weekly</SelectItem>
                      <SelectItem value="MONTHLY">Monthly</SelectItem>
                      <SelectItem value="UNSURE">Not sure / depends</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-1 text-xs text-slate-300">
                    How frequently should we update your products? Daily is
                    recommended for most suppliers.
                  </p>
                </div>

                <div>
                  <Label htmlFor="categoryFocus" className={labelClasses}>
                    Main product categories (optional)
                  </Label>
                  <Input
                    id="categoryFocus"
                    placeholder="e.g. Robotics, Coding kits, Electronics"
                    {...register("categoryFocus")}
                    className={cn(
                      inputClasses,
                      errors.categoryFocus && fieldErrorClasses
                    )}
                  />
                  <p className="mt-1 text-xs text-slate-300">
                    Your primary product categories to help us understand your
                    catalog.
                  </p>
                  {errors.categoryFocus && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.categoryFocus.message}
                    </p>
                  )}
                </div>
              </div>

              {showMappingNotes && (
                <div>
                  <Label htmlFor="mappingNotes" className={labelClasses}>
                    CSV/XML Column Names (optional)
                  </Label>
                  <Textarea
                    id="mappingNotes"
                    placeholder="List your column/field names, e.g.: SKU, Title, Price, Stock, Images, Description, Category..."
                    {...register("mappingNotes")}
                    className={cn(
                      inputClasses,
                      errors.mappingNotes && fieldErrorClasses
                    )}
                    rows={3}
                  />
                  <p className="mt-1 text-xs text-slate-300">
                    Help us understand your file structure. List the column
                    names from your CSV/XML so we can map them correctly.
                  </p>
                  {errors.mappingNotes && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.mappingNotes.message}
                    </p>
                  )}
                </div>
              )}

              {integrationMethod === "APP" && (
                <div>
                  <Label htmlFor="mappingNotes" className={labelClasses}>
                    Platform Details (optional)
                  </Label>
                  <Textarea
                    id="mappingNotes"
                    placeholder="Which platform do you use? (Shopify, WooCommerce, Wix, Magento, etc.) Any specific integration requirements?"
                    {...register("mappingNotes")}
                    className={cn(
                      inputClasses,
                      errors.mappingNotes && fieldErrorClasses
                    )}
                    rows={3}
                  />
                  <p className="mt-1 text-xs text-slate-300">
                    Tell us about your e-commerce platform and any special
                    requirements.
                  </p>
                  {errors.mappingNotes && (
                    <p className="mt-1 text-sm text-destructive">
                      {errors.mappingNotes.message}
                    </p>
                  )}
                </div>
              )}

              {integrationMethod === "NONE" && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
                  <p className="text-sm text-amber-200">
                    <strong>No problem!</strong> Many suppliers start without
                    automated integration. After your application is approved,
                    our team will help you set up the best integration method
                    for your needs. You can also manually upload products
                    through your supplier dashboard.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="logo-upload" className={labelClasses}>
                  Company Logo
                </Label>
                <div className="mt-3 rounded-lg border-2 border-dashed border-white/15 bg-white/5 p-6 text-center">
                  <Upload className="mx-auto mb-3 h-10 w-10 text-slate-200" />
                  <label
                    htmlFor="logo-upload"
                    className="inline-flex cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-sky-200 transition hover:bg-white/20"
                  >
                    Upload or drag & drop
                  </label>
                  <input
                    id="logo-upload"
                    name="logo-upload"
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  <p className="mt-2 text-xs text-slate-300">
                    PNG, JPG, WebP up to 5MB
                  </p>
                  {logoFile && (
                    <p className="mt-3 text-sm text-emerald-200">
                      ✓ {logoFile.name} selected
                    </p>
                  )}
                  {error && (
                    <p className="mt-2 text-sm text-destructive">{error}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Controller
                    name="termsAccepted"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="termsAccepted"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <div>
                    <Label
                      htmlFor="termsAccepted"
                      className="text-sm font-medium text-slate-200"
                    >
                      I accept the{" "}
                      <a href="/terms" className="text-sky-300 hover:underline">
                        Terms and Conditions
                      </a>{" "}
                      *
                    </Label>
                    <p className="mt-1 text-xs text-slate-300">
                      Confirm that you agree to the TechTots Supplier Terms and
                      Conditions.
                    </p>
                  </div>
                </div>
                {errors.termsAccepted && (
                  <p className="text-sm text-destructive">
                    {errors.termsAccepted.message}
                  </p>
                )}

                <div className="flex items-start space-x-3">
                  <Controller
                    name="privacyAccepted"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="privacyAccepted"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    )}
                  />
                  <div>
                    <Label
                      htmlFor="privacyAccepted"
                      className="text-sm font-medium text-slate-200"
                    >
                      I accept the{" "}
                      <a
                        href="/privacy"
                        className="text-sky-300 hover:underline"
                      >
                        Privacy Policy
                      </a>{" "}
                      *
                    </Label>
                    <p className="mt-1 text-xs text-slate-300">
                      Confirm that you consent to our data processing practices.
                    </p>
                  </div>
                </div>
                {errors.privacyAccepted && (
                  <p className="text-sm text-destructive">
                    {errors.privacyAccepted.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="container mx-auto px-4 pb-20 pt-24 sm:px-6 lg:px-12 lg:pb-24">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <Badge className="mx-auto mb-4 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
            Supplier Registration
          </Badge>
          <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Submit your supplier application
          </h1>
          <p className="mt-3 text-sm text-slate-200 sm:text-base">
            Share your business details so we can verify eligibility and tailor
            your onboarding plan.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-black/30">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;
              const Icon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border transition",
                      isComplete &&
                        "border-emerald-400/60 bg-emerald-500/20 text-emerald-100",
                      isActive &&
                        !isComplete &&
                        "border-sky-400/60 bg-sky-500/20 text-sky-100",
                      !isComplete &&
                        !isActive &&
                        "border-white/20 bg-white/5 text-slate-400"
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "mx-2 h-1 w-16 rounded-full transition sm:w-20",
                        isComplete ? "bg-emerald-400/60" : "bg-white/10"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-5">
            {steps.map(step => {
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;

              return (
                <div key={step.id} className="text-center">
                  <p
                    className={cn(
                      "text-sm font-semibold",
                      isActive && "text-sky-200",
                      isComplete && "text-emerald-200",
                      !isActive && !isComplete && "text-slate-300"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <Card className={cn(cardClasses, "border-white/10")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              {(() => {
                const StepIcon = steps[currentStep - 1].icon;
                return <StepIcon className="w-5 h-5" />;
              })()}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-slate-200">
              {steps[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-slate-200">
            <form
              onSubmit={handleSubmit(onSubmit as any)}
              className="space-y-6"
            >
              {error && (
                <Alert
                  variant="destructive"
                  className="border border-rose-500/40 bg-rose-500/10 text-rose-100 backdrop-blur"
                >
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border border-emerald-500/40 bg-emerald-500/10 text-emerald-100 backdrop-blur">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              {renderStepContent()}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  className="flex items-center gap-2 rounded-full border-white/20 bg-white/10 text-slate-200 transition hover:bg-white/20 disabled:opacity-50"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>

                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-indigo-500 px-6 text-white shadow-lg shadow-emerald-500/25 transition hover:from-sky-400 hover:via-emerald-400 hover:to-indigo-400"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isValid}
                    className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 px-6 text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400 disabled:opacity-60"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Application"}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Progress Info */}
        <div className="mt-6 text-center text-sm text-slate-300">
          Step {currentStep} of {steps.length} •{" "}
          {Math.round((currentStep / steps.length) * 100)}% Complete
        </div>
      </div>
    </section>
  );
}
