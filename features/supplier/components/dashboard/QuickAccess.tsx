"use client";

import Link from "next/link";
import {
  Plus,
  ShoppingCart,
  BarChart3,
  FileText,
  MessageSquare,
  HelpCircle,
  Settings,
  Package,
  DollarSign,
  TrendingUp,
  Users,
  Award,
  Zap,
  Star,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuickAccessProps {
  stats?: {
    pendingOrders: number;
    unreadMessages: number;
    overdueInvoices: number;
    activeProducts: number;
  };
}

export function QuickAccess({ stats }: QuickAccessProps) {
  const quickActions = [
    {
      name: "Add Product",
      href: "/supplier/products/new",
      icon: Plus,
      description: "Create a new product",
      color: "from-green-500 to-emerald-600",
      bgColor: "from-green-50 to-emerald-50",
      hoverColor: "from-green-100 to-emerald-100",
    },
    {
      name: "View Orders",
      href: "/supplier/orders",
      icon: ShoppingCart,
      description: "Check order status",
      color: "from-blue-500 to-indigo-600",
      bgColor: "from-blue-50 to-indigo-50",
      hoverColor: "from-blue-100 to-indigo-100",
      badge: stats?.pendingOrders,
    },
    {
      name: "Analytics",
      href: "/supplier/analytics",
      icon: BarChart3,
      description: "View performance",
      color: "from-purple-500 to-violet-600",
      bgColor: "from-purple-50 to-violet-50",
      hoverColor: "from-purple-100 to-violet-100",
    },
    {
      name: "Messages",
      href: "/supplier/messages",
      icon: MessageSquare,
      description: "Check communications",
      color: "from-orange-500 to-amber-600",
      bgColor: "from-orange-50 to-amber-50",
      hoverColor: "from-orange-100 to-amber-100",
      badge: stats?.unreadMessages,
    },
  ];

  const quickLinks = [
    {
      name: "Products",
      href: "/supplier/products",
      icon: Package,
      description: "Manage catalog",
      count: stats?.activeProducts,
    },
    {
      name: "Invoices",
      href: "/supplier/invoices",
      icon: FileText,
      description: "View invoices",
      count: stats?.overdueInvoices,
    },
    {
      name: "Revenue",
      href: "/supplier/revenue",
      icon: DollarSign,
      description: "Track earnings",
    },
    {
      name: "Support",
      href: "/supplier/support",
      icon: HelpCircle,
      description: "Get help",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                Quick Actions
              </CardTitle>
              <p className="text-sm text-gray-600">Most common tasks</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map(action => (
              <Link key={action.name} href={action.href}>
                <Card
                  className={`group hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br ${action.bgColor} hover:${action.hoverColor} cursor-pointer`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div
                        className={`w-10 h-10 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}
                      >
                        <action.icon className="w-5 h-5 text-white" />
                      </div>
                      {action.badge && action.badge > 0 && (
                        <Badge className="bg-red-500 text-white text-xs">
                          {action.badge}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {action.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                Quick Access
              </CardTitle>
              <p className="text-sm text-gray-600">Navigate to key sections</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickLinks.map(link => (
              <Link key={link.name} href={link.href}>
                <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-100 hover:border-gray-200 cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                        <link.icon className="w-4 h-4 text-gray-600" />
                      </div>
                      {link.count && link.count > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {link.count}
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">
                      {link.name}
                    </h3>
                    <p className="text-sm text-gray-600">{link.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Highlights */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold text-gray-900">
                Performance Highlights
              </CardTitle>
              <p className="text-sm text-gray-600">Key metrics at a glance</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats?.activeProducts || 0}
              </div>
              <p className="text-sm text-gray-600">Active Products</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats?.pendingOrders || 0}
              </div>
              <p className="text-sm text-gray-600">Pending Orders</p>
            </div>
            <div className="text-center group">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-200">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stats?.unreadMessages || 0}
              </div>
              <p className="text-sm text-gray-600">Unread Messages</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
