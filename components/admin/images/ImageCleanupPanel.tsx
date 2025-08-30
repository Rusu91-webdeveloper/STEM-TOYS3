"use client";

import React, { useState, useCallback, useEffect } from "react";
import {
  Trash2,
  Search,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  RefreshCw,
  Download,
  Upload,
  FileImage,
  Shield,
  Info,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  ImageManagementServiceClient,
  type ImageMetadata,
} from "@/lib/image-management-client";

interface ImageCleanupPanelProps {
  images: ImageMetadata[];
  onRefresh: () => void;
}

interface CleanupAnalysis {
  totalImages: number;
  orphanedImages: ImageMetadata[];
  invalidImages: ImageMetadata[];
  duplicateImages: ImageMetadata[][];
  largeImages: ImageMetadata[];
  oldImages: ImageMetadata[];
  potentialSavings: number;
  recommendations: string[];
}

interface CleanupJob {
  id: string;
  type: "orphaned" | "invalid" | "duplicate" | "large" | "old";
  images: ImageMetadata[];
  status: "pending" | "processing" | "completed" | "failed";
  progress: number;
  result?: {
    deleted: number;
    failed: number;
    savings: number;
  };
  error?: string;
}

export function ImageCleanupPanel({
  images,
  onRefresh,
}: ImageCleanupPanelProps) {
  const [analysis, setAnalysis] = useState<CleanupAnalysis | null>(null);
  const [cleanupJobs, setCleanupJobs] = useState<CleanupJob[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCleaning, setIsCleaning] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [selectedCleanupTypes, setSelectedCleanupTypes] = useState<string[]>(
    []
  );

  const { toast } = useToast();

  // Analyze images for cleanup opportunities
  const analyzeImages = useCallback(async () => {
    try {
      setIsAnalyzing(true);

      // Simulate analysis process
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Mock analysis results
      const mockAnalysis: CleanupAnalysis = {
        totalImages: images.length,
        orphanedImages: images.slice(0, Math.min(2, images.length)),
        invalidImages: [],
        duplicateImages: [
          images.slice(0, 2), // Mock duplicate group
        ],
        largeImages: images.filter(img => (img.size || 0) > 1024 * 1024), // > 1MB
        oldImages: images.filter(img => {
          const daysSinceUpload =
            (Date.now() - img.uploadedAt.getTime()) / (1000 * 60 * 60 * 24);
          return daysSinceUpload > 30; // > 30 days
        }),
        potentialSavings:
          images.reduce((sum, img) => sum + (img.size || 0), 0) * 0.3, // Estimate 30% savings
        recommendations: [
          "Remove orphaned images to free up storage",
          "Convert large images to WebP format for better compression",
          "Archive old images that haven't been accessed recently",
          "Remove duplicate images to reduce redundancy",
        ],
      };

      setAnalysis(mockAnalysis);

      toast({
        title: "Analysis Complete",
        description: `Found ${mockAnalysis.orphanedImages.length + mockAnalysis.duplicateImages.length} cleanup opportunities`,
      });
    } catch (error) {
      console.error("Analysis failed:", error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze images for cleanup",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [images, toast]);

  // Handle cleanup type selection
  const toggleCleanupType = useCallback((type: string) => {
    setSelectedCleanupTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  }, []);

  const selectAllCleanupTypes = useCallback(() => {
    if (!analysis) return;

    const allTypes = [
      "orphaned",
      "invalid",
      "duplicate",
      "large",
      "old",
    ].filter(type => {
      switch (type) {
        case "orphaned":
          return analysis.orphanedImages.length > 0;
        case "invalid":
          return analysis.invalidImages.length > 0;
        case "duplicate":
          return analysis.duplicateImages.length > 0;
        case "large":
          return analysis.largeImages.length > 0;
        case "old":
          return analysis.oldImages.length > 0;
        default:
          return false;
      }
    });

    setSelectedCleanupTypes(allTypes);
  }, [analysis]);

  // Start cleanup process
  const startCleanup = useCallback(async () => {
    if (selectedCleanupTypes.length === 0 || !analysis) {
      toast({
        title: "No cleanup types selected",
        description: "Please select what you want to clean up",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsCleaning(true);
      setOverallProgress(0);

      const jobs: CleanupJob[] = selectedCleanupTypes.map(type => {
        let imagesToClean: ImageMetadata[] = [];

        switch (type) {
          case "orphaned":
            imagesToClean = analysis.orphanedImages;
            break;
          case "invalid":
            imagesToClean = analysis.invalidImages;
            break;
          case "duplicate":
            imagesToClean = analysis.duplicateImages.flat();
            break;
          case "large":
            imagesToClean = analysis.largeImages;
            break;
          case "old":
            imagesToClean = analysis.oldImages;
            break;
        }

        return {
          id: Math.random().toString(36).substr(2, 9),
          type: type as any,
          images: imagesToClean,
          status: "pending",
          progress: 0,
        };
      });

      setCleanupJobs(jobs);

      // Process cleanup jobs
      await processCleanupJobs(jobs);
    } catch (error) {
      console.error("Cleanup failed:", error);
      toast({
        title: "Cleanup Failed",
        description: "Failed to start cleanup process",
        variant: "destructive",
      });
    }
  }, [selectedCleanupTypes, analysis, toast]);

  // Process cleanup jobs
  const processCleanupJobs = useCallback(
    async (jobs: CleanupJob[]) => {
      const totalJobs = jobs.length;
      let completedJobs = 0;

      for (const job of jobs) {
        try {
          // Update job status to processing
          setCleanupJobs(prev =>
            prev.map(j =>
              j.id === job.id ? { ...j, status: "processing", progress: 10 } : j
            )
          );

          // Simulate cleanup process
          await simulateCleanup(job);

          // Update job status to completed
          setCleanupJobs(prev =>
            prev.map(j =>
              j.id === job.id ? { ...j, status: "completed", progress: 100 } : j
            )
          );

          completedJobs++;
          setOverallProgress((completedJobs / totalJobs) * 100);
        } catch (error) {
          // Update job status to failed
          setCleanupJobs(prev =>
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

      setIsCleaning(false);

      if (completedJobs === totalJobs) {
        toast({
          title: "Cleanup Complete",
          description: `Successfully cleaned up ${completedJobs} image groups`,
        });

        // Refresh the main image list
        onRefresh();
      } else {
        toast({
          title: "Cleanup Partially Complete",
          description: `${completedJobs} of ${totalJobs} cleanup jobs completed successfully`,
          variant: "destructive",
        });
      }
    },
    [toast, onRefresh]
  );

  // Simulate cleanup process
  const simulateCleanup = async (job: CleanupJob): Promise<void> => {
    return new Promise((resolve, reject) => {
      let progress = 10;
      const interval = setInterval(() => {
        progress += Math.random() * 30;

        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          // Generate mock cleanup result
          const totalSize = job.images.reduce(
            (sum, img) => sum + (img.size || 0),
            0
          );
          const deleted = Math.floor(job.images.length * 0.9); // 90% success rate
          const failed = job.images.length - deleted;
          const savings = totalSize * (deleted / job.images.length);

          setCleanupJobs(prev =>
            prev.map(j =>
              j.id === job.id
                ? {
                    ...j,
                    progress: 100,
                    result: {
                      deleted,
                      failed,
                      savings,
                    },
                  }
                : j
            )
          );

          resolve();
        } else {
          setCleanupJobs(prev =>
            prev.map(j => (j.id === job.id ? { ...j, progress } : j))
          );
        }
      }, 300);
    });
  };

  // Get cleanup type info
  const getCleanupTypeInfo = useCallback(
    (type: string) => {
      if (!analysis) return { count: 0, description: "", icon: null };

      switch (type) {
        case "orphaned":
          return {
            count: analysis.orphanedImages.length,
            description: "Images not referenced by any product or content",
            icon: <AlertTriangle className="h-4 w-4 text-orange-500" />,
          };
        case "invalid":
          return {
            count: analysis.invalidImages.length,
            description: "Images with corrupted or invalid data",
            icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          };
        case "duplicate":
          return {
            count: analysis.duplicateImages.reduce(
              (sum, group) => sum + group.length,
              0
            ),
            description: "Duplicate images that can be consolidated",
            icon: <FileImage className="h-4 w-4 text-blue-500" />,
          };
        case "large":
          return {
            count: analysis.largeImages.length,
            description: "Images larger than 1MB that could be optimized",
            icon: <HardDrive className="h-4 w-4 text-purple-500" />,
          };
        case "old":
          return {
            count: analysis.oldImages.length,
            description: "Images older than 30 days that could be archived",
            icon: <Clock className="h-4 w-4 text-gray-500" />,
          };
        default:
          return { count: 0, description: "", icon: null };
      }
    },
    [analysis]
  );

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get cleanup type badge variant
  const getCleanupTypeBadgeVariant = (type: string) => {
    switch (type) {
      case "orphaned":
        return "secondary";
      case "invalid":
        return "destructive";
      case "duplicate":
        return "outline";
      case "large":
        return "default";
      case "old":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Get cleanup type icon
  const getCleanupTypeIcon = (type: string) => {
    switch (type) {
      case "orphaned":
        return <AlertTriangle className="h-4 w-4" />;
      case "invalid":
        return <AlertTriangle className="h-4 w-4" />;
      case "duplicate":
        return <FileImage className="h-4 w-4" />;
      case "large":
        return <HardDrive className="h-4 w-4" />;
      case "old":
        return <Clock className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  // Calculate total potential savings
  const totalPotentialSavings = cleanupJobs
    .filter(job => job.result)
    .reduce((sum, job) => sum + (job.result?.savings || 0), 0);

  useEffect(() => {
    // Auto-analyze when component mounts
    if (images.length > 0) {
      analyzeImages();
    }
  }, [images, analyzeImages]);

  return (
    <div className="space-y-6">
      {/* Analysis Results */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Cleanup Analysis Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {["orphaned", "invalid", "duplicate", "large", "old"].map(
                type => {
                  const info = getCleanupTypeInfo(type);
                  if (info.count === 0) return null;

                  return (
                    <div
                      key={type}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        selectedCleanupTypes.includes(type)
                          ? "ring-2 ring-primary border-primary"
                          : "hover:border-primary/50"
                      }`}
                      onClick={() => toggleCleanupType(type)}
                    >
                      <div className="flex items-center gap-3">
                        {info.icon}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium capitalize">{type}</h4>
                            <Badge variant={getCleanupTypeBadgeVariant(type)}>
                              {info.count}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {info.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              )}
            </div>

            {/* Recommendations */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">Recommendations</h4>
              <div className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={selectAllCleanupTypes}
                >
                  Select All
                </Button>
                <span className="text-sm text-muted-foreground">
                  {selectedCleanupTypes.length} cleanup types selected
                </span>
              </div>

              <Button
                onClick={startCleanup}
                disabled={selectedCleanupTypes.length === 0 || isCleaning}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Start Cleanup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cleanup Progress */}
      {cleanupJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw
                className={`h-5 w-5 ${isCleaning ? "animate-spin" : ""}`}
              />
              Cleanup Progress
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
              {cleanupJobs.map(job => (
                <div key={job.id} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm capitalize">
                        {job.type}
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
                          {job.result.deleted} deleted
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
                        <span>Images processed:</span>
                        <span>{job.images.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Successfully deleted:</span>
                        <span>{job.result.deleted}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Failed:</span>
                        <span>{job.result.failed}</span>
                      </div>
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Space freed:</span>
                        <span>{formatFileSize(job.result.savings)}</span>
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
            {cleanupJobs.some(job => job.status === "completed") && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium">Cleanup Results</h4>
                    <p className="text-sm text-muted-foreground">
                      Total space freed: {formatFileSize(totalPotentialSavings)}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCleanupJobs([])}
                  >
                    Clear Results
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Actions */}
      {!analysis && (
        <Card>
          <CardContent className="p-6 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Ready to Analyze</h3>
            <p className="text-muted-foreground mb-4">
              Analyze your images to find cleanup opportunities
            </p>
            <Button
              onClick={analyzeImages}
              disabled={isAnalyzing}
              className="flex items-center gap-2"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Start Analysis
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
