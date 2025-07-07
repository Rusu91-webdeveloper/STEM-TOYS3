"use client";

import { Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";


interface ProductDeleteButtonProps {
  productId: string;
  productName: string;
}

export function ProductDeleteButton({
  productId,
  productName,
}: ProductDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Succes",
          description: data.message || "Product deleted successfully",
        });
        setIsOpen(false);
        // Refresh the page to show updated list
        router.refresh();
      } else {
        throw new Error(data.error || "Failed to delete product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error ? error.message : "Failed to delete product",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog
      open={isOpen}
      onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          disabled={isDeleting}>
          <Trash2 className="h-4 w-4 mr-2" />
          Șterge Produs
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Ești sigur că vrei să ștergi acest produs?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Această acțiune va șterge permanent produsul "
            <strong>{productName}</strong>". Dacă produsul are comenzi
            existente, va fi marcat ca inactiv în loc să fie șters complet.{" "}
            Această acțiune nu poate fi anulată.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Anulează</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Se șterge...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Șterge Produs
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
