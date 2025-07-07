"use client";

import { UploadButton } from "@uploadthing/react";
import { Trash2 } from "lucide-react";
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
    const newImageUrls = res.map((file) => file.url);
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
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image, index) => (
          <div
            key={`${image}-${index}`}
            className="relative group aspect-square border rounded-md overflow-hidden">
            <Image
              src={image}
              alt={`Uploaded image ${index + 1}`}
              fill
              className="object-cover"
            />
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => handleRemoveImage(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {images.length < maxImages && (
          <div className="border border-dashed rounded-md flex items-center justify-center aspect-square">
            <UploadButton<OurFileRouter, keyof OurFileRouter>
              endpoint={endpoint}
              onClientUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              className="ut-button:bg-primary ut-button:ut-readying:bg-primary/80 ut-button:ut-uploading:bg-primary/80"
            />
          </div>
        )}
      </div>
      <p className="text-sm text-gray-500">
        {images.length} of {maxImages} images uploaded.{" "}
        {maxImages - images.length} remaining.
      </p>
    </div>
  );
}
