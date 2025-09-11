"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  ChevronDown,
  ChevronUp,
  Settings,
  Sparkles,
  Globe,
  GraduationCap,
  Users,
  Target,
  Puzzle,
} from "lucide-react";
import { EnhancementOptions } from "@/lib/ai";

interface AIEnhancementToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  options: EnhancementOptions;
  onOptionsChange: (options: EnhancementOptions) => void;
  disabled?: boolean;
}

export function AIEnhancementToggle({
  enabled,
  onToggle,
  options,
  onOptionsChange,
  disabled = false,
}: AIEnhancementToggleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleOptionChange = (
    key: keyof EnhancementOptions,
    value: boolean
  ) => {
    onOptionsChange({
      ...options,
      [key]: value,
    });
  };

  const optionConfigs = [
    {
      key: "includeRomanianOptimization" as keyof EnhancementOptions,
      label: "Romanian Market Optimization",
      description:
        "Align products with Romanian educational standards and curriculum",
      icon: Globe,
      color: "bg-blue-500",
    },
    {
      key: "includeSEOMetadata" as keyof EnhancementOptions,
      label: "SEO Optimization",
      description:
        "Generate meta titles, descriptions, and keywords for better search visibility",
      icon: Target,
      color: "bg-green-500",
    },
    {
      key: "includeLearningOutcomes" as keyof EnhancementOptions,
      label: "Learning Outcomes",
      description:
        "Identify specific skills and competencies developed by each product",
      icon: GraduationCap,
      color: "bg-purple-500",
    },
    {
      key: "includeAgeGroup" as keyof EnhancementOptions,
      label: "Age Group Classification",
      description:
        "Automatically categorize products by appropriate age ranges",
      icon: Users,
      color: "bg-orange-500",
    },
    {
      key: "includeStemDiscipline" as keyof EnhancementOptions,
      label: "STEM Discipline",
      description:
        "Classify products by Science, Technology, Engineering, or Mathematics focus",
      icon: Puzzle,
      color: "bg-red-500",
    },
    {
      key: "includeProductType" as keyof EnhancementOptions,
      label: "Product Type",
      description: "Categorize as Robotics, Puzzles, Construction Sets, etc.",
      icon: Settings,
      color: "bg-indigo-500",
    },
  ];

  const enabledOptionsCount = Object.values(options).filter(Boolean).length;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">AI Enhancement</CardTitle>
            </div>
            <Badge
              variant={enabled ? "default" : "secondary"}
              className={enabled ? "bg-blue-600" : ""}
            >
              {enabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={onToggle}
            disabled={disabled}
            className="data-[state=checked]:bg-blue-600"
          />
        </div>

        <p className="text-sm text-muted-foreground">
          Use AI to automatically enhance product descriptions, generate SEO
          metadata, and optimize for the Romanian educational market.
        </p>
      </CardHeader>

      {enabled && (
        <CardContent className="pt-0">
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto font-normal"
              >
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>
                    Enhancement Options ({enabledOptionsCount}/6 enabled)
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>

            <CollapsibleContent className="space-y-4 mt-4">
              <Separator />

              <div className="grid gap-4">
                {optionConfigs.map(config => {
                  const Icon = config.icon;
                  const isOptionEnabled = options[config.key];

                  return (
                    <div key={config.key} className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg ${config.color} bg-opacity-10`}
                      >
                        <Icon
                          className={`h-4 w-4 ${config.color.replace("bg-", "text-")}`}
                        />
                      </div>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label
                            htmlFor={config.key}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {config.label}
                          </Label>
                          <Switch
                            id={config.key}
                            checked={isOptionEnabled}
                            onCheckedChange={checked =>
                              handleOptionChange(config.key, checked)
                            }
                            className="data-[state=checked]:bg-blue-600"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      AI Enhancement Benefits
                    </p>
                    <ul className="text-xs text-blue-700 dark:text-blue-200 mt-1 space-y-1">
                      <li>
                        • Automatically generate compelling product descriptions
                      </li>
                      <li>• Optimize for Romanian educational standards</li>
                      <li>• Improve SEO with targeted keywords and metadata</li>
                      <li>• Reduce manual data entry by 80-90%</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      )}
    </Card>
  );
}
