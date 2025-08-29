"use client";

import { useState } from "react";
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

export function SupplierApplicationForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
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

  const updateFormData = (field: keyof ApplicationData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, field: 'logo') => {
    const file = event.target.files?.[0];
    if (file) {
      updateFormData(field, file);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      productCategories: prev.productCategories.includes(category)
        ? prev.productCategories.filter(c => c !== category)
        : [...prev.productCategories, category]
    }));
  };

  const handleCertificationToggle = (certification: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.includes(certification)
        ? prev.certifications.filter(c => c !== certification)
        : [...prev.certifications, certification]
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.companyName && formData.phone && formData.description);
      case 2:
        return !!(formData.businessAddress && formData.businessCity && 
                 formData.contactPersonName && formData.contactPersonEmail);
      case 3:
        return !!(formData.yearEstablished && formData.employeeCount && formData.annualRevenue);
      case 4:
        return formData.productCategories.length > 0;
      case 5:
        return formData.termsAccepted && formData.privacyAccepted;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
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
    if (!validateStep(currentStep)) {
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
            <p className="text-gray-600 mb-4">
              Thank you for your application. We'll review your information and get back to you within 5-7 business days.
            </p>
            <div className="flex items-center justify-center">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span className="text-sm text-gray-500">Redirecting...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Become a TechTots Supplier
          </h1>
          <p className="text-gray-600">
            Complete the application below to join our network of trusted STEM toy suppliers
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  currentStep >= step.id 
                    ? "bg-blue-600 text-white" 
                    : "bg-gray-200 text-gray-600"
                }`}>
                  {step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-1 mx-2 ${
                    currentStep > step.id ? "bg-blue-600" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
          <div className="text-center mt-2">
            <span className="text-sm text-gray-600">
              Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
            </span>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Form Steps */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {steps[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Company Information */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="companyName">Company Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => updateFormData("companyName", e.target.value)}
                      placeholder="Enter your company name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="+40 XXX XXX XXX"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => updateFormData("website", e.target.value)}
                    placeholder="https://yourcompany.com"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Company Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => updateFormData("description", e.target.value)}
                    placeholder="Tell us about your company and what you do..."
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vatNumber">VAT Number</Label>
                    <Input
                      id="vatNumber"
                      value={formData.vatNumber}
                      onChange={(e) => updateFormData("vatNumber", e.target.value)}
                      placeholder="RO12345678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="taxId">Tax ID</Label>
                    <Input
                      id="taxId"
                      value={formData.taxId}
                      onChange={(e) => updateFormData("taxId", e.target.value)}
                      placeholder="Tax identification number"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Contact Details */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="businessAddress">Business Address *</Label>
                  <Input
                    id="businessAddress"
                    value={formData.businessAddress}
                    onChange={(e) => updateFormData("businessAddress", e.target.value)}
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="businessCity">City *</Label>
                    <Input
                      id="businessCity"
                      value={formData.businessCity}
                      onChange={(e) => updateFormData("businessCity", e.target.value)}
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessState">State/County *</Label>
                    <Input
                      id="businessState"
                      value={formData.businessState}
                      onChange={(e) => updateFormData("businessState", e.target.value)}
                      placeholder="State or county"
                    />
                  </div>
                  <div>
                    <Label htmlFor="businessPostalCode">Postal Code *</Label>
                    <Input
                      id="businessPostalCode"
                      value={formData.businessPostalCode}
                      onChange={(e) => updateFormData("businessPostalCode", e.target.value)}
                      placeholder="Postal code"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contactPersonName">Contact Person Name *</Label>
                    <Input
                      id="contactPersonName"
                      value={formData.contactPersonName}
                      onChange={(e) => updateFormData("contactPersonName", e.target.value)}
                      placeholder="Full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactPersonEmail">Contact Email *</Label>
                    <Input
                      id="contactPersonEmail"
                      type="email"
                      value={formData.contactPersonEmail}
                      onChange={(e) => updateFormData("contactPersonEmail", e.target.value)}
                      placeholder="email@company.com"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="contactPersonPhone">Contact Phone *</Label>
                  <Input
                    id="contactPersonPhone"
                    value={formData.contactPersonPhone}
                    onChange={(e) => updateFormData("contactPersonPhone", e.target.value)}
                    placeholder="+40 XXX XXX XXX"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Business Profile */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="yearEstablished">Year Established *</Label>
                    <Input
                      id="yearEstablished"
                      value={formData.yearEstablished}
                      onChange={(e) => updateFormData("yearEstablished", e.target.value)}
                      placeholder="2020"
                    />
                  </div>
                  <div>
                    <Label htmlFor="employeeCount">Number of Employees *</Label>
                    <Select value={formData.employeeCount} onValueChange={(value) => updateFormData("employeeCount", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
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
                    <Label htmlFor="annualRevenue">Annual Revenue *</Label>
                    <Select value={formData.annualRevenue} onValueChange={(value) => updateFormData("annualRevenue", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select range" />
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
                  <Label>Product Categories *</Label>
                  <p className="text-sm text-gray-600 mb-3">Select all categories that apply to your products</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {productCategories.map((category) => (
                      <div key={category} className="flex items-center space-x-2">
                        <Checkbox
                          id={category}
                          checked={formData.productCategories.includes(category)}
                          onCheckedChange={() => handleCategoryToggle(category)}
                        />
                        <Label htmlFor={category} className="text-sm">{category}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Certifications & Standards</Label>
                  <p className="text-sm text-gray-600 mb-3">Select all certifications your company holds</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {certifications.map((certification) => (
                      <div key={certification} className="flex items-center space-x-2">
                        <Checkbox
                          id={certification}
                          checked={formData.certifications.includes(certification)}
                          onCheckedChange={() => handleCertificationToggle(certification)}
                        />
                        <Label htmlFor={certification} className="text-sm">{certification}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="catalogUrl">Product Catalog URL</Label>
                  <Input
                    id="catalogUrl"
                    value={formData.catalogUrl}
                    onChange={(e) => updateFormData("catalogUrl", e.target.value)}
                    placeholder="https://yourcompany.com/catalog"
                  />
                </div>
              </div>
            )}

            {/* Step 5: Documents & Terms */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div>
                  <Label htmlFor="logo">Company Logo</Label>
                  <p className="text-sm text-gray-600 mb-3">Upload your company logo (optional)</p>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <input
                      type="file"
                      id="logo"
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                      className="hidden"
                    />
                    <Label htmlFor="logo" className="cursor-pointer text-blue-600 hover:text-blue-700">
                      Click to upload logo
                    </Label>
                    {formData.logo && (
                      <p className="text-sm text-gray-600 mt-2">Selected: {formData.logo.name}</p>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="terms"
                      checked={formData.termsAccepted}
                      onCheckedChange={(checked) => updateFormData("termsAccepted", checked)}
                    />
                    <Label htmlFor="terms" className="text-sm">
                      I accept the <a href="/terms" className="text-blue-600 hover:underline">Terms and Conditions</a> *
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="privacy"
                      checked={formData.privacyAccepted}
                      onCheckedChange={(checked) => updateFormData("privacyAccepted", checked)}
                    />
                    <Label htmlFor="privacy" className="text-sm">
                      I accept the <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a> *
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </Button>
          
          {currentStep < steps.length ? (
            <Button
              onClick={nextStep}
              className="flex items-center gap-2"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2"
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
    </div>
  );
}
