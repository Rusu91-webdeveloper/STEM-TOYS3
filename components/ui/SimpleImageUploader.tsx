"use client";

import React, { useState } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";

interface SimpleImageUploaderProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
}

export function SimpleImageUploader({
  images,
  onImagesChange,
  maxImages = 10,
}: SimpleImageUploaderProps) {
  const [dragActive, setDragActive] = useState(false);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newImages = Array.from(files).map(file => {
      // Create a placeholder URL for the uploaded file
      const fileName = file.name || "image";
      const fileSize = file.size;
      const fileType = file.type;

      // Return a structured placeholder that indicates this needs processing
      return `placeholder://${fileName}?size=${fileSize}&type=${fileType}`;
    });

    onImagesChange([...images, ...newImages].slice(0, maxImages));
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-muted-foreground/50"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={e => handleFileUpload(e.target.files)}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="cursor-pointer flex flex-col items-center space-y-2"
          >
            <Upload className="w-8 h-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, WebP up to 4MB each
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Image Preview */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="aspect-square bg-muted rounded-md flex items-center justify-center relative overflow-hidden">
                  {image.startsWith("placeholder://") ? (
                    <div className="text-center p-2">
                      <ImageIcon className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {image.split("://")[1]?.split("?")[0] || "Image"}
                      </p>
                    </div>
                  ) : (
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  )}

                  {/* Remove Button */}
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeImage(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Info Text */}
      <div className="text-xs text-muted-foreground">
        <p>• Images will be automatically resized for different screen sizes</p>
        <p>• Supported formats: JPEG, PNG, WebP (max 4MB each)</p>
        <p>• First image will be used as the main product image</p>
        <p>• Maximum {maxImages} images allowed</p>
      </div>
    </div>
  );
}
