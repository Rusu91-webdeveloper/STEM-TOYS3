"use client";

import { Image as ImageIcon, Smartphone, Monitor, Tablet } from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProcessedImageInfoProps {
  imageUrl: string;
  filename: string;
  sizes: {
    thumbnail: string;
    small: string;
    medium: string;
    large: string;
    original: string;
  };
  metadata: {
    width: number;
    height: number;
    size: number;
    format: string;
    aspectRatio: number;
  };
}

export function ProcessedImageInfo({
  imageUrl,
  filename,
  sizes,
  metadata,
}: ProcessedImageInfoProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))  } ${  sizes[i]}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ImageIcon className="w-5 h-5" />
          Processed Image: {filename}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Image Preview */}
        <div className="flex justify-center">
          <img
            src={imageUrl}
            alt={filename}
            className="max-w-full h-32 object-contain rounded-lg border"
          />
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Format:</span> {metadata.format}
          </div>
          <div>
            <span className="font-medium">Size:</span>{" "}
            {formatFileSize(metadata.size)}
          </div>
          <div>
            <span className="font-medium">Dimensions:</span> {metadata.width} ×{" "}
            {metadata.height}
          </div>
          <div>
            <span className="font-medium">Aspect Ratio:</span>{" "}
            {metadata.aspectRatio.toFixed(2)}
          </div>
        </div>

        {/* Generated Sizes */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Generated Sizes:</h4>
          <div className="grid grid-cols-1 gap-2">
            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Thumbnail (150×150)</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Mobile
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center gap-2">
                <Tablet className="w-4 h-4 text-green-500" />
                <span className="text-sm">Small (300×300)</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Tablet
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Medium (600×600)</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                Desktop
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-orange-500" />
                <span className="text-sm">Large (1200×1200)</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                HD
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2 bg-muted rounded">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-red-500" />
                <span className="text-sm">Original</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Full Size
              </Badge>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <h5 className="font-medium text-green-800 mb-2">
            Benefits of Multiple Sizes:
          </h5>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Faster loading on mobile devices</li>
            <li>• Optimized bandwidth usage</li>
            <li>• Better user experience across devices</li>
            <li>• Improved SEO and Core Web Vitals</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
