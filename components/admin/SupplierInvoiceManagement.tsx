"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Download,
  Send,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { formatPriceWithCurrency } from "@/lib/currency-converter";

interface Supplier {
  id: string;
  name: string;
  email: string;
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
  notes?: string;
  createdAt: string;
  supplier: Supplier;
}

interface InvoiceStats {
  totalInvoices: number;
  totalSubtotal: number;
  totalCommission: number;
  totalAmount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function SupplierInvoiceManagement() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [supplierId, setSupplierId] = useState("all");
  const [search, setSearch] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  // Create invoice dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    supplierId: "",
    periodStart: "",
    periodEnd: "",
    subtotal: "",
    commission: "",
    notes: "",
    dueDate: "",
  });

  useEffect(() => {
    fetchInvoices();
    fetchSuppliers();
  }, [page, status, supplierId, search, periodStart, periodEnd]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");
      if (status && status !== "all") params.append("status", status);
      if (supplierId && supplierId !== "all")
        params.append("supplierId", supplierId);
      if (search) params.append("search", search);
      if (periodStart) params.append("periodStart", periodStart);
      if (periodEnd) params.append("periodEnd", periodEnd);

      const response = await fetch(`/api/admin/supplier-invoices?${params}`);
      if (!response.ok) throw new Error("Failed to fetch invoices");

      const data = await response.json();
      setInvoices(data.invoices);
      setStats(data.stats);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await fetch("/api/admin/suppliers");
      if (!response.ok) throw new Error("Failed to fetch suppliers");

      const data = await response.json();
      setSuppliers(data.suppliers || []);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    }
  };

  const handleCreateInvoice = async () => {
    try {
      const response = await fetch("/api/admin/supplier-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      if (!response.ok) throw new Error("Failed to create invoice");

      toast({
        title: "Success",
        description: "Invoice created successfully",
      });

      setCreateDialogOpen(false);
      setCreateForm({
        supplierId: "",
        periodStart: "",
        periodEnd: "",
        subtotal: "",
        commission: "",
        notes: "",
        dueDate: "",
      });
      fetchInvoices();
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to create invoice",
        variant: "destructive",
      });
    }
  };

  const handleSendInvoice = async (invoiceId: string) => {
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

      fetchInvoices();
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

  if (loading && invoices.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoices...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplier Invoices</h1>
          <p className="text-muted-foreground">
            Manage supplier invoices and payments
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Invoice
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>
                Create a new invoice for a supplier
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="supplier">Supplier</Label>
                <Select
                  value={createForm.supplierId}
                  onValueChange={value =>
                    setCreateForm({ ...createForm, supplierId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="periodStart">Period Start</Label>
                  <Input
                    type="date"
                    value={createForm.periodStart}
                    onChange={e =>
                      setCreateForm({
                        ...createForm,
                        periodStart: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="periodEnd">Period End</Label>
                  <Input
                    type="date"
                    value={createForm.periodEnd}
                    onChange={e =>
                      setCreateForm({
                        ...createForm,
                        periodEnd: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="subtotal">Subtotal (RON)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={createForm.subtotal}
                    onChange={e =>
                      setCreateForm({ ...createForm, subtotal: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="commission">Commission (RON)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={createForm.commission}
                    onChange={e =>
                      setCreateForm({
                        ...createForm,
                        commission: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  type="date"
                  value={createForm.dueDate}
                  onChange={e =>
                    setCreateForm({ ...createForm, dueDate: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  value={createForm.notes}
                  onChange={e =>
                    setCreateForm({ ...createForm, notes: e.target.value })
                  }
                  placeholder="Optional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateInvoice}>Create Invoice</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Invoices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalInvoices}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Subtotal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPriceWithCurrency(stats.totalSubtotal, "RON")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Commission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPriceWithCurrency(stats.totalCommission, "RON")}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">
                Total Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatPriceWithCurrency(stats.totalAmount, "RON")}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search invoices..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger>
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Suppliers</SelectItem>
                {suppliers.map(supplier => (
                  <SelectItem key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="date"
              placeholder="Period Start"
              value={periodStart}
              onChange={e => setPeriodStart(e.target.value)}
            />
            <Input
              type="date"
              placeholder="Period End"
              value={periodEnd}
              onChange={e => setPeriodEnd(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>
            {pagination && `${pagination.total} total invoices`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No invoices found.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map(invoice => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {invoice.supplier.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {invoice.supplier.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDate(invoice.periodStart)} -{" "}
                        {formatDate(invoice.periodEnd)}
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell>
                        {formatPriceWithCurrency(invoice.totalAmount, "RON")}
                      </TableCell>
                      <TableCell>{formatDate(invoice.dueDate)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              router.push(
                                `/admin/supplier-invoices/${invoice.id}`
                              )
                            }
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {invoice.status === "DRAFT" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSendInvoice(invoice.id)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.status === "DRAFT" && (
                            <Button size="sm" variant="outline">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {(page - 1) * 20 + 1} to{" "}
                    {Math.min(page * 20, pagination.total)} of{" "}
                    {pagination.total} invoices
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === pagination.pages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
