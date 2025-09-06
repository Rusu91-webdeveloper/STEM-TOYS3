"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Search, Zap, Clock, TrendingUp, Star, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  EmailVariableSuggestions,
  VariableSuggestion,
  VariableContext,
} from "@/lib/email-variable-suggestions";

interface VariableSuggestionsProps {
  templateCategory: string;
  content: string;
  subject: string;
  existingVariables: string[];
  onVariableSelect: (variable: string) => void;
  className?: string;
}

export function VariableSuggestions({
  templateCategory,
  content,
  subject,
  existingVariables,
  onVariableSelect,
  className = "",
}: VariableSuggestionsProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("suggested");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Get contextual suggestions
  const contextSuggestions = useMemo(() => {
    const context: VariableContext = {
      templateCategory,
      content,
      subject,
      existingVariables,
    };
    return EmailVariableSuggestions.getSuggestions(context);
  }, [templateCategory, content, subject, existingVariables]);

  // Get all variables by category
  const allVariablesByCategory = useMemo(() => {
    return EmailVariableSuggestions.getAllVariablesByCategory();
  }, []);

  // Get search results
  const searchResults = useMemo(() => {
    if (!searchTerm.trim()) return [];
    return EmailVariableSuggestions.searchVariables(searchTerm);
  }, [searchTerm]);

  // Get usage statistics
  const usageStats = useMemo(() => {
    return EmailVariableSuggestions.getVariableUsageStats();
  }, []);

  // Get filtered variables for category tab
  const filteredVariables = useMemo(() => {
    if (selectedCategory === "all") {
      return Object.values(allVariablesByCategory).flat();
    }
    return allVariablesByCategory[selectedCategory] || [];
  }, [allVariablesByCategory, selectedCategory]);

  const categories = ["all", ...Object.keys(allVariablesByCategory)];

  const handleVariableClick = (variable: string) => {
    onVariableSelect(variable);
  };

  const getUsageBadge = (variable: string) => {
    const usage = usageStats[variable];
    if (!usage) return null;

    if (usage >= 90) {
      return (
        <Badge variant="default" className="text-xs">
          Popular
        </Badge>
      );
    } else if (usage >= 70) {
      return (
        <Badge variant="secondary" className="text-xs">
          Common
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="text-xs">
          Rare
        </Badge>
      );
    }
  };

  const renderVariableItem = (
    suggestion: VariableSuggestion,
    showUsage = true
  ) => (
    <div
      key={suggestion.variable}
      className="flex items-start justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer group"
      onClick={() => handleVariableClick(suggestion.variable)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <code className="text-sm font-mono bg-muted px-2 py-1 rounded text-primary">
            {suggestion.variable}
          </code>
          {showUsage && getUsageBadge(suggestion.variable)}
        </div>
        <div className="text-sm font-medium text-foreground mb-1">
          {suggestion.label}
        </div>
        <div className="text-xs text-muted-foreground mb-2">
          {suggestion.description}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {suggestion.usage}
          </div>
          <div className="text-xs">e.g. "{suggestion.example}"</div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={e => {
          e.stopPropagation();
          handleVariableClick(suggestion.variable);
        }}
      >
        Insert
      </Button>
    </div>
  );

  return (
    <Card className={`w-full max-w-2xl ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Smart Variable Suggestions
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="w-4 h-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent>
              <p className="max-w-xs">
                Variables are automatically suggested based on your template
                category and content. Click any variable to insert it into your
                email template.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search variables..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Template Context Info */}
        {templateCategory && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 p-2 rounded">
            <Clock className="w-4 h-4" />
            <span>
              Suggestions for: <strong>{templateCategory}</strong> template
            </span>
          </div>
        )}

        {/* Search Results */}
        {searchTerm && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Results ({searchResults.length})
            </h4>
            <ScrollArea className="h-64">
              <div className="space-y-2">
                {searchResults.map(suggestion =>
                  renderVariableItem(suggestion)
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Main Tabs */}
        {!searchTerm && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="suggested"
                className="flex items-center gap-2"
              >
                <Zap className="w-4 h-4" />
                Suggested
                {contextSuggestions.length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {contextSuggestions.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                All Variables
              </TabsTrigger>
              <TabsTrigger value="popular" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                Popular
              </TabsTrigger>
            </TabsList>

            <TabsContent value="suggested" className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Zap className="w-4 h-4" />
                <span>Smart suggestions based on your template context</span>
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {contextSuggestions.length > 0 ? (
                    contextSuggestions.map(suggestion =>
                      renderVariableItem(suggestion)
                    )
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Zap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No specific suggestions available.</p>
                      <p className="text-xs">
                        Try the "All Variables" tab to browse available options.
                      </p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="all" className="space-y-2">
              <div className="flex items-center gap-2 mb-3">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="text-sm border rounded px-2 py-1 bg-background"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category === "all"
                        ? "All Categories"
                        : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {filteredVariables.map(suggestion =>
                    renderVariableItem(suggestion)
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="popular" className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <Star className="w-4 h-4" />
                <span>Most commonly used variables across all templates</span>
              </div>
              <ScrollArea className="h-64">
                <div className="space-y-2">
                  {Object.entries(usageStats)
                    .sort(([, a], [, b]) => b - a)
                    .slice(0, 10)
                    .map(([variable, usage]) => {
                      const suggestion =
                        EmailVariableSuggestions.getVariableDetails(variable);
                      if (!suggestion) return null;
                      return (
                        <div
                          key={variable}
                          className="flex items-center justify-between p-2 rounded border bg-card"
                        >
                          <div className="flex-1">
                            <code className="text-sm font-mono bg-muted px-2 py-1 rounded text-primary">
                              {variable}
                            </code>
                            <div className="text-xs text-muted-foreground mt-1">
                              {suggestion.label} • {usage}% usage
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleVariableClick(variable)}
                          >
                            Insert
                          </Button>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        )}

        {/* Footer Info */}
        <Separator />
        <div className="text-xs text-muted-foreground text-center">
          💡 <strong>Pro tip:</strong> Variables are automatically replaced with
          real data when emails are sent.
          {existingVariables.length > 0 && (
            <div className="mt-2">
              <strong>Currently using:</strong> {existingVariables.join(", ")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
