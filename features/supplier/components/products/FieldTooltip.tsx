"use client";

import { useState } from "react";
import { HelpCircle, Info, CheckCircle, AlertTriangle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface FieldTooltipProps {
  label: string;
  description: string;
  example?: string;
  validation?: string;
  required?: boolean;
  status?: "valid" | "warning" | "error" | "default";
  detailedHelp?: string;
  enumValues?: string[];
}

export function FieldTooltip({
  label,
  description,
  example,
  validation,
  required = false,
  status = "default",
  detailedHelp,
  enumValues,
}: FieldTooltipProps) {
  const [showDialog, setShowDialog] = useState(false);

  const statusIcons = {
    valid: <CheckCircle className="h-3 w-3 text-green-600" />,
    warning: <AlertTriangle className="h-3 w-3 text-amber-600" />,
    error: <AlertTriangle className="h-3 w-3 text-red-600" />,
    default: null,
  };

  const statusColors = {
    valid: "text-green-600",
    warning: "text-amber-600",
    error: "text-red-600",
    default: "text-muted-foreground",
  };

  return (
    <div className="flex items-center gap-2">
      <label className={cn("text-sm font-medium", statusColors[status])}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Quick Tooltip */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Info className="h-4 w-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs" sideOffset={5}>
          <p className="text-sm">{description}</p>
          {example && (
            <p className="text-xs text-muted-foreground mt-1">
              <strong>Example:</strong> {example}
            </p>
          )}
        </TooltipContent>
      </Tooltip>

      {/* Detailed Help Dialog */}
      {(detailedHelp || enumValues) && (
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
            >
              <HelpCircle className="h-4 w-4" />
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {label}
                {required && (
                  <Badge variant="destructive" className="text-xs">
                    Required
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {example && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Example</h4>
                  <code className="text-sm bg-muted p-3 rounded-lg block">
                    {example}
                  </code>
                </div>
              )}

              {validation && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">
                    Validation Rules
                  </h4>
                  <p className="text-sm text-muted-foreground">{validation}</p>
                </div>
              )}

              {enumValues && enumValues.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Valid Values</h4>
                  <div className="flex flex-wrap gap-2">
                    {enumValues.map(value => (
                      <Badge key={value} variant="outline">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {detailedHelp && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">More Details</h4>
                  <p className="text-sm text-muted-foreground">
                    {detailedHelp}
                  </p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Status Indicator */}
      {statusIcons[status]}
    </div>
  );
}
