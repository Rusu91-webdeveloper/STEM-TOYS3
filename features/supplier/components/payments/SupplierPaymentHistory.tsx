"use client";

import { useEffect, useState } from "react";
import {
  Download,
  Search,
  Filter,
  Calendar,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Banknote,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPriceWithCurrency } from "@/lib/currency-converter";

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "CANCELLED";
  paymentMethod: "BANK_TRANSFER" | "PAYPAL" | "STRIPE" | "WISE" | "OTHER";
  transactionId?: string;
  invoiceId?: string;
  invoiceNumber?: string;
  notes?: string;
  processedAt?: string;
  completedAt?: string;
  createdAt: string;
  fee?: number;
}

interface PaymentStats {
  totalPaid: number;
  totalPending: number;
  totalFees: number;
  averagePaymentTime: number;
  paymentCount: number;
  nextPaymentDate?: string;
  currentBalance: number;
}

export function SupplierPaymentHistory() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/supplier/payments");
      if (!response.ok) {
        throw new Error("Failed to fetch payment history");
      }

      const data = await response.json();
      setPayments(data.payments || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load payment history"
      );
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4" />;
      case "PROCESSING":
        return <Clock className="w-4 h-4" />;
      case "PENDING":
        return <Clock className="w-4 h-4" />;
      case "FAILED":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "BANK_TRANSFER":
        return <Banknote className="w-4 h-4" />;
      case "PAYPAL":
        return <CreditCard className="w-4 h-4" />;
      case "STRIPE":
        return <CreditCard className="w-4 h-4" />;
      case "WISE":
        return <DollarSign className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.notes?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;
    const matchesMethod =
      methodFilter === "all" || payment.paymentMethod === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Current Balance & Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Current Balance
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatPriceWithCurrency(stats.currentBalance)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Available for payout
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Paid
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPriceWithCurrency(stats.totalPaid)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {stats.paymentCount} payments
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {formatPriceWithCurrency(stats.totalPending)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Processing payments
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Avg Payment Time
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.averagePaymentTime} days
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    From invoice to payout
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Next Payment Info */}
      {stats?.nextPaymentDate && (
        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertDescription>
            <strong>Next Payment:</strong> Scheduled for{" "}
            {new Date(stats.nextPaymentDate).toLocaleDateString()}
          </AlertDescription>
        </Alert>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>
            Complete history of all your commission payments and payouts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                <SelectItem value="PAYPAL">PayPal</SelectItem>
                <SelectItem value="STRIPE">Stripe</SelectItem>
                <SelectItem value="WISE">Wise</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payments Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      No payments found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayments.map(payment => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </div>
                          {payment.completedAt && (
                            <div className="text-sm text-gray-500">
                              Completed:{" "}
                              {new Date(
                                payment.completedAt
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {formatPriceWithCurrency(payment.amount)}
                          </div>
                          {payment.fee && payment.fee > 0 && (
                            <div className="text-sm text-red-600">
                              Fee: {formatPriceWithCurrency(payment.fee)}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(payment.paymentMethod)}
                          <span className="text-sm">
                            {payment.paymentMethod.replace("_", " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(payment.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(payment.status)}
                            {payment.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.invoiceNumber ? (
                          <div>
                            <div className="font-medium">
                              {payment.invoiceNumber}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.invoiceId}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {payment.transactionId || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {payment.notes && (
                            <Button variant="ghost" size="sm">
                              <AlertTriangle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Receipt
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="text-sm text-gray-500">
              Showing {filteredPayments.length} of {payments.length} payments
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span>
                  Total Fees: {formatPriceWithCurrency(stats?.totalFees || 0)}
                </span>
              </div>
              <Button variant="outline" onClick={fetchPayments}>
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
