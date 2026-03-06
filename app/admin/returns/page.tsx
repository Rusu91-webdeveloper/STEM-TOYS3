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
  Calendar,
  TrendingUp,
  Users,
  Clock,
  DollarSign,
  RefreshCw,
  BarChart3,
  Eye,
  ImageIcon,
  ExternalLink,
  Send,
  Truck,
  Building2,
} from "lucide-react";
import Image from "next/image";
import { useState, useEffect } from "react";
import { DateRange } from "react-day-picker";
import { useSearchParams, useRouter } from "next/navigation";

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { AnalyticsChart } from "@/components/ui/analytics-chart";
import { useToast } from "@/components/ui/use-toast";
import { RETURN_REASON_LABELS_RO } from "@/lib/returns/policy";

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

type SupplierAuthorizationStatus =
  | "PENDING"
  | "REQUESTED"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

type CustomerSegment =
  | "new"
  | "returning"
  | "high-value"
  | "medium-value"
  | "low-value";

interface AnalyticsData {
  totalReturns: number;
  returnRate: number;
  averageProcessingTime: number;
  returnsByStatus: Array<{
    status: string;
    count: number;
  }>;
  returnsByReason: Array<{
    reason: string;
    count: number;
  }>;
  customerSegments: {
    newCustomers: number;
    returningCustomers: number;
    highValueCustomers: number;
    mediumValueCustomers: number;
    lowValueCustomers: number;
  };
  monthlyTrends: Array<{
    month: string;
    returns: number;
  }>;
  dateRange: {
    startDate: string | null;
    endDate: string | null;
  };
}

interface ReturnItem {
  id: string;
  reason: ReturnReason;
  details: string | null;
  status: ReturnStatus;
  createdAt: string;
  updatedAt?: string;
  refundStatus?: string | null;
  refundError?: string | null;
  photos?: string[];
  supplierAuthorizationStatus?: string | null;
  supplierAuthorizationDeadline?: string | null;
  supplierAuthorizationRequestedAt?: string | null;
  supplierAuthorizationNumber?: string | null;
  supplierAuthorizationNotes?: string | null;
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
      supplier?: {
        id: string;
        name: string;
      } | null;
    };
  };
}

const supplierAuthStatusOptions: SupplierAuthorizationStatus[] = [
  "PENDING",
  "REQUESTED",
  "APPROVED",
  "REJECTED",
  "EXPIRED",
];

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

const reasonLabels: Record<ReturnReason, string> = RETURN_REASON_LABELS_RO;

export default function AdminReturnsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Returns data and pagination
  const [returns, setReturns] = useState<ReturnItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  // Analytics data
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Filtering state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<ReturnStatus | undefined>(
    undefined
  );
  const [filterReason, setFilterReason] = useState<ReturnReason | undefined>(
    undefined
  );
  const [filterCustomerSegment, setFilterCustomerSegment] = useState<
    CustomerSegment | undefined
  >(undefined);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Bulk operations
  const [selectedReturns, setSelectedReturns] = useState<string[]>([]);
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Detail modal
  const [selectedReturnForDetails, setSelectedReturnForDetails] =
    useState<ReturnItem | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [sendingReport, setSendingReport] = useState<
    "supplier" | "courier" | null
  >(null);
  const [savingSupplierAuthorization, setSavingSupplierAuthorization] =
    useState(false);
  const [supplierAuthDraft, setSupplierAuthDraft] = useState<{
    status: SupplierAuthorizationStatus;
    number: string;
    notes: string;
    deadline: string;
  }>({
    status: "PENDING",
    number: "",
    notes: "",
    deadline: "",
  });

  const { toast } = useToast();

  // Initialize state from URL parameters
  useEffect(() => {
    const status = searchParams.get("status");
    const reason = searchParams.get("reason");
    const customerSegment = searchParams.get("customerSegment");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = searchParams.get("page");

    if (status && status !== "__ALL__") {
      setFilterStatus(status as ReturnStatus);
    }
    if (reason && reason !== "__ALL__") {
      setFilterReason(reason as ReturnReason);
    }
    if (customerSegment && customerSegment !== "__ALL__") {
      setFilterCustomerSegment(customerSegment as CustomerSegment);
    }
    if (startDate || endDate) {
      setDateRange({
        from: startDate ? new Date(startDate) : undefined,
        to: endDate ? new Date(endDate) : undefined,
      });
    }
    if (page) {
      setPagination(prev => ({ ...prev, page: parseInt(page) }));
    }
  }, [searchParams]);

  // Update URL when filters change
  const updateURL = (params: Record<string, string | undefined>) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== "__ALL__") {
        newSearchParams.set(key, value);
      } else {
        newSearchParams.delete(key);
      }
    });

    // Reset page when filters change (except for page parameter)
    if (!params.page) {
      newSearchParams.set("page", "1");
    }

    router.replace(`?${newSearchParams.toString()}`, { scroll: false });
  };

  // Fetch analytics data
  const fetchAnalytics = async (startDate?: string, endDate?: string) => {
    try {
      setAnalyticsLoading(true);
      const params = new URLSearchParams();
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await fetch(
        `/api/returns/analytics?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch analytics");
      }

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const fetchReturns = async (
    page = 1,
    status?: ReturnStatus,
    reason?: ReturnReason,
    customerSegment?: CustomerSegment,
    dateRange?: DateRange
  ) => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      });

      if (status) {
        params.append("status", status);
      }
      if (reason) {
        params.append("reason", reason);
      }
      if (customerSegment) {
        params.append("customerSegment", customerSegment);
      }
      if (dateRange?.from) {
        params.append("startDate", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        params.append("endDate", dateRange.to.toISOString());
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

  // Load analytics on mount
  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Fetch returns when filters change
  useEffect(() => {
    fetchReturns(
      pagination.page,
      filterStatus,
      filterReason,
      filterCustomerSegment,
      dateRange
    );
  }, [
    pagination.page,
    filterStatus,
    filterReason,
    filterCustomerSegment,
    dateRange,
    pagination.limit,
  ]);

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

      const data = await response.json().catch(() => null);
      if (data?.return) {
        applyUpdatedReturn(data.return);
      }

      toast({
        title: "Status Updated",
        description: `Return status changed to ${statusBadges[newStatus].label}`,
      });

      // Refresh the data
      fetchReturns(
        pagination.page,
        filterStatus,
        filterReason,
        filterCustomerSegment,
        dateRange
      );
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
      fetchReturns(
        pagination.page,
        filterStatus,
        filterReason,
        filterCustomerSegment,
        dateRange
      );
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

  // Handle date range changes
  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page

    // Update URL
    updateURL({
      startDate: range?.from?.toISOString(),
      endDate: range?.to?.toISOString(),
      page: "1",
    });
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    const newStatus = value === "__ALL__" ? undefined : (value as ReturnStatus);
    setFilterStatus(newStatus);
    setPagination(prev => ({ ...prev, page: 1 }));

    updateURL({ status: newStatus, page: "1" });
  };

  // Handle reason filter change
  const handleReasonFilterChange = (value: string) => {
    const newReason = value === "__ALL__" ? undefined : (value as ReturnReason);
    setFilterReason(newReason);
    setPagination(prev => ({ ...prev, page: 1 }));

    updateURL({ reason: newReason, page: "1" });
  };

  // Handle customer segment filter change
  const handleCustomerSegmentFilterChange = (value: string) => {
    const newSegment =
      value === "__ALL__" ? undefined : (value as CustomerSegment);
    setFilterCustomerSegment(newSegment);
    setPagination(prev => ({ ...prev, page: 1 }));

    updateURL({ customerSegment: newSegment, page: "1" });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    updateURL({ page: newPage.toString() });
  };

  // Handle analytics refresh
  const handleAnalyticsRefresh = () => {
    const startDate = dateRange?.from?.toISOString();
    const endDate = dateRange?.to?.toISOString();
    fetchAnalytics(startDate, endDate);
  };

  // View return details
  const handleViewDetails = (returnItem: ReturnItem) => {
    setSupplierAuthDraft({
      status:
        (returnItem.supplierAuthorizationStatus as SupplierAuthorizationStatus) ||
        "PENDING",
      number: returnItem.supplierAuthorizationNumber || "",
      notes: returnItem.supplierAuthorizationNotes || "",
      deadline: returnItem.supplierAuthorizationDeadline
        ? new Date(returnItem.supplierAuthorizationDeadline)
            .toISOString()
            .slice(0, 10)
        : "",
    });
    setSelectedReturnForDetails(returnItem);
    setDetailsModalOpen(true);
  };

  const applyUpdatedReturn = (updatedReturn: ReturnItem) => {
    setReturns(prev =>
      prev.map(item => (item.id === updatedReturn.id ? updatedReturn : item))
    );
    setSelectedReturnForDetails(updatedReturn);
  };

  const handleSaveSupplierAuthorization = async () => {
    if (!selectedReturnForDetails) return;

    try {
      setSavingSupplierAuthorization(true);

      const response = await fetch(
        `/api/returns/${selectedReturnForDetails.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            supplierAuthorizationStatus: supplierAuthDraft.status,
            supplierAuthorizationNumber: supplierAuthDraft.number,
            supplierAuthorizationNotes: supplierAuthDraft.notes,
            supplierAuthorizationDeadline: supplierAuthDraft.deadline || null,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          data?.error || "Failed to update supplier authorization"
        );
      }

      if (data?.return) {
        applyUpdatedReturn(data.return);
      } else {
        fetchReturns(
          pagination.page,
          filterStatus,
          filterReason,
          filterCustomerSegment,
          dateRange
        );
      }

      toast({
        title: "Supplier Authorization Updated",
        description: "RMA/ARP workflow details were saved successfully.",
      });
    } catch (error) {
      console.error("Error updating supplier authorization:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update supplier authorization.",
        variant: "destructive",
      });
    } finally {
      setSavingSupplierAuthorization(false);
    }
  };

  // Send return report to supplier or courier
  const handleSendReport = async (recipientType: "supplier" | "courier") => {
    if (!selectedReturnForDetails) return;

    try {
      setSendingReport(recipientType);

      const response = await fetch(
        `/api/returns/${selectedReturnForDetails.id}/send-report`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ recipientType }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Trimiterea a eșuat");
      }

      toast({
        title:
          recipientType === "supplier"
            ? "Raport trimis la furnizor"
            : "Reclamație trimisă la curier",
        description: data.message,
      });
    } catch (error) {
      console.error("Error sending report:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Nu s-a putut trimite raportul",
        variant: "destructive",
      });
    } finally {
      setSendingReport(null);
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
      </div>

      <Tabs defaultValue="returns" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
          <TabsTrigger value="returns">Returns Management</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          {/* Analytics Dashboard */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Returns
                </CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    analytics?.totalReturns || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Return requests processed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Return Rate
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `${analytics?.returnRate || 0}%`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Of total orders</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Avg Processing Time
                </CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    `${analytics?.averageProcessingTime || 0} days`
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  From approval to refund
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Returns
                </CardTitle>
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analyticsLoading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    analytics?.returnsByStatus.find(s => s.status === "PENDING")
                      ?.count || 0
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pending approval
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid gap-4 md:grid-cols-2">
            <AnalyticsChart
              data={
                analytics?.returnsByStatus.map(item => ({
                  name:
                    statusBadges[item.status as ReturnStatus]?.label ||
                    item.status,
                  value: item.count,
                })) || []
              }
              type="bar"
              title="Returns by Status"
              description="Distribution of return requests by current status"
              color="#2563eb"
            />

            <AnalyticsChart
              data={
                analytics?.returnsByReason.map(item => ({
                  name:
                    reasonLabels[item.reason as ReturnReason] || item.reason,
                  value: item.count,
                })) || []
              }
              type="pie"
              title="Returns by Reason"
              description="Most common reasons for returns"
            />
          </div>

          {/* Monthly Trends */}
          <AnalyticsChart
            data={
              analytics?.monthlyTrends.map(item => ({
                name: format(new Date(item.month + "-01"), "MMM yyyy"),
                value: item.returns,
              })) || []
            }
            type="line"
            title="Monthly Return Trends"
            description="Return requests over the last 12 months"
            color="#10b981"
            height={350}
          />

          {/* Customer Segments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Segments
              </CardTitle>
              <CardDescription>
                Return behavior by customer type
              </CardDescription>
            </CardHeader>
            <CardContent>
              {analyticsLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>New Customers</span>
                      <span className="font-medium">
                        {analytics?.customerSegments.newCustomers || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${analytics?.totalReturns ? ((analytics.customerSegments.newCustomers || 0) / analytics.totalReturns) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Returning Customers</span>
                      <span className="font-medium">
                        {analytics?.customerSegments.returningCustomers || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${analytics?.totalReturns ? ((analytics.customerSegments.returningCustomers || 0) / analytics.totalReturns) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>High-Value Customers</span>
                      <span className="font-medium">
                        {analytics?.customerSegments.highValueCustomers || 0}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{
                          width: `${analytics?.totalReturns ? ((analytics.customerSegments.highValueCustomers || 0) / analytics.totalReturns) * 100 : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Advanced Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {/* Date Range Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <DateRangePicker
                    date={dateRange}
                    onDateChange={handleDateRangeChange}
                    placeholder="Select date range"
                  />
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filterStatus || "__ALL__"}
                    onValueChange={handleStatusFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ALL__">All Statuses</SelectItem>
                      {Object.entries(statusBadges).map(
                        ([status, { label }]) => (
                          <SelectItem key={status} value={status}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Reason Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reason</label>
                  <Select
                    value={filterReason || "__ALL__"}
                    onValueChange={handleReasonFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Reasons" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ALL__">All Reasons</SelectItem>
                      {Object.entries(reasonLabels).map(([reason, label]) => (
                        <SelectItem key={reason} value={reason}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer Segment Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer Type</label>
                  <Select
                    value={filterCustomerSegment || "__ALL__"}
                    onValueChange={handleCustomerSegmentFilterChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ALL__">All Customers</SelectItem>
                      <SelectItem value="new">New Customers</SelectItem>
                      <SelectItem value="returning">
                        Returning Customers
                      </SelectItem>
                      <SelectItem value="high-value">
                        High-Value ($1000+)
                      </SelectItem>
                      <SelectItem value="medium-value">
                        Medium-Value ($500-$999)
                      </SelectItem>
                      <SelectItem value="low-value">
                        Low-Value (&lt;$500)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Search */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search returns..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                    {searchTerm && (
                      <X
                        className="absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground cursor-pointer"
                        onClick={() => setSearchTerm("")}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {filteredReturns.length} of {pagination.total} returns
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAnalyticsRefresh}
                    disabled={analyticsLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${analyticsLoading ? "animate-spin" : ""}`}
                    />
                    Refresh Analytics
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setFilterStatus(undefined);
                      setFilterReason(undefined);
                      setFilterCustomerSegment(undefined);
                      setDateRange(undefined);
                      setPagination(prev => ({ ...prev, page: 1 }));

                      // Clear all URL parameters
                      router.replace(window.location.pathname, {
                        scroll: false,
                      });
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions Section */}
          {filteredReturns.filter(ret => ret.status === "PENDING").length >
            0 && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={
                          selectedReturns.length > 0 &&
                          selectedReturns.length ===
                            filteredReturns.filter(
                              ret => ret.status === "PENDING"
                            ).length
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
                        order will be grouped together. Customers will receive
                        one email with one shipping label per order.
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
                                  checked={selectedReturns.includes(
                                    returnItem.id
                                  )}
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
                                      src={
                                        returnItem.orderItem.product.images[0]
                                      }
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
                                className={
                                  statusBadges[returnItem.status].color
                                }
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
                                      handleViewDetails(returnItem)
                                    }
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(
                                        returnItem.id,
                                        "APPROVED"
                                      )
                                    }
                                    disabled={returnItem.status === "APPROVED"}
                                  >
                                    Approve Return
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(
                                        returnItem.id,
                                        "REJECTED"
                                      )
                                    }
                                    disabled={returnItem.status === "REJECTED"}
                                  >
                                    Reject Return
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(
                                        returnItem.id,
                                        "RECEIVED"
                                      )
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
                                      handleUpdateStatus(
                                        returnItem.id,
                                        "REFUNDED"
                                      )
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
                      Showing {filteredReturns.length} of {pagination.total}{" "}
                      returns
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
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
                        onClick={() => handlePageChange(pagination.page + 1)}
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
        </TabsContent>
      </Tabs>

      {/* Return Details Modal */}
      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Return Details
            </DialogTitle>
            <DialogDescription>
              Return ID: {selectedReturnForDetails?.id.slice(-8)}
            </DialogDescription>
          </DialogHeader>

          {selectedReturnForDetails && (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex items-center justify-between">
                <Badge
                  className={`text-sm px-3 py-1 ${statusBadges[selectedReturnForDetails.status].color}`}
                >
                  {statusBadges[selectedReturnForDetails.status].label}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Requested:{" "}
                  {format(
                    new Date(selectedReturnForDetails.createdAt),
                    "MMM dd, yyyy 'at' HH:mm"
                  )}
                </span>
              </div>

              {/* Customer Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <p className="font-medium">
                      {selectedReturnForDetails.user.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Email:</span>
                    <p className="font-medium">
                      {selectedReturnForDetails.user.email}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Product Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Product Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {selectedReturnForDetails.orderItem.product.images?.[0] && (
                      <div className="relative h-24 w-24 rounded-lg overflow-hidden border">
                        <Image
                          src={
                            selectedReturnForDetails.orderItem.product.images[0]
                          }
                          alt={selectedReturnForDetails.orderItem.name}
                          className="object-cover"
                          fill
                        />
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <h4 className="font-medium">
                        {selectedReturnForDetails.orderItem.name}
                      </h4>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>
                          SKU:{" "}
                          {selectedReturnForDetails.orderItem.product.sku ||
                            "N/A"}
                        </p>
                        <p>
                          Supplier:{" "}
                          {selectedReturnForDetails.orderItem.product.supplier
                            ?.name || "In-house / Unknown"}
                        </p>
                        <p>
                          Quantity:{" "}
                          {selectedReturnForDetails.orderItem.quantity}
                        </p>
                        <p>
                          Price: $
                          {selectedReturnForDetails.orderItem.price.toFixed(2)}
                        </p>
                        <p>
                          Order #{selectedReturnForDetails.order.orderNumber}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Return Reason */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Return Reason</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="outline" className="text-sm">
                    {reasonLabels[selectedReturnForDetails.reason]}
                  </Badge>
                  {selectedReturnForDetails.details && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-1">
                        Additional Details:
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedReturnForDetails.details}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Photos Section */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Uploaded Photos
                    {selectedReturnForDetails.photos &&
                      selectedReturnForDetails.photos.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedReturnForDetails.photos.length} photo(s)
                        </Badge>
                      )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedReturnForDetails.photos &&
                  selectedReturnForDetails.photos.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {selectedReturnForDetails.photos.map((photo, index) => (
                        <div
                          key={index}
                          className="relative aspect-square rounded-lg overflow-hidden border group"
                        >
                          <Image
                            src={photo}
                            alt={`Return photo ${index + 1}`}
                            className="object-cover"
                            fill
                          />
                          <a
                            href={photo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            <ExternalLink className="h-6 w-6 text-white" />
                          </a>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No photos uploaded for this return</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Supplier Routing & Authorization */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Supplier Return Workflow
                  </CardTitle>
                  <CardDescription>
                    Track supplier approval (RMA/ARP) for this return item.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Supplier: </span>
                      <span className="font-medium">
                        {selectedReturnForDetails.orderItem.product.supplier
                          ?.name || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SKU: </span>
                      <span className="font-mono">
                        {selectedReturnForDetails.orderItem.product.sku ||
                          "N/A"}
                      </span>
                    </div>
                    {selectedReturnForDetails.supplierAuthorizationRequestedAt && (
                      <div>
                        <span className="text-muted-foreground">
                          Requested At:{" "}
                        </span>
                        <span>
                          {format(
                            new Date(
                              selectedReturnForDetails.supplierAuthorizationRequestedAt
                            ),
                            "MMM dd, yyyy HH:mm"
                          )}
                        </span>
                      </div>
                    )}
                    {selectedReturnForDetails.supplierAuthorizationDeadline && (
                      <div>
                        <span className="text-muted-foreground">
                          Deadline:{" "}
                        </span>
                        <span>
                          {format(
                            new Date(
                              selectedReturnForDetails.supplierAuthorizationDeadline
                            ),
                            "MMM dd, yyyy"
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Supplier Authorization Status
                      </label>
                      <Select
                        value={supplierAuthDraft.status}
                        onValueChange={value =>
                          setSupplierAuthDraft(prev => ({
                            ...prev,
                            status: value as SupplierAuthorizationStatus,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {supplierAuthStatusOptions.map(option => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        RMA / ARP Number
                      </label>
                      <Input
                        value={supplierAuthDraft.number}
                        onChange={e =>
                          setSupplierAuthDraft(prev => ({
                            ...prev,
                            number: e.target.value,
                          }))
                        }
                        placeholder="e.g. KID-RMA-1024"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Supplier Response Deadline
                      </label>
                      <Input
                        type="date"
                        value={supplierAuthDraft.deadline}
                        onChange={e =>
                          setSupplierAuthDraft(prev => ({
                            ...prev,
                            deadline: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Supplier Notes
                    </label>
                    <Textarea
                      value={supplierAuthDraft.notes}
                      onChange={e =>
                        setSupplierAuthDraft(prev => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Supplier response, RMA conditions, missing info, next action..."
                      className="min-h-[90px]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveSupplierAuthorization}
                      disabled={savingSupplierAuthorization}
                      variant="outline"
                    >
                      {savingSupplierAuthorization && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Save Supplier Workflow
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Refund Info (if refunded) */}
              {selectedReturnForDetails.status === "REFUNDED" && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Refund Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status: </span>
                      <span
                        className={
                          selectedReturnForDetails.refundStatus === "SUCCESS"
                            ? "text-green-600 font-medium"
                            : selectedReturnForDetails.refundStatus === "FAILED"
                              ? "text-red-600 font-medium"
                              : ""
                        }
                      >
                        {selectedReturnForDetails.refundStatus || "Unknown"}
                      </span>
                    </div>
                    {selectedReturnForDetails.refundError && (
                      <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700">
                        <p className="font-medium">Error:</p>
                        <p>{selectedReturnForDetails.refundError}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Send Report Actions */}
              <Card className="bg-blue-50 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Trimite Raport
                  </CardTitle>
                  <CardDescription>
                    Trimite detaliile returnării și fotografiile către furnizor
                    sau curier
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 border-purple-300 bg-purple-50 hover:bg-purple-100 text-purple-700"
                    onClick={() => handleSendReport("supplier")}
                    disabled={sendingReport !== null}
                  >
                    {sendingReport === "supplier" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Building2 className="h-4 w-4 mr-2" />
                    )}
                    Trimite la Furnizor (RMA)
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-orange-300 bg-orange-50 hover:bg-orange-100 text-orange-700"
                    onClick={() => handleSendReport("courier")}
                    disabled={sendingReport !== null}
                  >
                    {sendingReport === "courier" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Truck className="h-4 w-4 mr-2" />
                    )}
                    Trimite la Curier (Reclamație)
                  </Button>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setDetailsModalOpen(false)}
                >
                  Închide
                </Button>
                {selectedReturnForDetails.status === "PENDING" && (
                  <>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        handleUpdateStatus(
                          selectedReturnForDetails.id,
                          "REJECTED"
                        );
                        setDetailsModalOpen(false);
                      }}
                    >
                      Respinge Returnarea
                    </Button>
                    <Button
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => {
                        handleUpdateStatus(
                          selectedReturnForDetails.id,
                          "APPROVED"
                        );
                        setDetailsModalOpen(false);
                      }}
                    >
                      Aprobă Returnarea
                    </Button>
                  </>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
