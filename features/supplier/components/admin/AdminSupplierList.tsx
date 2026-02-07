"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  CheckSquare,
  Square,
  MoreHorizontal,
  Download,
  TrendingUp,
  TrendingDown,
  Star,
  Package,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type Supplier,
  type SupplierStatus,
} from "@/features/supplier/types/supplier";

const statusConfig = {
  PENDING: {
    label: "Pending Review",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  APPROVED: {
    label: "Approved",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  SUSPENDED: {
    label: "Suspended",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertTriangle,
  },
  INACTIVE: {
    label: "Inactive",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Building2,
  },
};

export function AdminSupplierList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [performanceLoading, setPerformanceLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<SupplierStatus | "ALL">(
    "ALL"
  );
  const [sortBy, setSortBy] = useState<
    "createdAt" | "companyName" | "status" | "performanceGrade"
  >("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedSuppliers, setSelectedSuppliers] = useState<Set<string>>(
    new Set()
  );
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showPerformance, setShowPerformance] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setPerformanceLoading(true);
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
      // Don't show error for performance data, just log it
    } finally {
      setPerformanceLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/suppliers", {
        credentials: "include",
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
      setSuppliers(data.suppliers || []);

      // Also fetch performance data
      await fetchPerformanceData();
    } catch (err) {
      console.error("Error fetching suppliers:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (
    supplierId: string,
    newStatus: SupplierStatus,
    rejectionReason?: string
  ) => {
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
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleBulkStatusUpdate = async (
    newStatus: SupplierStatus,
    rejectionReason?: string
  ) => {
    if (selectedSuppliers.size === 0) return;

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
      setError(
        err instanceof Error ? err.message : "Failed to update statuses"
      );
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
    if (selectedSuppliers.size === filteredSuppliers.length) {
      setSelectedSuppliers(new Set());
    } else {
      setSelectedSuppliers(new Set(filteredSuppliers.map(s => s.id)));
    }
  };

  const getSelectableSuppliers = () => {
    return filteredSuppliers.filter(supplier => supplier.status === "PENDING");
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/admin/suppliers/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: statusFilter === "ALL" ? undefined : statusFilter,
          search: searchTerm || undefined,
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
        err instanceof Error ? err.message : "Failed to export suppliers"
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

  const filteredSuppliers = suppliersWithPerformance
    .filter(supplier => {
      const matchesSearch =
        supplier.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.contactPersonEmail
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        supplier.contactPersonName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" || supplier.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "companyName":
          comparison = a.companyName.localeCompare(b.companyName);
          break;
        case "status":
          comparison = a.status.localeCompare(b.status);
          break;
        case "performanceGrade":
          const aGrade = a.performance?.performanceGrade || "F";
          const bGrade = b.performance?.performanceGrade || "F";
          const gradeOrder = {
            "A+": 7,
            A: 6,
            "B+": 5,
            B: 4,
            "C+": 3,
            C: 2,
            D: 1,
            F: 0,
          };
          comparison = gradeOrder[aGrade] - gradeOrder[bGrade];
          break;
        case "createdAt":
        default:
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

  const getStatusCounts = () => {
    const counts = {
      PENDING: 0,
      APPROVED: 0,
      REJECTED: 0,
      SUSPENDED: 0,
      INACTIVE: 0,
      TOTAL: suppliers.length,
    };

    suppliers.forEach(supplier => {
      counts[supplier.status]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading suppliers...</p>
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
          <h1 className="text-3xl font-bold text-gray-900">
            Supplier Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage supplier applications and approvals
          </p>
        </div>
        <div className="flex gap-2">
          {selectedSuppliers.size > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={bulkActionLoading}>
                  <MoreHorizontal className="w-4 h-4 mr-2" />
                  Bulk Actions ({selectedSuppliers.size})
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem
                  onClick={() => handleBulkStatusUpdate("APPROVED")}
                  disabled={bulkActionLoading}
                  className="text-green-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Selected
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleBulkStatusUpdate("REJECTED")}
                  disabled={bulkActionLoading}
                  className="text-red-600"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="outline"
            onClick={() => setShowPerformance(!showPerformance)}
            disabled={performanceLoading}
          >
            {performanceLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Loading Performance...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4 mr-2" />
                {showPerformance ? "Hide" : "Show"} Performance
              </>
            )}
          </Button>
          <Button variant="outline" onClick={fetchSuppliers}>
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button asChild variant="secondary">
            <Link href="/admin/suppliers/feeds">
              <Database className="w-4 h-4 mr-2" />
              Manage Feeds
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/suppliers/new">
              <Plus className="w-4 h-4 mr-2" />
              Add Supplier
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-900">
              {statusCounts.TOTAL}
            </div>
            <div className="text-sm text-gray-600">Total Suppliers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">
              {statusCounts.PENDING}
            </div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">
              {statusCounts.APPROVED}
            </div>
            <div className="text-sm text-gray-600">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">
              {statusCounts.REJECTED}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">
              {statusCounts.SUSPENDED}
            </div>
            <div className="text-sm text-gray-600">Suspended</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">
              {statusCounts.INACTIVE}
            </div>
            <div className="text-sm text-gray-600">Inactive</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search suppliers..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={value =>
                setStatusFilter(value as SupplierStatus | "ALL")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={value =>
                setSortBy(
                  value as
                    | "createdAt"
                    | "companyName"
                    | "status"
                    | "performanceGrade"
                )
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="companyName">Company Name</SelectItem>
                <SelectItem value="status">Status</SelectItem>
                {showPerformance && (
                  <SelectItem value="performanceGrade">
                    Performance Grade
                  </SelectItem>
                )}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              {sortOrder === "asc" ? "↑ Ascending" : "↓ Descending"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Suppliers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Suppliers ({filteredSuppliers.length})</CardTitle>
          <CardDescription>
            Manage supplier applications and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-8">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">
                No suppliers found matching your criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={
                          selectedSuppliers.size ===
                            getSelectableSuppliers().length &&
                          getSelectableSuppliers().length > 0
                        }
                        onCheckedChange={toggleAllSelection}
                        disabled={getSelectableSuppliers().length === 0}
                      />
                    </TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    {showPerformance && <TableHead>Performance</TableHead>}
                    {showPerformance && <TableHead>Fulfillment</TableHead>}
                    {showPerformance && <TableHead>Quality</TableHead>}
                    <TableHead>Categories</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSuppliers.map(supplier => {
                    const statusInfo = statusConfig[supplier.status] || {
                      label: supplier.status || "Unknown",
                      color: "bg-slate-100 text-slate-800 border-slate-200",
                      icon: AlertTriangle,
                    };
                    const StatusIcon = statusInfo.icon || AlertTriangle;

                    return (
                      <TableRow key={supplier.id}>
                        <TableCell>
                          {supplier.status === "PENDING" && (
                            <Checkbox
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
                              {supplier.businessCity},{" "}
                              {supplier.businessCountry}
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
                            {supplier.performance ? (
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={`${
                                    supplier.performance.performanceGrade ===
                                      "A+" ||
                                    supplier.performance.performanceGrade ===
                                      "A"
                                      ? "bg-green-100 text-green-800"
                                      : supplier.performance
                                            .performanceGrade === "B+" ||
                                          supplier.performance
                                            .performanceGrade === "B"
                                        ? "bg-blue-100 text-blue-800"
                                        : supplier.performance
                                              .performanceGrade === "C+" ||
                                            supplier.performance
                                              .performanceGrade === "C"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {supplier.performance.performanceGrade}
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  {supplier.performance.overallScore}%
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">
                                No data
                              </span>
                            )}
                          </TableCell>
                        )}
                        {showPerformance && (
                          <TableCell>
                            {supplier.performance ? (
                              <div className="text-sm">
                                <div className="flex items-center gap-1">
                                  <Package className="w-3 h-3 text-blue-600" />
                                  {supplier.performance.fulfillmentRate}%
                                </div>
                                <div className="text-xs text-gray-500">
                                  {supplier.performance.fulfilledOrders}/
                                  {supplier.performance.totalOrders} orders
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </TableCell>
                        )}
                        {showPerformance && (
                          <TableCell>
                            {supplier.performance ? (
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-600" />
                                <span className="text-sm">
                                  {supplier.performance.qualityScore}/5
                                </span>
                                <span className="text-xs text-gray-500 ml-1">
                                  ({supplier.performance.reviewCount} reviews)
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
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
                                +{supplier.productCategories.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="w-4 h-4" />
                            {new Date(supplier.createdAt).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" asChild>
                              <Link href={`/admin/suppliers/${supplier.id}`}>
                                <Eye className="w-4 h-4" />
                              </Link>
                            </Button>
                            {supplier.status === "PENDING" && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
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
        </CardContent>
      </Card>
    </div>
  );
}
