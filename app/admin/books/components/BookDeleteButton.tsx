"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

interface BookDeleteButtonProps {
  bookId: string;
  bookName: string;
}

export function BookDeleteButton({ bookId, bookName }: BookDeleteButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleDelete = async () => {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Succes",
          description: data.message || "Book deleted successfully",
        });
        setIsOpen(false);
        // Refresh the page to show updated list
        router.refresh();
      } else {
        throw new Error(data.error || "Failed to delete book");
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error ? error.message : "Failed to delete book",
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
          Șterge Carte
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Ești sigur că vrei să ștergi această carte?
          </AlertDialogTitle>
          <AlertDialogDescription>
            Această acțiune va șterge permanent cartea "
            <strong>{bookName}</strong>" din baza de date. Dacă această carte
            are comenzi existente, ștergerea va fi blocată pentru a păstra
            istoricul comenzilor. Această acțiune nu poate fi anulată.
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
                Șterge Carte
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
