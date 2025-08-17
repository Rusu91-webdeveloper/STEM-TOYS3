"use client";

import {
  Search,
  Filter,
  ArrowUpDown,
  MoreHorizontal,
  Mail,
  Download,
  RotateCw,
  User,
  Lock,
  BanIcon,
  ShieldCheck,
  Eye,
  Trash2,
  UserCheck,
  UserX,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/lib/currency";

// Type definitions
type Customer = {
  id: string;
  name: string;
  email: string;
  joined: string;
  orders: number;
  spent: number;
  status: string;
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
  const { formatPrice } = useCurrency();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  // Function to fetch customers from the API
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (status !== "all") params.append("status", status);
      if (sortBy) params.append("sortBy", sortBy);
      if (searchTerm) params.append("search", searchTerm);
      params.append("page", pagination.page.toString());
      params.append("limit", pagination.limit.toString());

      const response = await fetch(`/api/admin/customers?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch customers");
      }

      const data = await response.json();
      setCustomers(data.customers || []);
      setPagination(data.pagination || pagination);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast({
        title: "Error",
        description: "Failed to load customers. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch customers on initial load and when filters change
  useEffect(() => {
    fetchCustomers();
  }, [status, sortBy, pagination.page]);

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Reset to first page when searching
    setPagination({ ...pagination, page: 1 });
    fetchCustomers();
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
              status: newStatus ? "Active" : "Inactive",
            };
          }
          return customer;
        })
      );

      toast({
        title: "Success",
        description: `Customer status updated to ${newStatus ? "active" : "inactive"}`,
      });
    } catch (error) {
      console.error("Error updating customer status:", error);
      toast({
        title: "Error",
        description: "Failed to update customer status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Add function to handle user deletion
  const deleteUser = async (userId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this customer? This action cannot be undone."
      )
    ) {
      return;
    }

    setLoading(true);
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
        fetchCustomers();
      } else {
        // Update the total count
        setPagination({
          ...pagination,
          total: pagination.total - 1,
          pages: Math.ceil((pagination.total - 1) / pagination.limit),
        });
      }

      toast({
        title: "Success",
        description: "Customer deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting customer:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to delete customer",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            <span>Email All</span>
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <form
              onSubmit={handleSearch}
              className="flex w-full max-w-sm items-center space-x-2"
            >
              <Input
                type="search"
                placeholder="Search customers..."
                className="w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <Button type="submit" variant="outline" size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </form>
            <div className="flex flex-col sm:flex-row gap-2">
              <Select
                defaultValue="all"
                value={status}
                onValueChange={value => setStatus(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select
                defaultValue="newest"
                value={sortBy}
                onValueChange={value => setSortBy(value)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="spent-high">Highest Spent</SelectItem>
                  <SelectItem value="spent-low">Lowest Spent</SelectItem>
                  <SelectItem value="orders-high">Most Orders</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
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
                <span className="ml-2">Loading customers...</span>
              </div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No customers found. Try adjusting your filters.
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b text-xs font-medium text-muted-foreground">
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1">
                        <span>Customer</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1">
                        <span>Joined</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1">
                        <span>Orders</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1">
                        <span>Total Spent</span>
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
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
                            href={`/admin/customers/${customer.id.toLowerCase()}`}
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
                        {formatPrice(customer.spent)}
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
                          {customer.status}
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
                              <span className="sr-only">Actions</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/admin/customers/${customer.id.toLowerCase()}`
                                )
                              }
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                (window.location.href = `mailto:${customer.email}`)
                              }
                            >
                              <Mail className="mr-2 h-4 w-4" />
                              Send Email
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
                                Deactivate Account
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleUserStatus(customer.id, customer.status)
                                }
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Activate Account
                              </DropdownMenuItem>
                            )}
                            {customer.orders === 0 && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => deleteUser(customer.id)}
                                  className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Account
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

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {customers.length} of {pagination.total} customers
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={pagination.page <= 1 || loading}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={pagination.page >= pagination.pages || loading}
                className="gap-1"
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
