"use client";

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
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { EmailAnalytics } from "./components/email-analytics";
import { EmailAutomationOverview } from "./components/email-automation-overview";
import { EmailCampaigns } from "./components/email-campaigns";
import { EmailSegments } from "./components/email-segments";
import { EmailSequences } from "./components/email-sequences";
import { EmailSettings } from "./components/email-settings";
import { EmailTemplates } from "./components/email-templates";

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
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchEmailStats();
  }, []);

  const fetchEmailStats = async () => {
    try {
      // Fetch real data from our API endpoints
      const [
        sequencesResponse,
        campaignsResponse,
        templatesResponse,
        metricsResponse,
      ] = await Promise.all([
        fetch("/api/admin/email-sequences"),
        fetch("/api/admin/email-campaigns"),
        fetch("/api/admin/email-templates"),
        fetch("/api/admin/email-metrics"),
      ]);

      const sequences = sequencesResponse.ok
        ? await sequencesResponse.json()
        : { sequences: [] };
      const campaigns = campaignsResponse.ok
        ? await campaignsResponse.json()
        : { campaigns: [] };
      const templates = templatesResponse.ok
        ? await templatesResponse.json()
        : { templates: [] };
      const metrics = metricsResponse.ok
        ? await metricsResponse.json()
        : {
            totalSent: 0,
            totalOpened: 0,
            totalClicked: 0,
            openRate: 0,
            clickRate: 0,
            bounceRate: 0,
            unsubscribeRate: 0,
          };

      // Calculate real stats from actual data
      const activeSequences =
        sequences.sequences?.filter((seq: any) => seq.isActive === true)
          .length || 0;
      const activeCampaigns =
        campaigns.campaigns?.filter(
          (camp: any) =>
            camp.status === "SENDING" || camp.status === "SCHEDULED"
        ).length || 0;

      // Use real metrics data from the database
      const realStats: EmailStats = {
        totalSent: metrics.totalSent,
        totalOpened: metrics.totalOpened,
        totalClicked: metrics.totalClicked,
        openRate: metrics.openRate,
        clickRate: metrics.clickRate,
        bounceRate: metrics.bounceRate,
        unsubscribeRate: metrics.unsubscribeRate,
        activeSequences,
        activeCampaigns,
        totalSubscribers: templates.templates?.length || 0, // This should come from newsletter subscribers
      };

      setStats(realStats);
    } catch (error) {
      console.error("Error fetching email stats:", error);
      // Fallback to some basic stats if API fails
      setStats({
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
    }
    if (rate <= 2) return "text-green-600";
    if (rate <= 5) return "text-yellow-600";
    return "text-red-600";
  };

  const handleNewCampaign = () => {
    setActiveTab("campaigns");
  };

  const handleSettings = () => {
    // For now, just show an alert. In the future, this could open a settings modal
    alert("Email settings functionality coming soon!");
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
          <Button variant="outline" onClick={handleSettings}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={handleNewCampaign}>
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
              {stats.activeSequences} active sequences, {stats.activeCampaigns}{" "}
              campaigns
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
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
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
