"use client";

import { useState, useRef } from "react";
import { 
  Upload, 
  Image as ImageIcon, 
  X, 
  CheckCircle, 
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

interface UploadedImage {
  id: string;
  url: string;
  name: string;
  size: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

export function BulkImageUpload() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const newImages: UploadedImage[] = [];
    let hasErrors = false;

    Array.from(files).forEach((file, index) => {
      // Validate file type
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported image format.`,
          variant: "destructive",
        });
        hasErrors = true;
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 5MB.`,
          variant: "destructive",
        });
        hasErrors = true;
        return;
      }

      const image: UploadedImage = {
        id: `temp-${Date.now()}-${index}`,
        url: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        status: 'uploading'
      };

      newImages.push(image);
    });

    if (hasErrors) return;

    setImages(prev => [...prev, ...newImages]);
    
    // Start upload process
    uploadImages(newImages);
  };

  const uploadImages = async (imagesToUpload: UploadedImage[]) => {
    setIsUploading(true);
    setUploadProgress(0);

    const totalImages = imagesToUpload.length;
    let completed = 0;

    for (const image of imagesToUpload) {
      try {
        // Simulate upload process (replace with actual upload logic)
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Update image status to success
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, status: 'success' as const }
            : img
        ));

        completed++;
        setUploadProgress((completed / totalImages) * 100);
      } catch (error) {
        // Update image status to error
        setImages(prev => prev.map(img => 
          img.id === image.id 
            ? { ...img, status: 'error' as const, error: 'Upload failed' }
            : img
        ));

        completed++;
        setUploadProgress((completed / totalImages) * 100);
      }
    }

    setIsUploading(false);
    
    const successCount = imagesToUpload.filter(img => img.status === 'success').length;
    if (successCount > 0) {
      toast({
        title: "Upload completed",
        description: `Successfully uploaded ${successCount} images.`,
      });
    }
  };

  const removeImage = (imageId: string) => {
    setImages(prev => prev.filter(img => img.id !== imageId));
  };

  const retryUpload = (imageId: string) => {
    const image = images.find(img => img.id === imageId);
    if (image) {
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, status: 'uploading' as const, error: undefined }
          : img
      ));
      uploadImages([image]);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Bulk Image Upload
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Area */}
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
          <h3 className="text-sm font-medium mb-1">Upload product images</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Supported formats: JPEG, PNG, WebP, GIF (max 5MB each)
          </p>
          <Button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            size="sm"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            Choose Images
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Upload Progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading images...</span>
              <span>{Math.round(uploadProgress)}%</span>
            </div>
            <Progress value={uploadProgress} className="w-full" />
          </div>
        )}

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Status Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {image.status === 'uploading' && (
                      <RefreshCw className="w-6 h-6 text-white animate-spin" />
                    )}
                    {image.status === 'success' && (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    )}
                    {image.status === 'error' && (
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    )}
                  </div>
                </div>

                {/* Image Info */}
                <div className="mt-2 space-y-1">
                  <p className="text-xs font-medium truncate">{image.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(image.size)}</p>
                  
                  {/* Status Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      image.status === 'success' ? 'bg-green-100 text-green-800' :
                      image.status === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {image.status === 'uploading' ? 'Uploading...' :
                       image.status === 'success' ? 'Success' : 'Error'}
                    </span>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1">
                      {image.status === 'error' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => retryUpload(image.id)}
                          className="h-6 w-6 p-0"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeImage(image.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {image.error && (
                  <p className="text-xs text-red-600 mt-1">{image.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Summary */}
        {images.length > 0 && (
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{images.length} images selected</span>
            <span>
              {images.filter(img => img.status === 'success').length} uploaded,{' '}
              {images.filter(img => img.status === 'error').length} failed
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
