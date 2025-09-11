"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Bot,
  Eye,
  Check,
  X,
  Edit,
  Sparkles,
  Globe,
  Target,
  GraduationCap,
  Users,
  Puzzle,
  Settings,
} from "lucide-react";
import { BasicProduct, EnhancedProduct } from "@/lib/ai";

interface AIEnhancementPreviewProps {
  originalProduct: BasicProduct;
  enhancedProduct: EnhancedProduct;
  onAccept: () => void;
  onReject: () => void;
  onEdit: (field: string, value: any) => void;
  className?: string;
}

export function AIEnhancementPreview({
  originalProduct,
  enhancedProduct,
  onAccept,
  onReject,
  onEdit,
  className,
}: AIEnhancementPreviewProps) {
  const [activeTab, setActiveTab] = useState("description");

  const getFieldIcon = (field: string) => {
    switch (field) {
      case "description":
        return <Bot className="h-4 w-4" />;
      case "seo":
        return <Target className="h-4 w-4" />;
      case "categorization":
        return <Settings className="h-4 w-4" />;
      case "romanian":
        return <Globe className="h-4 w-4" />;
      case "learning":
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const getFieldColor = (field: string) => {
    switch (field) {
      case "description":
        return "text-blue-600";
      case "seo":
        return "text-green-600";
      case "categorization":
        return "text-purple-600";
      case "romanian":
        return "text-orange-600";
      case "learning":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const renderFieldComparison = (
    field: string,
    original: any,
    enhanced: any,
    label: string,
    type: "text" | "array" | "boolean" = "text"
  ) => {
    const hasChanges = JSON.stringify(original) !== JSON.stringify(enhanced);

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {getFieldIcon(field)}
          <span className="font-medium">{label}</span>
          {hasChanges && (
            <Badge variant="outline" className="text-xs">
              Enhanced
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              Original
            </p>
            <div className="p-2 bg-muted rounded text-sm">
              {type === "array" ? (
                Array.isArray(original) && original.length > 0 ? (
                  <ul className="space-y-1">
                    {original.map((item: string, index: number) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground italic">
                    Not specified
                  </span>
                )
              ) : type === "boolean" ? (
                <Badge variant={original ? "default" : "secondary"}>
                  {original ? "Yes" : "No"}
                </Badge>
              ) : (
                original || (
                  <span className="text-muted-foreground italic">
                    Not specified
                  </span>
                )
              )}
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">
              AI Enhanced
            </p>
            <div
              className={`p-2 rounded text-sm ${hasChanges ? "bg-blue-50 dark:bg-blue-950/20" : "bg-muted"}`}
            >
              {type === "array" ? (
                Array.isArray(enhanced) && enhanced.length > 0 ? (
                  <ul className="space-y-1">
                    {enhanced.map((item: string, index: number) => (
                      <li key={index} className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-blue-600 rounded-full" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted-foreground italic">
                    Not specified
                  </span>
                )
              ) : type === "boolean" ? (
                <Badge variant={enhanced ? "default" : "secondary"}>
                  {enhanced ? "Yes" : "No"}
                </Badge>
              ) : (
                enhanced || (
                  <span className="text-muted-foreground italic">
                    Not specified
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">AI Enhancement Preview</CardTitle>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              {originalProduct.name}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger
              value="description"
              className="flex items-center gap-1"
            >
              <Bot className="h-3 w-3" />
              Description
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              SEO
            </TabsTrigger>
            <TabsTrigger
              value="categorization"
              className="flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="romanian" className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              Romanian
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              Learning
            </TabsTrigger>
          </TabsList>

          <TabsContent value="description" className="space-y-4">
            {renderFieldComparison(
              "description",
              originalProduct.description,
              enhancedProduct.enhancedDescription,
              "Product Description",
              "text"
            )}
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            {renderFieldComparison(
              "seo",
              originalProduct.name,
              enhancedProduct.metaTitle,
              "Meta Title",
              "text"
            )}
            {renderFieldComparison(
              "seo",
              originalProduct.description?.substring(0, 160),
              enhancedProduct.metaDescription,
              "Meta Description",
              "text"
            )}
            {renderFieldComparison(
              "seo",
              originalProduct.tags || [],
              enhancedProduct.metaKeywords,
              "Meta Keywords",
              "array"
            )}
          </TabsContent>

          <TabsContent value="categorization" className="space-y-4">
            {renderFieldComparison(
              "categorization",
              "Not specified",
              enhancedProduct.ageGroup,
              "Age Group",
              "text"
            )}
            {renderFieldComparison(
              "categorization",
              "GENERAL",
              enhancedProduct.stemDiscipline,
              "STEM Discipline",
              "text"
            )}
            {renderFieldComparison(
              "categorization",
              "Not specified",
              enhancedProduct.productType,
              "Product Type",
              "text"
            )}
            {renderFieldComparison(
              "categorization",
              originalProduct.tags || [],
              enhancedProduct.tags,
              "Tags",
              "array"
            )}
          </TabsContent>

          <TabsContent value="romanian" className="space-y-4">
            {renderFieldComparison(
              "romanian",
              [],
              enhancedProduct.romanianCompetencies,
              "Romanian Competencies",
              "array"
            )}
            {renderFieldComparison(
              "romanian",
              [],
              enhancedProduct.romanianCurriculumAlignment,
              "Curriculum Alignment",
              "array"
            )}
            {renderFieldComparison(
              "romanian",
              "Not specified",
              enhancedProduct.romanianEducationalLevel,
              "Educational Level",
              "text"
            )}
            {renderFieldComparison(
              "romanian",
              [],
              enhancedProduct.romanianSubjectAreas,
              "Subject Areas",
              "array"
            )}
            {renderFieldComparison(
              "romanian",
              false,
              enhancedProduct.romanianMinistryApproval,
              "Ministry Approval",
              "boolean"
            )}
          </TabsContent>

          <TabsContent value="learning" className="space-y-4">
            {renderFieldComparison(
              "learning",
              [],
              enhancedProduct.learningOutcomes,
              "Learning Outcomes",
              "array"
            )}
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Review the AI enhancements above and choose your action
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onReject}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              variant="outline"
              onClick={() => onEdit("all", enhancedProduct)}
              className="text-blue-600 hover:text-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <Button
              onClick={onAccept}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Accept
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
