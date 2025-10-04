"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Edit, Send, Download, Check, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { formatPriceWithCurrency } from "@/lib/currency-converter";

interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: any;
  isActive: boolean;
}

interface SupplierInvoice {
  id: string;
  invoiceNumber: string;
  periodStart: string;
  periodEnd: string;
  subtotal: number;
  commission: number;
  totalAmount: number;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED";
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  supplier: Supplier;
}

interface SupplierInvoiceDetailProps {
  invoiceId: string;
  onBack: () => void;
}

export function SupplierInvoiceDetail({
  invoiceId,
  onBack,
}: SupplierInvoiceDetailProps) {
  const [invoice, setInvoice] = useState<SupplierInvoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    status: "",
    paymentMethod: "",
    notes: "",
  });

  useEffect(() => {
    fetchInvoice();
  }, [invoiceId]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/supplier-invoices/${invoiceId}`);
      if (!response.ok) throw new Error("Failed to fetch invoice");

      const data = await response.json();
      setInvoice(data);
      setEditForm({
        status: data.status,
        paymentMethod: data.paymentMethod || "",
        notes: data.notes || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateInvoice = async () => {
    try {
      const response = await fetch(
        `/api/admin/supplier-invoices/${invoiceId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        }
      );

      if (!response.ok) throw new Error("Failed to update invoice");

      toast({
        title: "Success",
        description: "Invoice updated successfully",
      });

      setEditDialogOpen(false);
      fetchInvoice();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to update invoice",
        variant: "destructive",
      });
    }
  };

  const handleSendInvoice = async () => {
    try {
      const response = await fetch(
        `/api/admin/supplier-invoices/${invoiceId}/send`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to send invoice");

      toast({
        title: "Success",
        description: "Invoice sent successfully",
      });

      fetchInvoice();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to send invoice",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      DRAFT: "secondary",
      SENT: "default",
      PAID: "default",
      OVERDUE: "destructive",
      CANCELLED: "outline",
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "secondary"}>
        {status}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Invoices
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              {error || "Invoice not found"}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Invoices
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              Invoice {invoice.invoiceNumber}
            </h1>
            <p className="text-muted-foreground">
              {invoice.supplier.name} • Created {formatDate(invoice.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Invoice</DialogTitle>
                <DialogDescription>
                  Update invoice status and details
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={editForm.status}
                    onValueChange={value =>
                      setEditForm({ ...editForm, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SENT">Sent</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Input
                    value={editForm.paymentMethod}
                    onChange={e =>
                      setEditForm({
                        ...editForm,
                        paymentMethod: e.target.value,
                      })
                    }
                    placeholder="e.g., Bank Transfer, PayPal"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    value={editForm.notes}
                    onChange={e =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    placeholder="Optional notes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleUpdateInvoice}>Update Invoice</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {invoice.status === "DRAFT" && (
            <Button onClick={handleSendInvoice}>
              <Send className="h-4 w-4 mr-2" />
              Send Invoice
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Invoice Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Invoice Number
                  </Label>
                  <p className="font-mono">{invoice.invoiceNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Status
                  </Label>
                  <div className="mt-1">{getStatusBadge(invoice.status)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Period Start
                  </Label>
                  <p>{formatDate(invoice.periodStart)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Period End
                  </Label>
                  <p>{formatDate(invoice.periodEnd)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Due Date
                  </Label>
                  <p>{formatDate(invoice.dueDate)}</p>
                </div>
                {invoice.paidAt && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Paid Date
                    </Label>
                    <p>{formatDate(invoice.paidAt)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>
                    {formatPriceWithCurrency(invoice.subtotal, "RON")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Commission:</span>
                  <span>
                    -{formatPriceWithCurrency(invoice.commission, "RON")}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total Amount:</span>
                    <span>
                      {formatPriceWithCurrency(invoice.totalAmount, "RON")}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Supplier Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Company Name
                </Label>
                <p className="font-medium">{invoice.supplier.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Email
                </Label>
                <p className="text-sm">{invoice.supplier.email}</p>
              </div>
              {invoice.supplier.phone && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Phone
                  </Label>
                  <p className="text-sm">{invoice.supplier.phone}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Status
                </Label>
                <div className="mt-1">
                  <Badge
                    variant={
                      invoice.supplier.isActive ? "default" : "secondary"
                    }
                  >
                    {invoice.supplier.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {invoice.paymentMethod && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Payment Method
                  </Label>
                  <p className="text-sm">{invoice.paymentMethod}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  Payment Status
                </Label>
                <div className="mt-1">
                  {invoice.status === "PAID" ? (
                    <Badge
                      variant="default"
                      className="bg-green-100 text-green-800"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Paid
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      <X className="h-3 w-3 mr-1" />
                      Unpaid
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
