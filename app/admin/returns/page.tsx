"use client";

import { format } from "date-fns";
import { ro } from "date-fns/locale";
import {
  Loader2,
  MoreHorizontal,
  Search,
  // Filter,
  ChevronLeft,
  ChevronRight,
  // X,
  CheckSquare,
  Package,
  // Calendar,
  // TrendingUp,
  Users,
  // Clock,
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
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef, useCallback } from "react";
import { DateRange } from "react-day-picker";

import { DashboardError } from "@/app/admin/components/dashboard-status";
// import { AnalyticsChart } from "@/components/ui/analytics-chart";
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
import { DateRangePicker } from "@/components/ui/date-range-picker";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { ReturnDestinationReview } from "@/features/returns/components/ReturnDestinationReview";
import { ReturnRefundReviewDialog } from "@/features/returns/components/ReturnRefundReviewDialog";
import { useCsrfToken } from "@/hooks/useCsrfToken";
import { formatOrderAmount } from "@/lib/admin/dashboard-metrics";
import { RETURN_REASON_LABELS_RO } from "@/lib/returns/policy";
import type {
  DestinationEvidence,
  ReturnDestination,
} from "@/lib/returns/return-destination";
import { canTransitionReturnStatus } from "@/lib/returns/status-machine";

type ReturnReason =
  | "DOES_NOT_MEET_EXPECTATIONS"
  | "DAMAGED_OR_DEFECTIVE"
  | "MISSING_PARTS"
  | "WRONG_ITEM_SHIPPED"
  | "DAMAGED_IN_TRANSIT"
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

type ReturnLiability =
  | "UNDECIDED"
  | "SUPPLIER"
  | "COURIER"
  | "INTERNAL"
  | "CUSTOMER";

type ReturnResolutionStatus =
  | "OPEN"
  | "WAITING_SUPPLIER"
  | "WAITING_COURIER"
  | "READY_TO_REFUND"
  | "REFUNDED"
  | "REJECTED"
  | "CLOSED";

type CustomerSegment =
  | "new"
  | "returning"
  | "high-value"
  | "medium-value"
  | "low-value";

interface _AnalyticsData {
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
  destination?: ReturnDestination;
  destinationReview?: DestinationEvidence | null;
  supplierContract?: string | null;
  supplierAuthorizationStatus?: string | null;
  supplierAuthorizationDeadline?: string | null;
  supplierAuthorizationRequestedAt?: string | null;
  supplierAuthorizationNumber?: string | null;
  supplierAuthorizationNotes?: string | null;
  sentToSupplierAt?: string | null;
  sentToCourierAt?: string | null;
  supplierMessageId?: string | null;
  courierMessageId?: string | null;
  liability?: ReturnLiability | null;
  resolutionStatus?: ReturnResolutionStatus | null;
  externalClaimDeadline?: string | null;
  resolutionNotes?: string | null;
  reportLogs?: Array<{
    id: string;
    recipientType: "SUPPLIER" | "COURIER";
    recipientEmail: string;
    messageId?: string | null;
    emailSubject?: string | null;
    sentAt: string;
  }>;
  user: {
    id: string;
    name: string;
    email: string;
  };
  order: {
    id: string;
    orderNumber: string;
    createdAt: string;
    total: number;
    currency: string;
    shippingCost: number;
    discountAmount: number;
    paymentMethod: string;
  };
  orderItem: {
    isDigital?: boolean;
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
        businessAddress?: string | null;
        businessCity?: string | null;
        businessState?: string | null;
        businessCountry?: string | null;
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

const liabilityOptions: Array<{
  value: ReturnLiability;
  label: string;
}> = [
  { value: "UNDECIDED", label: "Nestabilită" },
  { value: "SUPPLIER", label: "Furnizor" },
  { value: "COURIER", label: "Curier" },
  { value: "INTERNAL", label: "Magazin" },
  { value: "CUSTOMER", label: "Client" },
];

const resolutionStatusOptions: Array<{
  value: ReturnResolutionStatus;
  label: string;
}> = [
  { value: "OPEN", label: "Deschis" },
  { value: "WAITING_SUPPLIER", label: "În așteptarea furnizorului" },
  { value: "WAITING_COURIER", label: "În așteptarea curierului" },
  { value: "READY_TO_REFUND", label: "Pregătit pentru rambursare" },
  { value: "REFUNDED", label: "Rambursat" },
  { value: "REJECTED", label: "Respins" },
  { value: "CLOSED", label: "Închis" },
];

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const statusBadges: Record<ReturnStatus, { label: string; color: string }> = {
  PENDING: { label: "În așteptare", color: "bg-yellow-100 text-yellow-800" },
  APPROVED: { label: "Aprobat", color: "bg-blue-100 text-blue-800" },
  REJECTED: { label: "Respins", color: "bg-red-100 text-red-800" },
  RECEIVED: { label: "Primit", color: "bg-purple-100 text-purple-800" },
  REFUNDED: { label: "Rambursat", color: "bg-green-100 text-green-800" },
};

const reasonLabels: Record<ReturnReason, string> = RETURN_REASON_LABELS_RO;

const liabilityBadges: Record<
  ReturnLiability,
  { label: string; color: string }
> = {
  UNDECIDED: { label: "Nestabilită", color: "bg-slate-100 text-slate-700" },
  SUPPLIER: { label: "Furnizor", color: "bg-violet-100 text-violet-800" },
  COURIER: { label: "Curier", color: "bg-orange-100 text-orange-800" },
  INTERNAL: { label: "Magazin", color: "bg-blue-100 text-blue-800" },
  CUSTOMER: { label: "Client", color: "bg-amber-100 text-amber-800" },
};

const resolutionBadges: Record<
  ReturnResolutionStatus,
  { label: string; color: string }
> = {
  OPEN: { label: "Deschis", color: "bg-slate-100 text-slate-700" },
  WAITING_SUPPLIER: {
    label: "În așteptarea furnizorului",
    color: "bg-violet-100 text-violet-800",
  },
  WAITING_COURIER: {
    label: "În așteptarea curierului",
    color: "bg-orange-100 text-orange-800",
  },
  READY_TO_REFUND: {
    label: "Pregătit pentru rambursare",
    color: "bg-emerald-100 text-emerald-800",
  },
  REFUNDED: { label: "Rambursat", color: "bg-green-100 text-green-800" },
  REJECTED: { label: "Respins", color: "bg-red-100 text-red-800" },
  CLOSED: { label: "Închis", color: "bg-gray-200 text-gray-800" },
};

function formatDate(
  date: Date,
  pattern: string,
  options?: Parameters<typeof format>[2]
) {
  return format(date, pattern, { ...options, locale: ro });
}

function getReturnExposure(returnItem: ReturnItem) {
  return (
    Number(returnItem.orderItem.price || 0) *
    Number(returnItem.orderItem.quantity || 0)
  );
}

function getClaimDeadlineState(deadline?: string | null) {
  if (!deadline) return null;
  const date = new Date(deadline);
  if (Number.isNaN(date.getTime())) return null;
  const now = new Date();
  const isOverdue = date.getTime() < now.getTime();
  const msRemaining = date.getTime() - now.getTime();
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  return {
    date,
    isOverdue,
    daysRemaining,
  };
}

function canMoveReturnTo(
  currentStatus: ReturnStatus,
  nextStatus: ReturnStatus
) {
  return (
    currentStatus !== nextStatus &&
    canTransitionReturnStatus(currentStatus, nextStatus)
  );
}

export default function AdminReturnsPage() {
  const csrf = useCsrfToken();
  const [refundTarget, setRefundTarget] = useState<ReturnItem | null>(null);
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
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const requestController = useRef<AbortController | null>(null);
  const successfulQuery = useRef<string | null>(null);

  // Analytics data

  // Filtering state
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const [submittedSearch, setSubmittedSearch] = useState(
    searchParams.get("search") || ""
  );
  const [filterStatus, setFilterStatus] = useState<ReturnStatus | undefined>(
    undefined
  );
  const [filterReason, setFilterReason] = useState<ReturnReason | undefined>(
    undefined
  );
  const [filterLiability, setFilterLiability] = useState<
    ReturnLiability | undefined
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
  const [savingCaseTracking, setSavingCaseTracking] = useState(false);
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
  const [caseTrackingDraft, setCaseTrackingDraft] = useState<{
    liability: ReturnLiability;
    resolutionStatus: ReturnResolutionStatus;
    externalClaimDeadline: string;
    resolutionNotes: string;
  }>({
    liability: "UNDECIDED",
    resolutionStatus: "OPEN",
    externalClaimDeadline: "",
    resolutionNotes: "",
  });

  const { toast } = useToast();

  // Initialize state from URL parameters
  useEffect(() => {
    const status = searchParams.get("status");
    const reason = searchParams.get("reason");
    const liability = searchParams.get("liability");

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = searchParams.get("page");

    setFilterStatus(
      status && status !== "__ALL__" ? (status as ReturnStatus) : undefined
    );
    setFilterReason(
      reason && reason !== "__ALL__" ? (reason as ReturnReason) : undefined
    );
    setFilterLiability(
      liability && liability !== "__ALL__"
        ? (liability as ReturnLiability)
        : undefined
    );
    setSubmittedSearch(searchParams.get("search") || "");
    setSearchTerm(searchParams.get("search") || "");
    setDateRange(previous => {
      if (!startDate && !endDate) return undefined;
      if (
        previous?.from?.toISOString() === startDate &&
        previous?.to?.toISOString() === endDate
      )
        return previous;
      return {
        from: startDate ? new Date(startDate) : undefined,
        to: endDate ? new Date(endDate) : undefined,
      };
    });
    const parsedPage = Number(page || "1");
    setPagination(prev => ({
      ...prev,
      page: Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1,
    }));
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

  const fetchReturns = useCallback(
    async (
      page = 1,
      status?: ReturnStatus,
      reason?: ReturnReason,
      liability?: ReturnLiability,
      _customerSegment?: CustomerSegment,
      dateRange?: DateRange
    ) => {
      requestController.current?.abort();
      const controller = new AbortController();
      requestController.current = controller;
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
      if (liability) {
        params.append("liability", liability);
      }
      if (submittedSearch.trim()) params.set("search", submittedSearch.trim());
      if (dateRange?.from) {
        params.append("startDate", dateRange.from.toISOString());
      }
      if (dateRange?.to) {
        const inclusiveEnd = new Date(dateRange.to);
        inclusiveEnd.setHours(23, 59, 59, 999);
        params.append("endDate", inclusiveEnd.toISOString());
      }

      const query = params.toString();
      try {
        setLoading(true);
        setLoadError(null);
        const response = await fetch(`/api/returns/admin?${query}`, {
          signal: controller.signal,
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        if (controller.signal.aborted) return;
        setReturns(data.returns);
        setPagination(data.pagination);
        setSelectedReturns([]);
        setHasLoaded(true);
        successfulQuery.current = query;
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Error fetching returns:", error);
        setLoadError("Retururile nu au putut fi încărcate. Încearcă din nou.");
        if (successfulQuery.current !== query) {
          setReturns([]);
          setHasLoaded(false);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [pagination.limit, submittedSearch]
  );

  // Load analytics on mount

  // Fetch returns when filters change
  useEffect(() => {
    fetchReturns(
      pagination.page,
      filterStatus,
      filterReason,
      filterLiability,
      undefined,
      dateRange
    );
  }, [
    pagination.page,
    filterStatus,
    filterReason,
    filterLiability,
    dateRange,
    pagination.limit,
    fetchReturns,
  ]);
  useEffect(() => () => requestController.current?.abort(), []);

  const handleUpdateStatus = async (
    returnId: string,
    newStatus: ReturnStatus
  ) => {
    if (newStatus === "REFUNDED") {
      const target = returns.find(record => record.id === returnId);
      if (target) setRefundTarget(target);
      return;
    }
    try {
      const response = await fetch(`/api/returns/${returnId}/status`, {
        method: "PATCH",
        headers: csrf.addToHeaders({
          "Content-Type": "application/json",
        }),
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
        title: "Stare actualizată",
        description:
          data?.notification?.success === false
            ? "Statusul a fost salvat, dar emailul a eșuat. Corectează configurația și retrimite aprobarea."
            : `Return status changed to ${statusBadges[newStatus].label}`,
        variant:
          data?.notification?.success === false ? "destructive" : "default",
      });

      // Refresh the data
      fetchReturns(
        pagination.page,
        filterStatus,
        filterReason,
        filterLiability,
        undefined,
        dateRange
      );
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Eroare",
        description: "Starea returului nu a putut fi actualizată.",
        variant: "destructive",
      });
    }
  };

  const handleBulkApproval = async () => {
    if (selectedReturns.length === 0) {
      toast({
        title: "Niciun retur selectat",
        description: "Selectează retururile pe care vrei să le aprobi.",
        variant: "destructive",
      });
      return;
    }

    try {
      setBulkProcessing(true);

      const response = await fetch("/api/returns/bulk-approve", {
        method: "POST",
        headers: csrf.addToHeaders({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({ returnIds: selectedReturns }),
      });

      if (!response.ok) {
        throw new Error("Failed to approve returns");
      }

      const _data = await response.json();

      toast({
        title: "Retururi aprobate",
        description:
          response.status === 202
            ? "Retururile au fost aprobate, dar unele emailuri au eșuat. Corectează configurația și retrimite aprobarea."
            : `Aprobat ${selectedReturns.length} retururi. Serviciul de email a acceptat mesajele cu documente și destinații pentru fiecare articol.`,
        variant: response.status === 202 ? "destructive" : "default",
      });

      // Clear selection and refresh data
      setSelectedReturns([]);
      fetchReturns(
        pagination.page,
        filterStatus,
        filterReason,
        filterLiability,
        undefined,
        dateRange
      );
    } catch (error) {
      console.error("Error in bulk approval:", error);
      toast({
        title: "Aprobarea a eșuat",
        description:
          "Retururile selectate nu au putut fi aprobate. Încearcă din nou.",
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

  const handleLiabilityFilterChange = (value: string) => {
    const newLiability =
      value === "__ALL__" ? undefined : (value as ReturnLiability);
    setFilterLiability(newLiability);
    setPagination(prev => ({ ...prev, page: 1 }));

    updateURL({ liability: newLiability, page: "1" });
  };

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    updateURL({ page: newPage.toString() });
  };

  // Handle analytics refresh

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
    setCaseTrackingDraft({
      liability: (returnItem.liability as ReturnLiability) || "UNDECIDED",
      resolutionStatus:
        (returnItem.resolutionStatus as ReturnResolutionStatus) || "OPEN",
      externalClaimDeadline: returnItem.externalClaimDeadline
        ? new Date(returnItem.externalClaimDeadline).toISOString().slice(0, 10)
        : "",
      resolutionNotes: returnItem.resolutionNotes || "",
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
          headers: csrf.addToHeaders({
            "Content-Type": "application/json",
          }),
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
          filterLiability,
          undefined,
          dateRange
        );
      }

      toast({
        title: "Autorizarea furnizorului a fost actualizată",
        description: "Detaliile autorizării RMA/ARP au fost salvate.",
      });
    } catch (error) {
      console.error("Error updating supplier authorization:", error);
      toast({
        title: "Eroare",
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

  const handleSaveCaseTracking = async () => {
    if (!selectedReturnForDetails) return;

    try {
      setSavingCaseTracking(true);

      const response = await fetch(
        `/api/returns/${selectedReturnForDetails.id}/status`,
        {
          method: "PATCH",
          headers: csrf.addToHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({
            liability: caseTrackingDraft.liability,
            resolutionStatus: caseTrackingDraft.resolutionStatus,
            externalClaimDeadline:
              caseTrackingDraft.externalClaimDeadline || null,
            resolutionNotes: caseTrackingDraft.resolutionNotes,
          }),
        }
      );

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.error || "Failed to update case tracking");
      }

      if (data?.return) {
        applyUpdatedReturn(data.return);
      } else {
        fetchReturns(
          pagination.page,
          filterStatus,
          filterReason,
          filterLiability,
          undefined,
          dateRange
        );
      }

      toast({
        title: "Caz actualizat",
        description:
          "Responsabilitatea și etapa de recuperare au fost salvate.",
      });
    } catch (error) {
      console.error("Error updating case tracking:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Failed to update case tracking.",
        variant: "destructive",
      });
    } finally {
      setSavingCaseTracking(false);
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
          headers: csrf.addToHeaders({
            "Content-Type": "application/json",
          }),
          body: JSON.stringify({ recipientType }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Trimiterea a eșuat");
      }

      if (data?.audit) {
        const mergedReturn = {
          ...selectedReturnForDetails,
          ...data.audit,
        };
        applyUpdatedReturn(mergedReturn);
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

  const filteredReturns = returns;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Retururi</h1>
      </div>

      <div className="w-full">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Filtre
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                {/* Date Range Filter */}
                <div className="space-y-2">
                  <label htmlFor="date" className="text-sm font-medium">
                    Interval
                  </label>
                  <DateRangePicker
                    date={dateRange}
                    onDateChange={handleDateRangeChange}
                    placeholder="Alege intervalul"
                  />
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label
                    htmlFor="return-field-1"
                    className="text-sm font-medium"
                  >
                    Stare
                  </label>
                  <Select
                    value={filterStatus || "__ALL__"}
                    onValueChange={handleStatusFilterChange}
                  >
                    <SelectTrigger id="return-field-1">
                      <SelectValue placeholder="Toate stările" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ALL__">Toate stările</SelectItem>
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
                  <label
                    htmlFor="return-field-2"
                    className="text-sm font-medium"
                  >
                    Motiv
                  </label>
                  <Select
                    value={filterReason || "__ALL__"}
                    onValueChange={handleReasonFilterChange}
                  >
                    <SelectTrigger id="return-field-2">
                      <SelectValue placeholder="Toate motivele" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ALL__">Toate motivele</SelectItem>
                      {Object.entries(reasonLabels).map(([reason, label]) => (
                        <SelectItem key={reason} value={reason}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="return-field-3"
                    className="text-sm font-medium"
                  >
                    Responsabilitate
                  </label>
                  <Select
                    value={filterLiability || "__ALL__"}
                    onValueChange={handleLiabilityFilterChange}
                  >
                    <SelectTrigger id="return-field-3">
                      <SelectValue placeholder="Toate responsabilitățile" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__ALL__">
                        Toate responsabilitățile
                      </SelectItem>
                      {Object.entries(liabilityBadges).map(
                        ([liability, { label }]) => (
                          <SelectItem key={liability} value={liability}>
                            {label}
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Customer Segment Filter */}

                {/* Search */}
                <div className="space-y-2">
                  <label
                    htmlFor="return-field-4"
                    className="text-sm font-medium"
                  >
                    Caută
                  </label>
                  <form
                    className="relative"
                    onSubmit={event => {
                      event.preventDefault();
                      setSubmittedSearch(searchTerm);
                      setPagination(prev => ({ ...prev, page: 1 }));
                      updateURL({
                        search: searchTerm.trim() || undefined,
                        page: "1",
                      });
                    }}
                  >
                    <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="return-field-4"
                      placeholder="Client, comandă sau produs"
                      aria-label="Caută retururi"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                    <button
                      type="submit"
                      aria-label="Aplică căutarea retururilor"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600"
                    >
                      <Search className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {hasLoaded && !loading
                    ? `${filteredReturns.length} din ${pagination.total} retururi`
                    : "Se verifică situația retururilor"}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      fetchReturns(
                        pagination.page,
                        filterStatus,
                        filterReason,
                        filterLiability,
                        undefined,
                        dateRange
                      )
                    }
                    disabled={loading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                    />
                    Actualizează retururile
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setSubmittedSearch("");
                      setFilterStatus(undefined);
                      setFilterReason(undefined);
                      setFilterLiability(undefined);
                      setDateRange(undefined);
                      setPagination(prev => ({ ...prev, page: 1 }));

                      // Clear all URL parameters
                      router.replace(window.location.pathname, {
                        scroll: false,
                      });
                    }}
                  >
                    Resetează filtrele
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
                          ? `${selectedReturns.length} retururi selectate`
                          : "Selectează retururile în așteptare"}
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
                              Se procesează…
                            </>
                          ) : (
                            <>
                              <CheckSquare className="h-4 w-4 mr-2" />
                              Aprobă selecția ({selectedReturns.length})
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setSelectedReturns([])}
                          disabled={bulkProcessing}
                        >
                          Anulează selecția
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
                        <strong>Procesarea selecției:</strong> Retururile
                        aceleiași comenzi sunt grupate. Clientul primește un
                        singur e-mail, cu câte un document pentru fiecare produs
                        fizic și destinația lui.
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {loadError && (
            <DashboardError
              message={loadError}
              stale={hasLoaded}
              onRetry={() =>
                fetchReturns(
                  pagination.page,
                  filterStatus,
                  filterReason,
                  filterLiability,
                  undefined,
                  dateRange
                )
              }
            />
          )}
          <Card>
            <CardHeader>
              <CardTitle>Cereri de retur</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                </div>
              ) : !hasLoaded ? null : filteredReturns.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  Nu există retururi pentru filtrele alese.
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto rounded-md border">
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
                          <TableHead>ID retur</TableHead>
                          <TableHead>Client</TableHead>
                          <TableHead>Produs</TableHead>
                          <TableHead>Motiv</TableHead>
                          <TableHead>Data comenzii</TableHead>
                          <TableHead>Stare</TableHead>
                          <TableHead className="text-right">Acțiune</TableHead>
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
                                {returnItem.orderItem.product?.images?.[0] && (
                                  <div className="relative h-10 w-10 rounded overflow-hidden">
                                    <Image
                                      src={
                                        returnItem.orderItem.product?.images[0]
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
                                    Comanda #{returnItem.order.orderNumber}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Sumă în risc:{" "}
                                    {formatOrderAmount(
                                      getReturnExposure(returnItem),
                                      returnItem.order.currency
                                    )}
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
                              {formatDate(
                                new Date(returnItem.order.createdAt),
                                "dd MMM yyyy"
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
                              {returnItem.liability && (
                                <div className="mt-1">
                                  <Badge
                                    variant="outline"
                                    className={
                                      liabilityBadges[returnItem.liability]
                                        .color
                                    }
                                  >
                                    {
                                      liabilityBadges[returnItem.liability]
                                        .label
                                    }
                                  </Badge>
                                </div>
                              )}
                              {returnItem.resolutionStatus && (
                                <div className="mt-1">
                                  <Badge
                                    variant="outline"
                                    className={
                                      resolutionBadges[
                                        returnItem.resolutionStatus
                                      ].color
                                    }
                                  >
                                    {
                                      resolutionBadges[
                                        returnItem.resolutionStatus
                                      ].label
                                    }
                                  </Badge>
                                </div>
                              )}
                              {(() => {
                                const deadlineState = getClaimDeadlineState(
                                  returnItem.externalClaimDeadline
                                );
                                if (!deadlineState) return null;

                                return (
                                  <div
                                    className={`mt-1 text-xs ${
                                      deadlineState.isOverdue
                                        ? "text-red-700"
                                        : "text-amber-700"
                                    }`}
                                  >
                                    {deadlineState.isOverdue
                                      ? `Termen depășit din ${formatDate(
                                          deadlineState.date,
                                          "dd MMM yyyy",
                                          { locale: ro }
                                        )}`
                                      : `Termen reclamație ${formatDate(
                                          deadlineState.date,
                                          "dd MMM yyyy",
                                          { locale: ro }
                                        )}`}
                                  </div>
                                );
                              })()}
                              {returnItem.status === "REFUNDED" && (
                                <div className="mt-1">
                                  <span className="text-xs font-semibold">
                                    Rambursare:
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
                                    <span className="sr-only">
                                      Deschide acțiunile
                                    </span>
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleViewDetails(returnItem)
                                    }
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    Vezi detaliile
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(
                                        returnItem.id,
                                        "APPROVED"
                                      )
                                    }
                                    disabled={
                                      !canMoveReturnTo(
                                        returnItem.status,
                                        "APPROVED"
                                      )
                                    }
                                  >
                                    Aprobă returul
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(
                                        returnItem.id,
                                        "REJECTED"
                                      )
                                    }
                                    disabled={
                                      !canMoveReturnTo(
                                        returnItem.status,
                                        "REJECTED"
                                      )
                                    }
                                  >
                                    Respinge returul
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(
                                        returnItem.id,
                                        "RECEIVED"
                                      )
                                    }
                                    disabled={
                                      !canMoveReturnTo(
                                        returnItem.status,
                                        "RECEIVED"
                                      )
                                    }
                                  >
                                    Marchează primit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateStatus(
                                        returnItem.id,
                                        "REFUNDED"
                                      )
                                    }
                                    disabled={
                                      !canMoveReturnTo(
                                        returnItem.status,
                                        "REFUNDED"
                                      )
                                    }
                                  >
                                    Înregistrează rambursarea
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
                      Se afișează {filteredReturns.length} din{" "}
                      {pagination.total} retururi
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page - 1)}
                        disabled={pagination.page <= 1}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Înapoi
                      </Button>
                      <div className="text-sm">
                        Pagina {pagination.page} din {pagination.totalPages}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(pagination.page + 1)}
                        disabled={pagination.page >= pagination.totalPages}
                      >
                        Înainte
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Return Details Modal */}
      {refundTarget && (
        <ReturnRefundReviewDialog
          key={refundTarget.id}
          target={refundTarget}
          onClose={() => setRefundTarget(null)}
          onUpdated={record => {
            applyUpdatedReturn(record as ReturnItem);
            fetchReturns(
              pagination.page,
              filterStatus,
              filterReason,
              filterLiability,
              undefined,
              dateRange
            );
          }}
        />
      )}

      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-3xl max-h-[90dvh] overflow-y-auto overflow-x-hidden min-w-0 [overflow-wrap:anywhere] [&>*]:min-w-0 [&_input]:min-w-0 [&_textarea]:min-w-0 [&_button]:whitespace-normal">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Detaliile returului
            </DialogTitle>
            <DialogDescription>
              ID retur: {selectedReturnForDetails?.id.slice(-8)}
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
                  Solicitat la:{" "}
                  {formatDate(
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
                    Date client
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Nume:</span>
                    <p className="font-medium">
                      {selectedReturnForDetails.user.name}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">E-mail:</span>
                    <p className="font-medium">
                      {selectedReturnForDetails.user.email}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Product Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Date produs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4">
                    {selectedReturnForDetails.orderItem.product
                      ?.images?.[0] && (
                      <div className="relative h-24 w-24 rounded-lg overflow-hidden border">
                        <Image
                          src={
                            selectedReturnForDetails.orderItem.product
                              ?.images[0]
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
                          {selectedReturnForDetails.orderItem.product?.sku ||
                            "N/A"}
                        </p>
                        <p>
                          Furnizor:{" "}
                          {selectedReturnForDetails.orderItem.product?.supplier
                            ?.name || "In-house / Unknown"}
                        </p>
                        <p>
                          Cantitate:{" "}
                          {selectedReturnForDetails.orderItem.quantity}
                        </p>
                        <p>
                          Preț unitar:{" "}
                          {formatOrderAmount(
                            selectedReturnForDetails.orderItem.price,
                            selectedReturnForDetails.order.currency
                          )}
                        </p>
                        <p>
                          Comanda #{selectedReturnForDetails.order.orderNumber}
                        </p>
                        <p>
                          Sumă în risc:{" "}
                          {formatOrderAmount(
                            getReturnExposure(selectedReturnForDetails),
                            selectedReturnForDetails.order.currency
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Situația financiară
                  </CardTitle>
                  <CardDescription>
                    Valoarea rambursării și termenul de recuperare pentru acest
                    retur.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      Sumă în risc
                    </p>
                    <p className="mt-1 text-2xl font-semibold">
                      {formatOrderAmount(
                        getReturnExposure(selectedReturnForDetails),
                        selectedReturnForDetails.order.currency
                      )}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      Responsabilitate
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {
                        liabilityBadges[
                          (selectedReturnForDetails.liability as ReturnLiability) ||
                            "UNDECIDED"
                        ].label
                      }
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-sm text-muted-foreground">
                      Termen recuperare
                    </p>
                    {(() => {
                      const deadlineState = getClaimDeadlineState(
                        selectedReturnForDetails.externalClaimDeadline
                      );
                      if (!deadlineState) {
                        return (
                          <p className="mt-1 text-lg font-semibold">
                            Nestabilit
                          </p>
                        );
                      }

                      return (
                        <>
                          <p className="mt-1 text-lg font-semibold">
                            {formatDate(deadlineState.date, "dd MMM yyyy", {
                              locale: ro,
                            })}
                          </p>
                          <p
                            className={`text-sm ${
                              deadlineState.isOverdue
                                ? "text-red-700"
                                : "text-amber-700"
                            }`}
                          >
                            {deadlineState.isOverdue
                              ? "Follow-up overdue"
                              : `${deadlineState.daysRemaining} day(s) left`}
                          </p>
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Return Reason */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Motivul returului</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Badge variant="outline" className="text-sm">
                    {reasonLabels[selectedReturnForDetails.reason]}
                  </Badge>
                  {selectedReturnForDetails.details && (
                    <div className="mt-3 p-3 bg-muted rounded-md">
                      <p className="text-sm font-medium mb-1">
                        Detalii suplimentare:
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
                    Fotografii încărcate
                    {selectedReturnForDetails.photos &&
                      selectedReturnForDetails.photos.length > 0 && (
                        <Badge variant="secondary" className="ml-2">
                          {selectedReturnForDetails.photos.length} fotografii
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
                      <p>Nu există fotografii încărcate pentru acest retur.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Case Decision & Recovery */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">
                    Decizie și recuperare
                  </CardTitle>
                  <CardDescription>
                    Stabilește responsabilitatea și următorul pas pentru
                    recuperarea pierderii. Aprobarea furnizorului și recuperarea
                    banilor nu trebuie să întârzie rambursarea către client.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="return-field-5"
                        className="text-sm font-medium"
                      >
                        Responsabilitate
                      </label>
                      <Select
                        value={caseTrackingDraft.liability}
                        onValueChange={value =>
                          setCaseTrackingDraft(prev => ({
                            ...prev,
                            liability: value as ReturnLiability,
                          }))
                        }
                      >
                        <SelectTrigger id="return-field-5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {liabilityOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="return-field-6"
                        className="text-sm font-medium"
                      >
                        Etapa soluționării
                      </label>
                      <Select
                        value={caseTrackingDraft.resolutionStatus}
                        onValueChange={value =>
                          setCaseTrackingDraft(prev => ({
                            ...prev,
                            resolutionStatus: value as ReturnResolutionStatus,
                          }))
                        }
                      >
                        <SelectTrigger id="return-field-6">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {resolutionStatusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="return-field-7"
                        className="text-sm font-medium"
                      >
                        Termen recuperare externă
                      </label>
                      <Input
                        id="return-field-7"
                        type="date"
                        value={caseTrackingDraft.externalClaimDeadline}
                        onChange={e =>
                          setCaseTrackingDraft(prev => ({
                            ...prev,
                            externalClaimDeadline: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="return-field-8"
                      className="text-sm font-medium"
                    >
                      Note privind soluționarea
                    </label>
                    <Textarea
                      id="return-field-8"
                      value={caseTrackingDraft.resolutionNotes}
                      onChange={e =>
                        setCaseTrackingDraft(prev => ({
                          ...prev,
                          resolutionNotes: e.target.value,
                        }))
                      }
                      placeholder="Ce s-a întâmplat, cine rambursează, ce dovezi lipsesc și când se face rambursarea."
                      className="min-h-[90px]"
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button
                      onClick={handleSaveCaseTracking}
                      disabled={savingCaseTracking}
                      variant="outline"
                    >
                      {savingCaseTracking && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Salvează cazul
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <ReturnDestinationReview
                key={selectedReturnForDetails.id}
                returnId={selectedReturnForDetails.id}
                status={selectedReturnForDetails.status}
                isDigital={selectedReturnForDetails.orderItem.isDigital}
                destination={selectedReturnForDetails.destination}
                evidence={selectedReturnForDetails.destinationReview}
                contract={selectedReturnForDetails.supplierContract}
                warehouseAddress={[
                  selectedReturnForDetails.orderItem.product?.supplier
                    ?.businessAddress,
                  selectedReturnForDetails.orderItem.product?.supplier
                    ?.businessCity,
                  selectedReturnForDetails.orderItem.product?.supplier
                    ?.businessState,
                  selectedReturnForDetails.orderItem.product?.supplier
                    ?.businessCountry,
                ]
                  .filter(Boolean)
                  .join(", ")}
                headers={csrf.addToHeaders({
                  "Content-Type": "application/json",
                })}
                onSaved={(destination, destinationReview) =>
                  applyUpdatedReturn({
                    ...selectedReturnForDetails,
                    destination,
                    destinationReview,
                  })
                }
              />

              {/* Supplier Routing & Authorization */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Autorizarea furnizorului
                  </CardTitle>
                  <CardDescription>
                    Urmărește autorizarea RMA/ARP pentru produsul returnat.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Furnizor: </span>
                      <span className="font-medium">
                        {selectedReturnForDetails.orderItem.product?.supplier
                          ?.name || "Unknown"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">SKU: </span>
                      <span className="font-mono">
                        {selectedReturnForDetails.orderItem.product?.sku ||
                          "N/A"}
                      </span>
                    </div>
                    {selectedReturnForDetails.supplierAuthorizationRequestedAt && (
                      <div>
                        <span className="text-muted-foreground">
                          Solicitat la:{" "}
                        </span>
                        <span>
                          {formatDate(
                            new Date(
                              selectedReturnForDetails.supplierAuthorizationRequestedAt
                            ),
                            "dd MMM yyyy, HH:mm"
                          )}
                        </span>
                      </div>
                    )}
                    {selectedReturnForDetails.supplierAuthorizationDeadline && (
                      <div>
                        <span className="text-muted-foreground">Termen: </span>
                        <span>
                          {formatDate(
                            new Date(
                              selectedReturnForDetails.supplierAuthorizationDeadline
                            ),
                            "dd MMM yyyy"
                          )}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="return-field-9"
                        className="text-sm font-medium"
                      >
                        Starea autorizării
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
                        <SelectTrigger id="return-field-9">
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
                      <label
                        htmlFor="return-field-10"
                        className="text-sm font-medium"
                      >
                        Număr RMA/ARP
                      </label>
                      <Input
                        id="return-field-10"
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
                      <label
                        htmlFor="return-field-11"
                        className="text-sm font-medium"
                      >
                        Termen răspuns / termen recepție aprobat
                      </label>
                      <Input
                        id="return-field-11"
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
                    <label
                      htmlFor="return-field-12"
                      className="text-sm font-medium"
                    >
                      Note furnizor
                    </label>
                    <Textarea
                      id="return-field-12"
                      value={supplierAuthDraft.notes}
                      onChange={e =>
                        setSupplierAuthDraft(prev => ({
                          ...prev,
                          notes: e.target.value,
                        }))
                      }
                      placeholder="Răspunsul furnizorului, condiții RMA, informații lipsă și următorul pas…"
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
                      Salvează autorizarea
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
                      Date rambursare
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Stare: </span>
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
                        <p className="font-medium">Eroare:</p>
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
                <CardContent className="flex flex-col gap-3">
                  {(selectedReturnForDetails.sentToSupplierAt ||
                    selectedReturnForDetails.sentToCourierAt) && (
                    <div className="w-full rounded-md border border-blue-200 bg-white/80 p-3 text-sm text-slate-700">
                      {selectedReturnForDetails.sentToSupplierAt && (
                        <p>
                          Ultimul raport la furnizor:{" "}
                          {formatDate(
                            new Date(selectedReturnForDetails.sentToSupplierAt),
                            "dd MMM yyyy, HH:mm"
                          )}
                          {selectedReturnForDetails.supplierMessageId
                            ? ` | ID mesaj: ${selectedReturnForDetails.supplierMessageId}`
                            : ""}
                        </p>
                      )}
                      {selectedReturnForDetails.sentToCourierAt && (
                        <p>
                          Ultima reclamație la curier:{" "}
                          {formatDate(
                            new Date(selectedReturnForDetails.sentToCourierAt),
                            "dd MMM yyyy, HH:mm"
                          )}
                          {selectedReturnForDetails.courierMessageId
                            ? ` | ID mesaj: ${selectedReturnForDetails.courierMessageId}`
                            : ""}
                        </p>
                      )}
                    </div>
                  )}
                  {selectedReturnForDetails.reportLogs &&
                    selectedReturnForDetails.reportLogs.length > 0 && (
                      <div className="w-full rounded-md border border-blue-200 bg-white/80 p-3 text-sm text-slate-700">
                        <p className="mb-2 font-medium">
                          Istoricul rapoartelor
                        </p>
                        <div className="space-y-2">
                          {selectedReturnForDetails.reportLogs.map(log => (
                            <div
                              key={log.id}
                              className="rounded border border-slate-200 bg-slate-50 px-3 py-2"
                            >
                              <p>
                                {log.recipientType === "SUPPLIER"
                                  ? "Furnizor"
                                  : "Curier"}{" "}
                                |{" "}
                                {formatDate(
                                  new Date(log.sentAt),
                                  "dd MMM yyyy, HH:mm"
                                )}
                              </p>
                              <p className="text-slate-500">
                                {log.recipientEmail}
                                {log.messageId ? ` | ${log.messageId}` : ""}
                              </p>
                              {log.emailSubject && (
                                <p className="text-slate-500">
                                  {log.emailSubject}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  <div className="flex flex-col sm:flex-row gap-3">
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
                  </div>
                </CardContent>
              </Card>

              {(selectedReturnForDetails.status === "APPROVED" ||
                selectedReturnForDetails.status === "REJECTED") && (
                <Button
                  variant="outline"
                  onClick={() =>
                    handleUpdateStatus(
                      selectedReturnForDetails.id,
                      selectedReturnForDetails.status
                    )
                  }
                >
                  Retrimite emailul cu instrucțiuni
                </Button>
              )}

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
