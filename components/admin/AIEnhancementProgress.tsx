"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Bot,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { EnhancementProgress } from "@/lib/ai";

interface AIEnhancementProgressProps {
  progress: EnhancementProgress;
  onCancel?: () => void;
  className?: string;
}

export function AIEnhancementProgress({
  progress,
  onCancel,
  className,
}: AIEnhancementProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (!progress?.startTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - progress.startTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [progress?.startTime]);

  // Safety check - if progress is null, don't render
  if (!progress) {
    return null;
  }

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  const formatEstimatedTime = (ms?: number) => {
    if (!ms) return "Calculating...";
    return formatTime(ms);
  };

  const progressPercentage =
    progress.total > 0 ? (progress.processed / progress.total) * 100 : 0;
  const successRate =
    progress.processed > 0
      ? (progress.successful / progress.processed) * 100
      : 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg">AI Enhancement Progress</CardTitle>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              Processing
            </Badge>
          </div>
          {onCancel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCancel}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-medium">
              {progress.processed} / {progress.total} products
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progressPercentage.toFixed(1)}% complete</span>
            {progress.estimatedTimeRemaining && (
              <span>
                ~{formatEstimatedTime(progress.estimatedTimeRemaining)}{" "}
                remaining
              </span>
            )}
          </div>
        </div>

        {/* Current Product */}
        {progress.currentProduct && (
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 dark:text-blue-100">
                  Currently enhancing:
                </p>
                <p className="text-blue-700 dark:text-blue-200">
                  {progress.currentProduct}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-lg font-bold text-green-600">
                {progress.successful}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Successful</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-lg font-bold text-red-600">
                {progress.failed}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Failed</p>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-lg font-bold text-blue-600">
                {successRate.toFixed(1)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Success Rate</p>
          </div>
        </div>

        {/* Timing Information */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>Elapsed: {formatTime(elapsedTime)}</span>
          </div>
          {progress.estimatedTimeRemaining && (
            <span>
              Est. remaining:{" "}
              {formatEstimatedTime(progress.estimatedTimeRemaining)}
            </span>
          )}
        </div>

        {/* Errors */}
        {progress.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-destructive">
              Recent Errors:
            </h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {progress.errors.slice(-3).map((error, index) => (
                <Alert key={index} variant="destructive" className="py-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>{error.product}:</strong> {error.error}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Completion Message */}
        {progress.processed === progress.total && progress.total > 0 && (
          <Alert className="border-green-200 bg-green-50 dark:bg-green-950/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              AI enhancement completed! {progress.successful} out of{" "}
              {progress.total} products were successfully enhanced.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
