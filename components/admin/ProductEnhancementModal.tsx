"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Check, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  getAgeGroupDisplayName,
  getStemDisciplineDisplayName,
  getProductTypeDisplayName,
} from "@/lib/utils/product-categorization";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: {
    name: string;
  } | null;
  tags?: string[];
  ageGroup?: string;
  stemDiscipline?: string;
  productType?: string;
  learningOutcomes?: string[];
  metadata?: any;
  romanianCompetencies?: string[];
  romanianSubjectAreas?: string[];
}

interface ProductEnhancementModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

type ModalState = "options" | "processing" | "preview";

interface EnhancementPreview {
  original: any;
  enhanced: any;
  changedFields: string[];
}

export function ProductEnhancementModal({
  product,
  open,
  onOpenChange,
  onSuccess,
}: ProductEnhancementModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [modalState, setModalState] = useState<ModalState>("options");
  const [jobId, setJobId] = useState<string | null>(null);
  const [preview, setPreview] = useState<EnhancementPreview | null>(null);
  const [progress, setProgress] = useState(0);
  const [isApplying, setIsApplying] = useState(false);

  // Enhancement options
  const [options, setOptions] = useState({
    includeRomanianOptimization: true,
    includeLearningOutcomes: true,
    includeStemDiscipline: true,
    includeAgeGroup: true,
    includeProductType: true,
  });

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setModalState("options");
      setJobId(null);
      setPreview(null);
      setProgress(0);
      setIsApplying(false);
    }
  }, [open]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ro-RO", {
      style: "currency",
      currency: "RON",
    }).format(price);
  };

  const handleStartEnhancement = async () => {
    try {
      setModalState("processing");
      setProgress(10);

      const response = await fetch(
        `/api/admin/products/${product.id}/enhance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            aiEnhancement: { options },
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to start enhancement");
      }

      const data = await response.json();
      setJobId(data.jobId);

      // Start polling for job status
      pollJobStatus(data.jobId);
    } catch (error) {
      console.error("Enhancement error:", error);
      toast({
        title: "Error",
        description: "Failed to start enhancement. Please try again.",
        variant: "destructive",
      });
      setModalState("options");
    }
  };

  const pollJobStatus = async (jobId: string) => {
    let pollCount = 0;
    const maxPolls = 120; // 10 minutes max

    const interval = setInterval(async () => {
      pollCount++;

      if (pollCount > maxPolls) {
        clearInterval(interval);
        toast({
          title: "Timeout",
          description: "Enhancement timed out. Please try again.",
          variant: "destructive",
        });
        setModalState("options");
        return;
      }

      try {
        const statusResponse = await fetch(
          `/api/admin/ai-jobs/status/${jobId}`
        );
        const statusData = await statusResponse.json();

        if (statusData.status === "PROCESSING") {
          // Update progress
          const estimatedProgress = Math.min(10 + pollCount * 2, 90);
          setProgress(estimatedProgress);
        }

        if (statusData.status === "COMPLETED") {
          clearInterval(interval);
          setProgress(100);

          if (statusData.result?.success && statusData.result?.preview) {
            setPreview(statusData.result.preview);
            setModalState("preview");
          } else {
            throw new Error("Enhancement failed");
          }
        } else if (statusData.status === "FAILED") {
          clearInterval(interval);
          throw new Error(statusData.error || "Enhancement failed");
        }
      } catch (pollError) {
        clearInterval(interval);
        console.error("Polling error:", pollError);
        toast({
          title: "Error",
          description: "Enhancement failed. Please try again.",
          variant: "destructive",
        });
        setModalState("options");
      }
    }, 5000); // Poll every 5 seconds
  };

  const handleApplyChanges = async () => {
    if (!jobId) return;

    try {
      setIsApplying(true);

      const response = await fetch(
        `/api/admin/products/${product.id}/apply-enhancement`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to apply enhancement");
      }

      toast({
        title: "Success",
        description: "Product enhanced successfully!",
      });

      onOpenChange(false);
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error("Apply error:", error);
      toast({
        title: "Error",
        description: "Failed to apply changes. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleReEnhance = () => {
    setModalState("options");
    setJobId(null);
    setPreview(null);
    setProgress(0);
  };

  const renderOptionsState = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          Enhance Product with AI
        </DialogTitle>
        <DialogDescription>
          Select the enhancements you want to apply to this product
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        {/* Product Info */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <h3 className="font-semibold">{product.name}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">
              {product.category?.name || "Fără categorie"}
            </Badge>
            <span>{formatPrice(product.price)}</span>
          </div>
        </div>

        {/* Enhancement Options */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Enhancement Options</Label>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="romanian"
                checked={options.includeRomanianOptimization}
                onCheckedChange={checked =>
                  setOptions(prev => ({
                    ...prev,
                    includeRomanianOptimization: checked as boolean,
                  }))
                }
              />
              <div className="space-y-1">
                <Label
                  htmlFor="romanian"
                  className="cursor-pointer font-medium"
                >
                  Romanian Market Optimization
                </Label>
                <p className="text-xs text-muted-foreground">
                  Add Romanian competencies, curriculum alignment, and local SEO
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="learning"
                checked={options.includeLearningOutcomes}
                onCheckedChange={checked =>
                  setOptions(prev => ({
                    ...prev,
                    includeLearningOutcomes: checked as boolean,
                  }))
                }
              />
              <div className="space-y-1">
                <Label
                  htmlFor="learning"
                  className="cursor-pointer font-medium"
                >
                  Learning Outcomes Classification
                </Label>
                <p className="text-xs text-muted-foreground">
                  Identify educational outcomes and skills developed
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="stem"
                checked={options.includeStemDiscipline}
                onCheckedChange={checked =>
                  setOptions(prev => ({
                    ...prev,
                    includeStemDiscipline: checked as boolean,
                  }))
                }
              />
              <div className="space-y-1">
                <Label htmlFor="stem" className="cursor-pointer font-medium">
                  STEM Discipline Categorization
                </Label>
                <p className="text-xs text-muted-foreground">
                  Classify into Science, Technology, Engineering, or Math
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="age"
                checked={options.includeAgeGroup}
                onCheckedChange={checked =>
                  setOptions(prev => ({
                    ...prev,
                    includeAgeGroup: checked as boolean,
                  }))
                }
              />
              <div className="space-y-1">
                <Label htmlFor="age" className="cursor-pointer font-medium">
                  Age Group Detection
                </Label>
                <p className="text-xs text-muted-foreground">
                  Identify appropriate age range for the product
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Checkbox
                id="type"
                checked={options.includeProductType}
                onCheckedChange={checked =>
                  setOptions(prev => ({
                    ...prev,
                    includeProductType: checked as boolean,
                  }))
                }
              />
              <div className="space-y-1">
                <Label htmlFor="type" className="cursor-pointer font-medium">
                  Product Type Classification
                </Label>
                <p className="text-xs text-muted-foreground">
                  Categorize as Robotics, Puzzles, Construction Sets, etc.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleStartEnhancement}>
          <Sparkles className="h-4 w-4 mr-2" />
          Start Enhancement
        </Button>
      </DialogFooter>
    </>
  );

  const renderProcessingState = () => (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
          Enhancing Product...
        </DialogTitle>
        <DialogDescription>
          AI is analyzing and enhancing your product. This may take 30-60
          seconds.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-600 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
          <p>Please wait while we enhance:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            {options.includeRomanianOptimization && (
              <li>Romanian market optimization</li>
            )}
            {options.includeLearningOutcomes && <li>Learning outcomes</li>}
            {options.includeStemDiscipline && <li>STEM discipline</li>}
            {options.includeAgeGroup && <li>Age group</li>}
            {options.includeProductType && <li>Product type</li>}
          </ul>
        </div>
      </div>
    </>
  );

  const renderPreviewState = () => {
    if (!preview) return null;

    const { original, enhanced, changedFields } = preview;

    return (
      <>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Check className="h-5 w-5 text-green-600" />
            Enhancement Preview
          </DialogTitle>
          <DialogDescription>
            Review the changes before applying them to your product
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[500px] overflow-y-auto">
          {/* Changed Fields Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm font-medium text-green-900">
              {changedFields.length} fields will be enhanced:
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {changedFields.map(field => (
                <Badge key={field} variant="secondary" className="bg-green-100">
                  {field}
                </Badge>
              ))}
            </div>
          </div>

          {/* Field-by-Field Comparison */}
          <div className="space-y-3">
            {/* Description */}
            {changedFields.includes("description") && (
              <ComparisonField
                label="Description"
                original={original.description}
                enhanced={enhanced.description}
              />
            )}

            {/* Tags */}
            {changedFields.includes("tags") && (
              <ComparisonField
                label="Tags"
                original={original.tags?.join(", ") || "None"}
                enhanced={enhanced.tags?.join(", ") || "None"}
              />
            )}

            {/* Age Group */}
            {changedFields.includes("ageGroup") && (
              <ComparisonField
                label="Age Group"
                original={
                  original.ageGroup
                    ? getAgeGroupDisplayName(original.ageGroup)
                    : "Not set"
                }
                enhanced={
                  enhanced.ageGroup
                    ? getAgeGroupDisplayName(enhanced.ageGroup)
                    : "Not set"
                }
              />
            )}

            {/* STEM Discipline */}
            {changedFields.includes("stemDiscipline") && (
              <ComparisonField
                label="STEM Discipline"
                original={
                  original.stemDiscipline
                    ? getStemDisciplineDisplayName(original.stemDiscipline)
                    : "Not set"
                }
                enhanced={
                  enhanced.stemDiscipline
                    ? getStemDisciplineDisplayName(enhanced.stemDiscipline)
                    : "Not set"
                }
              />
            )}

            {/* Product Type */}
            {changedFields.includes("productType") && (
              <ComparisonField
                label="Product Type"
                original={
                  original.productType
                    ? getProductTypeDisplayName(original.productType)
                    : "Not set"
                }
                enhanced={
                  enhanced.productType
                    ? getProductTypeDisplayName(enhanced.productType)
                    : "Not set"
                }
              />
            )}

            {/* Learning Outcomes */}
            {changedFields.includes("learningOutcomes") && (
              <ComparisonField
                label="Learning Outcomes"
                original={
                  original.learningOutcomes?.length > 0
                    ? original.learningOutcomes.join(", ")
                    : "None"
                }
                enhanced={
                  enhanced.learningOutcomes?.length > 0
                    ? enhanced.learningOutcomes.join(", ")
                    : "None"
                }
              />
            )}

            {/* SEO Metadata */}
            {changedFields.includes("metadata.seo") && (
              <div className="space-y-2">
                <ComparisonField
                  label="Meta Title"
                  original={original.metadata?.seo?.metaTitle || "Not set"}
                  enhanced={enhanced.metadata?.seo?.metaTitle || "Not set"}
                />
                <ComparisonField
                  label="Meta Description"
                  original={
                    original.metadata?.seo?.metaDescription || "Not set"
                  }
                  enhanced={
                    enhanced.metadata?.seo?.metaDescription || "Not set"
                  }
                />
              </div>
            )}

            {/* Romanian Competencies */}
            {changedFields.includes("romanianCompetencies") && (
              <ComparisonField
                label="Romanian Competencies"
                original={
                  original.romanianCompetencies?.length > 0
                    ? original.romanianCompetencies.join(", ")
                    : "None"
                }
                enhanced={
                  enhanced.romanianCompetencies?.length > 0
                    ? enhanced.romanianCompetencies.join(", ")
                    : "None"
                }
              />
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Reject
          </Button>
          <Button variant="secondary" onClick={handleReEnhance}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-enhance
          </Button>
          <Button onClick={handleApplyChanges} disabled={isApplying}>
            {isApplying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Apply Changes
          </Button>
        </DialogFooter>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        {modalState === "options" && renderOptionsState()}
        {modalState === "processing" && renderProcessingState()}
        {modalState === "preview" && renderPreviewState()}
      </DialogContent>
    </Dialog>
  );
}

// Helper component for field comparison
function ComparisonField({
  label,
  original,
  enhanced,
}: {
  label: string;
  original: string;
  enhanced: string;
}) {
  const hasChanged = original !== enhanced;

  return (
    <div className="border rounded-lg p-3 space-y-2">
      <Label className="text-sm font-semibold">{label}</Label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground">Current</span>
          <p className="text-sm bg-muted p-2 rounded">{original}</p>
        </div>
        <div className="space-y-1">
          <span className="text-xs text-green-600 font-medium">Enhanced</span>
          <p
            className={`text-sm p-2 rounded ${
              hasChanged ? "bg-green-50 border border-green-200" : "bg-muted"
            }`}
          >
            {enhanced}
          </p>
        </div>
      </div>
    </div>
  );
}
