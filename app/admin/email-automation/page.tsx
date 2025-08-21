"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Users,
  BarChart3,
  Settings,
  Plus,
  Play,
  Pause,
  Trash2,
  Eye,
  Edit,
  Copy,
  Calendar,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { EmailAutomationOverview } from "./components/email-automation-overview";
import { EmailSequences } from "./components/email-sequences";
import { EmailCampaigns } from "./components/email-campaigns";
import { EmailAnalytics } from "./components/email-analytics";
import { EmailSegments } from "./components/email-segments";
import { EmailTemplates } from "./components/email-templates";
import { EmailSettings } from "./components/email-settings";

interface EmailStats {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  activeSequences: number;
  activeCampaigns: number;
  totalSubscribers: number;
}

export default function EmailAutomationPage() {
  const [stats, setStats] = useState<EmailStats>({
    totalSent: 0,
    totalOpened: 0,
    totalClicked: 0,
    openRate: 0,
    clickRate: 0,
    bounceRate: 0,
    unsubscribeRate: 0,
    activeSequences: 0,
    activeCampaigns: 0,
    totalSubscribers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmailStats();
  }, []);

  const fetchEmailStats = async () => {
    try {
      // This would fetch from your API
      const mockStats: EmailStats = {
        totalSent: 15420,
        totalOpened: 12336,
        totalClicked: 2467,
        openRate: 80.1,
        clickRate: 20.0,
        bounceRate: 2.3,
        unsubscribeRate: 0.8,
        activeSequences: 5,
        activeCampaigns: 3,
        totalSubscribers: 2847,
      };
      setStats(mockStats);
    } catch (error) {
      console.error("Error fetching email stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (
    rate: number,
    type: "open" | "click" | "bounce" | "unsubscribe"
  ) => {
    if (type === "open" || type === "click") {
      if (rate >= 80) return "text-green-600";
      if (rate >= 60) return "text-yellow-600";
      return "text-red-600";
    } else {
      if (rate <= 2) return "text-green-600";
      if (rate <= 5) return "text-yellow-600";
      return "text-red-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Email Automation
          </h1>
          <p className="text-muted-foreground">
            Manage your email marketing campaigns, sequences, and analytics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSent.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Rate</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getStatusColor(stats.openRate, "open")}`}
            >
              {stats.openRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalOpened.toLocaleString()} opens
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Click Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getStatusColor(stats.clickRate, "click")}`}
            >
              {stats.clickRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalClicked.toLocaleString()} clicks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subscribers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalSubscribers.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">+5% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getStatusColor(stats.bounceRate, "bounce")}`}
            >
              {stats.bounceRate}%
            </div>
            <p className="text-xs text-muted-foreground">Industry avg: 2.5%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Unsubscribe Rate
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${getStatusColor(stats.unsubscribeRate, "unsubscribe")}`}
            >
              {stats.unsubscribeRate}%
            </div>
            <p className="text-xs text-muted-foreground">Industry avg: 0.5%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Automations
            </CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.activeSequences + stats.activeCampaigns}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.activeSequences} sequences, {stats.activeCampaigns}{" "}
              campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="sequences" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Sequences
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="segments" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Segments
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <EmailAutomationOverview stats={stats} />
        </TabsContent>

        <TabsContent value="sequences" className="space-y-4">
          <EmailSequences />
        </TabsContent>

        <TabsContent value="campaigns" className="space-y-4">
          <EmailCampaigns />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <EmailAnalytics />
        </TabsContent>

        <TabsContent value="segments" className="space-y-4">
          <EmailSegments />
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <EmailTemplates />
        </TabsContent>
      </Tabs>
    </div>
  );
}
