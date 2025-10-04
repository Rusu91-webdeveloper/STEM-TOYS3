"use client";

import { useState, useEffect } from "react";
import {
  Image,
  Upload,
  Search,
  Filter,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  FileImage,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface ImageMetadata {
  id: string;
  originalUrl: string;
  filename: string;
  fileSize: number;
  width?: number;
  height?: number;
  format: string;
  uploadedAt: string;
  processedSizes?: any;
  optimizationStats?: any;
  tags: string[];
  alt?: string;
  description?: string;
  processingLogs: ProcessingLog[];
}

interface ProcessingLog {
  id: string;
  operation: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export function ImageProcessingManager() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formatFilter, setFormatFilter] = useState<string>("ALL");
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(
    null
  );
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/images/list");
      if (!response.ok) {
        throw new Error("Failed to fetch images");
      }

      const data = await response.json();
      setImages(data.images || []);
    } catch (err) {
      console.error("Error fetching images:", err);
      setError(err instanceof Error ? err.message : "Failed to load images");
    } finally {
      setLoading(false);
    }
  };

  const optimizeImages = async (imageIds: string[]) => {
    try {
      setProcessing(true);
      setError(null);
      setSuccess(null);

      const response = await fetch("/api/admin/images/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to optimize images");
      }

      const result = await response.json();
      setSuccess(`Successfully optimized ${result.optimizedCount} images`);
      await fetchImages();
    } catch (err) {
      console.error("Error optimizing images:", err);
      setError(
        err instanceof Error ? err.message : "Failed to optimize images"
      );
    } finally {
      setProcessing(false);
    }
  };

  const deleteImages = async (imageIds: string[]) => {
    if (
      !confirm(`Are you sure you want to delete ${imageIds.length} image(s)?`)
    ) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const response = await fetch("/api/admin/images/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageIds }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete images");
      }

      setSuccess(`Successfully deleted ${imageIds.length} image(s)`);
      await fetchImages();
    } catch (err) {
      console.error("Error deleting images:", err);
      setError(err instanceof Error ? err.message : "Failed to delete images");
    } finally {
      setProcessing(false);
    }
  };

  const updateImageMetadata = async (
    imageId: string,
    metadata: Partial<ImageMetadata>
  ) => {
    try {
      const response = await fetch(`/api/admin/images/metadata/${imageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error("Failed to update image metadata");
      }

      setSuccess("Image metadata updated successfully");
      await fetchImages();
      setSelectedImage(null);
    } catch (err) {
      console.error("Error updating metadata:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update metadata"
      );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const filteredImages = images.filter(image => {
    const matchesSearch =
      image.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.alt?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      image.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFormat =
      formatFilter === "ALL" || image.format === formatFilter;
    return matchesSearch && matchesFormat;
  });

  const getProcessingStatus = (logs: ProcessingLog[]) => {
    if (logs.length === 0) return { status: "pending", icon: Clock };

    const latestLog = logs[logs.length - 1];
    switch (latestLog.status) {
      case "completed":
        return { status: "completed", icon: CheckCircle };
      case "failed":
        return { status: "failed", icon: AlertCircle };
      case "processing":
        return { status: "processing", icon: RefreshCw };
      default:
        return { status: "pending", icon: Clock };
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading images...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Image Processing</h1>
          <p className="text-gray-600 mt-2">
            Manage image uploads, optimization, and metadata
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchImages} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="w-4 h-4 mr-2" />
                Upload Images
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Images</DialogTitle>
                <DialogDescription>
                  Upload multiple images for processing and optimization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image-upload">Select Images</Label>
                  <Input
                    id="image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowUploadDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button>Upload</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">
              {images.length}
            </div>
            <div className="text-sm text-gray-600">Total Images</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {
                images.filter(img =>
                  img.processingLogs.some(log => log.status === "completed")
                ).length
              }
            </div>
            <div className="text-sm text-gray-600">Optimized</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {
                images.filter(img =>
                  img.processingLogs.some(log => log.status === "processing")
                ).length
              }
            </div>
            <div className="text-sm text-gray-600">Processing</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {
                images.filter(img =>
                  img.processingLogs.some(log => log.status === "failed")
                ).length
              }
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search images..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Formats</SelectItem>
                <SelectItem value="jpeg">JPEG</SelectItem>
                <SelectItem value="png">PNG</SelectItem>
                <SelectItem value="webp">WebP</SelectItem>
                <SelectItem value="gif">GIF</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                onClick={() =>
                  optimizeImages(filteredImages.map(img => img.id))
                }
                disabled={processing || filteredImages.length === 0}
                variant="outline"
              >
                <Settings className="w-4 h-4 mr-2" />
                Optimize All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Images Table */}
      <Card>
        <CardHeader>
          <CardTitle>Images ({filteredImages.length})</CardTitle>
          <CardDescription>
            Manage your image library and processing status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredImages.length === 0 ? (
            <div className="text-center py-8">
              <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No images found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Preview</TableHead>
                    <TableHead>Filename</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Dimensions</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredImages.map(image => {
                    const { status, icon: StatusIcon } = getProcessingStatus(
                      image.processingLogs
                    );
                    return (
                      <TableRow key={image.id}>
                        <TableCell>
                          <img
                            src={image.originalUrl}
                            alt={image.alt || image.filename}
                            className="w-12 h-12 object-cover rounded"
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900 truncate max-w-48">
                              {image.filename}
                            </div>
                            {image.alt && (
                              <div className="text-sm text-gray-500 truncate max-w-48">
                                {image.alt}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {image.format.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatFileSize(image.fileSize)}</TableCell>
                        <TableCell>
                          {image.width && image.height
                            ? `${image.width}×${image.height}`
                            : "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status === "completed"
                                ? "default"
                                : status === "failed"
                                  ? "destructive"
                                  : status === "processing"
                                    ? "secondary"
                                    : "outline"
                            }
                          >
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(image.uploadedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setSelectedImage(image)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => optimizeImages([image.id])}
                              disabled={processing}
                            >
                              <Settings className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteImages([image.id])}
                              disabled={processing}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Details Dialog */}
      {selectedImage && (
        <Dialog
          open={!!selectedImage}
          onOpenChange={() => setSelectedImage(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Image Details</DialogTitle>
              <DialogDescription>
                View and edit image metadata and processing logs
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Image Preview */}
              <div className="flex justify-center">
                <img
                  src={selectedImage.originalUrl}
                  alt={selectedImage.alt || selectedImage.filename}
                  className="max-w-full max-h-64 object-contain rounded-lg border"
                />
              </div>

              {/* Metadata Form */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="alt">Alt Text</Label>
                  <Input
                    id="alt"
                    value={selectedImage.alt || ""}
                    onChange={e =>
                      setSelectedImage({
                        ...selectedImage,
                        alt: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={selectedImage.description || ""}
                    onChange={e =>
                      setSelectedImage({
                        ...selectedImage,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  value={selectedImage.tags.join(", ")}
                  onChange={e =>
                    setSelectedImage({
                      ...selectedImage,
                      tags: e.target.value.split(",").map(tag => tag.trim()),
                    })
                  }
                />
              </div>

              {/* Processing Logs */}
              <div>
                <h4 className="font-semibold mb-2">Processing Logs</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {selectedImage.processingLogs.map(log => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div>
                        <span className="font-medium">{log.operation}</span>
                        <span className="text-sm text-gray-500 ml-2">
                          {new Date(log.startedAt).toLocaleString()}
                        </span>
                      </div>
                      <Badge
                        variant={
                          log.status === "completed"
                            ? "default"
                            : log.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {log.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setSelectedImage(null)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    updateImageMetadata(selectedImage.id, {
                      alt: selectedImage.alt,
                      description: selectedImage.description,
                      tags: selectedImage.tags,
                    })
                  }
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
