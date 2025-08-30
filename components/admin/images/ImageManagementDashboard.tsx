"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  ImageManagementService,
  type ImageMetadata,
} from "@/lib/image-management";
import { ImageOptimizationPanel } from "./ImageOptimizationPanel";
import { ImageCleanupPanel } from "./ImageCleanupPanel";
import { ImageAnalyticsPanel } from "./ImageAnalyticsPanel";

interface ImageStats {
  totalImages: number;
  totalSize: number;
  formats: Record<string, number>;
  averageSize: number;
  oldestImage?: Date;
  newestImage?: Date;
  orphanedImages: number;
  invalidImages: number;
}

interface ImageItem extends ImageMetadata {
  isSelected: boolean;
  status: "valid" | "invalid" | "orphaned" | "processing";
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

  const { toast } = useToast();

  // Load images and stats
  const loadImages = useCallback(async () => {
    try {
      setLoading(true);

      // In a real implementation, you'd fetch images from your database
      // For now, we'll simulate with mock data
      const mockImages: ImageItem[] = [
        {
          url: "https://via.placeholder.com/800x600",
          filename: "product-1.jpg",
          size: 1024 * 1024, // 1MB
          width: 800,
          height: 600,
          format: "jpeg",
          uploadedAt: new Date(Date.now() - 86400000), // 1 day ago
          tags: ["product", "electronics"],
          alt: "Product image 1",
          isSelected: false,
          status: "valid",
        },
        {
          url: "https://via.placeholder.com/1200x800",
          filename: "banner-1.png",
          size: 2 * 1024 * 1024, // 2MB
          width: 1200,
          height: 800,
          format: "png",
          uploadedAt: new Date(Date.now() - 172800000), // 2 days ago
          tags: ["banner", "marketing"],
          alt: "Banner image 1",
          isSelected: false,
          status: "valid",
        },
      ];

      setImages(mockImages);
      setFilteredImages(mockImages);

      // Calculate stats
      const imageStats: ImageStats = {
        totalImages: mockImages.length,
        totalSize: mockImages.reduce((sum, img) => sum + img.size, 0),
        formats: mockImages.reduce(
          (acc, img) => {
            acc[img.format || "unknown"] =
              (acc[img.format || "unknown"] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        ),
        averageSize:
          mockImages.reduce((sum, img) => sum + img.size, 0) /
          mockImages.length,
        oldestImage: new Date(
          Math.min(...mockImages.map(img => img.uploadedAt.getTime()))
        ),
        newestImage: new Date(
          Math.max(...mockImages.map(img => img.uploadedAt.getTime()))
        ),
        orphanedImages: 0,
        invalidImages: 0,
      };

      setStats(imageStats);
    } catch (error) {
      console.error("Failed to load images:", error);
      toast({
        title: "Error",
        description: "Failed to load images",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Filter and sort images
  useEffect(() => {
    let filtered = [...images];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        img =>
          img.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
          img.alt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          img.tags?.some(tag =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply format filter
    if (formatFilter !== "all") {
      filtered = filtered.filter(img => img.format === formatFilter);
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(img => img.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortBy as keyof ImageItem];
      let bValue: any = b[sortBy as keyof ImageItem];

      if (sortBy === "uploadedAt") {
        aValue = aValue.getTime();
        bValue = bValue.getTime();
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredImages(filtered);
  }, [images, searchTerm, formatFilter, statusFilter, sortBy, sortOrder]);

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
      setSelectedImages(filteredImages.map(img => img.url));
    }
  }, [selectedImages.length, filteredImages]);

  // Bulk operations
  const deleteSelectedImages = useCallback(async () => {
    if (selectedImages.length === 0) return;

    try {
      const result = await ImageManagementService.deleteImages(selectedImages);

      if (result.success) {
        toast({
          title: "Success",
          description: `Deleted ${result.deleted} images successfully`,
        });

        // Remove deleted images from state
        setImages(prev =>
          prev.filter(img => !selectedImages.includes(img.url))
        );
        setSelectedImages([]);
        loadImages(); // Reload to update stats
      } else {
        toast({
          title: "Error",
          description: `Failed to delete ${result.failed} images`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete images",
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
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
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
                        selectedImages.includes(image.url)
                          ? "ring-2 ring-primary"
                          : ""
                      }`}
                    >
                      {/* Selection Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <Checkbox
                          checked={selectedImages.includes(image.url)}
                          onCheckedChange={() =>
                            toggleImageSelection(image.url)
                          }
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
