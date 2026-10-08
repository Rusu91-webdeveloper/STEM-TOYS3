"use client";

import {
  ArrowLeft,
  Mail,
  Phone,
  // MapPin,
  CreditCard,
  // Package,
  AlertCircle,
  UserX,
  UserCheck,
  Trash2,
  // Edit,
  Clock,
  DollarSign,
  ShoppingCart,
  Shield,
  Truck,
  User,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import { DashboardError } from "@/app/admin/components/dashboard-status";
import { RoleChangeDialog } from "@/components/admin/RoleChangeDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  // CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
// import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import {
  formatRon,
  formatOrderAmount,
  orderStatusLabels,
} from "@/lib/admin/dashboard-metrics";

type Order = {
  currency: string;
  orderNumber: string;
  paymentStatus: string;
  id: string;
  date: string;
  total: number;
  status: string;
};

type Address = {
  id: string;
  name: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

type PaymentCard = {
  id: string;
  cardholderName: string;
  lastFourDigits: string;
  cardType: string;
  expiryMonth: string;
  expiryYear: string;
  isDefault: boolean;
};

type CustomerDetails = {
  id: string;
  name: string;
  email: string;
  status: string;
  role: "CUSTOMER" | "ADMIN" | "SUPPLIER";
  joined: string;
  totalOrders: number;
  totalSpent: number;
  lastOrder: Order | null;
  wishlistCount: number;
  addresses: Address[];
  paymentCards: PaymentCard[];
};

export default function CustomerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const formatPrice = formatRon;
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  // Abort old requests when the record or page changes.
  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch(`/api/admin/customers/${customerId}`, {
          signal: controller.signal,
          cache: "no-store",
        });
        if (response.status === 404) {
          setCustomer(null);
          return;
        }
        if (!response.ok) throw new Error("Clientul nu a putut fi încărcat.");
        const data = await response.json();
        if (!controller.signal.aborted) setCustomer(data);
      } catch {
        if (!controller.signal.aborted)
          setLoadError(
            "Datele clientului nu au putut fi încărcate. Încearcă din nou."
          );
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    if (customerId) void load();
    return () => controller.abort();
  }, [customerId, reload]);

  // Toggle user status
  const toggleUserStatus = async () => {
    if (!customer) return;

    try {
      const newStatus = customer.status === "Active" ? false : true;

      const response = await fetch(
        `/api/admin/customers/${customer.id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isActive: newStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update customer status");
      }

      setCustomer({
        ...customer,
        status: newStatus ? "Activ" : "Inactiv",
      });

      toast({
        title: "Salvat",
        description: `Customer ${newStatus ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      console.error("Error updating customer status:", error);
      toast({
        title: "Eroare",
        description: "Starea clientului nu a putut fi actualizată.",
        variant: "destructive",
      });
    }
  };

  // Function to handle role change completion
  const handleRoleChanged = () => {
    // Refresh customer data to get updated role
    const fetchCustomerData = async () => {
      try {
        const response = await fetch(`/api/admin/customers/${customerId}`);
        if (response.ok) {
          const data = await response.json();
          setCustomer(data);
        }
      } catch (error) {
        console.error("Error refreshing customer data:", error);
      }
    };
    fetchCustomerData();
  };

  // Delete customer account
  const deleteCustomerAccount = async () => {
    if (!customer) return;

    try {
      const response = await fetch(`/api/admin/customers/${customer.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete customer");
      }

      toast({
        title: "Salvat",
        description: "Contul clientului a fost șters.",
      });

      // Redirect back to customers list
      router.push("/admin/customers");
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error ? error.message : "Failed to delete customer",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("ro-RO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Se încarcă datele clientului…
          </p>
        </div>
      </div>
    );
  }

  if (loadError)
    return (
      <DashboardError
        message={loadError}
        onRetry={() => setReload(previous => previous + 1)}
      />
    );
  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Clientul nu a fost găsit</h2>
        <p className="text-muted-foreground">
          Clientul nu există sau contul lui a fost șters.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/customers")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Înapoi la clienți
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/customers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Datele clientului
          </h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => (window.location.href = `mailto:${customer.email}`)}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            <span>Trimite e-mail</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsRoleDialogOpen(true)}
            className="flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            <span>Modifică rolul</span>
          </Button>
          {customer.status === "Active" ? (
            <Button
              variant="destructive"
              onClick={toggleUserStatus}
              className="flex items-center gap-2"
            >
              <UserX className="h-4 w-4" />
              <span>Dezactivează</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={toggleUserStatus}
              className="flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              <span>Activează</span>
            </Button>
          )}

          {customer.totalOrders === 0 && (
            <AlertDialog
              open={deleteDialogOpen}
              onOpenChange={setDeleteDialogOpen}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Șterge</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Șterge contul clientului</AlertDialogTitle>
                  <AlertDialogDescription>
                    Contul clientului va fi șters definitiv. Această acțiune nu
                    poate fi anulată.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
                    Renunță
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteCustomerAccount}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Șterge contul
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Customer Overview */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-xl">{customer.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                <span>{customer.email}</span>
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={customer.status === "Active" ? "default" : "secondary"}
                className={
                  customer.status === "Active"
                    ? "bg-green-100 text-green-800 hover:bg-green-100"
                    : ""
                }
              >
                {customer.status === "Active" ? "Activ" : "Inactiv"}
              </Badge>
              <Badge
                variant="outline"
                className={
                  customer.role === "ADMIN"
                    ? "bg-purple-100 text-purple-800 border-purple-200"
                    : customer.role === "SUPPLIER"
                      ? "bg-blue-100 text-blue-800 border-blue-200"
                      : "bg-gray-100 text-gray-800 border-gray-200"
                }
              >
                {customer.role === "ADMIN" ? (
                  <Shield className="mr-1 h-3 w-3" />
                ) : customer.role === "SUPPLIER" ? (
                  <Truck className="mr-1 h-3 w-3" />
                ) : (
                  <User className="mr-1 h-3 w-3" />
                )}
                {customer.role === "ADMIN"
                  ? "Administrator"
                  : customer.role === "SUPPLIER"
                    ? "Furnizor"
                    : "Client"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-4 bg-muted rounded-md flex flex-col">
              <span className="text-muted-foreground text-xs uppercase">
                Înregistrat la
              </span>
              <span className="flex items-center mt-1 gap-1">
                <Clock className="h-4 w-4" />
                {formatDate(customer.joined)}
              </span>
            </div>
            <div className="p-4 bg-muted rounded-md flex flex-col">
              <span className="text-muted-foreground text-xs uppercase">
                Comenzi plasate
              </span>
              <span className="flex items-center mt-1 gap-1">
                <ShoppingCart className="h-4 w-4" />
                {customer.totalOrders}
              </span>
            </div>
            <div className="p-4 bg-muted rounded-md flex flex-col">
              <span className="text-muted-foreground text-xs uppercase">
                Valoare achitată · RON
              </span>
              <div className="mt-1">
                <span className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" />
                  {formatPrice(customer.totalSpent)}
                </span>
                <p className="mt-1 text-xs text-slate-500">
                  Comenzi achitate în RON, fără comenzi anulate sau rambursate
                  integral. Rambursările parțiale nu sunt deduse.
                </p>
              </div>
            </div>
            <div className="p-4 bg-muted rounded-md flex flex-col">
              <span className="text-muted-foreground text-xs uppercase">
                Produse favorite
              </span>
              <span className="flex items-center mt-1 gap-1">
                {customer.wishlistCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabbed content */}
      <Tabs defaultValue="addresses">
        <TabsList className="flex h-auto w-full flex-wrap sm:w-auto">
          <TabsTrigger value="addresses">Adrese</TabsTrigger>
          <TabsTrigger value="payment">Metode de plată</TabsTrigger>
          <TabsTrigger value="orders">Istoricul comenzilor</TabsTrigger>
        </TabsList>

        {/* Addresses Tab */}
        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Adrese salvate</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.addresses.length === 0 ? (
                <p className="text-muted-foreground">
                  Nu există adrese salvate.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {customer.addresses.map(address => (
                    <Card key={address.id}>
                      <CardHeader className="pb-2">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <CardTitle className="text-md">
                            {address.name}
                          </CardTitle>
                          {address.isDefault && (
                            <Badge variant="outline">Implicită</Badge>
                          )}
                        </div>
                        <CardDescription>{address.fullName}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="text-sm space-y-1 text-muted-foreground">
                          <p>{address.addressLine1}</p>
                          {address.addressLine2 && (
                            <p>{address.addressLine2}</p>
                          )}
                          <p>
                            {address.city}, {address.state} {address.postalCode}
                          </p>
                          <p>{address.country}</p>
                          <p className="flex items-center gap-1 mt-2">
                            <Phone className="h-3 w-3" />
                            {address.phone}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metode de plată</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.paymentCards.length === 0 ? (
                <p className="text-muted-foreground">
                  Nu există metode de plată salvate.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {customer.paymentCards.map(card => (
                    <Card key={card.id}>
                      <CardHeader className="pb-2">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <CardTitle className="text-md flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            {card.cardType}
                          </CardTitle>
                          {card.isDefault && (
                            <Badge variant="outline">Implicită</Badge>
                          )}
                        </div>
                        <CardDescription>{card.cardholderName}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="text-sm space-y-1">
                          <p>•••• •••• •••• {card.lastFourDigits}</p>
                          <p className="text-muted-foreground">
                            Expiră la: {card.expiryMonth}/{card.expiryYear}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Order History Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Istoricul comenzilor</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.totalOrders === 0 ? (
                <p className="text-muted-foreground">
                  Clientul nu are comenzi înregistrate.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Comandă</TableHead>
                        <TableHead>Dată</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Stare</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.lastOrder && (
                        <TableRow>
                          <TableCell>
                            {customer.lastOrder.orderNumber ||
                              customer.lastOrder.id}
                          </TableCell>
                          <TableCell>
                            {formatDate(customer.lastOrder.date)}
                          </TableCell>
                          <TableCell>
                            <span className="text-lg font-semibold">
                              {formatOrderAmount(
                                customer.lastOrder.total,
                                customer.lastOrder.currency
                              )}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {orderStatusLabels[customer.lastOrder.status] ??
                                customer.lastOrder.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(
                                  `/admin/orders/${customer.lastOrder?.id}`
                                )
                              }
                            >
                              Vezi
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                      {/* Note: This only shows the last order. In a full app, you'd fetch and paginate all orders */}
                      {/* If we need more orders, we'd need a separate API endpoint to fetch customer's order history */}
                    </TableBody>
                  </Table>
                  {customer.totalOrders > 1 && (
                    <div className="mt-4 text-center">
                      <Link
                        href={`/admin/orders?customerId=${customer.id}`}
                        className="text-primary hover:underline text-sm"
                      >
                        Vezi toate cele {customer.totalOrders} comenzi
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Role Change Dialog */}
      {customer && (
        <RoleChangeDialog
          isOpen={isRoleDialogOpen}
          onClose={() => setIsRoleDialogOpen(false)}
          userId={customer.id}
          userName={customer.name || customer.email}
          currentRole={customer.role}
          onRoleChanged={handleRoleChanged}
        />
      )}
    </div>
  );
}
