"use client";

import {
  BarChart3,
  Image as ImageIcon,
  HardDrive,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Download,
  Upload,
  Settings,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
// Remove direct database service import - we'll use API calls instead

import { ImageAnalyticsPanel } from "./ImageAnalyticsPanel";
import { ImageCleanupPanel } from "./ImageCleanupPanel";
import { ImageOptimizationPanel } from "./ImageOptimizationPanel";
import { ProcessedImageInfo } from "./ProcessedImageInfo";

// Define interfaces for the frontend
interface ImageStats {
  totalImages: number;
  totalSize: number;
  averageSize: number;
  formats: Record<string, number>;
  orphanedImages: number;
  invalidImages: number;
}

interface ImageItem {
  id: string;
  url: string;
  filename: string;
  size: number;
  width: number;
  height: number;
  format: string;
  uploadedAt: Date;
  tags?: string[];
  alt?: string;
  status: "valid" | "invalid" | "orphaned" | "processing";
  isSelected: boolean;
}

export function ImageManagementDashboard() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [filteredImages, setFilteredImages] = useState<ImageItem[]>([]);
  const [stats, setStats] = useState<ImageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("uploadedAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationInfo, setPaginationInfo] = useState<{
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  } | null>(null);

  const { toast } = useToast();

  // Load images and stats (optimized)
  const loadImages = useCallback(async () => {
    try {
      setLoading(true);

      // Get data from API endpoints with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const [statusResponse, cleanupResponse, imagesResponse] =
        await Promise.all([
          fetch("/api/admin/images/status", {
            signal: controller.signal,
            headers: {
              "Cache-Control": "max-age=300", // Cache for 5 minutes
            },
          }),
          fetch("/api/admin/images/cleanup", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              cleanupTypes: ["orphaned", "invalid"],
              dryRun: true,
              settings: {
                maxAge: 30,
                maxSize: 5 * 1024 * 1024,
                duplicateThreshold: 0.95,
              },
            }),
            signal: controller.signal,
          }),
          fetch("/api/admin/images/list", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              page: currentPage,
              limit: 20, // Reasonable page size for dashboard
              search: searchTerm || undefined,
              format: formatFilter !== "all" ? formatFilter : undefined,
              status: statusFilter !== "all" ? statusFilter : undefined,
              sortBy,
              sortOrder,
            }),
            signal: controller.signal,
          }),
        ]);

      clearTimeout(timeoutId);

      if (!statusResponse.ok || !cleanupResponse.ok) {
        throw new Error("Failed to fetch image data");
      }

      const statusData = await statusResponse.json();
      const cleanupData = await cleanupResponse.json();

      // Load real images from the list API
      let imagesData = { data: { images: [] } };
      if (imagesResponse.ok) {
        imagesData = await imagesResponse.json();
      } else {
        console.warn("Failed to load images list, using empty array");
      }

      const realImages: ImageItem[] =
        imagesData.data?.images?.map((img: any) => ({
          id: img.id,
          url: img.url,
          filename: img.filename,
          size: img.size,
          width: img.width,
          height: img.height,
          format: img.format,
          uploadedAt: new Date(img.uploadedAt),
          tags: img.tags || [],
          alt: img.alt,
          status: img.status,
          isSelected: false,
        })) || [];

      setImages(realImages);
      setFilteredImages(realImages);

      // Store pagination information
      setPaginationInfo({
        total: imagesData.data.pagination?.total || 0,
        totalPages: imagesData.data.pagination?.totalPages || 0,
        hasNext: imagesData.data.pagination?.hasNext || false,
        hasPrev: imagesData.data.pagination?.hasPrev || false,
      });

      // Extract stats from API response
      const stats: ImageStats = {
        totalImages:
          statusData.statistics?.totalProcessedImages || realImages.length,
        totalSize: realImages.reduce((sum, img) => sum + img.size, 0),
        averageSize:
          realImages.length > 0
            ? realImages.reduce((sum, img) => sum + img.size, 0) /
              realImages.length
            : 0,
        formats: statusData.statistics?.formatDistribution || {},
        orphanedImages: cleanupData.analysis?.orphaned?.count || 0,
        invalidImages: cleanupData.analysis?.invalid?.count || 0,
      };

      setStats(stats);
    } catch (error) {
      console.error("Failed to load images:", error);

      // Handle different types of errors
      let errorMessage = "Failed to load images";
      if (error instanceof Error) {
        if (error.name === "AbortError") {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message.includes("fetch")) {
          errorMessage = "Network error. Please check your connection.";
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      // Set default stats on error to prevent UI breaking
      setStats({
        totalImages: 0,
        totalSize: 0,
        averageSize: 0,
        formats: {},
        orphanedImages: 0,
        invalidImages: 0,
      });
    } finally {
      setLoading(false);
    }
  }, [
    toast,
    sortBy,
    sortOrder,
    currentPage,
    searchTerm,
    formatFilter,
    statusFilter,
  ]);

  // Images are now filtered and sorted server-side, so filteredImages = images
  useEffect(() => {
    setFilteredImages(images);
  }, [images]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, formatFilter, statusFilter, sortBy, sortOrder]);

  // Handle image selection
  const toggleImageSelection = useCallback((imageId: string) => {
    setSelectedImages(prev =>
      prev.includes(imageId)
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  }, []);

  const selectAllImages = useCallback(() => {
    if (selectedImages.length === filteredImages.length) {
      setSelectedImages([]);
    } else {
      setSelectedImages(filteredImages.map(img => img.id));
    }
  }, [selectedImages.length, filteredImages]);

  // Bulk operations
  const deleteSelectedImages = useCallback(async () => {
    if (selectedImages.length === 0) return;

    try {
      const response = await fetch("/api/admin/images/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          operation: "delete",
          imageIds: selectedImages,
          deleteFromStorage: true, // Delete from UploadThing as well
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete images");
      }

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });

        // Remove deleted images from state
        setImages(prev => prev.filter(img => !selectedImages.includes(img.id)));
        setSelectedImages([]);
        loadImages(); // Reload to update stats
      } else {
        throw new Error(result.error || "Delete operation failed");
      }
    } catch (error) {
      console.error("Delete operation failed:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete images",
        variant: "destructive",
      });
    }
  }, [selectedImages, toast, loadImages]);

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "valid":
        return "default";
      case "invalid":
        return "destructive";
      case "orphaned":
        return "secondary";
      case "processing":
        return "outline";
      default:
        return "secondary";
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-4 w-4" />;
      case "invalid":
        return <AlertTriangle className="h-4 w-4" />;
      case "orphaned":
        return <Clock className="h-4 w-4" />;
      case "processing":
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Loading...
                </CardTitle>
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

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Images</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalImages || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across all categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? formatFileSize(stats.totalSize) : "0 Bytes"}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats ? `Avg: ${formatFileSize(stats.averageSize)}` : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Formats</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? Object.keys(stats.formats).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Different file types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats ? stats.orphanedImages + stats.invalidImages : 0}
            </div>
            <p className="text-xs text-muted-foreground">Issues detected</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="cleanup">Cleanup</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardHeader>
              <CardTitle>Image Library</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search images by name, tags, or alt text..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={formatFilter} onValueChange={setFormatFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Formats</SelectItem>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                    <SelectItem value="gif">GIF</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="valid">Valid</SelectItem>
                    <SelectItem value="invalid">Invalid</SelectItem>
                    <SelectItem value="orphaned">Orphaned</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uploadedAt">Upload Date</SelectItem>
                    <SelectItem value="filename">Filename</SelectItem>
                    <SelectItem value="size">File Size</SelectItem>
                    <SelectItem value="format">Format</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() =>
                    setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
                  }
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </Button>
              </div>

              {/* Bulk Actions */}
              {selectedImages.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{selectedImages.length} images selected</span>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={selectAllImages}
                        >
                          {selectedImages.length === filteredImages.length
                            ? "Deselect All"
                            : "Select All"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={deleteSelectedImages}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Selected
                        </Button>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Image Grid */}
          <Card>
            <CardContent className="p-6">
              {filteredImages.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No images found</h3>
                  <p className="text-muted-foreground">
                    Try adjusting your search or filters
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredImages.map((image, index) => (
                    <div
                      key={image.url}
                      className={`relative group border rounded-lg overflow-hidden transition-all ${
                        selectedImages.includes(image.id)
                          ? "ring-2 ring-primary"
                          : ""
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selectedImages.includes(image.id)}
                          onCheckedChange={() => toggleImageSelection(image.id)}
                          className="bg-white/90"
                        />
                      </div>

                      {/* Image */}
                      <div className="aspect-square bg-muted">
                        <img
                          src={image.url}
                          alt={image.alt || image.filename}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={getStatusBadgeVariant(image.status)}
                          size="sm"
                        >
                          {getStatusIcon(image.status)}
                          <span className="ml-1 capitalize">
                            {image.status}
                          </span>
                        </Badge>
                      </div>

                      {/* Image Info */}
                      <div className="p-3 bg-white/95">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-sm truncate">
                            {image.filename}
                          </h4>
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground">
                          <div className="flex justify-between">
                            <span>Size:</span>
                            <span>{formatFileSize(image.size)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Dimensions:</span>
                            <span>
                              {image.width}×{image.height}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span>Format:</span>
                            <span className="uppercase">{image.format}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Uploaded:</span>
                            <span>{image.uploadedAt.toLocaleDateString()}</span>
                          </div>
                        </div>

                        {/* Tags */}
                        {image.tags && image.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {image.tags.slice(0, 3).map((tag, tagIndex) => (
                              <Badge
                                key={tagIndex}
                                variant="secondary"
                                size="sm"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {image.tags.length > 3 && (
                              <Badge variant="outline" size="sm">
                                +{image.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pagination Controls */}
          {paginationInfo && paginationInfo.totalPages > 1 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredImages.length} of {paginationInfo.total}{" "}
                    images
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(prev => Math.max(1, prev - 1))
                      }
                      disabled={!paginationInfo.hasPrev}
                    >
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {/* Show current page and nearby pages */}
                      {Array.from(
                        { length: Math.min(5, paginationInfo.totalPages) },
                        (_, i) => {
                          const pageNum = Math.max(
                            1,
                            Math.min(
                              paginationInfo.totalPages,
                              currentPage - 2 + i
                            )
                          );
                          return (
                            <Button
                              key={pageNum}
                              variant={
                                pageNum === currentPage ? "default" : "outline"
                              }
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              className="w-8 h-8 p-0"
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage(prev =>
                          Math.min(paginationInfo.totalPages, prev + 1)
                        )
                      }
                      disabled={!paginationInfo.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="optimization">
          <ImageOptimizationPanel
            images={filteredImages}
            onRefresh={loadImages}
          />
        </TabsContent>

        <TabsContent value="cleanup">
          <ImageCleanupPanel images={images} onRefresh={loadImages} />
        </TabsContent>

        <TabsContent value="analytics">
          <ImageAnalyticsPanel stats={stats} images={images} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
