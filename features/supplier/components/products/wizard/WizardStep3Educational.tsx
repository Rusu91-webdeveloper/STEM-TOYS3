"use client";

import { useState } from "react";
import { Brain, Tag, X, Plus, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldTooltip } from "../FieldTooltip";
import { cn } from "@/lib/utils";

interface WizardStep3EducationalProps {
  formData: any;
  updateFormData: (data: Partial<any>) => void;
  errors: Record<string, string>;
}

const learningOutcomesConfig = {
  PROBLEM_SOLVING: {
    label: "Problem Solving",
    icon: "🧩",
    description: "Develops analytical thinking and solution finding",
    color: "bg-blue-500",
  },
  CREATIVITY: {
    label: "Creativity",
    icon: "🎨",
    description: "Encourages creative thinking and imagination",
    color: "bg-purple-500",
  },
  CRITICAL_THINKING: {
    label: "Critical Thinking",
    icon: "🤔",
    description: "Builds logical reasoning and decision-making",
    color: "bg-green-500",
  },
  MOTOR_SKILLS: {
    label: "Motor Skills",
    icon: "✋",
    description: "Improves hand-eye coordination and dexterity",
    color: "bg-orange-500",
  },
  LOGIC: {
    label: "Logic",
    icon: "🧠",
    description: "Enhances logical thinking and pattern recognition",
    color: "bg-indigo-500",
  },
};

const specialCategoriesConfig = {
  NEW_ARRIVALS: {
    label: "New Arrivals",
    icon: "✨",
    description: "Feature in 'New Products' section",
    benefit: "20% more visibility",
  },
  BEST_SELLERS: {
    label: "Best Sellers",
    icon: "🔥",
    description: "Show as popular choice",
    benefit: "Trusted by customers",
  },
  GIFT_IDEAS: {
    label: "Gift Ideas",
    icon: "🎁",
    description: "Perfect for gifting occasions",
    benefit: "Featured in gift guides",
  },
  SALE_ITEMS: {
    label: "Sale Items",
    icon: "💰",
    description: "Promote as on sale",
    benefit: "Attracts bargain hunters",
  },
};

const commonTags = [
  "educational",
  "interactive",
  "hands-on",
  "STEM",
  "fun",
  "learning",
  "creative",
  "building",
  "coding",
  "science",
  "math",
  "engineering",
];

export function WizardStep3Educational({
  formData,
  updateFormData,
  errors,
}: WizardStep3EducationalProps) {
  const [newTag, setNewTag] = useState("");

  const toggleLearningOutcome = (outcome: string) => {
    const current = formData.learningOutcomes || [];
    const updated = current.includes(outcome)
      ? current.filter((o: string) => o !== outcome)
      : [...current, outcome];
    updateFormData({ learningOutcomes: updated });
  };

  const toggleSpecialCategory = (category: string) => {
    const current = formData.specialCategories || [];
    const updated = current.includes(category)
      ? current.filter((c: string) => c !== category)
      : [...current, category];
    updateFormData({ specialCategories: updated });
  };

  const addTag = (tag: string) => {
    if (!tag.trim()) return;
    const current = formData.tags || [];
    if (!current.includes(tag.trim())) {
      updateFormData({ tags: [...current, tag.trim()] });
    }
    setNewTag("");
  };

  const removeTag = (tagToRemove: string) => {
    const current = formData.tags || [];
    updateFormData({ tags: current.filter((t: string) => t !== tagToRemove) });
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-5 duration-500">
      {/* Header */}
      <div className="text-center space-y-2 pb-4">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-2">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-2xl font-bold">Educational Attributes</h2>
        <p className="text-muted-foreground">
          Help customers discover the educational value
        </p>
      </div>

      <Alert className="bg-purple-50/50 border-purple-200 dark:bg-purple-950/20">
        <AlertDescription className="text-sm">
          <strong>Stand out:</strong> These attributes help your product appear
          in specific searches and filters.
        </AlertDescription>
      </Alert>

      {/* Learning Outcomes */}
      <div className="space-y-3">
        <FieldTooltip
          label="Learning Outcomes"
          description="What skills do children develop with this product?"
          enumValues={Object.keys(learningOutcomesConfig)}
          detailedHelp="Select all applicable learning outcomes. Products with defined learning outcomes get better visibility in educational searches."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(learningOutcomesConfig).map(([key, config]) => {
            const isSelected = (formData.learningOutcomes || []).includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggleLearningOutcome(key)}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all hover:scale-[1.02] text-left",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-muted hover:border-muted-foreground/30"
                )}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full text-white text-xl flex-shrink-0",
                      isSelected ? config.color : "bg-muted-foreground/20"
                    )}
                  >
                    {config.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">
                        {config.label}
                      </span>
                      {isSelected && (
                        <Badge className="text-xs">Selected</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {config.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        {(formData.learningOutcomes?.length || 0) > 0 && (
          <p className="text-xs text-green-600">
            ✓ {formData.learningOutcomes.length} learning outcomes selected
          </p>
        )}
      </div>

      {/* Tags */}
      <div className="space-y-3">
        <FieldTooltip
          label="Product Tags"
          description="Add searchable keywords to help customers find your product."
          example="educational, robotics, coding, interactive"
          validation="Up to 20 tags"
          detailedHelp="Tags improve product discoverability. Use specific, relevant terms that customers might search for."
        />

        {/* Current Tags */}
        {(formData.tags?.length || 0) > 0 && (
          <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg">
            {formData.tags.map((tag: string, index: number) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center gap-1 px-3 py-1"
              >
                <Tag className="h-3 w-3" />
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Add Tag Input */}
        <div className="flex gap-2">
          <Input
            value={newTag}
            onChange={e => setNewTag(e.target.value)}
            onKeyPress={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(newTag);
              }
            }}
            placeholder="Type a tag and press Enter"
            disabled={(formData.tags?.length || 0) >= 20}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => addTag(newTag)}
            disabled={(formData.tags?.length || 0) >= 20}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Common Tags */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Quick add (click to add):
          </p>
          <div className="flex flex-wrap gap-2">
            {commonTags
              .filter(tag => !(formData.tags || []).includes(tag))
              .slice(0, 8)
              .map(tag => (
                <Button
                  key={tag}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addTag(tag)}
                  className="text-xs"
                  disabled={(formData.tags?.length || 0) >= 20}
                >
                  + {tag}
                </Button>
              ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {formData.tags?.length || 0}/20 tags
        </p>
      </div>

      {/* Special Categories */}
      <div className="space-y-3">
        <FieldTooltip
          label="Special Categories"
          description="Feature your product in special collections."
          enumValues={Object.keys(specialCategoriesConfig)}
          detailedHelp="Special categories give your product premium placement in specific sections of the store."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(specialCategoriesConfig).map(([key, config]) => {
            const isSelected = (formData.specialCategories || []).includes(key);
            return (
              <div
                key={key}
                className={cn(
                  "p-4 rounded-lg border-2 transition-all",
                  isSelected ? "border-primary bg-primary/5" : "border-muted"
                )}
              >
                <label className="flex items-start gap-3 cursor-pointer">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSpecialCategory(key)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{config.icon}</span>
                      <span className="text-sm font-semibold">
                        {config.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      {config.description}
                    </p>
                    <Badge variant="outline" className="text-xs">
                      <Star className="h-3 w-3 mr-1" />
                      {config.benefit}
                    </Badge>
                  </div>
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
