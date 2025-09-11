"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EnhancedAdminBulkUpload } from "@/components/admin/EnhancedAdminBulkUpload";

export function BulkUploadModal() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Upload
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Products</DialogTitle>
          <DialogDescription>
            Upload multiple products at once using CSV or Excel files with
            AI-powered enhancement for descriptions, SEO, and Romanian market
            optimization. Download the template to see the required format.
          </DialogDescription>
        </DialogHeader>
        <EnhancedAdminBulkUpload />
      </DialogContent>
    </Dialog>
  );
}
