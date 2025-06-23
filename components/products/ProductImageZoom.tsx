"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { X, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ProductImageZoomProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  zoomLevel?: number;
  enableHoverZoom?: boolean;
  enableClickZoom?: boolean;
  showZoomControls?: boolean;
}

export default function ProductImageZoom({
  src,
  alt,
  width = 600,
  height = 600,
  priority = false,
  className,
  zoomLevel = 2,
  enableHoverZoom = true,
  enableClickZoom = true,
  showZoomControls = true,
}: ProductImageZoomProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalZoomLevel, setModalZoomLevel] = useState(1);
  const [modalRotation, setModalRotation] = useState(0);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);
  const modalImageRef = useRef<HTMLDivElement>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Handle hover zoom
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!enableHoverZoom || !imageRef.current) return;

      const rect = imageRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      setHoverPosition({ x, y });
    },
    [enableHoverZoom]
  );

  const handleMouseEnter = useCallback(() => {
    if (enableHoverZoom) {
      setIsHovering(true);
    }
  }, [enableHoverZoom]);

  const handleMouseLeave = useCallback(() => {
    setIsHovering(false);
  }, []);

  // Handle click to open modal
  const handleClick = useCallback(() => {
    if (enableClickZoom) {
      setIsModalOpen(true);
      setModalZoomLevel(1);
      setModalRotation(0);
      setDragOffset({ x: 0, y: 0 });
    }
  }, [enableClickZoom]);

  // Modal zoom controls
  const handleZoomIn = useCallback(() => {
    setModalZoomLevel(prev => Math.min(prev + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setModalZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  }, []);

  const handleRotate = useCallback(() => {
    setModalRotation(prev => (prev + 90) % 360);
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement("a");
    link.href = src;
    link.download = alt.replace(/\s+/g, "-").toLowerCase() + ".jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [src, alt]);

  // Modal drag functionality
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (modalZoomLevel > 1) {
        setIsDragging(true);
        setDragStart({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
    },
    [modalZoomLevel, dragOffset]
  );

  const handleMouseMoveModal = useCallback(
    (e: React.MouseEvent) => {
      if (isDragging && modalZoomLevel > 1) {
        setDragOffset({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y,
        });
      }
    },
    [isDragging, modalZoomLevel, dragStart]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Reset zoom and position when modal closes
  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setModalZoomLevel(1);
    setModalRotation(0);
    setDragOffset({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  // Keyboard controls for accessibility
  useEffect(() => {
    if (!isModalOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          handleModalClose();
          break;
        case "+":
        case "=":
          e.preventDefault();
          handleZoomIn();
          break;
        case "-":
          e.preventDefault();
          handleZoomOut();
          break;
        case "r":
        case "R":
          e.preventDefault();
          handleRotate();
          break;
        case "d":
        case "D":
          e.preventDefault();
          handleDownload();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isModalOpen,
    handleModalClose,
    handleZoomIn,
    handleZoomOut,
    handleRotate,
    handleDownload,
  ]);

  return (
    <>
      {/* Main Image with Hover Zoom */}
      <div
        ref={imageRef}
        className={cn(
          "relative overflow-hidden cursor-zoom-in transition-all duration-200",
          className
        )}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        onKeyDown={e => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-label={`Zoom ${alt}`}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className={cn(
            "w-full h-full object-cover transition-transform duration-200",
            isHovering && enableHoverZoom && "scale-110"
          )}
          style={
            isHovering && enableHoverZoom
              ? {
                  transformOrigin: `${hoverPosition.x}% ${hoverPosition.y}%`,
                }
              : undefined
          }
        />

        {/* Zoom Indicator */}
        {enableClickZoom && (
          <div className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIn className="w-4 h-4" />
          </div>
        )}
      </div>

      {/* Modal for Full-Screen Zoom */}
      <Dialog open={isModalOpen} onOpenChange={handleModalClose}>
        <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 bg-black/95">
          <DialogHeader className="absolute top-4 left-4 z-10">
            <DialogTitle className="text-white sr-only">{alt}</DialogTitle>
          </DialogHeader>

          {/* Controls */}
          {showZoomControls && (
            <div className="absolute top-4 right-4 z-10 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleZoomOut}
                disabled={modalZoomLevel <= 0.5}
                className="bg-white/90 hover:bg-white"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleZoomIn}
                disabled={modalZoomLevel >= 4}
                className="bg-white/90 hover:bg-white"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleRotate}
                className="bg-white/90 hover:bg-white"
              >
                <RotateCw className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownload}
                className="bg-white/90 hover:bg-white"
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Zoom Level Indicator */}
          <div className="absolute bottom-4 left-4 z-10 text-white bg-black/50 px-3 py-1 rounded">
            {Math.round(modalZoomLevel * 100)}%
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 right-4 z-10 text-white/70 text-sm bg-black/50 px-3 py-1 rounded">
            <div>+/- to zoom • R to rotate • D to download</div>
            {modalZoomLevel > 1 && <div>Drag to pan</div>}
          </div>

          {/* Main Modal Image */}
          <div
            ref={modalImageRef}
            className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMoveModal}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div
              className="relative max-w-none max-h-none transition-transform duration-200 ease-out"
              style={{
                transform: `scale(${modalZoomLevel}) rotate(${modalRotation}deg) translate(${
                  dragOffset.x / modalZoomLevel
                }px, ${dragOffset.y / modalZoomLevel}px)`,
                cursor: modalZoomLevel > 1 ? "grab" : "default",
              }}
            >
              <Image
                src={src}
                alt={alt}
                width={1200}
                height={1200}
                className="object-contain max-w-[90vw] max-h-[90vh]"
                priority
                draggable={false}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
