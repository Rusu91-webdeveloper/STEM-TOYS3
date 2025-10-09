"use client";

import {
  CheckCircle,
  Edit,
  Image as ImageIcon,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ProductPreviewCard } from "../ProductPreviewCard";
import { ImageUploader } from "@/components/ui/ImageUploader";
import { FieldTooltip } from "../FieldTooltip";

interface WizardStep4ReviewProps {
  formData: any;
  errors: Record<string, string>;
  updateFormData: (data: Partial<any>) => void;
  goToStep: (step: number) => void;
}

export function WizardStep4Review({
  formData,
  errors,
  updateFormData,
  goToStep,
}: WizardStep4ReviewProps) {
  const hasRequiredFields =
    formData.name &&
    formData.description &&
    formData.price > 0 &&
    formData.stockQuantity >= 0 &&
    formData.images &&
    formData.images.length > 0;

  const completionStats = {
    required: hasRequiredFields ? 100 : 0,
    optional: [
      formData.ageGroup,
      formData.stemDiscipline,
      formData.productType,
      formData.weight,
      formData.compareAtPrice,
    ].filter(Boolean).length,
    educational: [
      ...(formData.learningOutcomes || []),
      ...(formData.tags || []),
      ...(formData.specialCategories || []),
    ].length,
  };

  const warnings = [];
  if (!formData.ageGroup) warnings.push("Age group not set");
  if (!formData.stemDiscipline || formData.stemDiscipline === "GENERAL")
    warnings.push("STEM discipline not specified");
  if (!formData.learningOutcomes || formData.learningOutcomes.length === 0)
    warnings.push("No learning outcomes selected");
  if (!formData.tags || formData.tags.length === 0)
    warnings.push("No tags added");
  if (formData.images && formData.images.length === 1)
    warnings.push("Only 1 image uploaded - consider adding more");

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
      {/* Header */}
      <div className="text-center space-y-2 pb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <CheckCircle className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Review & Submit</h2>
        <p className="text-muted-foreground">
          Check everything looks good before submitting
        </p>
      </div>

      {/* Completion Status */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {completionStats.required}%
              </div>
              <div className="text-sm text-muted-foreground">
                Required Fields
              </div>
              {completionStats.required === 100 ? (
                <Badge variant="default" className="mt-2 bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Complete
                </Badge>
              ) : (
                <Badge variant="destructive" className="mt-2">
                  Incomplete
                </Badge>
              )}
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {completionStats.optional}/5
              </div>
              <div className="text-sm text-muted-foreground">
                Optional Details
              </div>
              <Badge variant="secondary" className="mt-2">
                {completionStats.optional === 5 ? "Excellent!" : "Good"}
              </Badge>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {completionStats.educational}
              </div>
              <div className="text-sm text-muted-foreground">
                Educational Items
              </div>
              <Badge variant="secondary" className="mt-2">
                {completionStats.educational > 3 ? "Great!" : "Add more"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            <strong>Suggestions to improve your listing:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              {warnings.map((warning, idx) => (
                <li key={idx}>• {warning}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Product Preview */}
      <ProductPreviewCard formData={formData} />

      {/* Quick Edit Links */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-4">Quick Edit</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => goToStep(1)}
              className="justify-start"
            >
              <Edit className="h-4 w-4 mr-2" />
              Basic Information
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => goToStep(2)}
              className="justify-start"
            >
              <Edit className="h-4 w-4 mr-2" />
              Product Details
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => goToStep(3)}
              className="justify-start"
            >
              <Edit className="h-4 w-4 mr-2" />
              Educational Attributes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Additional Images */}
      {formData.images && formData.images.length < 10 && (
        <div className="space-y-3">
          <FieldTooltip
            label="Add More Images (Optional)"
            description="Upload additional product photos to showcase different angles and features."
            validation={`${formData.images.length}/10 images uploaded`}
          />
          <Card className="border-dashed">
            <CardContent className="pt-6">
              <div className="text-center mb-4">
                <ImageIcon className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Add more images to increase customer confidence
                </p>
              </div>
              <ImageUploader
                maxImages={10}
                onImagesUploaded={newImages =>
                  updateFormData({ images: newImages })
                }
                initialImages={formData.images || []}
                endpoint="productImage"
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Errors Summary */}
      {Object.keys(errors).length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Please fix the following errors before submitting:</strong>
            <ul className="mt-2 space-y-1 text-sm">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>
                  <strong>{field}:</strong> {message}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Submission Info */}
      <Alert className="bg-blue-50/50 border-blue-200 dark:bg-blue-950/20">
        <AlertDescription className="text-sm">
          <strong>What happens next:</strong>
          <ul className="mt-2 space-y-1">
            <li>✓ Your product will be saved with status "Pending Approval"</li>
            <li>✓ Our admin team will review it within 48 hours</li>
            <li>✓ You'll receive an email notification when it's approved</li>
            <li>✓ Once approved, it will be visible on the website</li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
