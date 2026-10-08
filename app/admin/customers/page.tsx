"use client";

import {
  Search,
  Filter,
  Mail,
  ArrowUpDown,
  MoreHorizontal,
  RotateCw,
  User,
  Eye,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Truck,
  Settings,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useRef, useCallback } from "react";

import { DashboardError } from "@/app/admin/components/dashboard-status";
import { RoleChangeDialog } from "@/components/admin/RoleChangeDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { formatRon } from "@/lib/admin/dashboard-metrics";

// Type definitions
type Customer = {
  id: string;
  name: string;
  email: string;
  joined: string;
  orders: number;
  spent: number;
  status: string;
  role: "CUSTOMER" | "ADMIN" | "SUPPLIER";
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  pages: number;
};

export default function CustomersPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const requestController = useRef<AbortController | null>(null);
  const successfulQuery = useRef<string | null>(null);
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createRole, setCreateRole] = useState<"CUSTOMER" | "ADMIN">(
    "CUSTOMER"
  );
  const [createStatus, setCreateStatus] = useState<"active" | "inactive">(
    "active"
  );
  const [isCreating, setIsCreating] = useState(false);

  // Function to fetch customers from the API
  const fetchCustomers = useCallback(async () => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    let query = "";
    setLoading(true);
    setLoadError(null);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (status !== "all") params.append("status", status);
      if (sortBy) params.append("sortBy", sortBy);
      if (submittedSearch) params.append("search", submittedSearch);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      query = params.toString();
      const response = await fetch(`/api/admin/customers?${query}`, {
        signal: controller.signal,
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();
      if (controller.signal.aborted) return;
      successfulQuery.current = query;
      setCustomers(data.customers || []);
      setPagination(previous => data.pagination ?? previous);
      setHasLoaded(true);
    } catch (error) {
      if (controller.signal.aborted) return;
      if (successfulQuery.current !== query) {
        setHasLoaded(false);
        setCustomers([]);
      }
      console.error("Error fetching customers:", error);
      setLoadError(
        "Lista clienților nu a putut fi încărcată. Încearcă din nou."
      );
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [status, sortBy, submittedSearch, pagination.page, pagination.limit]);

  // Fetch customers on initial load and when filters change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);
  useEffect(() => () => requestController.current?.abort(), []);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setPagination(prev => ({ ...prev, page: 1 }));
    if (submittedSearch === searchTerm && pagination.page === 1)
      void fetchCustomers();
    setSubmittedSearch(searchTerm);
  };

  // Handle pagination
  const handlePrevPage = () => {
    if (pagination.page > 1) {
      setPagination({ ...pagination, page: pagination.page - 1 });
    }
  };

  const handleNextPage = () => {
    if (pagination.page < pagination.pages) {
      setPagination({ ...pagination, page: pagination.page + 1 });
    }
  };

  // Function to handle role change dialog
  const handleRoleChange = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsRoleDialogOpen(true);
  };

  // Function to handle role change completion
  const handleRoleChanged = () => {
    fetchCustomers(); // Refresh the customers list
    setSelectedCustomer(null);
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: createName,
          email: createEmail,
          password: createPassword || undefined,
          role: createRole,
          isActive: createStatus === "active",
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create customer";
        try {
          const error = await response.json();
          errorMessage = error.error || error.message || errorMessage;
        } catch {
          // ignore JSON parse errors
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      let description =
        data.message || "Customer account created successfully.";
      if (data.password) {
        description += ` Parolă temporară: ${data.password}`;
      }

      toast({
        title: "Salvat",
        description,
      });

      setIsCreateDialogOpen(false);
      setCreateName("");
      setCreateEmail("");
      setCreatePassword("");
      setCreateRole("CUSTOMER");
      setCreateStatus("active");

      // Refresh list
      fetchCustomers();
    } catch (error) {
      console.error("Error creating customer:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error ? error.message : "Failed to create customer",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  // Add function to handle user status toggle
  const toggleUserStatus = async (userId: string, currentStatus: string) => {
    setLoading(true);
    try {
      const newStatus = currentStatus === "Active" ? false : true;

      const response = await fetch(`/api/admin/customers/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update customer status");
      }

      // Update the customer in the local state
      setCustomers(
        customers.map(customer => {
          if (customer.id === userId) {
            return {
              ...customer,
              status: newStatus ? "Activ" : "Inactiv",
            };
          }
          return customer;
        })
      );

      toast({
        title: "Salvat",
        description: `Customer status updated to ${newStatus ? "active" : "inactive"}`,
      });
    } catch (error) {
      console.error("Error updating customer status:", error);
      toast({
        title: "Eroare",
        description: "Starea clientului nu a putut fi actualizată.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add function to handle user deletion
  const deleteUser = async (userId: string) => {
    if (deleting) return;
    setDeleting(true);
    try {
      const response = await fetch(`/api/admin/customers/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete customer");
      }

      // Remove the customer from the local state
      setCustomers(customers.filter(customer => customer.id !== userId));

      // Update pagination if needed
      if (customers.length === 1 && pagination.page > 1) {
        setPagination({ ...pagination, page: pagination.page - 1 });
      } else {
        // Update the total count
        setPagination({
          ...pagination,
          total: pagination.total - 1,
          pages: Math.ceil((pagination.total - 1) / pagination.limit),
        });
      }

      toast({
        title: "Salvat",
        description: "Contul clientului a fost șters.",
      });
      setDeleteTarget(null);
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error ? error.message : "Failed to delete customer",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Clienți</h1>
        <div className="flex gap-2">
          <Button
            className="flex items-center gap-2"
            onClick={() => setIsCreateDialogOpen(true)}
          >
            <User className="h-4 w-4" />
            <span>Adaugă client</span>
          </Button>
        </div>
      </div>

      {loadError && (
        <DashboardError
          message={loadError}
          stale={hasLoaded}
          onRetry={() => void fetchCustomers()}
        />
      )}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <form
              onSubmit={handleSearch}
              className="flex w-full max-w-sm items-center space-x-2"
            >
              <Input
                type="search"
                placeholder="Caută clienți..."
                className="w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Button
                type="submit"
                variant="outline"
                size="icon"
                aria-label="Caută clienți"
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                defaultValue="all"
                value={status}
                onValueChange={value => {
                  setStatus(value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Stare" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toate stările</SelectItem>
                  <SelectItem value="active">Activ</SelectItem>
                  <SelectItem value="inactive">Inactiv</SelectItem>
                </SelectContent>
              </Select>
              <Select
                defaultValue="newest"
                value={sortBy}
                onValueChange={value => {
                  setSortBy(value);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Ordonează după" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Cei mai noi</SelectItem>
                  <SelectItem value="oldest">Cei mai vechi</SelectItem>
                  <SelectItem value="spent-high">
                    Valoare achitată: descrescător
                  </SelectItem>
                  <SelectItem value="spent-low">
                    Valoare achitată: crescător
                  </SelectItem>
                  <SelectItem value="orders-high">
                    Cele mai multe comenzi
                  </SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                aria-label="Reîncarcă clienții"
                onClick={() => fetchCustomers()}
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-6 overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <RotateCw className="h-6 w-6 animate-spin" />
                <span className="ml-2">Se încarcă clienții…</span>
              </div>
            ) : !hasLoaded ? null : customers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nu există clienți pentru filtrele alese.
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b text-xs font-medium text-muted-foreground">
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1">
                        <span>Client</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1">
                        <span>Înregistrat la</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1">
                        <span>Comenzi</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1">
                        <span>Comenzi achitate (RON)</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">Stare</th>
                    <th className="px-4 py-3 text-left">Rol</th>
                    <th className="px-4 py-3 text-right">Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map(customer => (
                    <tr
                      key={customer.id}
                      className="border-b text-sm hover:bg-muted/50"
                    >
                      <td className="px-4 py-4">
                        <div>
                          <Link
                            href={`/admin/customers/${customer.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {customer.name}
                          </Link>
                          <div className="text-xs text-muted-foreground">
                            {customer.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">{customer.joined}</td>
                      <td className="px-4 py-4">{customer.orders}</td>
                      <td className="px-4 py-4 font-medium">
                        {formatRon(customer.spent)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            customer.status === "Active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {customer.status === "Active" ? (
                            <UserCheck className="mr-1 h-3 w-3" />
                          ) : (
                            <UserX className="mr-1 h-3 w-3" />
                          )}
                          {customer.status === "Active" ? "Activ" : "Inactiv"}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            customer.role === "ADMIN"
                              ? "bg-purple-100 text-purple-700"
                              : customer.role === "SUPPLIER"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {customer.role === "ADMIN" ? (
                            <Shield className="mr-1 h-3 w-3" />
                          ) : customer.role === "SUPPLIER" ? (
                            <Truck className="mr-1 h-3 w-3" />
                          ) : (
                            <User className="mr-1 h-3 w-3" />
                          )}
                          {
                            {
                              CUSTOMER: "Client",
                              ADMIN: "Administrator",
                              SUPPLIER: "Furnizor",
                            }[customer.role]
                          }
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Acțiuni</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Acțiuni</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/admin/customers/${customer.id}`)
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Vezi profilul
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                (window.location.href = `mailto:${customer.email}`)
                              }
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Trimite e-mail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRoleChange(customer)}
                            >
                              <Settings className="mr-2 h-4 w-4" />
                              Modifică rolul
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            {customer.status === "Active" ? (
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleUserStatus(customer.id, customer.status)
                                }
                                className="text-destructive focus:text-destructive"
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Dezactivează contul
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleUserStatus(customer.id, customer.status)
                                }
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activează contul
                              </DropdownMenuItem>
                            )}
                            {customer.orders === 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => setDeleteTarget(customer)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Șterge contul
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {hasLoaded && (
            <div className="mt-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Se afișează {customers.length} din {pagination.total} clienți
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={pagination.page <= 1 || loading}
                >
                  Înapoi
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={pagination.page >= pagination.pages || loading}
                  className="gap-1"
                >
                  Înainte
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={open => {
          if (!open && !deleting) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Șterge contul clientului?</DialogTitle>
            <DialogDescription>
              Contul {deleteTarget?.name || deleteTarget?.email} va fi șters
              definitiv. Această acțiune nu poate fi anulată.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
            >
              Renunță
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => {
                if (deleteTarget) void deleteUser(deleteTarget.id);
              }}
            >
              {deleting ? "Se șterge…" : "Șterge definitiv"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Customer Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adaugă un cont de client</DialogTitle>
            <DialogDescription>
              Creează un cont și stabilește rolul și accesul potrivit.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nume</Label>
              <Input
                id="create-name"
                value={createName}
                onChange={e => setCreateName(e.target.value)}
                placeholder="Numele clientului"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-email">E-mail</Label>
              <Input
                id="create-email"
                type="email"
                value={createEmail}
                onChange={e => setCreateEmail(e.target.value)}
                placeholder="customer@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="create-password">Parolă (opțional)</Label>
              <Input
                id="create-password"
                type="password"
                value={createPassword}
                onChange={e => setCreatePassword(e.target.value)}
                placeholder="Lasă gol pentru generarea unei parole"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={createRole}
                  onValueChange={value =>
                    setCreateRole(value as "CUSTOMER" | "ADMIN")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alege rolul" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CUSTOMER">Client</SelectItem>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Stare</Label>
                <Select
                  value={createStatus}
                  onValueChange={value =>
                    setCreateStatus(value as "active" | "inactive")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Alege starea" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activ</SelectItem>
                    <SelectItem value="inactive">Inactiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isCreating}
              >
                Renunță
              </Button>
              <Button type="submit" disabled={isCreating}>
                {isCreating ? "Se creează…" : "Creează contul"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Role Change Dialog */}
      {selectedCustomer && (
        <RoleChangeDialog
          isOpen={isRoleDialogOpen}
          onClose={() => {
            setIsRoleDialogOpen(false);
            setSelectedCustomer(null);
          }}
          userId={selectedCustomer.id}
          userName={selectedCustomer.name || selectedCustomer.email}
          currentRole={selectedCustomer.role}
          onRoleChanged={handleRoleChanged}
        />
      )}
    </div>
  );
}
