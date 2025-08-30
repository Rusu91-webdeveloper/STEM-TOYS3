"use client";

import React, { useState, useCallback, useRef } from "react";
import { UploadButton } from "@uploadthing/react";
import {
  Trash2,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  X,
  RotateCcw,
} from "lucide-react";
import Image from "next/image";
import { Button } from "./button";
import { Badge } from "./badge";
import { Alert, AlertDescription } from "./alert";
import { OurFileRouter } from "@/lib/uploadthing";
import {
  validateImage,
  formatFileSize,
  IMAGE_DIMENSIONS,
  type ImageValidationResult,
} from "@/lib/image-validation";

interface EnhancedImageUploaderProps {
  endpoint: keyof OurFileRouter;
  maxImages?: number;
  initialImages?: string[];
  onImagesChange?: (imageUrls: string[]) => void;
  validationMode?: "strict" | "lenient" | "custom";
  customValidation?: (file: File) => Promise<ImageValidationResult>;
  showMetadata?: boolean;
  allowReordering?: boolean;
  className?: string;
}

interface ImageItem {
  url: string;
  id: string;
  metadata?: {
    width: number;
    height: number;
    size: number;
    format: string;
    aspectRatio: number;
  };
  validationStatus: "pending" | "validating" | "valid" | "invalid" | "error";
  validationResult?: ImageValidationResult;
}

export function EnhancedImageUploader({
  endpoint,
  maxImages = 10,
  initialImages = [],
  onImagesChange,
  validationMode = "strict",
  customValidation,
  showMetadata = true,
  allowReordering = true,
  className = "",
}: EnhancedImageUploaderProps) {
  const [images, setImages] = useState<ImageItem[]>(
    initialImages.map(url => ({
      url,
      id: Math.random().toString(36).substr(2, 9),
      validationStatus: "pending",
    }))
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update parent component when images change
  const notifyParent = useCallback(
    (newImages: ImageItem[]) => {
      if (onImagesChange) {
        onImagesChange(newImages.map(img => img.url));
      }
    },
    [onImagesChange]
  );

  // Validate image file
  const validateImageFile = useCallback(
    async (file: File): Promise<ImageValidationResult> => {
      if (customValidation) {
        return customValidation(file);
      }

      switch (validationMode) {
        case "strict":
          return validateImage(file, {
            maxSize: 2 * 1024 * 1024, // 2MB
            maxWidth: 2000,
            maxHeight: 2000,
            minWidth: 400,
            minHeight: 400,
            allowedFormats: ["jpeg", "png", "webp"],
          });
        case "lenient":
          return validateImage(file, {
            maxSize: 8 * 1024 * 1024, // 8MB
            maxWidth: 4000,
            maxHeight: 4000,
            minWidth: 100,
            minHeight: 100,
            allowedFormats: ["jpeg", "png", "webp", "gif"],
          });
        default:
          return validateImage(file);
      }
    },
    [validationMode, customValidation]
  );

  // Handle file selection and validation
  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (!files || images.length >= maxImages) return;

      setUploading(true);
      setValidationErrors([]);

      for (const file of files) {
        if (images.length >= maxImages) break;

        try {
          // Validate image
          const validationResult = await validateImageFile(file);

          if (!validationResult.isValid) {
            setValidationErrors(prev => [...prev, ...validationResult.errors]);
            continue;
          }

          // Create temporary image item
          const tempImage: ImageItem = {
            url: URL.createObjectURL(file),
            id: Math.random().toString(36).substr(2, 9),
            validationStatus: "valid",
            validationResult,
            metadata: validationResult.metadata,
          };

          setImages(prev => [...prev, tempImage]);
          notifyParent([...images, tempImage]);

          // Show warnings if any
          if (validationResult.warnings.length > 0) {
            setValidationErrors(prev => [
              ...prev,
              ...validationResult.warnings,
            ]);
          }
        } catch (error) {
          setValidationErrors(prev => [
            ...prev,
            `Failed to validate ${file.name}: ${error}`,
          ]);
        }
      }

      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [images, maxImages, validateImageFile, notifyParent]
  );

  // Handle UploadThing completion
  const handleUploadComplete = useCallback(
    (res: { fileUrl: string }[]) => {
      const newImageUrls = res.map(file => file.fileUrl);

      // Replace temporary URLs with permanent ones
      setImages(prev => {
        const updated = prev.map((img, index) => {
          if (img.url.startsWith("blob:")) {
            return {
              ...img,
              url: newImageUrls[index] || img.url,
              validationStatus: "valid" as const,
            };
          }
          return img;
        });

        notifyParent(updated);
        return updated;
      });
    },
    [notifyParent]
  );

  // Handle UploadThing error
  const handleUploadError = useCallback((error: Error) => {
    setValidationErrors(prev => [...prev, `Upload failed: ${error.message}`]);
  }, []);

  // Remove image
  const removeImage = useCallback(
    (index: number) => {
      setImages(prev => {
        const updated = prev.filter((_, i) => i !== index);
        notifyParent(updated);
        return updated;
      });
    },
    [notifyParent]
  );

  // Drag and drop reordering
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = "move";
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
      e.preventDefault();

      if (dragIndex === null || dragIndex === dropIndex) return;

      setImages(prev => {
        const newImages = [...prev];
        const [draggedItem] = newImages.splice(dragIndex, 1);
        newImages.splice(dropIndex, 0, draggedItem);

        notifyParent(newImages);
        return newImages;
      });

      setDragIndex(null);
    },
    [dragIndex, notifyParent]
  );

  // Clear validation errors
  const clearErrors = useCallback(() => {
    setValidationErrors([]);
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setValidationErrors(prev =>
                        prev.filter((_, i) => i !== index)
                      )
                    }
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={clearErrors}>
                Clear All
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Image Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={image.id}
            className={`relative group aspect-square border rounded-md overflow-hidden transition-all ${
              dragIndex === index ? "opacity-50 scale-95" : ""
            } ${allowReordering ? "cursor-move" : ""}`}
            draggable={allowReordering}
            onDragStart={e => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={e => handleDrop(e, index)}
          >
            {/* Image */}
            <Image
              src={image.url}
              alt={`Product image ${index + 1}`}
              fill
              className="object-cover"
            />

            {/* Validation Status Badge */}
            <div className="absolute top-2 left-2">
              {image.validationStatus === "valid" && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Valid
                </Badge>
              )}
              {image.validationStatus === "invalid" && (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Invalid
                </Badge>
              )}
            </div>

            {/* Metadata Badge */}
            {showMetadata && image.metadata && (
              <div className="absolute bottom-2 left-2">
                <Badge
                  variant="outline"
                  className="bg-black/50 text-white text-xs"
                >
                  {image.metadata.width}×{image.metadata.height}
                </Badge>
              </div>
            )}

            {/* Remove Button */}
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeImage(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>

            {/* Drag Handle */}
            {allowReordering && (
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 bg-black/50 rounded flex items-center justify-center">
                  <div className="w-3 h-3 grid grid-cols-2 gap-0.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="w-1 h-1 bg-white rounded-sm" />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Upload Button */}
        {images.length < maxImages && (
          <div className="border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center aspect-square hover:border-gray-400 transition-colors">
            <div className="space-y-2 text-center">
              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto" />
              <div className="text-sm text-gray-600">
                <p>Drop images here or</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Select Files"
                  )}
                </Button>
              </div>

              {/* UploadThing Button */}
              <UploadButton<OurFileRouter>
                endpoint={endpoint}
                onClientUploadComplete={handleUploadComplete}
                onUploadError={handleUploadError}
                className="ut-button:bg-primary ut-button:ut-readying:bg-primary/80 ut-button:ut-uploading:bg-primary/80"
              />

              {/* Hidden file input for drag & drop */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>
        )}
      </div>

      {/* Image Count and Info */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {images.length} of {maxImages} images uploaded
        </span>
        {images.length > 0 && (
          <span>
            Total size:{" "}
            {formatFileSize(
              images.reduce(
                (total, img) => total + (img.metadata?.size || 0),
                0
              )
            )}
          </span>
        )}
      </div>

      {/* Validation Mode Info */}
      <div className="text-xs text-gray-400">
        Validation mode: {validationMode} | Max file size:{" "}
        {validationMode === "strict" ? "2MB" : "8MB"} | Formats:{" "}
        {validationMode === "strict"
          ? "JPEG, PNG, WebP"
          : "JPEG, PNG, WebP, GIF"}
      </div>
    </div>
  );
}
