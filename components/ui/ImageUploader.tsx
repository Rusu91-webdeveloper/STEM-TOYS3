"use client";

import { UploadButton } from "@uploadthing/react";
import { Trash2, Upload, Image as ImageIcon, Plus } from "lucide-react";
import Image from "next/image";
import React, { useState } from "react";

import { OurFileRouter } from "@/lib/uploadthing";

import { Button } from "./button";

interface ImageUploaderProps {
  /**
   * Maximum number of images that can be uploaded
   */
  maxImages?: number;

  /**
   * Callback function to be called when images are uploaded
   */
  onImagesUploaded?: (imageUrls: string[]) => void;

  /**
   * Initial images to display
   */
  initialImages?: string[];

  /**
   * Endpoint to use for upload (must be defined in your FileRouter)
   */
  endpoint: keyof OurFileRouter;
}

export function ImageUploader({
  maxImages = 5,
  onImagesUploaded,
  initialImages = [],
  endpoint,
}: ImageUploaderProps) {
  const [images, setImages] = useState<string[]>(initialImages);

  const handleUploadComplete = (res: { url: string }[]) => {
    const newImageUrls = res.map(file => file.url);
    const updatedImages = [...images, ...newImageUrls].slice(0, maxImages);

    setImages(updatedImages);

    // Notify parent component
    if (onImagesUploaded) {
      onImagesUploaded(updatedImages);
    }
  };

  const handleUploadError = (error: Error) => {
    // Handle error
    console.error("Upload error:", error);
    alert(`Upload error: ${error.message}`);
  };

  const handleRemoveImage = (indexToRemove: number) => {
    const updatedImages = images.filter((_, index) => index !== indexToRemove);
    setImages(updatedImages);

    // Notify parent component
    if (onImagesUploaded) {
      onImagesUploaded(updatedImages);
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Upload Area */}
      {images.length < maxImages && (
        <div className="relative">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-gray-400 transition-all duration-200 hover:bg-gray-50/50">
            <div className="space-y-4">
              {/* Upload Icon */}
              <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>

              {/* Upload Text */}
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-gray-900">
                  Upload Product Images
                </h3>
                <p className="text-gray-600 max-w-sm mx-auto">
                  Drag and drop your images here, or click the button below to
                  browse files
                </p>
              </div>

              {/* Upload Button */}
              <div className="flex justify-center">
                <UploadButton<OurFileRouter, keyof OurFileRouter>
                  endpoint={endpoint}
                  onClientUploadComplete={handleUploadComplete}
                  onUploadError={handleUploadError}
                  className="ut-button:bg-blue-600 ut-button:hover:bg-blue-700 ut-button:text-white ut-button:font-medium ut-button:px-6 ut-button:py-3 ut-button:rounded-lg ut-button:transition-all ut-button:duration-200 ut-button:shadow-sm ut-button:hover:shadow-md ut-button:ut-readying:bg-blue-500 ut-button:ut-uploading:bg-blue-500"
                />
              </div>

              {/* File Info */}
              <div className="text-xs text-gray-500 space-y-1">
                <p>Supported formats: JPEG, PNG, WebP</p>
                <p>Maximum file size: 4MB per image</p>
                <p>Recommended dimensions: 800x800px or higher</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Uploaded Images ({images.length}/{maxImages})
            </h4>
            {images.length < maxImages && (
              <div className="text-sm text-gray-500">
                {maxImages - images.length} more can be added
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {images.map((image, index) => (
              <div
                key={`${image}-${index}`}
                className="relative group aspect-square border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200"
              >
                <Image
                  src={image}
                  alt={`Product image ${index + 1}`}
                  fill
                  className="object-cover"
                />

                {/* Image Number Badge */}
                <div className="absolute top-2 left-2">
                  <div className="bg-black/70 text-white text-xs px-2 py-1 rounded-full font-medium">
                    {index + 1}
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 bg-red-600 hover:bg-red-700"
                  onClick={() => handleRemoveImage(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200" />
              </div>
            ))}

            {/* Add More Button */}
            {images.length < maxImages && (
              <div className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-gray-400 hover:bg-gray-50/50 transition-all duration-200 cursor-pointer group relative">
                <div className="text-center space-y-2">
                  <div className="mx-auto w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                    <Plus className="w-4 h-4 text-gray-600" />
                  </div>
                  <p className="text-xs text-gray-600 font-medium">Add More</p>
                </div>

                {/* Hidden Upload Button that covers the entire area */}
                <div className="absolute inset-0 opacity-0">
                  <UploadButton<OurFileRouter, keyof OurFileRouter>
                    endpoint={endpoint}
                    onClientUploadComplete={handleUploadComplete}
                    onUploadError={handleUploadError}
                    className="w-full h-full ut-button:w-full ut-button:h-full ut-button:bg-transparent ut-button:border-0 ut-button:rounded-lg ut-button:cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Progress Indicator */}
      {images.length > 0 && (
        <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-4 py-3 rounded-lg">
          <span>
            {images.length} of {maxImages} images uploaded
          </span>
          <div className="flex items-center space-x-2">
            <div className="w-24 bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(images.length / maxImages) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium">
              {Math.round((images.length / maxImages) * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
