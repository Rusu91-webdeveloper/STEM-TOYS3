"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { Edit, MoreHorizontal, Trash2, ExternalLink } from "lucide-react";

interface ProductActionsDropdownProps {
  productId: string;
  productSlug?: string; // Add optional slug property for view link
}

export function ProductActionsDropdown({
  productId,
  productSlug,
}: ProductActionsDropdownProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [slug, setSlug] = useState<string | undefined>(productSlug);

  // If slug wasn't provided, fetch it
  useEffect(() => {
    if (!productSlug) {
      const fetchProductSlug = async () => {
        try {
          const response = await fetch(`/api/admin/products/${productId}`);
          if (response.ok) {
            const data = await response.json();
            setSlug(data.slug);
          }
        } catch (error) {
          console.error("Error fetching product details:", error);
        }
      };

      fetchProductSlug();
    }
  }, [productId, productSlug]);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleDelete();
  };

  const handleDelete = async () => {
    if (isDeleting) return; // Prevent multiple clicks

    try {
      setIsDeleting(true);

      // Add debug logging to verify the productId
      console.log(`Attempting to delete product with ID: ${productId}`);
      console.log(`Delete URL: /api/admin/products/${productId}`);

      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      // Log the response status
      console.log(`Delete response status: ${response.status}`);

      if (!response.ok) {
        const error = await response.json();
        console.error("Delete error response:", error);
        throw new Error(error.error || "Failed to delete product");
      }

      // Close dialog first
      setShowDeleteDialog(false);

      // Show success message
      toast({
        title: "Product deleted",
        description: "The product has been successfully deleted.",
      });

      // Force router refresh to update the UI with latest data
      router.refresh();

      // Use a timeout to ensure dialog is fully closed before redirecting
      setTimeout(() => {
        // Navigate to the products page
        router.push("/admin/products");
      }, 300);
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
      setIsDeleting(false);
    }
  };

  // Handle dialog close properly
  const handleDialogChange = (open: boolean) => {
    if (isDeleting) return; // Don't close while deleting is in progress
    setShowDeleteDialog(open);

    // If dialog is closing, focus the trigger button
    if (!open && triggerRef.current) {
      setTimeout(() => {
        triggerRef.current?.focus();
      }, 50);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            ref={triggerRef}
            variant="ghost"
            className="h-8 w-8 p-0 data-[state=open]:bg-muted">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(productId);
              toast({
                title: "Copied",
                description: "Product ID copied to clipboard",
                duration: 3000,
              });
            }}>
            Copy product ID
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href={`/admin/products/${productId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </DropdownMenuItem>
          {slug && (
            <DropdownMenuItem asChild>
              <Link
                href={`/products/${slug}`}
                target="_blank">
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Site
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600"
            onClick={() => setShowDeleteDialog(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={showDeleteDialog}
        onOpenChange={handleDialogChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this product. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteClick}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Delete Product"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
