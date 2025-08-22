"use client";

import { format } from "date-fns";
import { Plus, Search, Send, Trash2, Copy } from "lucide-react";
import { useState, useEffect, useCallback } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

interface Coupon {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minimumOrderValue?: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  currentUses: number;
  maxUsesPerUser?: number;
  isActive: boolean;
  startsAt?: string;
  expiresAt?: string;
  isInfluencer: boolean;
  influencerName?: string;
  image?: string;
  showAsPopup: boolean;
  popupPriority: number;
  createdAt: string;
  admin: {
    name: string;
    email: string;
  };
  _count: {
    orders: number;
    usages: number;
  };
}

interface CreateCouponData {
  code: string;
  name: string;
  description?: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  minimumOrderValue?: number;
  maxDiscountAmount?: number;
  maxUses?: number;
  maxUsesPerUser?: number;
  startsAt?: string;
  expiresAt?: string;
  isInfluencer: boolean;
  influencerName?: string;
  image?: string;
  showAsPopup: boolean;
  popupPriority: number;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  // Create coupon form state
  const [newCoupon, setNewCoupon] = useState<CreateCouponData>({
    code: "",
    name: "",
    description: "",
    type: "PERCENTAGE",
    value: 0,
    minimumOrderValue: undefined,
    maxDiscountAmount: undefined,
    maxUses: undefined,
    maxUsesPerUser: undefined,
    startsAt: "",
    expiresAt: "",
    isInfluencer: false,
    influencerName: "",
    image: "",
    showAsPopup: true,
    popupPriority: 0,
  });

  // Email form state
  const [emailData, setEmailData] = useState({
    recipients: "subscribers" as "subscribers" | "all_users" | "custom",
    customEmails: "",
    subject: "",
    message: "",
  });

  // Fetch coupons
  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== "all" && { isActive: statusFilter }),
        ...(typeFilter !== "all" && { isInfluencer: typeFilter }),
      });

      console.warn("Fetching coupons with params:", params.toString());
      const response = await fetch(`/api/admin/coupons?${params}`);
      if (!response.ok) throw new Error("Failed to fetch coupons");

      const data = await response.json();
      console.warn("Fetched coupons data:", data);
      setCoupons(data.coupons);
      setTotalPages(data.pagination.pages);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast({
        title: "Error",
        description: "Failed to fetch coupons",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, typeFilter, toast]);

  useEffect(() => {
    console.warn(
      "useEffect triggered - currentPage:",
      currentPage,
      "searchTerm:",
      searchTerm,
      "statusFilter:",
      statusFilter,
      "typeFilter:",
      typeFilter
    );
    fetchCoupons();
  }, [fetchCoupons]);

  // Fetch custom CSRF token
  const getCustomCsrfToken = async () => {
    try {
      const response = await fetch("/api/csrf-token");
      if (!response.ok) {
        throw new Error("Failed to fetch CSRF token");
      }
      const data = await response.json();
      return data.csrfToken;
    } catch (error) {
      console.error("CSRF Token fetch error:", error);
      toast({
        title: "Security Error",
        description: "Could not verify your session. Please refresh the page.",
        variant: "destructive",
      });
      return null;
    }
  };

  // Create coupon
  const handleCreateCoupon = async () => {
    try {
      // Validate required fields on frontend
      if (!newCoupon.code.trim()) {
        toast({
          title: "Validation Error",
          description: "Coupon code is required",
          variant: "destructive",
        });
        return;
      }

      if (!newCoupon.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Coupon name is required",
          variant: "destructive",
        });
        return;
      }

      if (!newCoupon.value || newCoupon.value <= 0) {
        toast({
          title: "Validation Error",
          description: "Discount value must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      if (newCoupon.type === "PERCENTAGE" && newCoupon.value > 100) {
        toast({
          title: "Validation Error",
          description: "Percentage discount cannot exceed 100%",
          variant: "destructive",
        });
        return;
      }

      // Get CSRF token
      const csrfToken = await getCustomCsrfToken();
      if (!csrfToken) {
        // The getCustomCsrfToken function already shows a toast on error
        return;
      }

      const payload = {
        code: newCoupon.code.toUpperCase().trim(),
        name: newCoupon.name.trim(),
        description: newCoupon.description?.trim() || "",
        type: newCoupon.type,
        value: Number(newCoupon.value),
        minimumOrderValue: newCoupon.minimumOrderValue
          ? Number(newCoupon.minimumOrderValue)
          : "",
        maxDiscountAmount: newCoupon.maxDiscountAmount
          ? Number(newCoupon.maxDiscountAmount)
          : "",
        maxUses: newCoupon.maxUses ? Number(newCoupon.maxUses) : "",
        maxUsesPerUser: newCoupon.maxUsesPerUser
          ? Number(newCoupon.maxUsesPerUser)
          : "",
        startsAt: newCoupon.startsAt || "",
        expiresAt: newCoupon.expiresAt || "",
        isInfluencer: newCoupon.isInfluencer,
        influencerName: newCoupon.influencerName?.trim() || "",
        showAsPopup: newCoupon.showAsPopup,
        popupPriority: newCoupon.popupPriority
          ? Number(newCoupon.popupPriority)
          : 0,
      };

      console.warn("Sending coupon data:", payload);

      const response = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      console.warn("Coupon creation response:", responseData);

      if (!response.ok) {
        if (responseData.details) {
          // Show specific validation errors
          const errorMessages = responseData.details
            .map((err: any) => `${err.path.join(".")}: ${err.message}`)
            .join("\n");

          toast({
            title: "Validation Failed",
            description: errorMessages,
            variant: "destructive",
          });
        } else {
          throw new Error(responseData.error || "Failed to create coupon");
        }
        return;
      }

      toast({
        title: "Success",
        description: "Coupon created successfully",
      });

      setShowCreateDialog(false);
      setNewCoupon({
        code: "",
        name: "",
        description: "",
        type: "PERCENTAGE",
        value: 0,
        minimumOrderValue: undefined,
        maxDiscountAmount: undefined,
        maxUses: undefined,
        maxUsesPerUser: undefined,
        startsAt: "",
        expiresAt: "",
        isInfluencer: false,
        influencerName: "",
        image: "",
        showAsPopup: true,
        popupPriority: 0,
      });

      // Reset to first page and refresh the list
      setCurrentPage(1);
      console.warn("Resetting to page 1 and will fetch coupons");
    } catch (error) {
      console.error("Error creating coupon:", error); // For debugging
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to create coupon",
        variant: "destructive",
      });
    }
  };

  // Send coupon email
  const handleSendEmail = async () => {
    if (!selectedCoupon) return;

    try {
      const customEmailsList = emailData.customEmails
        ? emailData.customEmails
            .split(",")
            .map(email => email.trim())
            .filter(Boolean)
        : [];

      const response = await fetch(
        `/api/admin/coupons/${selectedCoupon.id}/send-email`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipients: emailData.recipients,
            customEmails:
              emailData.recipients === "custom" ? customEmailsList : undefined,
            subject: emailData.subject,
            message: emailData.message || undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to send emails");
      }

      const result = await response.json();
      toast({
        title: "Success",
        description: `Coupon emails sent to ${result.stats.successCount} recipients`,
      });

      setShowEmailDialog(false);
      setEmailData({
        recipients: "subscribers",
        customEmails: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to send emails",
        variant: "destructive",
      });
    }
  };

  // Delete/deactivate coupon
  const handleDeleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`Are you sure you want to delete "${coupon.name}"?`)) return;

    try {
      const response = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete coupon");

      toast({
        title: "Success",
        description: "Coupon deleted successfully",
      });

      fetchCoupons();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete coupon",
        variant: "destructive",
      });
    }
  };

  // Copy coupon code
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: `Coupon code "${code}" copied to clipboard`,
    });
  };

  const getStatusBadge = (coupon: Coupon) => {
    if (!coupon.isActive) return <Badge variant="destructive">Inactive</Badge>;
    if (coupon.expiresAt && new Date() > new Date(coupon.expiresAt)) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
  };

  const getUsageText = (coupon: Coupon) => {
    if (coupon.maxUses) {
      return `${coupon.currentUses}/${coupon.maxUses} uses`;
    }
    return `${coupon.currentUses} uses`;
  };

  const getDiscountText = (coupon: Coupon) => {
    if (coupon.type === "PERCENTAGE") {
      return `${coupon.value}% REDUCERE`;
    }
    return `${coupon.value} LEI REDUCERE`;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Discount Coupons</h1>
          <p className="text-muted-foreground mt-1">
            Manage discount coupons and promotional codes
          </p>
        </div>

        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Coupon</DialogTitle>
              <DialogDescription>
                Set up a new discount coupon for your customers
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Coupon Code *</Label>
                  <Input
                    id="code"
                    placeholder="SAVE20"
                    value={newCoupon.code}
                    onChange={e =>
                      setNewCoupon({
                        ...newCoupon,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    placeholder="20% Summer Sale"
                    value={newCoupon.name}
                    onChange={e =>
                      setNewCoupon({ ...newCoupon, name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Special summer discount for all products"
                  value={newCoupon.description}
                  onChange={e =>
                    setNewCoupon({ ...newCoupon, description: e.target.value })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="type">Discount Type *</Label>
                  <Select
                    value={newCoupon.type}
                    onValueChange={(value: "PERCENTAGE" | "FIXED_AMOUNT") =>
                      setNewCoupon({ ...newCoupon, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED_AMOUNT">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="value">
                    {newCoupon.type === "PERCENTAGE"
                      ? "Percentage (%)"
                      : "Amount (LEI)"}{" "}
                    *
                  </Label>
                  <Input
                    id="value"
                    type="number"
                    min="0"
                    max={newCoupon.type === "PERCENTAGE" ? "100" : undefined}
                    value={newCoupon.value || ""}
                    onChange={e =>
                      setNewCoupon({
                        ...newCoupon,
                        value: parseFloat(e.target.value) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minOrder">Minimum Order Value (LEI)</Label>
                  <Input
                    id="minOrder"
                    type="number"
                    min="0"
                    value={newCoupon.minimumOrderValue || ""}
                    onChange={e =>
                      setNewCoupon({
                        ...newCoupon,
                        minimumOrderValue:
                          parseFloat(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
                {newCoupon.type === "PERCENTAGE" && (
                  <div>
                    <Label htmlFor="maxDiscount">
                      Max Discount Amount (LEI)
                    </Label>
                    <Input
                      id="maxDiscount"
                      type="number"
                      min="0"
                      value={newCoupon.maxDiscountAmount || ""}
                      onChange={e =>
                        setNewCoupon({
                          ...newCoupon,
                          maxDiscountAmount:
                            parseFloat(e.target.value) || undefined,
                        })
                      }
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxUses">Max Total Uses</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="1"
                    value={newCoupon.maxUses || ""}
                    onChange={e =>
                      setNewCoupon({
                        ...newCoupon,
                        maxUses: parseInt(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="maxUsesPerUser">Max Uses Per User</Label>
                  <Input
                    id="maxUsesPerUser"
                    type="number"
                    min="1"
                    value={newCoupon.maxUsesPerUser || ""}
                    onChange={e =>
                      setNewCoupon({
                        ...newCoupon,
                        maxUsesPerUser: parseInt(e.target.value) || undefined,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startsAt">Start Date</Label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    value={newCoupon.startsAt}
                    onChange={e =>
                      setNewCoupon({ ...newCoupon, startsAt: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="expiresAt">Expiry Date</Label>
                  <Input
                    id="expiresAt"
                    type="datetime-local"
                    value={newCoupon.expiresAt}
                    onChange={e =>
                      setNewCoupon({ ...newCoupon, expiresAt: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isInfluencer"
                  checked={newCoupon.isInfluencer}
                  onCheckedChange={checked =>
                    setNewCoupon({ ...newCoupon, isInfluencer: checked })
                  }
                />
                <Label htmlFor="isInfluencer">Influencer Coupon</Label>
              </div>

              {newCoupon.isInfluencer && (
                <div>
                  <Label htmlFor="influencerName">Influencer Name</Label>
                  <Input
                    id="influencerName"
                    placeholder="John Doe"
                    value={newCoupon.influencerName}
                    onChange={e =>
                      setNewCoupon({
                        ...newCoupon,
                        influencerName: e.target.value,
                      })
                    }
                  />
                </div>
              )}

              <div>
                <Label htmlFor="image">Promotional Image URL</Label>
                <Input
                  id="image"
                  placeholder="https://example.com/coupon-image.jpg"
                  value={newCoupon.image}
                  onChange={e =>
                    setNewCoupon({ ...newCoupon, image: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Optional. Enter the URL of an image to display with this
                  coupon
                </p>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="showAsPopup"
                    checked={newCoupon.showAsPopup}
                    onCheckedChange={checked =>
                      setNewCoupon({ ...newCoupon, showAsPopup: checked })
                    }
                  />
                  <Label htmlFor="showAsPopup">Show as Website Popup</Label>
                  <p className="text-xs text-muted-foreground">
                    Display this coupon in a promotional popup when users visit
                    the website
                  </p>
                </div>

                {newCoupon.showAsPopup && (
                  <div>
                    <Label htmlFor="popupPriority">Popup Priority</Label>
                    <Input
                      id="popupPriority"
                      type="number"
                      min="0"
                      max="10"
                      placeholder="0"
                      value={newCoupon.popupPriority || ""}
                      onChange={e =>
                        setNewCoupon({
                          ...newCoupon,
                          popupPriority: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Higher numbers = higher priority. Only one popup will be
                      shown at a time
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCreateDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCoupon}>Create Coupon</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search coupons..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="false">Regular</SelectItem>
                <SelectItem value="true">Influencer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Coupons List */}
      <div className="grid gap-4 mb-6">
        {loading ? (
          <div className="text-center py-8">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground">No coupons found</p>
            </CardContent>
          </Card>
        ) : (
          coupons.map(coupon => (
            <Card key={coupon.id}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{coupon.name}</h3>
                      {getStatusBadge(coupon)}
                      {coupon.isInfluencer && (
                        <Badge variant="outline">
                          Influencer{" "}
                          {coupon.influencerName &&
                            `- ${coupon.influencerName}`}
                        </Badge>
                      )}
                      {coupon.showAsPopup && (
                        <Badge variant="secondary">
                          Popup Priority: {coupon.popupPriority}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-2">
                      <span className="font-mono bg-muted px-2 py-1 rounded">
                        {coupon.code}
                      </span>
                      <span className="font-semibold text-green-600">
                        {getDiscountText(coupon)}
                      </span>
                      <span>{getUsageText(coupon)}</span>
                      {coupon.expiresAt && (
                        <span>
                          Expires:{" "}
                          {format(new Date(coupon.expiresAt), "MMM d, yyyy")}
                        </span>
                      )}
                    </div>

                    {coupon.description && (
                      <p className="text-sm text-muted-foreground mb-2">
                        {coupon.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Created by {coupon.admin.name}</span>
                      <span>
                        {format(new Date(coupon.createdAt), "MMM d, yyyy")}
                      </span>
                      {coupon.minimumOrderValue && (
                        <span>Min order: {coupon.minimumOrderValue} LEI</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopyCode(coupon.code)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCoupon(coupon);
                        setEmailData({
                          ...emailData,
                          subject: `🎉 Ofertă Specială: ${getDiscountText(coupon)} cu codul ${coupon.code}!`,
                        });
                        setShowEmailDialog(true);
                      }}
                    >
                      <Send className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCoupon(coupon)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Email Dialog */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Coupon Email</DialogTitle>
            <DialogDescription>
              Send "{selectedCoupon?.name}" coupon to your customers
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="recipients">Recipients</Label>
              <Select
                value={emailData.recipients}
                onValueChange={(
                  value: "subscribers" | "all_users" | "custom"
                ) => setEmailData({ ...emailData, recipients: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="subscribers">
                    Newsletter Subscribers
                  </SelectItem>
                  <SelectItem value="all_users">
                    All Registered Users
                  </SelectItem>
                  <SelectItem value="custom">Custom Email List</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {emailData.recipients === "custom" && (
              <div>
                <Label htmlFor="customEmails">Email Addresses</Label>
                <Textarea
                  id="customEmails"
                  placeholder="email1@example.com, email2@example.com"
                  value={emailData.customEmails}
                  onChange={e =>
                    setEmailData({ ...emailData, customEmails: e.target.value })
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Separate multiple emails with commas
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="subject">Email Subject</Label>
              <Input
                id="subject"
                value={emailData.subject}
                onChange={e =>
                  setEmailData({ ...emailData, subject: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="message">Additional Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add a personal message to include in the email"
                value={emailData.message}
                onChange={e =>
                  setEmailData({ ...emailData, message: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendEmail}>Send Emails</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
