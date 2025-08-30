"use client";

import React, { useState, useCallback } from "react";
import {
  Zap,
  Download,
  Upload,
  Settings,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  FileImage,
  HardDrive,
  BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/check";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  ImageManagementService,
  type ImageMetadata,
} from "@/lib/image-management";

interface ImageOptimizationPanelProps {
  images: ImageMetadata[];
  onRefresh: () => void;
}

interface OptimizationJob {
  id: string;
  imageUrl: string;
  filename: string;
  originalSize: number;
  targetFormat: string;
  targetQuality: number;
  targetWidth?: number;
  targetHeight?: number;
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  result?: {
    optimizedUrl: string;
    newSize: number;
    savings: number;
    savingsPercent: number;
  };
  error?: string;
}

interface OptimizationSettings {
  targetFormat: "jpeg" | "png" | "webp" | "avif";
  quality: number;
  maxWidth?: number;
  maxHeight?: number;
  maintainAspectRatio: boolean;
  progressive: boolean;
  stripMetadata: boolean;
}

export function ImageOptimizationPanel({
  images,
  onRefresh,
}: ImageOptimizationPanelProps) {
  const [optimizationJobs, setOptimizationJobs] = useState<OptimizationJob[]>(
    []
  );
  const [settings, setSettings] = useState<OptimizationSettings>({
    targetFormat: "webp",
    quality: 85,
    maxWidth: 1920,
    maxHeight: 1080,
    maintainAspectRatio: true,
    progressive: true,
    stripMetadata: true,
  });
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const { toast } = useToast();

  // Handle image selection
  const toggleImageSelection = useCallback((imageUrl: string) => {
    setSelectedImages(prev =>
      prev.includes(imageUrl)
        ? prev.filter(url => url !== imageUrl)
        : [...prev, imageUrl]
    );
  }, []);

  const selectAllImages = useCallback(() => {
    if (selectedImages.length === images.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(images.map(img => img.url));
    }
  }, [selectedImages.length, images]);

  // Create optimization jobs
  const createOptimizationJobs = useCallback(() => {
    if (selectedImages.length === 0) {
      toast({
        title: "No images selected",
        description: "Please select images to optimize",
        variant: "destructive",
      });
      return;
    }

    const jobs: OptimizationJob[] = selectedImages.map(imageUrl => {
      const image = images.find(img => img.url === imageUrl);
      return {
        id: Math.random().toString(36).substr(2, 9),
        imageUrl,
        filename: image?.filename || "unknown",
        originalSize: image?.size || 0,
        targetFormat: settings.targetFormat,
        targetQuality: settings.quality,
        targetWidth: settings.maxWidth,
        targetHeight: settings.maxHeight,
        status: "pending",
        progress: 0,
      };
    });

    setOptimizationJobs(jobs);
    setIsOptimizing(true);
    setOverallProgress(0);

    // Start processing jobs
    processOptimizationJobs(jobs);
  }, [selectedImages, images, settings, toast]);

  // Process optimization jobs
  const processOptimizationJobs = useCallback(
    async (jobs: OptimizationJob[]) => {
      const totalJobs = jobs.length;
      let completedJobs = 0;

      for (const job of jobs) {
        try {
          // Update job status to processing
          setOptimizationJobs(prev =>
            prev.map(j =>
              j.id === job.id ? { ...j, status: "processing", progress: 10 } : j
            )
          );

          // Simulate optimization process
          await simulateOptimization(job);

          // Update job status to completed
          setOptimizationJobs(prev =>
            prev.map(j =>
              j.id === job.id ? { ...j, status: "completed", progress: 100 } : j
            )
          );

          completedJobs++;
          setOverallProgress((completedJobs / totalJobs) * 100);
        } catch (error) {
          // Update job status to failed
          setOptimizationJobs(prev =>
            prev.map(j =>
              j.id === job.id
                ? {
                    ...j,
                    status: "failed",
                    progress: 0,
                    error:
                      error instanceof Error ? error.message : "Unknown error",
                  }
                : j
            )
          );
        }
      }

      setIsOptimizing(false);

      if (completedJobs === totalJobs) {
        toast({
          title: "Optimization Complete",
          description: `Successfully optimized ${completedJobs} images`,
        });
      } else {
        toast({
          title: "Optimization Partially Complete",
          description: `${completedJobs} of ${totalJobs} images optimized successfully`,
          variant: "destructive",
        });
      }
    },
    [toast]
  );

  // Simulate optimization process
  const simulateOptimization = async (job: OptimizationJob): Promise<void> => {
    return new Promise((resolve, reject) => {
      let progress = 10;
      const interval = setInterval(() => {
        progress += Math.random() * 20;

        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          // Generate mock optimization result
          const originalSize = job.originalSize;
          const newSize = Math.floor(
            originalSize * (0.6 + Math.random() * 0.3)
          ); // 30-60% reduction
          const savings = originalSize - newSize;
          const savingsPercent = (savings / originalSize) * 100;

          setOptimizationJobs(prev =>
            prev.map(j =>
              j.id === job.id
                ? {
                    ...j,
                    progress: 100,
                    result: {
                      optimizedUrl: `https://via.placeholder.com/800x600?text=Optimized+${job.targetFormat.toUpperCase()}`,
                      newSize,
                      savings,
                      savingsPercent,
                    },
                  }
                : j
            )
          );

          resolve();
        } else {
          setOptimizationJobs(prev =>
            prev.map(j => (j.id === job.id ? { ...j, progress } : j))
          );
        }
      }, 200);
    });
  };

  // Download optimized images
  const downloadOptimizedImages = useCallback(async () => {
    const completedJobs = optimizationJobs.filter(
      job => job.status === "completed" && job.result
    );

    if (completedJobs.length === 0) {
      toast({
        title: "No optimized images",
        description: "Please complete optimization first",
        variant: "destructive",
      });
      return;
    }

    // In a real implementation, you would create a zip file and trigger download
    toast({
      title: "Download Started",
      description: `Preparing ${completedJobs.length} optimized images for download`,
    });
  }, [optimizationJobs, toast]);

  // Clear completed jobs
  const clearCompletedJobs = useCallback(() => {
    setOptimizationJobs(prev => prev.filter(job => job.status !== "completed"));
  }, []);

  // Calculate total savings
  const totalSavings = optimizationJobs
    .filter(job => job.result)
    .reduce((sum, job) => sum + (job.result?.savings || 0), 0);

  const totalSavingsPercent =
    optimizationJobs
      .filter(job => job.result)
      .reduce((sum, job) => sum + (job.result?.savingsPercent || 0), 0) /
    Math.max(optimizationJobs.filter(job => job.result).length, 1);

  return (
    <div className="space-y-6">
      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Optimization Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="targetFormat">Target Format</Label>
              <Select
                value={settings.targetFormat}
                onValueChange={(value: "jpeg" | "png" | "webp" | "avif") =>
                  setSettings(prev => ({ ...prev, targetFormat: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="webp">WebP (Best compression)</SelectItem>
                  <SelectItem value="avif">
                    AVIF (Modern, high quality)
                  </SelectItem>
                  <SelectItem value="jpeg">JPEG (Widely supported)</SelectItem>
                  <SelectItem value="png">
                    PNG (Lossless, transparency)
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality">Quality</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="quality"
                  type="range"
                  min="1"
                  max="100"
                  value={settings.quality}
                  onChange={e =>
                    setSettings(prev => ({
                      ...prev,
                      quality: parseInt(e.target.value),
                    }))
                  }
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">
                  {settings.quality}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxWidth">Max Width</Label>
              <Input
                id="maxWidth"
                type="number"
                value={settings.maxWidth || ""}
                onChange={e =>
                  setSettings(prev => ({
                    ...prev,
                    maxWidth: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="Auto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxHeight">Max Height</Label>
              <Input
                id="maxHeight"
                type="number"
                value={settings.maxHeight || ""}
                onChange={e =>
                  setSettings(prev => ({
                    ...prev,
                    maxHeight: e.target.value
                      ? parseInt(e.target.value)
                      : undefined,
                  }))
                }
                placeholder="Auto"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="maintainAspectRatio"
                  checked={settings.maintainAspectRatio}
                  onCheckedChange={checked =>
                    setSettings(prev => ({
                      ...prev,
                      maintainAspectRatio: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="maintainAspectRatio">
                  Maintain Aspect Ratio
                </Label>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="progressive"
                  checked={settings.progressive}
                  onCheckedChange={checked =>
                    setSettings(prev => ({
                      ...prev,
                      progressive: checked as boolean,
                    }))
                  }
                />
                <Label htmlFor="progressive">Progressive Loading</Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Image Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileImage className="h-5 w-5" />
            Select Images to Optimize
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedImages.length === images.length}
                onCheckedChange={selectAllImages}
              />
              <span className="text-sm text-muted-foreground">
                {selectedImages.length} of {images.length} images selected
              </span>
            </div>

            <Button
              onClick={createOptimizationJobs}
              disabled={selectedImages.length === 0 || isOptimizing}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Start Optimization
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {images.map(image => (
              <div
                key={image.url}
                className={`relative border rounded-lg overflow-hidden cursor-pointer transition-all ${
                  selectedImages.includes(image.url)
                    ? "ring-2 ring-primary"
                    : "hover:border-primary/50"
                }`}
                onClick={() => toggleImageSelection(image.url)}
              >
                <div className="aspect-square bg-muted">
                  <img
                    src={image.url}
                    alt={image.alt || image.filename}
                    className="w-full h-full object-cover"
                  />
                </div>

                {selectedImages.includes(image.url) && (
                  <div className="absolute top-2 right-2">
                    <CheckCircle className="h-4 w-4 text-primary bg-white rounded-full" />
                  </div>
                )}

                <div className="p-2 text-xs">
                  <div className="font-medium truncate">{image.filename}</div>
                  <div className="text-muted-foreground">
                    {Math.round(image.size / 1024)} KB
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Progress */}
      {optimizationJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw
                className={`h-5 w-5 ${isOptimizing ? "animate-spin" : ""}`}
              />
              Optimization Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Overall Progress</span>
                <span>{Math.round(overallProgress)}%</span>
              </div>
              <Progress value={overallProgress} className="h-2" />
            </div>

            {/* Individual Jobs */}
            <div className="space-y-3">
              {optimizationJobs.map(job => (
                <div key={job.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {job.filename}
                      </span>
                      <Badge
                        variant={
                          job.status === "completed"
                            ? "default"
                            : job.status === "failed"
                              ? "destructive"
                              : job.status === "processing"
                                ? "secondary"
                                : "outline"
                        }
                      >
                        {job.status === "completed" && (
                          <CheckCircle className="h-3 w-3 mr-1" />
                        )}
                        {job.status === "failed" && (
                          <AlertTriangle className="h-3 w-3 mr-1" />
                        )}
                        {job.status === "processing" && (
                          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                        )}
                        {job.status}
                      </Badge>
                    </div>

                    {job.result && (
                      <div className="text-sm text-muted-foreground">
                        <span className="text-green-600 font-medium">
                          -{Math.round(job.result.savingsPercent)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{Math.round(job.progress)}%</span>
                    </div>
                    <Progress value={job.progress} className="h-1" />
                  </div>

                  {job.result && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      <div className="flex justify-between">
                        <span>Original:</span>
                        <span>{Math.round(job.originalSize / 1024)} KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Optimized:</span>
                        <span>{Math.round(job.result.newSize / 1024)} KB</span>
                      </div>
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Saved:</span>
                        <span>{Math.round(job.result.savings / 1024)} KB</span>
                      </div>
                    </div>
                  )}

                  {job.error && (
                    <div className="mt-2 text-xs text-red-600">
                      Error: {job.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Results Summary */}
            {optimizationJobs.some(job => job.status === "completed") && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                    <h4 className="font-medium">Optimization Results</h4>
                    <p className="text-sm text-muted-foreground">
                      Total space saved: {Math.round(totalSavings / 1024)} KB (
                      {Math.round(totalSavingsPercent)}%)
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearCompletedJobs}
                    >
                      Clear Completed
                    </Button>
                    <Button
                      size="sm"
                      onClick={downloadOptimizedImages}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download All
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
