"use client";

import {
  Package,
  TrendingUp,
  Star,
  Calendar,
  Clock,
  Eye,
  ShoppingCart,
  Heart,
  CreditCard,
  MapPin,
  Bell,
  Search,
  Filter,
  Download,
  RefreshCw,
  Award,
  Target,
  Zap,
  Activity,
  BarChart3,
  Gift,
  CheckCircle,
  XCircle,
  AlertCircle,
  Truck,
  Box,
  DollarSign,
  Users,
  Percent,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { useCurrency } from "@/lib/currency";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
    image?: string;
  }[];
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  trackingNumber?: string;
}

interface UserStats {
  totalOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteCategory: string;
  accountLevel: {
    current: string;
    progress: number;
    nextLevel: string;
    benefitsUnlocked: string[];
  };
  loyaltyPoints: number;
  savedOnDiscounts: number;
}

interface Activity {
  id: string;
  type: "order" | "review" | "wishlist" | "account";
  title: string;
  description: string;
  date: string;
  icon: React.ComponentType<{ className?: string }>;
  status?: "success" | "warning" | "info";
}

interface EnhancedDashboardProps {
  className?: string;
}

const ORDER_STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-yellow-500",
    textColor: "text-yellow-700",
    bgColor: "bg-yellow-50",
    icon: Clock,
  },
  processing: {
    label: "Processing",
    color: "bg-blue-500",
    textColor: "text-blue-700",
    bgColor: "bg-blue-50",
    icon: Package,
  },
  shipped: {
    label: "Shipped",
    color: "bg-purple-500",
    textColor: "text-purple-700",
    bgColor: "bg-purple-50",
    icon: Truck,
  },
  delivered: {
    label: "Delivered",
    color: "bg-green-500",
    textColor: "text-green-700",
    bgColor: "bg-green-50",
    icon: CheckCircle,
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-500",
    textColor: "text-red-700",
    bgColor: "bg-red-50",
    icon: XCircle,
  },
};

const ACCOUNT_LEVELS = {
  bronze: {
    name: "Bronze Explorer",
    color: "from-amber-600 to-amber-400",
    next: "silver",
  },
  silver: {
    name: "Silver Innovator",
    color: "from-gray-500 to-gray-300",
    next: "gold",
  },
  gold: {
    name: "Gold Pioneer",
    color: "from-yellow-500 to-yellow-300",
    next: "platinum",
  },
  platinum: {
    name: "Platinum Genius",
    color: "from-purple-500 to-purple-300",
    next: null,
  },
};

export function EnhancedDashboard({ className }: EnhancedDashboardProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  const [orders, setOrders] = useState<Order[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [ordersRes, statsRes, activitiesRes] = await Promise.all([
          fetch("/api/account/orders?limit=50"),
          fetch("/api/account/dashboard/stats"),
          fetch("/api/account/dashboard/activities"),
        ]);

        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          setOrders(ordersData);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setUserStats(statsData);
        }

        if (activitiesRes.ok) {
          const activitiesData = await activitiesRes.json();
          setActivities(activitiesData);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        // Set mock data for demonstration
        setMockData();
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Set mock data for demonstration
  const setMockData = () => {
    setUserStats({
      totalOrders: 24,
      totalSpent: 1247.89,
      averageOrderValue: 51.99,
      favoriteCategory: "Science Kits",
      accountLevel: {
        current: "silver",
        progress: 65,
        nextLevel: "gold",
        benefitsUnlocked: ["Free Shipping", "Early Access", "Member Discounts"],
      },
      loyaltyPoints: 1250,
      savedOnDiscounts: 186.5,
    });

    setOrders([
      {
        id: "1",
        orderNumber: "STEM-2024-001",
        date: "2024-01-15",
        status: "delivered",
        total: 89.99,
        items: [
          {
            id: "1",
            name: "Advanced Chemistry Set",
            quantity: 1,
            price: 89.99,
            image: "/images/chemistry-set.jpg",
          },
        ],
        shippingAddress: {
          name: "John Doe",
          street: "123 Science St",
          city: "Innovation City",
          state: "CA",
          zipCode: "90210",
        },
        trackingNumber: "TRK123456789",
      },
      {
        id: "2",
        orderNumber: "STEM-2024-002",
        date: "2024-01-10",
        status: "shipped",
        total: 156.48,
        items: [
          {
            id: "2",
            name: "Robotics Starter Kit",
            quantity: 1,
            price: 129.99,
            image: "/images/robotics-kit.jpg",
          },
          {
            id: "3",
            name: "Digital Microscope",
            quantity: 1,
            price: 26.49,
            image: "/images/microscope.jpg",
          },
        ],
        shippingAddress: {
          name: "John Doe",
          street: "123 Science St",
          city: "Innovation City",
          state: "CA",
          zipCode: "90210",
        },
        trackingNumber: "TRK987654321",
      },
    ]);

    setActivities([
      {
        id: "1",
        type: "order",
        title: "Order Delivered",
        description: "Advanced Chemistry Set was delivered",
        date: "2024-01-15",
        icon: CheckCircle,
        status: "success",
      },
      {
        id: "2",
        type: "review",
        title: "Review Submitted",
        description: "You reviewed the Robotics Starter Kit",
        date: "2024-01-12",
        icon: Star,
        status: "info",
      },
      {
        id: "3",
        type: "wishlist",
        title: "Item Added to Wishlist",
        description: "3D Printing Pen added to your wishlist",
        date: "2024-01-10",
        icon: Heart,
        status: "info",
      },
    ]);
  };

  // Filter and search orders
  const filteredOrders = useMemo(() => {
    let filtered = orders;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        order =>
          order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.items.some(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const cutoffDate = new Date();

      switch (dateFilter) {
        case "7days":
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case "30days":
          cutoffDate.setDate(now.getDate() - 30);
          break;
        case "90days":
          cutoffDate.setDate(now.getDate() - 90);
          break;
      }

      if (dateFilter !== "all") {
        filtered = filtered.filter(order => new Date(order.date) >= cutoffDate);
      }
    }

    return filtered;
  }, [orders, searchQuery, statusFilter, dateFilter]);

  // Paginate orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Quick actions
  const quickActions = [
    {
      title: t("browseProducts" as any, "Browse Products"),
      description: t("discoverNewSTEMToys" as any, "Discover new STEM toys"),
      icon: ShoppingCart,
      href: "/products",
      color: "bg-blue-500",
    },
    {
      title: t("viewWishlist" as any, "View Wishlist"),
      description: t("checkSavedItems" as any, "Check your saved items"),
      icon: Heart,
      href: "/account/wishlist",
      color: "bg-red-500",
    },
    {
      title: t("manageAddresses" as any, "Manage Addresses"),
      description: t(
        "updateShippingInfo" as any,
        "Update shipping information"
      ),
      icon: MapPin,
      href: "/account/addresses",
      color: "bg-green-500",
    },
    {
      title: t("paymentMethods" as any, "Payment Methods"),
      description: t("manageCards" as any, "Manage your cards"),
      icon: CreditCard,
      href: "/account/payment-methods",
      color: "bg-purple-500",
    },
  ];

  const StatCard = ({ title, value, subtitle, icon: Icon, trend }: any) => (
    <Card className="relative overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center text-sm">
            <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
            <span className="text-green-500">{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const OrderCard = ({ order }: { order: Order }) => {
    const statusConfig = ORDER_STATUS_CONFIG[order.status];
    const StatusIcon = statusConfig.icon;

    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-semibold">{order.orderNumber}</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(order.date).toLocaleDateString()}
              </p>
            </div>
            <Badge
              variant="secondary"
              className={cn(statusConfig.bgColor, statusConfig.textColor)}
            >
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          <div className="space-y-2 mb-4">
            {order.items.map(item => (
              <div key={item.id} className="flex items-center gap-3">
                {item.image && (
                  <div className="w-10 h-10 rounded-md overflow-hidden bg-gray-100">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={40}
                      height={40}
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Qty: {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-lg font-bold">{formatPrice(order.total)}</div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/account/orders/${order.id}`}>
                  <Eye className="h-4 w-4 mr-1" />
                  {t("view", "View")}
                </Link>
              </Button>
              {order.trackingNumber && (
                <Button variant="outline" size="sm">
                  <Truck className="h-4 w-4 mr-1" />
                  {t("track", "Track")}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ActivityItem = ({ activity }: { activity: Activity }) => {
    const Icon = activity.icon;

    return (
      <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            activity.status === "success"
              ? "bg-green-100"
              : activity.status === "warning"
                ? "bg-yellow-100"
                : "bg-blue-100"
          )}
        >
          <Icon
            className={cn(
              "h-4 w-4",
              activity.status === "success"
                ? "text-green-600"
                : activity.status === "warning"
                  ? "text-yellow-600"
                  : "text-blue-600"
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{activity.title}</p>
          <p className="text-xs text-muted-foreground">
            {activity.description}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(activity.date).toLocaleDateString()}
          </p>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2" />
                <div className="h-8 bg-gray-200 rounded mb-2" />
                <div className="h-3 bg-gray-200 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary to-secondary rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {t("welcomeBack", "Welcome back!")}
            </h1>
            <p className="opacity-90">
              {t(
                "dashboardSubtitle",
                "Here's what's happening with your account"
              )}
            </p>
          </div>
          {userStats && (
            <div className="text-right">
              <div className="text-sm opacity-90">
                {t("accountLevel", "Account Level")}
              </div>
              <div className="text-lg font-bold">
                {
                  ACCOUNT_LEVELS[
                    userStats.accountLevel
                      .current as keyof typeof ACCOUNT_LEVELS
                  ]?.name
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title={t("totalOrders", "Total Orders")}
            value={userStats.totalOrders}
            icon={Package}
            trend="+12% this month"
          />
          <StatCard
            title={t("totalSpent", "Total Spent")}
            value={formatPrice(userStats.totalSpent)}
            icon={DollarSign}
            trend="+8% this month"
          />
          <StatCard
            title={t("loyaltyPoints", "Loyalty Points")}
            value={userStats.loyaltyPoints.toLocaleString()}
            subtitle={t(
              "savedAmount",
              `Saved ${formatPrice(userStats.savedOnDiscounts)}`
            )}
            icon={Gift}
          />
          <StatCard
            title={t("averageOrder", "Average Order")}
            value={formatPrice(userStats.averageOrderValue)}
            subtitle={t(
              "favoriteCategory",
              `Favorite: ${userStats.favoriteCategory}`
            )}
            icon={BarChart3}
          />
        </div>
      )}

      {/* Account Level Progress */}
      {userStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              {t("accountProgress", "Account Progress")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {
                    ACCOUNT_LEVELS[
                      userStats.accountLevel
                        .current as keyof typeof ACCOUNT_LEVELS
                    ]?.name
                  }{" "}
                  →{" "}
                  {userStats.accountLevel.nextLevel &&
                    ACCOUNT_LEVELS[
                      userStats.accountLevel
                        .nextLevel as keyof typeof ACCOUNT_LEVELS
                    ]?.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {userStats.accountLevel.progress}%
                </span>
              </div>
              <Progress
                value={userStats.accountLevel.progress}
                className="h-2"
              />
              <div className="flex flex-wrap gap-2">
                {userStats.accountLevel.benefitsUnlocked.map(
                  (benefit, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {benefit}
                    </Badge>
                  )
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {t("quickActions", "Quick Actions")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="group p-4 rounded-lg border hover:border-primary transition-colors"
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center mb-3",
                    action.color
                  )}
                >
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors">
                  {action.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {action.description}
                </p>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="orders" className="space-y-4">
        <TabsList className="grid grid-cols-2 lg:grid-cols-3 w-full lg:w-auto">
          <TabsTrigger value="orders" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {t("orders", "Orders")}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            {t("activity", "Activity")}
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t("insights", "Insights")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="space-y-4">
          {/* Order Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <Input
                    placeholder={t("searchOrders", "Search orders...")}
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("allStatuses", "All Statuses")}
                    </SelectItem>
                    <SelectItem value="pending">
                      {t("pending", "Pending")}
                    </SelectItem>
                    <SelectItem value="processing">
                      {t("processing", "Processing")}
                    </SelectItem>
                    <SelectItem value="shipped">
                      {t("shipped", "Shipped")}
                    </SelectItem>
                    <SelectItem value="delivered">
                      {t("delivered", "Delivered")}
                    </SelectItem>
                    <SelectItem value="cancelled">
                      {t("cancelled", "Cancelled")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {t("allTime", "All Time")}
                    </SelectItem>
                    <SelectItem value="7days">
                      {t("last7Days", "Last 7 Days")}
                    </SelectItem>
                    <SelectItem value="30days">
                      {t("last30Days", "Last 30 Days")}
                    </SelectItem>
                    <SelectItem value="90days">
                      {t("last90Days", "Last 90 Days")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <div className="space-y-4">
            {paginatedOrders.length > 0 ? (
              <>
                {paginatedOrders.map(order => (
                  <OrderCard key={order.id} order={order} />
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {t(
                        "showingResults",
                        `Showing ${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredOrders.length)} of ${filteredOrders.length} results`
                      )}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        {t("previous", "Previous")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCurrentPage(p => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage === totalPages}
                      >
                        {t("next", "Next")}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Card className="text-center p-8">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {t("noOrdersFound", "No orders found")}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || statusFilter !== "all" || dateFilter !== "all"
                    ? t("tryDifferentFilters", "Try adjusting your filters")
                    : t(
                        "startShopping",
                        "Start shopping to see your orders here"
                      )}
                </p>
                <Button asChild>
                  <Link href="/products">
                    {t("browseProducts", "Browse Products")}
                  </Link>
                </Button>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("recentActivity", "Recent Activity")}</CardTitle>
            </CardHeader>
            <CardContent>
              {activities.length > 0 ? (
                <div className="space-y-2">
                  {activities.map(activity => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {t("noRecentActivity", "No recent activity")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {t("shoppingInsights", "Shopping Insights")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userStats ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {t("favoriteCategory", "Favorite Category")}
                      </span>
                      <Badge>{userStats.favoriteCategory}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {t("averageOrderValue", "Average Order Value")}
                      </span>
                      <span className="font-medium">
                        {formatPrice(userStats.averageOrderValue)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">
                        {t("totalSaved", "Total Saved")}
                      </span>
                      <span className="font-medium text-green-600">
                        {formatPrice(userStats.savedOnDiscounts)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    {t("noInsightsYet", "Not enough data yet")}
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("recommendations", "Recommendations")}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium text-blue-900">
                      {t("loyaltyTip", "💡 Loyalty Tip")}
                    </p>
                    <p className="text-xs text-blue-800 mt-1">
                      {t(
                        "loyaltyTipDesc",
                        "You're 35% away from Gold level! Next order gets 2x points."
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <p className="text-sm font-medium text-green-900">
                      {t("personalizedPick", "🎯 Personalized Pick")}
                    </p>
                    <p className="text-xs text-green-800 mt-1">
                      {t(
                        "personalizedPickDesc",
                        "Based on your interests, we recommend checking out our new Engineering series."
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
