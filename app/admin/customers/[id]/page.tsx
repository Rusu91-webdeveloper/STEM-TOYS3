"use client";

import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  Package,
  AlertCircle,
  UserX,
  UserCheck,
  Trash2,
  Edit,
  Clock,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
import { useCurrency } from "@/lib/currency";

type Order = {
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
  const { formatPrice } = useCurrency();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Fetch customer data
  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/customers/${customerId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch customer details");
        }
        const data = await response.json();
        setCustomer(data);
      } catch (error) {
        console.error("Error fetching customer details:", error);
        toast({
          title: "Error",
          description: "Failed to load customer details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId, toast]);

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
        status: newStatus ? "Active" : "Inactive",
      });

      toast({
        title: "Success",
        description: `Customer ${newStatus ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      console.error("Error updating customer status:", error);
      toast({
        title: "Error",
        description: "Failed to update customer status",
        variant: "destructive",
      });
    }
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
        title: "Success",
        description: "Customer deleted successfully",
      });

      // Redirect back to customers list
      router.push("/admin/customers");
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
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
    new Date(dateString).toLocaleDateString("en-US", {
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
            Loading customer details...
          </p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-xl font-semibold">Customer Not Found</h2>
        <p className="text-muted-foreground">
          The customer you're looking for doesn't exist or has been deleted.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push("/admin/customers")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Customers
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button and actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/customers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">
            Customer Details
          </h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => (window.location.href = `mailto:${customer.email}`)}
            className="flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            <span>Send Email</span>
          </Button>
          {customer.status === "Active" ? (
            <Button
              variant="destructive"
              onClick={toggleUserStatus}
              className="flex items-center gap-2"
            >
              <UserX className="h-4 w-4" />
              <span>Deactivate</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={toggleUserStatus}
              className="flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              <span>Activate</span>
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
                  <span>Delete</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Customer Account</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this customer? This action
                    cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={deleteCustomerAccount}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Delete Account
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">{customer.name}</CardTitle>
              <CardDescription className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4" />
                <span>{customer.email}</span>
              </CardDescription>
            </div>
            <Badge
              variant={customer.status === "Active" ? "default" : "secondary"}
              className={
                customer.status === "Active"
                  ? "bg-green-100 text-green-800 hover:bg-green-100"
                  : ""
              }
            >
              {customer.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="p-4 bg-muted rounded-md flex flex-col">
              <span className="text-muted-foreground text-xs uppercase">
                Joined
              </span>
              <span className="flex items-center mt-1 gap-1">
                <Clock className="h-4 w-4" />
                {formatDate(customer.joined)}
              </span>
            </div>
            <div className="p-4 bg-muted rounded-md flex flex-col">
              <span className="text-muted-foreground text-xs uppercase">
                Total Orders
              </span>
              <span className="flex items-center mt-1 gap-1">
                <ShoppingCart className="h-4 w-4" />
                {customer.totalOrders}
              </span>
            </div>
            <div className="p-4 bg-muted rounded-md flex flex-col">
              <span className="text-muted-foreground text-xs uppercase">
                Total Spent
              </span>
              <span className="flex items-center mt-1 gap-1">
                <DollarSign className="h-4 w-4" />
                {formatPrice(customer.totalSpent)}
              </span>
            </div>
            <div className="p-4 bg-muted rounded-md flex flex-col">
              <span className="text-muted-foreground text-xs uppercase">
                Wishlist Items
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
        <TabsList>
          <TabsTrigger value="addresses">Addresses</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="orders">Order History</TabsTrigger>
        </TabsList>

        {/* Addresses Tab */}
        <TabsContent value="addresses">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Saved Addresses</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.addresses.length === 0 ? (
                <p className="text-muted-foreground">No addresses saved.</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {customer.addresses.map(address => (
                    <Card key={address.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-md">
                            {address.name}
                          </CardTitle>
                          {address.isDefault && (
                            <Badge variant="outline">Default</Badge>
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
              <CardTitle className="text-lg">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.paymentCards.length === 0 ? (
                <p className="text-muted-foreground">
                  No payment methods saved.
                </p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {customer.paymentCards.map(card => (
                    <Card key={card.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-md flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            {card.cardType}
                          </CardTitle>
                          {card.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}
                        </div>
                        <CardDescription>{card.cardholderName}</CardDescription>
                      </CardHeader>
                      <CardContent className="pb-4">
                        <div className="text-sm space-y-1">
                          <p>•••• •••• •••• {card.lastFourDigits}</p>
                          <p className="text-muted-foreground">
                            Expires: {card.expiryMonth}/{card.expiryYear}
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
              <CardTitle className="text-lg">Order History</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.totalOrders === 0 ? (
                <p className="text-muted-foreground">No order history.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.lastOrder && (
                        <TableRow>
                          <TableCell>
                            #
                            {customer.lastOrder.id
                              .substring(0, 8)
                              .toUpperCase()}
                          </TableCell>
                          <TableCell>
                            {formatDate(customer.lastOrder.date)}
                          </TableCell>
                          <TableCell>
                            <span className="text-lg font-semibold">
                              {formatPrice(customer.lastOrder.total)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {customer.lastOrder.status}
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
                              View
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
                        View all {customer.totalOrders} orders
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
