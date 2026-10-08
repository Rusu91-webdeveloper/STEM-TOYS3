"use client";

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
  // Send,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  type Supplier,
  type SupplierStatus,
} from "@/features/supplier/types/supplier";
import { formatPriceWithCurrency } from "@/lib/currency-converter";

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

interface AdminSupplierDetailProps {
  supplierId: string;
}

export function AdminSupplierDetail({ supplierId }: AdminSupplierDetailProps) {
  const _router = useRouter();
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  const [marginForm, setMarginForm] = useState({
    defaultMargin: "",
    minimumMarginPercentage: "",
    priceChangeThreshold: "",
    plannedPromoDiscountPercentage: "",
    useSupplierRetailPriceAsBase: false,
  });
  const [isSavingMargins, setIsSavingMargins] = useState(false);
  const [pickupForm, setPickupForm] = useState({
    businessAddress: "",
    businessCity: "",
    businessState: "",
    businessPostalCode: "",
    businessCountry: "Romania",
    contactPersonName: "",
    contactPersonEmail: "",
    contactPersonPhone: "",
    phone: "",
  });
  const [isSavingPickup, setIsSavingPickup] = useState(false);

  useEffect(() => {
    fetchSupplier();
  }, [supplierId]);

  useEffect(() => {
    if (!supplier) return;
    const toPercent = (value?: number) =>
      value === undefined || value === null ? "" : String(value * 100);
    setMarginForm({
      defaultMargin: toPercent(supplier.defaultMargin),
      minimumMarginPercentage: toPercent(supplier.minimumMarginPercentage),
      priceChangeThreshold: toPercent(supplier.priceChangeThreshold),
      plannedPromoDiscountPercentage: toPercent(
        supplier.plannedPromoDiscountPercentage
      ),
      useSupplierRetailPriceAsBase:
        supplier.useSupplierRetailPriceAsBase ?? false,
    });
    setPickupForm({
      businessAddress: supplier.businessAddress || "",
      businessCity: supplier.businessCity || "",
      businessState: supplier.businessState || "",
      businessPostalCode: supplier.businessPostalCode || "",
      businessCountry: supplier.businessCountry || "Romania",
      contactPersonName: supplier.contactPersonName || "",
      contactPersonEmail: supplier.contactPersonEmail || "",
      contactPersonPhone: supplier.contactPersonPhone || "",
      phone: supplier.phone || "",
    });
  }, [supplier]);

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
          rejectionReason:
            newStatus === "REJECTED" ? rejectionReason : undefined,
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

  const _sendNotification = async (type: "approval" | "rejection") => {
    try {
      const response = await fetch(
        `/api/admin/suppliers/${supplierId}/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type,
            rejectionReason: type === "rejection" ? rejectionReason : undefined,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send notification");
      }
    } catch (err) {
      console.error("Error sending notification:", err);
      setError("Failed to send notification email");
    }
  };

  const handleMarginUpdate = async () => {
    try {
      setIsSavingMargins(true);
      setError(null);

      const parsePercent = (value: string) => {
        if (!value) return undefined;
        const numeric = Number(value);
        if (Number.isNaN(numeric)) return undefined;
        return numeric;
      };

      const payload = {
        defaultMargin: parsePercent(marginForm.defaultMargin),
        minimumMarginPercentage: parsePercent(
          marginForm.minimumMarginPercentage
        ),
        priceChangeThreshold: parsePercent(marginForm.priceChangeThreshold),
        plannedPromoDiscountPercentage: parsePercent(
          marginForm.plannedPromoDiscountPercentage
        ),
        useSupplierRetailPriceAsBase: marginForm.useSupplierRetailPriceAsBase,
      };

      const response = await fetch(`/api/admin/suppliers/${supplierId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update margin settings");
      }

      await fetchSupplier();
    } catch (err) {
      console.error("Error updating margin settings:", err);
      setError(err instanceof Error ? err.message : "Failed to update margins");
    } finally {
      setIsSavingMargins(false);
    }
  };

  const handlePickupUpdate = async () => {
    try {
      setIsSavingPickup(true);
      setError(null);

      const response = await fetch(`/api/admin/suppliers/${supplierId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          businessAddress: pickupForm.businessAddress,
          businessCity: pickupForm.businessCity,
          businessState: pickupForm.businessState,
          businessPostalCode: pickupForm.businessPostalCode,
          businessCountry: pickupForm.businessCountry,
          contactPersonName: pickupForm.contactPersonName,
          contactPersonEmail: pickupForm.contactPersonEmail,
          contactPersonPhone: pickupForm.contactPersonPhone,
          phone: pickupForm.phone,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update pickup details");
      }

      await fetchSupplier();
    } catch (err) {
      console.error("Error updating pickup details:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update pickup details"
      );
    } finally {
      setIsSavingPickup(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Se încarcă datele furnizorului…</p>
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
          <AlertDescription>{error || "Supplier not found"}</AlertDescription>
        </Alert>
        <Button variant="outline" className="mt-4" asChild>
          <Link href="/admin/suppliers">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Înapoi la furnizori
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
              Înapoi la furnizori
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {supplier.companyName}
            </h1>
            <p className="text-gray-600">Datele furnizorului</p>
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
                Datele firmei
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Numele firmei
                  </span>
                  <p className="text-gray-900">{supplier.companyName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Telefon
                  </span>
                  <p className="text-gray-900">{supplier.phone}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Cod TVA
                  </span>
                  <p className="text-gray-900">
                    {supplier.vatNumber || "Necompletat"}
                  </p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Identificator fiscal
                  </span>
                  <p className="text-gray-900">
                    {supplier.taxId || "Necompletat"}
                  </p>
                </div>
              </div>
              {supplier.description && (
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Descriere
                  </span>
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
                Sediul firmei
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-gray-900">{supplier.businessAddress}</p>
                <p className="text-gray-900">
                  {supplier.businessCity}, {supplier.businessState}{" "}
                  {supplier.businessPostalCode}
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
                Persoana de contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Nume
                  </span>
                  <p className="text-gray-900">{supplier.contactPersonName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Telefon
                  </span>
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

          {/* Pickup Address (FanCourier) */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Adresa de ridicare · Fan Courier
              </CardTitle>
              <CardDescription>
                Adresa folosită pentru ridicarea coletelor de către curier și
                documentele AWB.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup-business-address">Adresă</Label>
                  <Input
                    id="pickup-business-address"
                    value={pickupForm.businessAddress}
                    onChange={e =>
                      setPickupForm(prev => ({
                        ...prev,
                        businessAddress: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup-business-city">Localitate</Label>
                  <Input
                    id="pickup-business-city"
                    value={pickupForm.businessCity}
                    onChange={e =>
                      setPickupForm(prev => ({
                        ...prev,
                        businessCity: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup-business-state">Județ</Label>
                  <Input
                    id="pickup-business-state"
                    value={pickupForm.businessState}
                    onChange={e =>
                      setPickupForm(prev => ({
                        ...prev,
                        businessState: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup-business-postal">Cod poștal</Label>
                  <Input
                    id="pickup-business-postal"
                    value={pickupForm.businessPostalCode}
                    onChange={e =>
                      setPickupForm(prev => ({
                        ...prev,
                        businessPostalCode: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup-business-country">Țară</Label>
                  <Input
                    id="pickup-business-country"
                    value={pickupForm.businessCountry}
                    onChange={e =>
                      setPickupForm(prev => ({
                        ...prev,
                        businessCountry: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pickup-contact-name">
                    Numele persoanei de contact
                  </Label>
                  <Input
                    id="pickup-contact-name"
                    value={pickupForm.contactPersonName}
                    onChange={e =>
                      setPickupForm(prev => ({
                        ...prev,
                        contactPersonName: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup-contact-email">
                    E-mail de contact
                  </Label>
                  <Input
                    id="pickup-contact-email"
                    type="email"
                    value={pickupForm.contactPersonEmail}
                    onChange={e =>
                      setPickupForm(prev => ({
                        ...prev,
                        contactPersonEmail: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup-contact-phone">
                    Telefon de contact
                  </Label>
                  <Input
                    id="pickup-contact-phone"
                    value={pickupForm.contactPersonPhone}
                    onChange={e =>
                      setPickupForm(prev => ({
                        ...prev,
                        contactPersonPhone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pickup-main-phone">Telefon principal</Label>
                  <Input
                    id="pickup-main-phone"
                    value={pickupForm.phone}
                    onChange={e =>
                      setPickupForm(prev => ({
                        ...prev,
                        phone: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handlePickupUpdate} disabled={isSavingPickup}>
                  {isSavingPickup ? "Saving..." : "Save Pickup Details"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Informații despre firmă
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {supplier.yearEstablished && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Anul înființării
                    </span>
                    <p className="text-gray-900">{supplier.yearEstablished}</p>
                  </div>
                )}
                {supplier.employeeCount && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Angajați
                    </span>
                    <p className="text-gray-900">{supplier.employeeCount}</p>
                  </div>
                )}
                {supplier.annualRevenue && (
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Cifră de afaceri anuală
                    </span>
                    <p className="text-gray-900">{supplier.annualRevenue}</p>
                  </div>
                )}
              </div>

              {supplier.productCategories.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Categorii de produse
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {supplier.productCategories.map(category => (
                      <Badge key={category} variant="secondary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {supplier.certifications.length > 0 && (
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Certificări
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {supplier.certifications.map(cert => (
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
                <CardTitle>Verificarea cererii</CardTitle>
                <CardDescription>
                  Aprobă sau respinge cererea furnizorului.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleStatusUpdate("APPROVED")}
                  disabled={isUpdating}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Aprobă cererea
                </Button>

                <Dialog
                  open={showRejectionDialog}
                  onOpenChange={setShowRejectionDialog}
                >
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Respinge cererea
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Respinge cererea furnizorului</DialogTitle>
                      <DialogDescription>
                        Completează motivul respingerii, pentru comunicarea cu
                        furnizorul.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Enter rejection reason..."
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowRejectionDialog(false)}
                      >
                        Renunță
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleStatusUpdate("REJECTED")}
                        disabled={!rejectionReason.trim() || isUpdating}
                      >
                        Respinge cererea
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
                <CardTitle>Administrarea stării</CardTitle>
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
                      Suspendă furnizorul
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full text-gray-600 border-gray-600 hover:bg-gray-50"
                      onClick={() => handleStatusUpdate("INACTIVE")}
                      disabled={isUpdating}
                    >
                      <Building2 className="w-4 h-4 mr-2" />
                      Dezactivează furnizorul
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
                    Reactivează furnizorul
                  </Button>
                )}
                {supplier.status === "INACTIVE" && (
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusUpdate("APPROVED")}
                    disabled={isUpdating}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activează furnizorul
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Application Info */}
          <Card>
            <CardHeader>
              <CardTitle>Informații despre cerere</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Cerere depusă:</span>
                <span className="text-gray-900">
                  {new Date(supplier.createdAt).toLocaleDateString("ro-RO")}
                </span>
              </div>
              {supplier.approvedAt && (
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-gray-600">Aprobată:</span>
                  <span className="text-gray-900">
                    {new Date(supplier.approvedAt).toLocaleDateString("ro-RO")}
                  </span>
                </div>
              )}
              {supplier.rejectionReason && (
                <div>
                  <span className="text-sm font-medium text-gray-700">
                    Motivul respingerii
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {supplier.rejectionReason}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Terms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Condiții comerciale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Comision
                </span>
                <p className="text-gray-900">{supplier.commissionRate}%</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Termen de plată
                </span>
                <p className="text-gray-900">La {supplier.paymentTerms} zile</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Valoare minimă de comandă
                </span>
                <p className="text-gray-900">
                  {formatPriceWithCurrency(supplier.minimumOrderValue, "RON")}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Prețuri și marje · aplicate la următoarea sincronizare
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div className="rounded-md border border-gray-200 p-3 bg-gray-50">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={marginForm.useSupplierRetailPriceAsBase}
                        onChange={e =>
                          setMarginForm(prev => ({
                            ...prev,
                            useSupplierRetailPriceAsBase: e.target.checked,
                          }))
                        }
                      />
                      Folosește prețul de retail al furnizorului ca bază
                    </label>
                    <p className="mt-2 text-xs text-gray-500">
                      La sincronizare, prețul de retail al furnizorului devine
                      baza. Se adaugă marja suplimentară și, opțional, o rezervă
                      pentru reducerile planificate.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="admin-supplier-field-1"
                      className="text-xs text-gray-600"
                    >
                      Marjă peste prețul de retail al furnizorului (%)
                    </label>
                    <Input
                      id="admin-supplier-field-1"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={marginForm.defaultMargin}
                      onChange={e =>
                        setMarginForm(prev => ({
                          ...prev,
                          defaultMargin: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-supplier-field-2"
                      className="text-xs text-gray-600"
                    >
                      Reducere promoțională planificată (%)
                    </label>
                    <Input
                      id="admin-supplier-field-2"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={marginForm.plannedPromoDiscountPercentage}
                      onChange={e =>
                        setMarginForm(prev => ({
                          ...prev,
                          plannedPromoDiscountPercentage: e.target.value,
                        }))
                      }
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      Exemplu: preț furnizor 30 RON, marjă 20%, reducere
                      planificată 10%. Prețul sincronizat este 40 RON; după
                      cuponul de 10%, clientul plătește 36 RON.
                    </p>
                  </div>
                  <div>
                    <label
                      htmlFor="admin-supplier-field-3"
                      className="text-xs text-gray-600"
                    >
                      Marjă minimă (%)
                    </label>
                    <Input
                      id="admin-supplier-field-3"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={marginForm.minimumMarginPercentage}
                      onChange={e =>
                        setMarginForm(prev => ({
                          ...prev,
                          minimumMarginPercentage: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-supplier-field-4"
                      className="text-xs text-gray-600"
                    >
                      Prag de alertă pentru modificarea prețului (%)
                    </label>
                    <Input
                      id="admin-supplier-field-4"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={marginForm.priceChangeThreshold}
                      onChange={e =>
                        setMarginForm(prev => ({
                          ...prev,
                          priceChangeThreshold: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleMarginUpdate}
                    disabled={isSavingMargins}
                  >
                    {isSavingMargins ? "Saving..." : "Save Pricing Settings"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Acțiuni rapide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full" asChild>
                <Link href={`mailto:${supplier.contactPersonEmail}`}>
                  <Mail className="w-4 h-4 mr-2" />
                  Trimite e-mail
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`tel:${supplier.contactPersonPhone}`}>
                  <Phone className="w-4 h-4 mr-2" />
                  Sună persoana de contact
                </Link>
              </Button>
              {supplier.status === "APPROVED" && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/admin/suppliers/${supplier.id}/products`}>
                    <FileText className="w-4 h-4 mr-2" />
                    Vezi produsele
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
