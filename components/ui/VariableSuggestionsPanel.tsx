"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { VariableSuggestions } from "./VariableSuggestions";
import { cn } from "@/lib/utils";

interface VariableSuggestionsPanelProps {
  templateCategory: string;
  content: string;
  subject: string;
  existingVariables: string[];
  onVariableSelect: (variable: string) => void;
  className?: string;
}

export function VariableSuggestionsPanel({
  templateCategory,
  content,
  subject,
  existingVariables,
  onVariableSelect,
  className = "",
}: VariableSuggestionsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Keyboard shortcut to toggle panel (Ctrl/Cmd + Shift + V)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey) &&
        event.shiftKey &&
        event.key === "V"
      ) {
        event.preventDefault();
        setIsOpen(prev => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const togglePanel = () => {
    setIsOpen(prev => !prev);
    if (!isOpen) {
      setIsCollapsed(false);
    }
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => !prev);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Toggle Button */}
      <Button
        variant={isOpen ? "default" : "outline"}
        size="sm"
        onClick={togglePanel}
        className={cn(
          "flex items-center gap-2 transition-all duration-200",
          isOpen && "shadow-lg"
        )}
      >
        <Zap className="w-4 h-4" />
        Smart Variables
        {existingVariables.length > 0 && (
          <Badge variant="secondary" className="ml-1">
            {existingVariables.length}
          </Badge>
        )}
      </Button>

      {/* Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className={cn(
            "absolute top-full right-0 mt-2 z-50 transition-all duration-300 ease-in-out",
            isCollapsed ? "w-12" : "w-full max-w-2xl"
          )}
        >
          <div className="bg-background border rounded-lg shadow-xl">
            {/* Panel Header */}
            <div className="flex items-center justify-between p-3 border-b bg-muted/30">
              <div
                className={cn(
                  "flex items-center gap-2",
                  isCollapsed && "hidden"
                )}
              >
                <Zap className="w-4 h-4 text-primary" />
                <span className="font-medium">Smart Variable Suggestions</span>
                {existingVariables.length > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {existingVariables.length} in use
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-1">
                {!isCollapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCollapse}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                )}
                {isCollapsed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleCollapse}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePanel}
                  className="h-6 w-6 p-0"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Panel Content */}
            {!isCollapsed && (
              <div className="p-4">
                <VariableSuggestions
                  templateCategory={templateCategory}
                  content={content}
                  subject={subject}
                  existingVariables={existingVariables}
                  onVariableSelect={onVariableSelect}
                />
              </div>
            )}

            {/* Collapsed Content */}
            {isCollapsed && (
              <div className="p-2">
                <div className="text-center">
                  <Zap className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <div className="text-xs text-muted-foreground">
                    Smart Variables
                  </div>
                  {existingVariables.length > 0 && (
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {existingVariables.length}
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Keyboard Shortcut Hint */}
          {!isCollapsed && (
            <div className="absolute -bottom-8 right-0 text-xs text-muted-foreground bg-background border rounded px-2 py-1 shadow">
              Press{" "}
              <kbd className="px-1 py-0.5 bg-muted rounded text-xs">
                Ctrl+Shift+V
              </kbd>{" "}
              to toggle
            </div>
          )}
        </div>
      )}
    </div>
  );
}
