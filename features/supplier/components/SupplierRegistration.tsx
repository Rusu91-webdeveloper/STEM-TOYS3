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
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supplierRegistrationSchema, type SupplierRegistrationFormData } from "@/features/supplier/lib/supplier-validation";

const steps = [
  {
    id: 1,
    title: "Company Information",
    description: "Basic company details and contact information",
    icon: Building2
  },
  {
    id: 2,
    title: "Business Address",
    description: "Legal business address and location details",
    icon: MapPin
  },
  {
    id: 3,
    title: "Contact Person",
    description: "Primary contact person information",
    icon: User
  },
  {
    id: 4,
    title: "Business Details",
    description: "Additional business information and categories",
    icon: FileText
  },
  {
    id: 5,
    title: "Legal & Documents",
    description: "Terms acceptance and document upload",
    icon: FileText
  }
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
  "Other"
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
  "Other"
];

export function SupplierRegistration() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isValid },
    trigger
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
      businessCountry: "România",
      businessPostalCode: "",
      contactPersonName: "",
      contactPersonEmail: "",
      contactPersonPhone: "",
      yearEstablished: undefined,
      employeeCount: undefined,
      annualRevenue: "",
      certifications: [],
      productCategories: [],
      termsAccepted: false,
      privacyAccepted: false
    }
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

  const getFieldsForStep = (step: number): (keyof SupplierRegistrationFormData)[] => {
    switch (step) {
      case 1:
        return ["companyName", "phone", "vatNumber", "taxId"];
      case 2:
        return ["businessAddress", "businessCity", "businessState", "businessCountry", "businessPostalCode"];
      case 3:
        return ["contactPersonName", "contactPersonEmail", "contactPersonPhone"];
      case 4:
        return ["productCategories"];
      case 5:
        return ["termsAccepted", "privacyAccepted"];
      default:
        return [];
    }
  };

  const onSubmit = async (data: SupplierRegistrationFormData) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      
      // Append all form data
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            formData.append(key, JSON.stringify(value));
          } else {
            formData.append(key, value.toString());
          }
        }
      });

      // Append logo file if selected
      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const response = await fetch("/api/supplier/register", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Registration failed. Please try again.");
        return;
      }

      setSuccess("Registration submitted successfully! We'll review your application and contact you within 2-3 business days.");
      
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
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  placeholder="Enter your company name"
                  {...register("companyName")}
                  className={errors.companyName ? "border-destructive" : ""}
                />
                {errors.companyName && (
                  <p className="text-sm text-destructive mt-1">{errors.companyName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Company Description</Label>
                <Textarea
                  id="description"
                  placeholder="Brief description of your company and products"
                  {...register("description")}
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://yourcompany.com"
                  {...register("website")}
                />
                {errors.website && (
                  <p className="text-sm text-destructive mt-1">{errors.website.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  placeholder="07XXXXXXXX"
                  {...register("phone")}
                  className={errors.phone ? "border-destructive" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-destructive mt-1">{errors.phone.message}</p>
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
                    <p className="text-sm text-destructive mt-1">{errors.vatNumber.message}</p>
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
                    <p className="text-sm text-destructive mt-1">{errors.taxId.message}</p>
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
                <Label htmlFor="businessAddress">Business Address *</Label>
                <Input
                  id="businessAddress"
                  placeholder="Street address, building number"
                  {...register("businessAddress")}
                  className={errors.businessAddress ? "border-destructive" : ""}
                />
                {errors.businessAddress && (
                  <p className="text-sm text-destructive mt-1">{errors.businessAddress.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessCity">City *</Label>
                  <Input
                    id="businessCity"
                    placeholder="City name"
                    {...register("businessCity")}
                    className={errors.businessCity ? "border-destructive" : ""}
                  />
                  {errors.businessCity && (
                    <p className="text-sm text-destructive mt-1">{errors.businessCity.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="businessState">State/County *</Label>
                  <Input
                    id="businessState"
                    placeholder="State or county"
                    {...register("businessState")}
                    className={errors.businessState ? "border-destructive" : ""}
                  />
                  {errors.businessState && (
                    <p className="text-sm text-destructive mt-1">{errors.businessState.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="businessCountry">Country *</Label>
                  <Input
                    id="businessCountry"
                    {...register("businessCountry")}
                    className={errors.businessCountry ? "border-destructive" : ""}
                  />
                  {errors.businessCountry && (
                    <p className="text-sm text-destructive mt-1">{errors.businessCountry.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="businessPostalCode">Postal Code *</Label>
                  <Input
                    id="businessPostalCode"
                    placeholder="123456"
                    {...register("businessPostalCode")}
                    className={errors.businessPostalCode ? "border-destructive" : ""}
                  />
                  {errors.businessPostalCode && (
                    <p className="text-sm text-destructive mt-1">{errors.businessPostalCode.message}</p>
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
                <Label htmlFor="contactPersonName">Contact Person Name *</Label>
                <Input
                  id="contactPersonName"
                  placeholder="Full name of primary contact"
                  {...register("contactPersonName")}
                  className={errors.contactPersonName ? "border-destructive" : ""}
                />
                {errors.contactPersonName && (
                  <p className="text-sm text-destructive mt-1">{errors.contactPersonName.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contactPersonEmail">Contact Email *</Label>
                <Input
                  id="contactPersonEmail"
                  type="email"
                  placeholder="contact@yourcompany.com"
                  {...register("contactPersonEmail")}
                  className={errors.contactPersonEmail ? "border-destructive" : ""}
                />
                {errors.contactPersonEmail && (
                  <p className="text-sm text-destructive mt-1">{errors.contactPersonEmail.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contactPersonPhone">Contact Phone *</Label>
                <Input
                  id="contactPersonPhone"
                  placeholder="07XXXXXXXX"
                  {...register("contactPersonPhone")}
                  className={errors.contactPersonPhone ? "border-destructive" : ""}
                />
                {errors.contactPersonPhone && (
                  <p className="text-sm text-destructive mt-1">{errors.contactPersonPhone.message}</p>
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
                  <Label htmlFor="yearEstablished">Year Established</Label>
                  <Input
                    id="yearEstablished"
                    type="number"
                    placeholder="2020"
                    {...register("yearEstablished", { valueAsNumber: true })}
                  />
                  {errors.yearEstablished && (
                    <p className="text-sm text-destructive mt-1">{errors.yearEstablished.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="employeeCount">Number of Employees</Label>
                  <Input
                    id="employeeCount"
                    type="number"
                    placeholder="10"
                    {...register("employeeCount", { valueAsNumber: true })}
                  />
                  {errors.employeeCount && (
                    <p className="text-sm text-destructive mt-1">{errors.employeeCount.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="annualRevenue">Annual Revenue</Label>
                  <Input
                    id="annualRevenue"
                    placeholder="€100,000 - €500,000"
                    {...register("annualRevenue")}
                  />
                  {errors.annualRevenue && (
                    <p className="text-sm text-destructive mt-1">{errors.annualRevenue.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label>Product Categories *</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {productCategories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Controller
                        name="productCategories"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id={category}
                            checked={field.value?.includes(category)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, category]);
                              } else {
                                field.onChange(current.filter((c: string) => c !== category));
                              }
                            }}
                          />
                        )}
                      />
                      <Label htmlFor={category} className="text-sm">{category}</Label>
                    </div>
                  ))}
                </div>
                {errors.productCategories && (
                  <p className="text-sm text-destructive mt-1">{errors.productCategories.message}</p>
                )}
              </div>

              <div>
                <Label>Certifications</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                  {certifications.map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
                      <Controller
                        name="certifications"
                        control={control}
                        render={({ field }) => (
                          <Checkbox
                            id={cert}
                            checked={field.value?.includes(cert)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, cert]);
                              } else {
                                field.onChange(current.filter((c: string) => c !== cert));
                              }
                            }}
                          />
                        )}
                      />
                      <Label htmlFor={cert} className="text-sm">{cert}</Label>
                    </div>
                  ))}
                </div>
                {errors.certifications && (
                  <p className="text-sm text-destructive mt-1">{errors.certifications.message}</p>
                )}
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="logo">Company Logo</Label>
                <div className="mt-2">
                  <div className="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="flex text-sm text-gray-600">
                        <label
                          htmlFor="logo-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                        >
                          <span>Upload a file</span>
                          <input
                            id="logo-upload"
                            name="logo-upload"
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleFileUpload}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG, WebP up to 5MB</p>
                    </div>
                  </div>
                  {logoFile && (
                    <p className="text-sm text-green-600 mt-2">✓ {logoFile.name} selected</p>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-2">
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
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="termsAccepted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I accept the Terms and Conditions *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      I have read and agree to the TechTots Supplier Terms and Conditions
                    </p>
                  </div>
                </div>
                {errors.termsAccepted && (
                  <p className="text-sm text-destructive">{errors.termsAccepted.message}</p>
                )}

                <div className="flex items-start space-x-2">
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
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="privacyAccepted" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      I accept the Privacy Policy *
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      I have read and agree to the TechTots Privacy Policy
                    </p>
                  </div>
                </div>
                {errors.privacyAccepted && (
                  <p className="text-sm text-destructive">{errors.privacyAccepted.message}</p>
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Supplier Registration</h1>
          <p className="text-gray-600">Complete your application to become a TechTots supplier</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  currentStep >= step.id 
                    ? "bg-blue-600 border-blue-600 text-white" 
                    : "bg-white border-gray-300 text-gray-500"
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-full h-0.5 mx-4 ${
                    currentStep > step.id ? "bg-blue-600" : "bg-gray-300"
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            {steps.map((step) => (
              <div key={step.id} className="text-center flex-1">
                <p className={`text-sm font-medium ${
                  currentStep >= step.id ? "text-blue-600" : "text-gray-500"
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-400 mt-1">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {(() => {
                const StepIcon = steps[currentStep - 1].icon;
                return <StepIcon className="w-5 h-5" />;
              })()}
              {steps[currentStep - 1].title}
            </CardTitle>
            <CardDescription>
              {steps[currentStep - 1].description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
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
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Previous
                </Button>

                {currentStep < steps.length ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={isSubmitting || !isValid}
                    className="flex items-center gap-2"
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
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Step {currentStep} of {steps.length} • {Math.round((currentStep / steps.length) * 100)}% Complete
          </p>
        </div>
      </div>
    </div>
  );
}
