"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  MessageSquare,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  User,
  Building2,
  Calendar,
  FileText,
  MoreHorizontal,
  Plus,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AdminTicketDetail } from "./AdminTicketDetail";

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status:
    | "OPEN"
    | "PENDING_CUSTOMER"
    | "PENDING_SUPPLIER"
    | "RESOLVED"
    | "CLOSED"
    | "REOPENED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category:
    | "GENERAL"
    | "ACCOUNT"
    | "ORDER"
    | "SUPPORT"
    | "MARKETING"
    | "ANNOUNCEMENT";
  assignedTo: string | null;
  attachments: string[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  supplier: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPersonEmail: string;
  };
  assignedAdmin: {
    id: string;
    name: string;
    email: string;
  } | null;
  responses: Array<{
    id: string;
    responderType: string;
    createdAt: string;
  }>;
}

interface TicketStats {
  total: number;
  byStatus: Record<string, number>;
}

const priorityConfig = {
  URGENT: {
    label: "Urgent",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertTriangle,
  },
  HIGH: {
    label: "High",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertTriangle,
  },
  MEDIUM: {
    label: "Medium",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  LOW: {
    label: "Low",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
};

const statusConfig = {
  OPEN: {
    label: "Open",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  PENDING_CUSTOMER: {
    label: "Pending Customer",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  PENDING_SUPPLIER: {
    label: "Pending Supplier",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  RESOLVED: {
    label: "Resolved",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  CLOSED: {
    label: "Closed",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  REOPENED: {
    label: "Reopened",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
};

export function AdminTicketsList() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<TicketStats>({ total: 0, byStatus: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    category: "all",
    assignedTo: "all",
    search: "",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    fetchTickets();
  }, [filters, pagination.page]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      if (filters.status !== "all") params.append("status", filters.status);
      if (filters.priority !== "all")
        params.append("priority", filters.priority);
      if (filters.category !== "all")
        params.append("category", filters.category);
      if (filters.assignedTo !== "all")
        params.append("assignedTo", filters.assignedTo);
      if (filters.search) params.append("search", filters.search);

      const res = await fetch(`/api/admin/tickets?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load tickets");

      const data = await res.json();
      setTickets(data.tickets || []);
      setStats(data.stats || { total: 0, byStatus: {} });
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        pages: data.pagination.pages,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const handleSearch = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityIcon = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return config ? config.icon : Clock;
  };

  const getStatusColor = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? config.color : "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPriorityColor = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return config ? config.color : "bg-gray-100 text-gray-800 border-gray-200";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-600 mt-1">
            Manage and respond to supplier support requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchTickets}>
            <Clock className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Tickets
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.byStatus.OPEN || 0}
                </p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {(stats.byStatus.PENDING_CUSTOMER || 0) +
                    (stats.byStatus.PENDING_SUPPLIER || 0)}
                </p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.byStatus.RESOLVED || 0}
                </p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search tickets..."
                  value={filters.search}
                  onChange={e => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2">
              <Select
                value={filters.status}
                onValueChange={value => handleFilterChange("status", value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="OPEN">Open</SelectItem>
                  <SelectItem value="PENDING_CUSTOMER">
                    Pending Customer
                  </SelectItem>
                  <SelectItem value="PENDING_SUPPLIER">
                    Pending Supplier
                  </SelectItem>
                  <SelectItem value="RESOLVED">Resolved</SelectItem>
                  <SelectItem value="CLOSED">Closed</SelectItem>
                  <SelectItem value="REOPENED">Reopened</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.priority}
                onValueChange={value => handleFilterChange("priority", value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.category}
                onValueChange={value => handleFilterChange("category", value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="ACCOUNT">Account</SelectItem>
                  <SelectItem value="ORDER">Order</SelectItem>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={filters.assignedTo}
                onValueChange={value => handleFilterChange("assignedTo", value)}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickets</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading tickets...</span>
            </div>
          ) : tickets.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No tickets found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map(ticket => {
                    const PriorityIcon = getPriorityIcon(ticket.priority);
                    return (
                      <TableRow key={ticket.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="font-medium">
                            {ticket.ticketNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.responses.length} responses
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{ticket.subject}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {ticket.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <div>
                              <div className="font-medium">
                                {ticket.supplier.companyName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {ticket.supplier.contactPersonName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(ticket.status)}>
                            {statusConfig[ticket.status]?.label ||
                              ticket.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            <PriorityIcon className="w-3 h-3 mr-1" />
                            {priorityConfig[ticket.priority]?.label ||
                              ticket.priority}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ticket.assignedAdmin ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-gray-400" />
                              <span className="text-sm">
                                {ticket.assignedAdmin.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">
                              Unassigned
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(ticket.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setSelectedTicket(ticket)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Respond
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                <User className="w-4 h-4 mr-2" />
                                Assign
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} tickets
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() =>
                    setPagination(prev => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === pagination.pages}
                  onClick={() =>
                    setPagination(prev => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <AdminTicketDetail
        ticket={selectedTicket}
        open={!!selectedTicket}
        onOpenChange={(open) => !open && setSelectedTicket(null)}
        onTicketUpdate={fetchTickets}
      />
    </div>
  );
}
