"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  Building2,
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  FileText, 
  Calendar,
  User,
  Award,
  DollarSign,
  AlertCircle,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { type Supplier, type SupplierStatus } from "@/features/supplier/types/supplier";

const statusConfig = {
  PENDING: {
    label: "Pending Review",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock
  },
  APPROVED: {
    label: "Approved",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle
  },
  REJECTED: {
    label: "Rejected",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle
  },
  SUSPENDED: {
    label: "Suspended",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertTriangle
  },
  INACTIVE: {
    label: "Inactive",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Building2
  }
};

interface AdminSupplierDetailProps {
  supplierId: string;
}

export function AdminSupplierDetail({ supplierId }: AdminSupplierDetailProps) {
  const router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);

  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  const fetchSupplier = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/suppliers/${supplierId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch supplier details");
      }

      const data = await response.json();
      console.log("Supplier data received:", data);
      setSupplier(data);
    } catch (err) {
      console.error("Error fetching supplier:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: SupplierStatus) => {
    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch(`/api/admin/suppliers/${supplierId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
          rejectionReason: newStatus === "REJECTED" ? rejectionReason : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update supplier status");
      }

      // Refresh supplier data
      await fetchSupplier();
      setShowRejectionDialog(false);
      setRejectionReason("");
    } catch (err) {
      console.error("Error updating supplier status:", err);
      setError(err instanceof Error ? err.message : "Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const sendNotification = async (type: "approval" | "rejection") => {
    try {
      const response = await fetch(`/api/admin/suppliers/${supplierId}/notify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          rejectionReason: type === "rejection" ? rejectionReason : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }
    } catch (err) {
      console.error("Error sending notification:", err);
      setError("Failed to send notification email");
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading supplier details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !supplier) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || "Supplier not found"}
          </AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/suppliers">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Suppliers
          </Link>
        </Button>
      </div>
    );
  }

  const statusInfo = statusConfig[supplier.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="outline" asChild>
            <Link href="/admin/suppliers">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Suppliers
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{supplier.companyName}</h1>
            <p className="text-gray-600">Supplier Application Details</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusInfo.color}>
            <StatusIcon className="w-4 h-4 mr-1" />
            {statusInfo.label}
          </Badge>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Company Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Company Name</label>
                  <p className="text-gray-900">{supplier.companyName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900">{supplier.phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">VAT Number</label>
                  <p className="text-gray-900">{supplier.vatNumber || "Not provided"}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Tax ID</label>
                  <p className="text-gray-900">{supplier.taxId || "Not provided"}</p>
                </div>
              </div>
              {supplier.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-gray-900">{supplier.description}</p>
                </div>
              )}
              {supplier.website && (
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  <a 
                    href={supplier.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {supplier.website}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Business Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Business Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-gray-900">{supplier.businessAddress}</p>
                <p className="text-gray-900">
                  {supplier.businessCity}, {supplier.businessState} {supplier.businessPostalCode}
                </p>
                <p className="text-gray-900">{supplier.businessCountry}</p>
              </div>
            </CardContent>
          </Card>

          {/* Contact Person */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Contact Person
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">{supplier.contactPersonName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Phone</label>
                  <p className="text-gray-900">{supplier.contactPersonPhone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <a 
                  href={`mailto:${supplier.contactPersonEmail}`}
                  className="text-blue-600 hover:underline"
                >
                  {supplier.contactPersonEmail}
                </a>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {supplier.yearEstablished && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Year Established</label>
                    <p className="text-gray-900">{supplier.yearEstablished}</p>
                  </div>
                )}
                {supplier.employeeCount && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Employees</label>
                    <p className="text-gray-900">{supplier.employeeCount}</p>
                  </div>
                )}
                {supplier.annualRevenue && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Annual Revenue</label>
                    <p className="text-gray-900">{supplier.annualRevenue}</p>
                  </div>
                )}
              </div>

              {supplier.productCategories.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Product Categories</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {supplier.productCategories.map((category) => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {supplier.certifications.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Certifications</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {supplier.certifications.map((cert) => (
                      <Badge key={cert} variant="outline">
                        <Award className="w-3 h-3 mr-1" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Actions */}
          {supplier.status === "PENDING" && (
            <Card>
              <CardHeader>
                <CardTitle>Review Actions</CardTitle>
                <CardDescription>
                  Approve or reject this supplier application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleStatusUpdate("APPROVED")}
                  disabled={isUpdating}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Application
                </Button>
                
                <Dialog open={showRejectionDialog} onOpenChange={setShowRejectionDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full text-red-600 border-red-600 hover:bg-red-50">
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Application
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Reject Supplier Application</DialogTitle>
                      <DialogDescription>
                        Please provide a reason for rejection. This will be sent to the supplier.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Enter rejection reason..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowRejectionDialog(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate("REJECTED")}
                        disabled={!rejectionReason.trim() || isUpdating}
                      >
                        Reject Application
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )}

          {/* Status Management */}
          {supplier.status !== "PENDING" && (
            <Card>
              <CardHeader>
                <CardTitle>Status Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {supplier.status === "APPROVED" && (
                  <>
                    <Button
                      variant="outline"
                      className="w-full text-orange-600 border-orange-600 hover:bg-orange-50"
                      onClick={() => handleStatusUpdate("SUSPENDED")}
                      disabled={isUpdating}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Suspend Supplier
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-gray-600 border-gray-600 hover:bg-gray-50"
                      onClick={() => handleStatusUpdate("INACTIVE")}
                      disabled={isUpdating}
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Set Inactive
                    </Button>
                  </>
                )}
                {supplier.status === "SUSPENDED" && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusUpdate("APPROVED")}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Reactivate Supplier
                  </Button>
                )}
                {supplier.status === "INACTIVE" && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusUpdate("APPROVED")}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activate Supplier
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Application Info */}
          <Card>
            <CardHeader>
              <CardTitle>Application Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Applied:</span>
                <span className="text-gray-900">
                  {new Date(supplier.createdAt).toLocaleDateString()}
                </span>
              </div>
              {supplier.approvedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-600">Approved:</span>
                  <span className="text-gray-900">
                    {new Date(supplier.approvedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
              {supplier.rejectionReason && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Rejection Reason</label>
                  <p className="text-sm text-gray-600 mt-1">{supplier.rejectionReason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Financial Terms
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Commission Rate</label>
                <p className="text-gray-900">{supplier.commissionRate}%</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Payment Terms</label>
                <p className="text-gray-900">Net {supplier.paymentTerms} days</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Minimum Order Value</label>
                <p className="text-gray-900">€{supplier.minimumOrderValue}</p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`mailto:${supplier.contactPersonEmail}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Email
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`tel:${supplier.contactPersonPhone}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  Call Contact
                </Link>
              </Button>
              {supplier.status === "APPROVED" && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/admin/suppliers/${supplier.id}/products`}>
                    <FileText className="w-4 h-4 mr-2" />
                    View Products
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
