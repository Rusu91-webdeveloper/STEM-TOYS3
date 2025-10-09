"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useCsrfToken } from "@/hooks/useCsrfToken";
import { WizardProgress } from "./wizard/WizardProgress";
import { WizardStep1Basic } from "./wizard/WizardStep1Basic";
import { WizardStep2Details } from "./wizard/WizardStep2Details";
import { WizardStep3Educational } from "./wizard/WizardStep3Educational";
import { WizardStep4Review } from "./wizard/WizardStep4Review";

const wizardSteps = [
  { id: 1, title: "Basics", description: "Required info" },
  { id: 2, title: "Details", description: "Optional" },
  { id: 3, title: "Educational", description: "Optional" },
  { id: 4, title: "Review", description: "Submit" },
];

// Validation schemas for each step
const step1Schema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000),
  price: z.number().min(0.01, "Price must be greater than 0"),
  priceCurrency: z.enum(["EUR", "RON"]),
  stockQuantity: z.number().min(0, "Stock cannot be negative"),
  images: z.array(z.string()).min(1, "At least one image is required"),
});

interface SupplierProductWizardProps {
  productId?: string;
}

export function SupplierProductWizard({
  productId,
}: SupplierProductWizardProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { addToHeaders, token: csrfToken } = useCsrfToken();

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<any>({
    name: "",
    description: "",
    price: 0,
    priceCurrency: "RON",
    stockQuantity: 0,
    sku: "",
    categoryId: "",
    images: [],
    ageGroup: "",
    stemDiscipline: "GENERAL",
    productType: "",
    compareAtPrice: undefined,
    weight: undefined,
    reorderPoint: undefined,
    learningOutcomes: [],
    tags: [],
    specialCategories: [],
    isActive: true,
    featured: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);

  // Load product if editing
  useEffect(() => {
    if (productId) {
      fetchProduct();
    } else {
      // Try to load draft from localStorage
      loadDraft();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/supplier/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          ...data,
          learningOutcomes: data.metadata?.learningOutcomes || [],
          specialCategories: data.metadata?.specialCategories || [],
          productType: data.metadata?.productType || "",
        });
        // Mark all steps as accessible when editing
        setCompletedSteps([1, 2, 3]);
      }
    } catch (error) {
      console.error("Error loading product:", error);
      toast({
        title: "Error",
        description: "Failed to load product",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadDraft = () => {
    try {
      const draft = localStorage.getItem("supplier-product-draft");
      if (draft) {
        const parsed = JSON.parse(draft);
        setFormData(parsed);
        toast({
          title: "Draft Loaded",
          description: "Your previous work has been restored",
        });
      }
    } catch (error) {
      console.error("Error loading draft:", error);
    }
  };

  const saveDraft = () => {
    try {
      setSavingDraft(true);
      localStorage.setItem("supplier-product-draft", JSON.stringify(formData));
      toast({
        title: "Draft Saved",
        description: "Your progress has been saved locally",
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      toast({
        title: "Error",
        description: "Failed to save draft",
        variant: "destructive",
      });
    } finally {
      setSavingDraft(false);
    }
  };

  const clearDraft = () => {
    try {
      localStorage.removeItem("supplier-product-draft");
    } catch (error) {
      console.error("Error clearing draft:", error);
    }
  };

  const updateFormData = (data: Partial<any>) => {
    setFormData((prev: any) => ({ ...prev, ...data }));
    // Clear errors for updated fields
    const updatedFields = Object.keys(data);
    setErrors(prev => {
      const newErrors = { ...prev };
      updatedFields.forEach(field => delete newErrors[field]);
      return newErrors;
    });
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      try {
        step1Schema.parse(formData);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            newErrors[err.path[0]] = err.message;
          });
        }
      }
    }

    // Additional custom validations
    if (formData.compareAtPrice && formData.compareAtPrice <= formData.price) {
      newErrors.compareAtPrice = "Must be greater than regular price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToStep = (step: number) => {
    // Validate current step before moving forward
    if (step > currentStep && !validateStep(currentStep)) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before continuing",
        variant: "destructive",
      });
      return;
    }

    // Mark current step as completed
    if (step > currentStep && !completedSteps.includes(currentStep)) {
      setCompletedSteps(prev => [...prev, currentStep]);
    }

    setCurrentStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    if (currentStep < wizardSteps.length) {
      goToStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    // Final validation
    if (!validateStep(1)) {
      setCurrentStep(1);
      toast({
        title: "Validation Error",
        description: "Please fix required fields errors",
        variant: "destructive",
      });
      return;
    }

    if (!csrfToken) {
      toast({
        title: "Security Error",
        description: "Please refresh and try again",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Convert EUR to RON if needed
      const finalPrice =
        formData.priceCurrency === "EUR" ? formData.price * 5 : formData.price;
      const finalComparePrice =
        formData.compareAtPrice && formData.priceCurrency === "EUR"
          ? formData.compareAtPrice * 5
          : formData.compareAtPrice;

      const productData = {
        ...formData,
        price: finalPrice,
        compareAtPrice: finalComparePrice,
        // Clean up empty strings for optional enums
        ageGroup: formData.ageGroup || undefined,
        stemDiscipline: formData.stemDiscipline || "GENERAL",
        productType: formData.productType || undefined,
      };

      const url = productId
        ? `/api/supplier/products/${productId}`
        : "/api/supplier/products";
      const method = productId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: addToHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save product");
      }

      // Clear draft on successful submission
      clearDraft();

      toast({
        title: "Success! 🎉",
        description: productId
          ? "Product updated successfully"
          : "Product created and submitted for approval",
      });

      router.push("/supplier/products");
    } catch (error) {
      console.error("Error submitting product:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <WizardProgress
        steps={wizardSteps}
        currentStep={currentStep}
        completedSteps={completedSteps}
      />

      {/* Step Content */}
      <Card className="p-6 md:p-8 mb-6">
        {currentStep === 1 && (
          <WizardStep1Basic
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )}
        {currentStep === 2 && (
          <WizardStep2Details
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )}
        {currentStep === 3 && (
          <WizardStep3Educational
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />
        )}
        {currentStep === 4 && (
          <WizardStep4Review
            formData={formData}
            errors={errors}
            updateFormData={updateFormData}
            goToStep={goToStep}
          />
        )}
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between gap-4 mb-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleBack}
          disabled={submitting}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={saveDraft}
            disabled={submitting || savingDraft}
          >
            <Save className="h-4 w-4 mr-2" />
            {savingDraft ? "Saving..." : "Save Draft"}
          </Button>

          {currentStep < wizardSteps.length ? (
            <Button type="button" onClick={handleNext} disabled={submitting}>
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || Object.keys(errors).length > 0}
              className="min-w-[150px]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {productId ? "Update Product" : "Submit for Approval"}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
