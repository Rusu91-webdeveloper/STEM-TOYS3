"use client";

import { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { Alert, AlertDescription } from "./alert";
import { Progress } from "./progress";
import {
  emailImageUploadService,
  emailImageUtils,
  type UploadedImage,
} from "@/lib/image-upload";

interface EmailImageUploaderProps {
  onImageUploaded: (image: UploadedImage) => void;
  onImageDeleted?: (imageId: string) => void;
  maxImages?: number;
  acceptedFormats?: string[];
  maxSizeInMB?: number;
  className?: string;
}

export function EmailImageUploader({
  onImageUploaded,
  onImageDeleted,
  maxImages = 10,
  acceptedFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  maxSizeInMB = 5,
  className = "",
}: EmailImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Check if we're at the limit
    if (uploadedImages.length + files.length > maxImages) {
      setUploadError(`Maximum ${maxImages} images allowed`);
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const fileArray = Array.from(files);

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i];

        // Validate file type
        if (!acceptedFormats.includes(file.type)) {
          throw new Error(
            `Invalid file type: ${file.type}. Accepted formats: ${acceptedFormats.join(", ")}`
          );
        }

        // Update progress
        setUploadProgress((i / fileArray.length) * 100);

        try {
          const uploadedImage = await emailImageUploadService.uploadImage(
            file,
            {
              maxSizeInMB,
              maxWidth: 1200,
              maxHeight: 800,
              quality: 85,
              format: "jpeg",
              folder: "email-templates",
            }
          );

          setUploadedImages(prev => [...prev, uploadedImage]);
          onImageUploaded(uploadedImage);
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error);
          setUploadError(
            `Failed to upload ${file.name}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }

      setUploadProgress(100);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await emailImageUploadService.deleteImage(imageId);
      setUploadedImages(prev => prev.filter(img => img.id !== imageId));
      onImageDeleted?.(imageId);
    } catch (error) {
      console.error("Failed to delete image:", error);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const insertImageIntoEditor = (image: UploadedImage) => {
    // This will be handled by the parent component
    // The image URL will be inserted into the rich text editor
    const imageHtml = emailImageUtils.generateEmailImageHtml(image, {
      width: Math.min(image.width, 600),
      height: "auto",
      align: "center",
    });

    // Dispatch custom event for the rich text editor to handle
    window.dispatchEvent(
      new CustomEvent("insertEmailImage", {
        detail: { image, imageHtml },
      })
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card>
        <CardContent className="p-4">
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-6 text-center transition-colors
              ${dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
              ${uploading ? "pointer-events-none opacity-50" : "cursor-pointer"}
            `}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={openFileDialog}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={acceptedFormats.join(",")}
              onChange={e => handleFileSelect(e.target.files)}
              className="hidden"
            />

            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-gray-400" />
              <div className="text-sm">
                <span className="font-medium text-blue-600">
                  Click to upload
                </span>{" "}
                or drag and drop
              </div>
              <div className="text-xs text-gray-500">
                PNG, JPG, WebP, GIF up to {maxSizeInMB}MB each
              </div>
              <div className="text-xs text-gray-400">
                {uploadedImages.length}/{maxImages} images uploaded
              </div>
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                <div className="space-y-2 w-full max-w-xs">
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Uploading...</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              </div>
            )}
          </div>

          {/* Upload Error */}
          {uploadError && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Uploaded Images Grid */}
      {uploadedImages.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Uploaded Images ({uploadedImages.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {uploadedImages.map(image => {
                const validation = emailImageUtils.validateForEmail(image);

                return (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                      <img
                        src={image.url}
                        alt={image.alt || image.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Image Info */}
                    <div className="mt-2 space-y-1">
                      <div
                        className="text-xs text-gray-600 truncate"
                        title={image.name}
                      >
                        {image.name}
                      </div>
                      <div className="text-xs text-gray-400">
                        {image.width}×{image.height} •{" "}
                        {(image.size / 1024).toFixed(1)}KB
                      </div>

                      {/* Validation Status */}
                      {!validation.isValid && (
                        <div className="flex items-center space-x-1">
                          <AlertCircle className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-yellow-600">
                            Warning
                          </span>
                        </div>
                      )}
                      {validation.isValid && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span className="text-xs text-green-600">Ready</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-6 w-6 p-0"
                          onClick={() => insertImageIntoEditor(image)}
                          title="Insert into email"
                        >
                          <ImageIcon className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-6 w-6 p-0"
                          onClick={() => handleDeleteImage(image.id)}
                          title="Delete image"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Format Badge */}
                    <Badge
                      variant="secondary"
                      className="absolute top-2 left-2 text-xs px-1 py-0"
                    >
                      {image.format.toUpperCase()}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Image Tips */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Email Image Tips
          </h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Use images under 1MB for faster email loading</li>
            <li>• Recommended width: 600px or less for email compatibility</li>
            <li>• Always include alt text for accessibility</li>
            <li>• Use JPEG for photos, PNG for graphics with transparency</li>
            <li>• Test emails in different email clients for compatibility</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
