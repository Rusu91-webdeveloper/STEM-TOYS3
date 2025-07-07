"use client";

import { formatDistance, format } from "date-fns";
import {
  Loader2,
  MoreHorizontal,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  CheckSquare,
  Package,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
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
import { useToast } from "@/components/ui/use-toast";

type ReturnReason =
  | "DOES_NOT_MEET_EXPECTATIONS"
  | "DAMAGED_OR_DEFECTIVE"
  | "WRONG_ITEM_SHIPPED"
  | "CHANGED_MIND"
  | "ORDERED_WRONG_PRODUCT"
  | "OTHER";

type ReturnStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "RECEIVED"
  | "REFUNDED";

interface ReturnItem {
  id: string;
  reason: ReturnReason;
  details: string | null;
  status: ReturnStatus;
  createdAt: string;
  refundStatus?: string | null;
  refundError?: string | null;
  user: {
    id: string;
    name: string;
    email: string;
  };
  order: {
    id: string;
    orderNumber: string;
    createdAt: string;
  };
  orderItem: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    product: {
      id: string;
      name: string;
      slug: string;
      sku: string;
      images: string[];
    };
  };
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const statusBadges: Record<ReturnStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Approved", color: "bg-blue-100 text-blue-800" },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800" },
  RECEIVED: { label: "Received", color: "bg-purple-100 text-purple-800" },
  REFUNDED: { label: "Refunded", color: "bg-green-100 text-green-800" },
};

const reasonLabels: Record<ReturnReason, string> = {
  DOES_NOT_MEET_EXPECTATIONS: "Does not meet expectations",
  DAMAGED_OR_DEFECTIVE: "Damaged or defective",
  WRONG_ITEM_SHIPPED: "Wrong item shipped",
  CHANGED_MIND: "Changed mind",
  ORDERED_WRONG_PRODUCT: "Ordered wrong product",
  OTHER: "Other reason",
};

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<ReturnStatus | undefined>(
    undefined
  );
  const [selectedReturns, setSelectedReturns] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const { toast } = useToast();

  const fetchReturns = async (page = 1, status?: ReturnStatus) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (status) {
        params.append("status", status);
      }

      const response = await fetch(`/api/returns/admin?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setReturns(data.returns);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching returns:", error);
      toast({
        title: "Error",
        description: "Failed to load returns. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns(pagination.page, filterStatus);
  }, [pagination.page, filterStatus, pagination.limit]);

  const handleUpdateStatus = async (
    returnId: string,
    newStatus: ReturnStatus
  ) => {
    try {
      const response = await fetch(`/api/returns/${returnId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update status");
      }

      toast({
        title: "Status Updated",
        description: `Return status changed to ${statusBadges[newStatus].label}`,
      });

      // Refresh the data
      fetchReturns(pagination.page, filterStatus);
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update return status.",
        variant: "destructive",
      });
    }
  };

  const handleBulkApproval = async () => {
    if (selectedReturns.length === 0) {
      toast({
        title: "No Returns Selected",
        description: "Please select returns to approve.",
        variant: "destructive",
      });
      return;
    }

    try {
      setBulkProcessing(true);

      const response = await fetch("/api/returns/bulk-approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ returnIds: selectedReturns }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve returns");
      }

      const data = await response.json();

      toast({
        title: "Bulk Approval Successful",
        description: `Successfully approved ${selectedReturns.length} returns. Customers will receive consolidated emails with single shipping labels per order.`,
      });

      // Clear selection and refresh data
      setSelectedReturns([]);
      fetchReturns(pagination.page, filterStatus);
    } catch (error) {
      console.error("Error in bulk approval:", error);
      toast({
        title: "Bulk Approval Failed",
        description: "Failed to approve selected returns. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleSelectReturn = (returnId: string) => {
    setSelectedReturns(prev =>
      prev.includes(returnId)
        ? prev.filter(id => id !== returnId)
        : [...prev, returnId]
    );
  };

  const handleSelectAll = () => {
    const pendingReturns = returns
      .filter(ret => ret.status === "PENDING")
      .map(ret => ret.id);

    if (selectedReturns.length === pendingReturns.length) {
      setSelectedReturns([]);
    } else {
      setSelectedReturns(pendingReturns);
    }
  };

  const filteredReturns = searchTerm
    ? returns.filter(
        ret =>
          ret.orderItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ret.order.orderNumber
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          ret.user.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : returns;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Returns Management</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search returns..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-8 w-[250px]"
            />
            {searchTerm && (
              <X
                className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground cursor-pointer"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>
          <Select
            value={filterStatus || "__ALL__"}
            onValueChange={value =>
              setFilterStatus(
                value === "__ALL__" ? undefined : (value as ReturnStatus)
              )
            }
          >
            <SelectTrigger className="w-[160px]">
              <div className="flex items-center">
                <Filter className="mr-2 h-4 w-4" />
                {filterStatus
                  ? statusBadges[filterStatus].label
                  : "All Statuses"}
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__ALL__">All Statuses</SelectItem>
              {Object.entries(statusBadges).map(([status, { label }]) => (
                <SelectItem key={status} value={status}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions Section */}
      {filteredReturns.filter(ret => ret.status === "PENDING").length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={
                      selectedReturns.length > 0 &&
                      selectedReturns.length ===
                        filteredReturns.filter(ret => ret.status === "PENDING")
                          .length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">
                    {selectedReturns.length > 0
                      ? `${selectedReturns.length} returns selected`
                      : "Select all pending returns"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedReturns.length > 0 && (
                  <>
                    <Button
                      onClick={handleBulkApproval}
                      disabled={bulkProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {bulkProcessing ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Approve Selected ({selectedReturns.length})
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedReturns([])}
                      disabled={bulkProcessing}
                    >
                      Clear Selection
                    </Button>
                  </>
                )}
              </div>
            </div>
            {selectedReturns.length > 0 && (
              <div className="mt-3 p-3 bg-blue-100 rounded-md">
                <div className="flex items-center gap-2 text-sm text-blue-800">
                  <Package className="h-4 w-4" />
                  <span>
                    <strong>Bulk Processing:</strong> Returns from the same
                    order will be grouped together. Customers will receive one
                    email with one shipping label per order.
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Return Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : filteredReturns.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No returns found.
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={
                            filteredReturns.filter(
                              ret => ret.status === "PENDING"
                            ).length > 0 &&
                            selectedReturns.length ===
                              filteredReturns.filter(
                                ret => ret.status === "PENDING"
                              ).length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Return ID</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReturns.map(returnItem => (
                      <TableRow key={returnItem.id}>
                        <TableCell>
                          {returnItem.status === "PENDING" ? (
                            <Checkbox
                              checked={selectedReturns.includes(returnItem.id)}
                              onCheckedChange={() =>
                                handleSelectReturn(returnItem.id)
                              }
                            />
                          ) : null}
                        </TableCell>
                        <TableCell className="font-medium">
                          {returnItem.id.slice(-6)}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {returnItem.user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {returnItem.user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {returnItem.orderItem.product.images?.[0] && (
                              <div className="relative h-10 w-10 rounded overflow-hidden">
                                <Image
                                  src={returnItem.orderItem.product.images[0]}
                                  alt={returnItem.orderItem.name}
                                  className="object-cover"
                                  fill
                                />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">
                                {returnItem.orderItem.name}
                              </div>
                              <div className="text-xs text-gray-500">
                                Order #{returnItem.order.orderNumber}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div>{reasonLabels[returnItem.reason]}</div>
                            {returnItem.details && (
                              <div className="text-xs text-gray-500 mt-1 italic">
                                {returnItem.details}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {format(
                            new Date(returnItem.order.createdAt),
                            "MMM dd, yyyy"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={statusBadges[returnItem.status].color}
                          >
                            {statusBadges[returnItem.status].label}
                          </Badge>
                          {returnItem.status === "REFUNDED" && (
                            <div className="mt-1">
                              <span className="text-xs font-semibold">
                                Refund:
                              </span>{" "}
                              <span
                                className={
                                  returnItem.refundStatus === "SUCCESS"
                                    ? "text-green-700"
                                    : returnItem.refundStatus === "FAILED"
                                      ? "text-red-700"
                                      : "text-gray-700"
                                }
                              >
                                {returnItem.refundStatus || "Unknown"}
                              </span>
                              {returnItem.refundError && (
                                <div className="text-xs text-red-600 mt-1">
                                  {returnItem.refundError}
                                </div>
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Open menu</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateStatus(returnItem.id, "APPROVED")
                                }
                                disabled={returnItem.status === "APPROVED"}
                              >
                                Approve Return
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateStatus(returnItem.id, "REJECTED")
                                }
                                disabled={returnItem.status === "REJECTED"}
                              >
                                Reject Return
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateStatus(returnItem.id, "RECEIVED")
                                }
                                disabled={
                                  returnItem.status === "RECEIVED" ||
                                  returnItem.status === "REFUNDED"
                                }
                              >
                                Mark as Received
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleUpdateStatus(returnItem.id, "REFUNDED")
                                }
                                disabled={returnItem.status === "REFUNDED"}
                              >
                                Mark as Refunded
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="text-sm text-gray-500">
                  Showing {filteredReturns.length} of {pagination.total} returns
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        page: pagination.page - 1,
                      })
                    }
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <div className="text-sm">
                    Page {pagination.page} of {pagination.totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination({
                        ...pagination,
                        page: pagination.page + 1,
                      })
                    }
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
