"use client";

import {
  Search,
  Filter,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Building2,
  Mail,
  Phone,
  Calendar,
  // CheckSquare,
  // Square,
  MoreHorizontal,
  Download,
  TrendingUp,
  // TrendingDown,
  Star,
  Package,
  Database,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect, useCallback, useRef } from "react";

import { DashboardError } from "@/app/admin/components/dashboard-status";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import {
  type Supplier,
  type SupplierStatus,
} from "@/features/supplier/types/supplier";

const statusConfig = {
  PENDING: {
    label: "În așteptarea verificării",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  APPROVED: {
    label: "Aprobat",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Respins",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  SUSPENDED: {
    label: "Suspendat",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertTriangle,
  },
  INACTIVE: {
    label: "Inactiv",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Building2,
  },
};

export function AdminSupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [performanceError, setPerformanceError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const listController = useRef<AbortController | null>(null);
  const successfulQuery = useRef<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | "ALL">(
    "ALL"
  );
  const [sortBy, setSortBy] = useState<"createdAt" | "companyName" | "status">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(
    new Set()
  );
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [updatingSupplierId, setUpdatingSupplierId] = useState<string | null>(
    null
  );
  const busy = bulkActionLoading || updatingSupplierId !== null;
  const [showPerformance, setShowPerformance] = useState(false);

  const fetchPerformanceData = async () => {
    try {
      setPerformanceLoading(true);
      setPerformanceError(false);
      const response = await fetch(
        "/api/admin/analytics/supplier-performance?period=30"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch performance data");
      }
      const data = await response.json();
      setPerformanceData(data.suppliers || []);
    } catch (err) {
      console.error("Error fetching performance data:", err);
      setPerformanceError(true);
      setPerformanceData([]);
    } finally {
      setPerformanceLoading(false);
    }
  };

  const fetchSuppliers = useCallback(async () => {
    listController.current?.abort();
    const controller = new AbortController();
    listController.current = controller;
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: String(pagination.limit),
      sortBy,
      sortOrder,
    });
    if (statusFilter !== "ALL") params.set("status", statusFilter);
    if (submittedSearch.trim()) params.set("search", submittedSearch.trim());
    const query = params.toString();
    try {
      setLoading(true);
      setLoadError(null);

      const response = await fetch(`/api/admin/suppliers?${query}`, {
        credentials: "include",
        signal: controller.signal,
        cache: "no-store",
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message =
          body?.error ||
          body?.message ||
          `Failed to fetch suppliers (${response.status})`;
        throw new Error(message);
      }

      const data = await response.json();
      if (controller.signal.aborted) return;
      setSuppliers(data.suppliers || []);
      setPagination(previous => data.pagination ?? previous);
      setCounts(data.filters?.statusCounts ?? {});
      setSelectedSuppliers(new Set());
      setHasLoaded(true);
      successfulQuery.current = query;
    } catch (err) {
      if (controller.signal.aborted) return;
      console.error("Error fetching suppliers:", err);
      setLoadError("Furnizorii nu au putut fi încărcați. Încearcă din nou.");
      if (successfulQuery.current !== query) {
        setSuppliers([]);
        setHasLoaded(false);
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    statusFilter,
    submittedSearch,
    sortBy,
    sortOrder,
  ]);
  useEffect(() => {
    void fetchSuppliers();
  }, [fetchSuppliers]);
  useEffect(() => () => listController.current?.abort(), []);

  const handleStatusUpdate = async (
    supplierId: string,
    newStatus: SupplierStatus,
    rejectionReason?: string
  ) => {
    if (busy) return;
    setUpdatingSupplierId(supplierId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/suppliers/${supplierId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          rejectionReason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update supplier status");
      }

      // Refresh the suppliers list
      await fetchSuppliers();
    } catch (err) {
      console.error("Error updating supplier status:", err);
      setError("Starea furnizorului nu s-a actualizat. Încearcă din nou.");
    } finally {
      setUpdatingSupplierId(null);
    }
  };

  const handleBulkStatusUpdate = async (
    newStatus: SupplierStatus,
    rejectionReason?: string
  ) => {
    if (busy || selectedSuppliers.size === 0) return;

    try {
      setBulkActionLoading(true);
      setError(null);

      const response = await fetch("/api/admin/suppliers/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: newStatus === "APPROVED" ? "approve" : "reject",
          supplierIds: Array.from(selectedSuppliers),
          rejectionReason,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update supplier statuses");
      }

      // Clear selection and refresh the suppliers list
      setSelectedSuppliers(new Set());
      await fetchSuppliers();
    } catch (err) {
      console.error("Error updating supplier statuses:", err);
      setError("Stările furnizorilor nu s-au actualizat. Încearcă din nou.");
    } finally {
      setBulkActionLoading(false);
    }
  };

  const toggleSupplierSelection = (supplierId: string) => {
    const newSelection = new Set(selectedSuppliers);
    if (newSelection.has(supplierId)) {
      newSelection.delete(supplierId);
    } else {
      newSelection.add(supplierId);
    }
    setSelectedSuppliers(newSelection);
  };

  const toggleAllSelection = () => {
    const selectable = getSelectableSuppliers();
    if (selectedSuppliers.size === selectable.length) {
      setSelectedSuppliers(new Set());
    } else {
      setSelectedSuppliers(new Set(selectable.map(s => s.id)));
    }
  };

  const getSelectableSuppliers = () =>
    filteredSuppliers.filter(supplier => supplier.status === "PENDING");

  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/suppliers/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: statusFilter === "ALL" ? undefined : statusFilter,
          search: submittedSearch || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to export suppliers");
      }

      // Create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `suppliers-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error exporting suppliers:", err);
      setError(
        "Exportul furnizorilor nu a putut fi generat. Încearcă din nou."
      );
    }
  };

  // Combine supplier data with performance data
  const suppliersWithPerformance = suppliers.map(supplier => {
    const performance = performanceData.find(p => p.supplierId === supplier.id);
    return {
      ...supplier,
      performance: performance || null,
    };
  });

  const filteredSuppliers = suppliersWithPerformance;

  const statusCounts = {
    PENDING: counts.PENDING ?? 0,
    APPROVED: counts.APPROVED ?? 0,
    REJECTED: counts.REJECTED ?? 0,
    SUSPENDED: counts.SUSPENDED ?? 0,
    INACTIVE: counts.INACTIVE ?? 0,
    TOTAL: Object.values(counts).reduce((sum, count) => sum + count, 0),
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Se încarcă furnizorii…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Furnizori</h1>
          <p className="text-gray-600 mt-2">
            Gestionează furnizorii, cererile și aprobările.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedSuppliers.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={busy}>
                  <MoreHorizontal className="w-4 h-4 mr-2" />
                  Acțiuni pentru selecție ({selectedSuppliers.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => handleBulkStatusUpdate("APPROVED")}
                  disabled={busy}
                  className="text-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobă selecția
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleBulkStatusUpdate("REJECTED")}
                  disabled={busy}
                  className="text-red-600"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Respinge selecția
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="outline"
            onClick={() => {
              if (!showPerformance) void fetchPerformanceData();
              setShowPerformance(!showPerformance);
            }}
            disabled={performanceLoading}
          >
            {performanceLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Se încarcă datele…
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                {showPerformance ? "Ascunde" : "Arată"} datele de procesare
              </>
            )}
          </Button>
          <Button variant="outline" onClick={fetchSuppliers} disabled={busy}>
            Actualizează
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportă CSV
          </Button>
          <Button asChild variant="secondary">
            <Link href="/admin/suppliers/feeds">
              <Database className="w-4 h-4 mr-2" />
              Sincronizări
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/suppliers/new">
              <Plus className="w-4 h-4 mr-2" />
              Adaugă furnizor
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {hasLoaded && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-900">
                {statusCounts.TOTAL}
              </div>
              <div className="text-sm text-gray-600">Total furnizori</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">
                {statusCounts.PENDING}
              </div>
              <div className="text-sm text-gray-600">
                În așteptarea verificării
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">
                {statusCounts.APPROVED}
              </div>
              <div className="text-sm text-gray-600">Aprobat</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">
                {statusCounts.REJECTED}
              </div>
              <div className="text-sm text-gray-600">Respins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-600">
                {statusCounts.SUSPENDED}
              </div>
              <div className="text-sm text-gray-600">Suspendat</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-gray-600">
                {statusCounts.INACTIVE}
              </div>
              <div className="text-sm text-gray-600">Inactiv</div>
            </CardContent>
          </Card>
        </div>
      )}

      {showPerformance && performanceError && (
        <div
          role="alert"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          Datele de livrare și recenziile nu au putut fi încărcate.{" "}
          <button
            className="underline"
            onClick={() => void fetchPerformanceData()}
          >
            Reîncearcă
          </button>
        </div>
      )}
      {showPerformance && (
        <p className="text-sm text-slate-500">
          Livrări și recenzii din ultimele 30 de zile. Lipsa datelor nu
          reprezintă un scor de performanță.
        </p>
      )}
      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtre și căutare
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <form
              className="relative"
              onSubmit={event => {
                event.preventDefault();
                setSubmittedSearch(searchTerm);
                setPagination(previous => ({ ...previous, page: 1 }));
              }}
            >
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                disabled={busy}
                placeholder="Caută furnizori..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
                aria-label="Caută furnizori"
              />
              <button
                type="submit"
                disabled={busy}
                aria-label="Aplică căutarea furnizorilor"
                className="absolute right-3 top-3"
              >
                <Search className="h-4 w-4" />
              </button>
            </form>

            <Select
              disabled={busy}
              value={statusFilter}
              onValueChange={value => {
                setStatusFilter(value as SupplierStatus | "ALL");
                setPagination(previous => ({ ...previous, page: 1 }));
              }}
            >
              <SelectTrigger aria-label="Filtrează furnizorii după stare">
                <SelectValue placeholder="Filtrează după stare" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Toate stările</SelectItem>
                <SelectItem value="PENDING">
                  În așteptarea verificării
                </SelectItem>
                <SelectItem value="APPROVED">Aprobat</SelectItem>
                <SelectItem value="REJECTED">Respins</SelectItem>
                <SelectItem value="SUSPENDED">Suspendat</SelectItem>
                <SelectItem value="INACTIVE">Inactiv</SelectItem>
              </SelectContent>
            </Select>

            <Select
              disabled={busy}
              value={sortBy}
              onValueChange={value => {
                setSortBy(value as "createdAt" | "companyName" | "status");
                setPagination(previous => ({ ...previous, page: 1 }));
              }}
            >
              <SelectTrigger aria-label="Ordonează furnizorii după">
                <SelectValue placeholder="Ordonează după" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Data înregistrării</SelectItem>
                <SelectItem value="companyName">Numele firmei</SelectItem>
                <SelectItem value="status">Stare</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑ Crescător" : "↓ Descrescător"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {loadError && (
        <DashboardError
          message={loadError}
          stale={hasLoaded}
          onRetry={() => void fetchSuppliers()}
        />
      )}
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Furnizori {hasLoaded ? `(${pagination.total})` : ""}
          </CardTitle>
          <CardDescription>
            Datele și starea furnizorilor magazinului.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!hasLoaded ? null : filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                Nu există furnizori pentru filtrele alese.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        aria-label="Selectează furnizorii în așteptare de pe pagină"
                        checked={
                          selectedSuppliers.size ===
                            getSelectableSuppliers().length &&
                          getSelectableSuppliers().length > 0
                        }
                        onCheckedChange={toggleAllSelection}
                        disabled={busy || getSelectableSuppliers().length === 0}
                      />
                    </TableHead>
                    <TableHead>Firmă</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Stare</TableHead>

                    {showPerformance && (
                      <TableHead>Procesare comenzi</TableHead>
                    )}
                    {showPerformance && <TableHead>Recenzii</TableHead>}
                    <TableHead>Categorii</TableHead>
                    <TableHead>Înregistrat</TableHead>
                    <TableHead>Acțiuni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map(supplier => {
                    const statusInfo = statusConfig[supplier.status] || {
                      label: supplier.status || "Stare necunoscută",
                      color: "bg-slate-100 text-slate-800 border-slate-200",
                      icon: AlertTriangle,
                    };
                    const StatusIcon = statusInfo.icon || AlertTriangle;

                    return (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          {supplier.status === "PENDING" && (
                            <Checkbox
                              aria-label={`Selectează ${supplier.companyName}`}
                              disabled={busy}
                              checked={selectedSuppliers.has(supplier.id)}
                              onCheckedChange={() =>
                                toggleSupplierSelection(supplier.id)
                              }
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium text-gray-900">
                              {supplier.companyName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {[
                                supplier.businessCity,
                                ["RO", "Romania"].includes(
                                  supplier.businessCountry
                                )
                                  ? "România"
                                  : supplier.businessCountry,
                              ]
                                .filter(Boolean)
                                .join(", ") || "Adresă necompletată"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="w-4 h-4 text-gray-400" />
                              {supplier.contactPersonEmail}
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {supplier.contactPersonPhone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={statusInfo.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </TableCell>

                        {showPerformance && (
                          <TableCell>
                            {supplier.performance &&
                            supplier.performance.totalOrders > 0 ? (
                              <div className="text-sm">
                                <div className="flex items-center gap-1">
                                  <Package className="w-3 h-3 text-blue-600" />
                                  {supplier.performance.fulfillmentRate}%
                                </div>
                                <div className="text-xs text-gray-500">
                                  {supplier.performance.fulfilledOrders}/
                                  {supplier.performance.totalOrders} comenzi
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {performanceLoading
                                  ? "Se încarcă…"
                                  : performanceError
                                    ? "Indisponibil"
                                    : "Fără date"}
                              </span>
                            )}
                          </TableCell>
                        )}
                        {showPerformance && (
                          <TableCell>
                            {supplier.performance &&
                            supplier.performance.reviewCount > 0 ? (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-600" />
                                <span className="text-sm">
                                  {supplier.performance.qualityScore}/5
                                </span>
                                <span className="text-xs text-gray-500 ml-1">
                                  ({supplier.performance.reviewCount} recenzii)
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {performanceLoading
                                  ? "Se încarcă…"
                                  : performanceError
                                    ? "Indisponibil"
                                    : "Fără date"}
                              </span>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {supplier.productCategories
                              .slice(0, 3)
                              .map(category => (
                                <Badge
                                  key={category}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {category}
                                </Badge>
                              ))}
                            {supplier.productCategories.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{supplier.productCategories.length - 3} în plus
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(supplier.createdAt).toLocaleDateString(
                              "ro-RO"
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link
                                href={`/admin/suppliers/${supplier.id}`}
                                aria-label={`Vezi furnizorul ${supplier.companyName}`}
                              >
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            {supplier.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busy}
                                  aria-label={`Aprobă furnizorul ${supplier.companyName}`}
                                  className="text-green-600 border-green-600 hover:bg-green-50"
                                  onClick={() =>
                                    handleStatusUpdate(supplier.id, "APPROVED")
                                  }
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={busy}
                                  aria-label={`Respinge furnizorul ${supplier.companyName}`}
                                  className="text-red-600 border-red-600 hover:bg-red-50"
                                  onClick={() =>
                                    handleStatusUpdate(supplier.id, "REJECTED")
                                  }
                                >
                                  <XCircle className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {hasLoaded && (
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
              <span>
                Pagina {pagination.page} din {Math.max(1, pagination.pages)} ·{" "}
                {pagination.total} furnizori
              </span>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  disabled={pagination.page <= 1 || loading || busy}
                  onClick={() =>
                    setPagination(previous => ({
                      ...previous,
                      page: previous.page - 1,
                    }))
                  }
                >
                  Înapoi
                </Button>
                <Button
                  variant="outline"
                  disabled={
                    pagination.page >= pagination.pages || loading || busy
                  }
                  onClick={() =>
                    setPagination(previous => ({
                      ...previous,
                      page: previous.page + 1,
                    }))
                  }
                >
                  Înainte
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
