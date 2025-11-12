"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  ArrowRight, 
  Building2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  FileText, 
  Upload, 
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ApplicationData {
  // Company Information
  companyName: string;
  companySlug: string;
  description: string;
  website: string;
  phone: string;
  vatNumber: string;
  taxId: string;
  
  // Business Address
  businessAddress: string;
  businessCity: string;
  businessState: string;
  businessCountry: string;
  businessPostalCode: string;
  
  // Contact Person
  contactPersonName: string;
  contactPersonEmail: string;
  contactPersonPhone: string;
  
  // Business Details
  yearEstablished: string;
  employeeCount: string;
  annualRevenue: string;
  certifications: string[];
  productCategories: string[];
  
  // Legal
  termsAccepted: boolean;
  privacyAccepted: boolean;
  
  // Files
  logo?: File;
  catalogUrl: string;
}

type FieldName = keyof ApplicationData;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const yearPattern = /^\d{4}$/;

const fieldValidators: Partial<Record<FieldName, (value: ApplicationData[FieldName]) => boolean>> = {
  companyName: (value) => isNonEmptyString(value),
  phone: (value) => isNonEmptyString(value),
  description: (value) => isNonEmptyString(value),
  businessAddress: (value) => isNonEmptyString(value),
  businessCity: (value) => isNonEmptyString(value),
  businessState: (value) => isNonEmptyString(value),
  businessPostalCode: (value) => isNonEmptyString(value),
  contactPersonName: (value) => isNonEmptyString(value),
  contactPersonEmail: (value) => typeof value === "string" && emailPattern.test(value.trim()),
  contactPersonPhone: (value) => isNonEmptyString(value),
  yearEstablished: (value) => typeof value === "string" && yearPattern.test(value.trim()),
  employeeCount: (value) => isNonEmptyString(value),
  annualRevenue: (value) => isNonEmptyString(value),
  productCategories: (value) => Array.isArray(value) && value.length > 0,
  termsAccepted: (value) => value === true,
  privacyAccepted: (value) => value === true,
};

const requiredFieldsByStep: Record<number, FieldName[]> = {
  1: ["companyName", "phone", "description"],
  2: [
    "businessAddress",
    "businessCity",
    "businessState",
    "businessPostalCode",
    "contactPersonName",
    "contactPersonEmail",
    "contactPersonPhone",
  ],
  3: ["yearEstablished", "employeeCount", "annualRevenue"],
  4: ["productCategories"],
  5: ["termsAccepted", "privacyAccepted"],
};

const productCategories = [
  "Science Kits",
  "Technology & Coding",
  "Engineering & Construction",
  "Mathematics",
  "Robotics",
  "Chemistry",
  "Physics",
  "Biology",
  "Astronomy",
  "Geology",
  "Environmental Science",
  "Computer Science",
  "Electronics",
  "Mechanics",
  "Other"
];

const certifications = [
  "CE Marking",
  "ISO 9001",
  "ISO 14001",
  "OHSAS 18001",
  "RoHS Compliance",
  "REACH Compliance",
  "EN 71 Safety Standard",
  "ASTM F963",
  "Educational Certification",
  "STEM Certification",
  "Other"
];

const steps = [
  { id: 1, title: "Company Information", description: "Basic company details" },
  { id: 2, title: "Contact Details", description: "Business address and contact person" },
  { id: 3, title: "Business Profile", description: "Company size and revenue" },
  { id: 4, title: "Products & Certifications", description: "What you sell and your standards" },
  { id: 5, title: "Documents & Terms", description: "Upload documents and accept terms" }
];

const inputClasses =
  "bg-slate-900/40 border-white/10 text-white placeholder:text-slate-400 focus-visible:ring-sky-400 focus-visible:ring-offset-0";
const selectTriggerClasses =
  "bg-slate-900/40 border-white/10 text-white focus-visible:ring-sky-400 focus-visible:ring-offset-0";
const cardClasses = "border border-white/10 bg-white/5 shadow-lg shadow-black/25 backdrop-blur";
const fieldErrorClasses = "border-rose-400/60 focus-visible:ring-rose-400";
const labelClasses = "text-slate-200";

export function SupplierApplicationForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldName, boolean>>>({});
  
  const [formData, setFormData] = useState<ApplicationData>({
    companyName: "",
    companySlug: "",
    description: "",
    website: "",
    phone: "",
    vatNumber: "",
    taxId: "",
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessCountry: "Romania",
    businessPostalCode: "",
    contactPersonName: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    yearEstablished: "",
    employeeCount: "",
    annualRevenue: "",
    certifications: [],
    productCategories: [],
    termsAccepted: false,
    privacyAccepted: false,
    catalogUrl: ""
  });

  const updateFormData = <K extends FieldName>(field: K, value: ApplicationData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: false }));
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>, field: "logo") => {
    const file = event.target.files?.[0];
    if (file) {
      updateFormData(field, file);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => {
      const exists = prev.productCategories.includes(category);
      const nextCategories = exists
        ? prev.productCategories.filter(c => c !== category)
        : [...prev.productCategories, category];

      setFieldErrors(errors => ({
        ...errors,
        productCategories: nextCategories.length === 0,
      }));

      return {
        ...prev,
        productCategories: nextCategories,
      };
    });
  };

  const handleCertificationToggle = (certification: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(certification)
        ? prev.certifications.filter(c => c !== certification)
        : [...prev.certifications, certification]
    }));
  };

  const validateStep = (step: number, shouldSetErrors = false): boolean => {
    const fields = requiredFieldsByStep[step] ?? [];
    if (!fields.length) {
      return true;
    }

    let isValid = true;
    const updates: Partial<Record<FieldName, boolean>> = {};

    fields.forEach(field => {
      const validator = fieldValidators[field];
      const value = formData[field];
      const fieldIsValid = validator ? validator(value) : Boolean(value);
      updates[field] = !fieldIsValid;

      if (!fieldIsValid) {
        isValid = false;
      }
    });

    if (shouldSetErrors) {
      setFieldErrors(prev => ({ ...prev, ...updates }));
    }

    return isValid;
  };

  const nextStep = () => {
    if (validateStep(currentStep, true)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
      setError(null);
    } else {
      setError("Please fill in all required fields before proceeding.");
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep, true)) {
      setError("Please complete all required fields.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      
      // Append all form data
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'logo' && value instanceof File) {
          formDataToSend.append(key, value);
        } else if (Array.isArray(value)) {
          formDataToSend.append(key, JSON.stringify(value));
        } else {
          formDataToSend.append(key, String(value));
        }
      });

      const response = await fetch("/api/supplier/register-public", {
        method: "POST",
        body: formDataToSend,
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/supplier/registration-success");
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to submit application. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const progress = (currentStep / steps.length) * 100;

  if (success) {
    return (
      <section className="container mx-auto flex min-h-[60vh] items-center justify-center px-4 pb-20 pt-24 sm:px-6 lg:px-12">
        <Card className={cn(cardClasses, "w-full max-w-lg text-center")}>
          <CardContent className="space-y-6 p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-200">
              <CheckCircle className="h-10 w-10" />
            </div>
            <div className="space-y-3">
              <h2 className="text-3xl font-semibold text-white">Application submitted!</h2>
              <p className="text-sm text-slate-200">
                Thank you for your application. Our partnerships team will review your submission and respond within 5-7 business days.
              </p>
            </div>
            <div className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
              <Loader2 className="mr-2 h-4 w-4 animate-spin text-sky-300" />
              Redirecting to onboarding timeline...
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 pb-20 pt-24 sm:px-6 lg:px-12 lg:pb-24">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-10 text-center">
          <Badge className="mx-auto mb-4 w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-200">
            Supplier Application
          </Badge>
          <h1 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Become a TechTots Supplier
          </h1>
          <p className="mt-3 text-sm text-slate-200 sm:text-base">
            Complete the application below to join our network of trusted STEM toy suppliers.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-10 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-inner shadow-black/30">
          <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isComplete = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition",
                      isComplete && "border-emerald-400/60 bg-emerald-500/20 text-emerald-100",
                      isActive && !isComplete && "border-sky-400/60 bg-sky-500/20 text-sky-100",
                      !isComplete && !isActive && "border-white/20 bg-white/5 text-slate-400"
                    )}
                  >
                    {step.id}
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
          <div className="mt-6">
            <Progress value={progress} className="h-2 bg-white/10" />
            <p className="mt-3 text-center text-sm text-slate-200">
              Step {currentStep} of {steps.length}: <span className="font-medium text-white">{steps[currentStep - 1].title}</span>
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert
            variant="destructive"
            className="mb-6 border border-rose-500/40 bg-rose-500/10 text-rose-100 backdrop-blur"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Steps */}
        <Card className={cn(cardClasses, "border-white/10")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Building2 className="w-5 h-5" />
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription className="text-slate-200">
              {steps[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-slate-200">
            {/* Step 1: Company Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName" className={labelClasses}>Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => updateFormData("companyName", e.target.value)}
                      placeholder="Enter your company name"
                      className={cn(inputClasses, fieldErrors.companyName && fieldErrorClasses)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className={labelClasses}>Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="+40 XXX XXX XXX"
                      className={cn(inputClasses, fieldErrors.phone && fieldErrorClasses)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="website" className={labelClasses}>Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => updateFormData("website", e.target.value)}
                    placeholder="https://yourcompany.com"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <Label htmlFor="description" className={labelClasses}>Company Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Tell us about your company and what you do..."
                    rows={4}
                    className={cn(inputClasses, "min-h-[120px]", fieldErrors.description && fieldErrorClasses)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vatNumber" className={labelClasses}>VAT Number</Label>
                    <Input
                      id="vatNumber"
                      value={formData.vatNumber}
                      onChange={(e) => updateFormData("vatNumber", e.target.value)}
                      placeholder="RO12345678"
                      className={inputClasses}
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId" className={labelClasses}>Tax ID</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => updateFormData("taxId", e.target.value)}
                      placeholder="Tax identification number"
                      className={inputClasses}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessAddress" className={labelClasses}>Business Address *</Label>
                  <Input
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => updateFormData("businessAddress", e.target.value)}
                    placeholder="Street address"
                    className={cn(inputClasses, fieldErrors.businessAddress && fieldErrorClasses)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="businessCity" className={labelClasses}>City *</Label>
                    <Input
                      id="businessCity"
                      value={formData.businessCity}
                      onChange={(e) => updateFormData("businessCity", e.target.value)}
                      placeholder="City"
                      className={cn(inputClasses, fieldErrors.businessCity && fieldErrorClasses)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessState" className={labelClasses}>State/County *</Label>
                    <Input
                      id="businessState"
                      value={formData.businessState}
                      onChange={(e) => updateFormData("businessState", e.target.value)}
                      placeholder="State or county"
                      className={cn(inputClasses, fieldErrors.businessState && fieldErrorClasses)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessPostalCode" className={labelClasses}>Postal Code *</Label>
                    <Input
                      id="businessPostalCode"
                      value={formData.businessPostalCode}
                      onChange={(e) => updateFormData("businessPostalCode", e.target.value)}
                      placeholder="Postal code"
                      className={cn(inputClasses, fieldErrors.businessPostalCode && fieldErrorClasses)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactPersonName" className={labelClasses}>Contact Person Name *</Label>
                    <Input
                      id="contactPersonName"
                      value={formData.contactPersonName}
                      onChange={(e) => updateFormData("contactPersonName", e.target.value)}
                      placeholder="Full name"
                      className={cn(inputClasses, fieldErrors.contactPersonName && fieldErrorClasses)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPersonEmail" className={labelClasses}>Contact Email *</Label>
                    <Input
                      id="contactPersonEmail"
                      type="email"
                      value={formData.contactPersonEmail}
                      onChange={(e) => updateFormData("contactPersonEmail", e.target.value)}
                      placeholder="email@company.com"
                      className={cn(inputClasses, fieldErrors.contactPersonEmail && fieldErrorClasses)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="contactPersonPhone" className={labelClasses}>Contact Phone *</Label>
                  <Input
                    id="contactPersonPhone"
                    value={formData.contactPersonPhone}
                    onChange={(e) => updateFormData("contactPersonPhone", e.target.value)}
                    placeholder="+40 XXX XXX XXX"
                    className={cn(inputClasses, fieldErrors.contactPersonPhone && fieldErrorClasses)}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Business Profile */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="yearEstablished" className={labelClasses}>Year Established *</Label>
                    <Input
                      id="yearEstablished"
                      value={formData.yearEstablished}
                      onChange={(e) => updateFormData("yearEstablished", e.target.value)}
                      placeholder="2020"
                      className={cn(inputClasses, fieldErrors.yearEstablished && fieldErrorClasses)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="employeeCount" className={labelClasses}>Number of Employees *</Label>
                    <Select value={formData.employeeCount} onValueChange={(value) => updateFormData("employeeCount", value)}>
                      <SelectTrigger className={cn(selectTriggerClasses, fieldErrors.employeeCount && fieldErrorClasses)}>
                        <SelectValue placeholder="Select range" className="text-white" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-5">1-5 employees</SelectItem>
                        <SelectItem value="6-20">6-20 employees</SelectItem>
                        <SelectItem value="21-50">21-50 employees</SelectItem>
                        <SelectItem value="51-100">51-100 employees</SelectItem>
                        <SelectItem value="100+">100+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="annualRevenue" className={labelClasses}>Annual Revenue *</Label>
                    <Select value={formData.annualRevenue} onValueChange={(value) => updateFormData("annualRevenue", value)}>
                      <SelectTrigger className={cn(selectTriggerClasses, fieldErrors.annualRevenue && fieldErrorClasses)}>
                        <SelectValue placeholder="Select range" className="text-white" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="<100k">Less than €100k</SelectItem>
                        <SelectItem value="100k-500k">€100k - €500k</SelectItem>
                        <SelectItem value="500k-1M">€500k - €1M</SelectItem>
                        <SelectItem value="1M-5M">€1M - €5M</SelectItem>
                        <SelectItem value="5M+">€5M+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Products & Certifications */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div>
                  <Label className={labelClasses}>Product Categories *</Label>
                  <p className="mb-3 text-sm text-slate-300">Select all categories that apply to your products</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {productCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={formData.productCategories.includes(category)}
                          onCheckedChange={() => handleCategoryToggle(category)}
                        />
                        <Label htmlFor={category} className="text-sm text-slate-200">{category}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className={labelClasses}>Certifications & Standards</Label>
                  <p className="mb-3 text-sm text-slate-300">Select all certifications your company holds</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {certifications.map((certification) => (
                      <div key={certification} className="flex items-center space-x-2">
                        <Checkbox
                          id={certification}
                          checked={formData.certifications.includes(certification)}
                          onCheckedChange={() => handleCertificationToggle(certification)}
                        />
                        <Label htmlFor={certification} className="text-sm text-slate-200">{certification}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="catalogUrl" className={labelClasses}>Product Catalog URL</Label>
                  <Input
                    id="catalogUrl"
                    value={formData.catalogUrl}
                    onChange={(e) => updateFormData("catalogUrl", e.target.value)}
                    placeholder="https://yourcompany.com/catalog"
                    className={inputClasses}
                  />
                </div>
              </div>
            )}

            {/* Step 5: Documents & Terms */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="logo" className={labelClasses}>Company Logo</Label>
                  <p className="mb-3 text-sm text-slate-300">Upload your company logo (optional)</p>
                  <div className="rounded-lg border-2 border-dashed border-white/15 bg-white/5 p-6 text-center">
                    <Upload className="mx-auto mb-2 h-8 w-8 text-slate-200" />
                    <input
                      type="file"
                      id="logo"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, "logo")}
                      className="hidden"
                    />
                    <Label htmlFor="logo" className="cursor-pointer text-sky-300 hover:text-sky-200">
                      Click to upload logo
                    </Label>
                    {formData.logo && (
                      <p className="mt-2 text-sm text-slate-200">Selected: {formData.logo.name}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => updateFormData("termsAccepted", checked === true)}
                    />
                    <Label htmlFor="terms" className="text-sm text-slate-200">
                      I accept the <a href="/terms" className="text-sky-300 hover:underline">Terms and Conditions</a> *
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={formData.privacyAccepted}
                      onCheckedChange={(checked) => updateFormData("privacyAccepted", checked === true)}
                    />
                    <Label htmlFor="privacy" className="text-sm text-slate-200">
                      I accept the <a href="/privacy" className="text-sky-300 hover:underline">Privacy Policy</a> *
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <Button
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
              onClick={nextStep}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 via-emerald-500 to-indigo-500 px-6 text-white shadow-lg shadow-emerald-500/25 transition hover:from-sky-400 hover:via-emerald-400 hover:to-indigo-400"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 px-6 text-white shadow-lg shadow-emerald-500/25 transition hover:from-emerald-400 hover:via-sky-400 hover:to-indigo-400 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Submit Application
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
  </section>
  );
}
