"use client";

import { Upload } from "lucide-react";
import { useState } from "react";

import { EnhancedAdminBulkUpload } from "@/components/admin/EnhancedAdminBulkUpload";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function BulkUploadModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importă produse
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importă produse</DialogTitle>
          <DialogDescription>
            Importă mai multe produse din fișiere CSV sau Excel. Descarcă
            șablonul pentru formatul necesar și verifică informațiile înainte de
            import.
          </DialogDescription>
        </DialogHeader>
        <EnhancedAdminBulkUpload />
      </DialogContent>
    </Dialog>
  );
}
