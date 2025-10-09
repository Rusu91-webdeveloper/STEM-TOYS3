"use client";

import { useState, useEffect } from "react";
import { Settings, Baby, GraduationCap, Flask, Percent } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { FieldTooltip } from "../FieldTooltip";
import { cn } from "@/lib/utils";

interface WizardStep2DetailsProps {
  formData: any;
  updateFormData: (data: Partial<any>) => void;
  errors: Record<string, string>;
}

const ageGroupConfig = {
  TODDLERS_1_3: {
    label: "Toddlers (1-3)",
    icon: "👶",
    color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200",
  },
  PRESCHOOL_3_5: {
    label: "Preschool (3-5)",
    icon: "🧒",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200",
  },
  ELEMENTARY_6_8: {
    label: "Elementary (6-8)",
    icon: "👦",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  },
  MIDDLE_SCHOOL_9_12: {
    label: "Middle School (9-12)",
    icon: "🎓",
    color:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  },
  TEENS_13_PLUS: {
    label: "Teens (13+)",
    icon: "👨",
    color:
      "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200",
  },
};

const stemDisciplineConfig = {
  SCIENCE: { icon: "🔬", color: "bg-emerald-500" },
  TECHNOLOGY: { icon: "💻", color: "bg-blue-500" },
  ENGINEERING: { icon: "⚙️", color: "bg-orange-500" },
  MATHEMATICS: { icon: "📐", color: "bg-purple-500" },
  GENERAL: { icon: "🎯", color: "bg-gray-500" },
};

const productTypeConfig = {
  ROBOTICS: { label: "Robotics", icon: "🤖" },
  PUZZLES: { label: "Puzzles", icon: "🧩" },
  CONSTRUCTION_SETS: { label: "Construction Sets", icon: "🏗️" },
  EXPERIMENT_KITS: { label: "Experiment Kits", icon: "🧪" },
  BOARD_GAMES: { label: "Board Games", icon: "🎲" },
};

export function WizardStep2Details({
  formData,
  updateFormData,
  errors,
}: WizardStep2DetailsProps) {
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);

  useEffect(() => {
    if (formData.price && formData.compareAtPrice) {
      const price = parseFloat(formData.price);
      const comparePrice = parseFloat(formData.compareAtPrice);
      if (!isNaN(price) && !isNaN(comparePrice) && comparePrice > price) {
        const discount = ((comparePrice - price) / comparePrice) * 100;
        setDiscountPercent(Math.round(discount));
      } else {
        setDiscountPercent(null);
      }
    } else {
      setDiscountPercent(null);
    }
  }, [formData.price, formData.compareAtPrice]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
      {/* Header */}
      <div className="text-center space-y-2 pb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Product Details</h2>
        <p className="text-muted-foreground">
          Optional fields to enhance your product listing
        </p>
      </div>

      <Alert className="bg-green-50/50 border-green-200 dark:bg-green-950/20">
        <AlertDescription className="text-sm">
          <strong>Optional but recommended:</strong> These details help
          customers find and understand your product better.
        </AlertDescription>
      </Alert>

      {/* Age Group - Visual Selection */}
      <div className="space-y-3">
        <FieldTooltip
          label="Age Group"
          description="Target age range for this product."
          enumValues={Object.keys(ageGroupConfig)}
          detailedHelp="Selecting the right age group helps parents find appropriate products for their children."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(ageGroupConfig).map(([value, config]) => (
            <button
              key={value}
              type="button"
              onClick={() => updateFormData({ ageGroup: value })}
              className={cn(
                "p-4 rounded-lg border-2 transition-all hover:scale-105",
                formData.ageGroup === value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-muted hover:border-muted-foreground/30"
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-3xl">{config.icon}</span>
                <span className="text-sm font-medium">{config.label}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* STEM Discipline */}
      <div className="space-y-3">
        <FieldTooltip
          label="STEM Discipline"
          description="Primary STEM category for this educational product."
          enumValues={Object.keys(stemDisciplineConfig)}
        />
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {Object.entries(stemDisciplineConfig).map(([value, config]) => (
            <button
              key={value}
              type="button"
              onClick={() => updateFormData({ stemDiscipline: value })}
              className={cn(
                "p-3 rounded-lg border-2 transition-all hover:scale-105",
                formData.stemDiscipline === value
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-muted hover:border-muted-foreground/30"
              )}
            >
              <div className="flex flex-col items-center gap-2">
                <span className="text-2xl">{config.icon}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-xs font-medium",
                    formData.stemDiscipline === value && config.color,
                    formData.stemDiscipline === value &&
                      "text-white border-transparent"
                  )}
                >
                  {value}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Product Type */}
      <div className="space-y-3">
        <FieldTooltip
          label="Product Type"
          description="Type of STEM product. Helps with categorization."
          enumValues={Object.keys(productTypeConfig)}
        />
        <Select
          value={formData.productType || ""}
          onValueChange={value => updateFormData({ productType: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select product type" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(productTypeConfig).map(([value, config]) => (
              <SelectItem key={value} value={value}>
                <span className="flex items-center gap-2">
                  <span>{config.icon}</span>
                  <span>{config.label}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Compare At Price */}
      <div className="space-y-2">
        <FieldTooltip
          label="Compare At Price"
          description="Original price before discount. Shows customers how much they're saving."
          example="119.99"
          validation="Must be greater than the regular price"
          detailedHelp="This creates a 'was/now' price display that highlights the discount to customers."
        />
        <div className="flex gap-2">
          <Input
            type="number"
            step="0.01"
            min="0"
            value={formData.compareAtPrice || ""}
            onChange={e =>
              updateFormData({ compareAtPrice: parseFloat(e.target.value) })
            }
            placeholder="Optional - original price"
            className={errors.compareAtPrice ? "border-red-500" : ""}
          />
          {discountPercent !== null && (
            <div className="flex items-center gap-2 px-4 bg-green-100 dark:bg-green-900/30 rounded-md min-w-[100px] justify-center">
              <Percent className="h-4 w-4 text-green-700 dark:text-green-400" />
              <span className="text-sm font-bold text-green-700 dark:text-green-400">
                {discountPercent}% OFF
              </span>
            </div>
          )}
        </div>
        {errors.compareAtPrice && (
          <p className="text-sm text-red-600">{errors.compareAtPrice}</p>
        )}
        {discountPercent !== null && (
          <p className="text-xs text-green-600">
            ✓ Customers will see: <strong>Save {discountPercent}%</strong>
          </p>
        )}
      </div>

      {/* Weight */}
      <div className="space-y-2">
        <FieldTooltip
          label="Weight (kg)"
          description="Product weight in kilograms. Used for shipping calculations."
          example="1.2"
          validation="Must be 0 or greater"
          detailedHelp="Accurate weight helps calculate shipping costs and prevents delivery issues."
        />
        <Input
          type="number"
          step="0.01"
          min="0"
          value={formData.weight || ""}
          onChange={e => updateFormData({ weight: parseFloat(e.target.value) })}
          placeholder="0.0"
          className={errors.weight ? "border-red-500" : ""}
        />
        {errors.weight && (
          <p className="text-sm text-red-600">{errors.weight}</p>
        )}
        {formData.weight && formData.weight > 0 && (
          <p className="text-xs text-muted-foreground">
            ℹ️ Estimated shipping cost: ~{(formData.weight * 10).toFixed(2)} RON
          </p>
        )}
      </div>

      {/* Reorder Point */}
      <div className="space-y-2">
        <FieldTooltip
          label="Reorder Point"
          description="Get notified when stock drops to this level."
          example="10"
          validation="Must be 0 or greater"
          detailedHelp="Set a threshold for low stock alerts. When inventory reaches this level, you'll receive a notification to reorder."
        />
        <Input
          type="number"
          min="0"
          value={formData.reorderPoint || ""}
          onChange={e =>
            updateFormData({ reorderPoint: parseInt(e.target.value) || 0 })
          }
          placeholder="Optional - e.g., 5"
          className={errors.reorderPoint ? "border-red-500" : ""}
        />
        {errors.reorderPoint && (
          <p className="text-sm text-red-600">{errors.reorderPoint}</p>
        )}
        {formData.reorderPoint > 0 && (
          <Alert className="bg-amber-50/50 border-amber-200 dark:bg-amber-950/20">
            <AlertDescription className="text-xs">
              📬 You'll receive an alert when stock drops to{" "}
              {formData.reorderPoint} units
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}
