"use client";

import React, { useState, useCallback, useEffect } from "react";
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  HardDrive,
  FileImage,
  Download,
  Upload,
  Activity,
  Target,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ImageManagementService, type ImageMetadata } from "@/lib/image-management";

interface ImageAnalyticsPanelProps {
  stats: any;
  images: ImageMetadata[];
}

interface AnalyticsData {
  totalImages: number;
  totalSize: number;
  averageSize: number;
  formats: Record<string, number>;
  sizeDistribution: {
    small: number; // < 100KB
    medium: number; // 100KB - 1MB
    large: number; // 1MB - 5MB
    huge: number; // > 5MB
  };
  uploadTrends: {
    last7Days: number;
    last30Days: number;
    last90Days: number;
  };
  performanceMetrics: {
    averageLoadTime: number;
    compressionRatio: number;
    optimizationScore: number;
  };
  recommendations: string[];
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: string[];
    borderColor: string[];
    borderWidth: number;
  }[];
}

export function ImageAnalyticsPanel({ stats, images }: ImageAnalyticsPanelProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  // Generate analytics data
  const generateAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Simulate analytics generation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockAnalytics: AnalyticsData = {
        totalImages: images.length,
        totalSize: images.reduce((sum, img) => sum + (img.size || 0), 0),
        averageSize: images.length > 0 ? images.reduce((sum, img) => sum + (img.size || 0), 0) / images.length : 0,
        formats: images.reduce((acc, img) => {
          const format = img.format || 'unknown';
          acc[format] = (acc[format] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        sizeDistribution: {
          small: images.filter(img => (img.size || 0) < 100 * 1024).length,
          medium: images.filter(img => (img.size || 0) >= 100 * 1024 && (img.size || 0) < 1024 * 1024).length,
          large: images.filter(img => (img.size || 0) >= 1024 * 1024 && (img.size || 0) < 5 * 1024 * 1024).length,
          huge: images.filter(img => (img.size || 0) >= 5 * 1024 * 1024).length,
        },
        uploadTrends: {
          last7Days: images.filter(img => {
            const daysSinceUpload = (Date.now() - img.uploadedAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceUpload <= 7;
          }).length,
          last30Days: images.filter(img => {
            const daysSinceUpload = (Date.now() - img.uploadedAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceUpload <= 30;
          }).length,
          last90Days: images.filter(img => {
            const daysSinceUpload = (Date.now() - img.uploadedAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceUpload <= 90;
          }).length,
        },
        performanceMetrics: {
          averageLoadTime: 1.2 + Math.random() * 0.8, // 1.2-2.0 seconds
          compressionRatio: 0.65 + Math.random() * 0.25, // 65-90%
          optimizationScore: 70 + Math.random() * 25, // 70-95%
        },
        recommendations: [
          "Convert PNG images to WebP for better compression",
          "Resize images larger than 2MB to improve load times",
          "Implement lazy loading for product galleries",
          "Use progressive JPEGs for better perceived performance",
          "Consider implementing a CDN for global image delivery"
        ]
      };
      
      setAnalyticsData(mockAnalytics);
      
    } catch (error) {
      console.error("Failed to generate analytics:", error);
      toast({
        title: "Analytics Generation Failed",
        description: "Failed to generate image analytics",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [images, toast]);

  // Generate chart data for formats
  const generateFormatsChartData = useCallback((): ChartData => {
    if (!analyticsData) return { labels: [], datasets: [] };
    
    const formatEntries = Object.entries(analyticsData.formats);
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
    
    return {
      labels: formatEntries.map(([format]) => format.toUpperCase()),
      datasets: [{
        label: 'Number of Images',
        data: formatEntries.map(([, count]) => count),
        backgroundColor: colors.slice(0, formatEntries.length),
        borderColor: colors.slice(0, formatEntries.length),
        borderWidth: 1
      }]
    };
  }, [analyticsData]);

  // Generate chart data for size distribution
  const generateSizeDistributionChartData = useCallback((): ChartData => {
    if (!analyticsData) return { labels: [], datasets: [] };
    
    const colors = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];
    
    return {
      labels: ['Small (<100KB)', 'Medium (100KB-1MB)', 'Large (1MB-5MB)', 'Huge (>5MB)'],
      datasets: [{
        label: 'Number of Images',
        data: [
          analyticsData.sizeDistribution.small,
          analyticsData.sizeDistribution.medium,
          analyticsData.sizeDistribution.large,
          analyticsData.sizeDistribution.huge
        ],
        backgroundColor: colors,
        borderColor: colors,
        borderWidth: 1
      }]
    };
  }, [analyticsData]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Get performance score color
  const getPerformanceScoreColor = (score: number): string => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-yellow-600";
    if (score >= 50) return "text-orange-600";
    return "text-red-600";
  };

  // Get performance score badge variant
  const getPerformanceScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 90) return "default";
    if (score >= 70) return "secondary";
    return "destructive";
  };

  useEffect(() => {
    if (images.length > 0) {
      generateAnalytics();
    }
  }, [images, generateAnalytics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No Analytics Available</h3>
          <p className="text-muted-foreground mb-4">
            Generate analytics to view detailed image performance metrics
          </p>
          <Button onClick={generateAnalytics}>
            Generate Analytics
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Time Range:</span>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <FileImage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalImages}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatFileSize(analyticsData.totalSize)}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg: {formatFileSize(analyticsData.averageSize)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upload Trend</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData.uploadTrends.last30Days}
            </div>
            <p className="text-xs text-muted-foreground">
              Last 30 days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Optimization Score</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getPerformanceScoreColor(analyticsData.performanceMetrics.optimizationScore)}`}>
              {Math.round(analyticsData.performanceMetrics.optimizationScore)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Performance score
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Load Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Average Load Time</span>
                <Badge variant="outline">
                  {analyticsData.performanceMetrics.averageLoadTime.toFixed(1)}s
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Compression Ratio</span>
                <Badge variant="outline">
                  {Math.round(analyticsData.performanceMetrics.compressionRatio * 100)}%
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Optimization Score</span>
                <Badge variant={getPerformanceScoreBadgeVariant(analyticsData.performanceMetrics.optimizationScore)}>
                  {Math.round(analyticsData.performanceMetrics.optimizationScore)}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upload Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Last 7 Days</span>
                <Badge variant="outline">
                  {analyticsData.uploadTrends.last7Days}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last 30 Days</span>
                <Badge variant="outline">
                  {analyticsData.uploadTrends.last30Days}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Last 90 Days</span>
                <Badge variant="outline">
                  {analyticsData.uploadTrends.last90Days}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Size Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Small (<100KB)</span>
                <Badge variant="outline">
                  {analyticsData.sizeDistribution.small}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Medium (100KB-1MB)</span>
                <Badge variant="outline">
                  {analyticsData.sizeDistribution.medium}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Large (1MB-5MB)</span>
                <Badge variant="outline">
                  {analyticsData.sizeDistribution.large}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Huge (>5MB)</span>
                <Badge variant="outline">
                  {analyticsData.sizeDistribution.huge}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Format Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Image Format Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Object.entries(analyticsData.formats).map(([format, count]) => (
              <div key={format} className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {Math.round((count / analyticsData.totalImages) * 100)}%
                  </span>
                </div>
                <div className="text-sm font-medium uppercase">{format}</div>
                <div className="text-xs text-muted-foreground">{count} images</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Optimization Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span className="text-sm">{recommendation}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Analytics Report
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Generate Detailed Report
            </Button>
            <Button className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Run Optimization
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
