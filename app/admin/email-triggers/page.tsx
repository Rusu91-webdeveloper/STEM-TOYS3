"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Play,
  Pause,
  Settings,
  BarChart3,
  Mail,
  Zap,
} from "lucide-react";

interface EmailTrigger {
  id: string;
  name: string;
  description: string;
  type: string;
  status: string;
  isActive: boolean;
  priority: number;
  cooldownHours: number;
  actionType: string;
  tags: string[];
  createdAt: string;
  _count?: {
    executions: number;
  };
}

interface TriggerAnalytics {
  executions: Array<{
    status: string;
    _count: { id: number };
  }>;
  recentExecutions: Array<{
    id: string;
    trigger: { name: string; type: string };
    executionData: any;
    actionResult: any;
    status: string;
    executedAt: string;
  }>;
}

export default function EmailTriggersPage() {
  const [triggers, setTriggers] = useState<EmailTrigger[]>([]);
  const [analytics, setAnalytics] = useState<TriggerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTrigger, setSelectedTrigger] = useState<EmailTrigger | null>(
    null
  );

  const fetchTriggers = async () => {
    try {
      const response = await fetch("/api/admin/segmentation/rules");
      if (response.ok) {
        const data = await response.json();
        setTriggers(data);
      }
    } catch (error) {
      console.error("Error fetching triggers:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Get analytics for all triggers
      const response = await fetch("/api/admin/analytics/behavior");
      if (response.ok) {
        const data = await response.json();
        // Filter to only trigger-related analytics if available
        setAnalytics(data.triggerAnalytics || null);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const toggleTriggerStatus = async (
    triggerId: string,
    currentStatus: boolean
  ) => {
    try {
      const newStatus = currentStatus ? "PAUSED" : "ACTIVE";
      const response = await fetch(
        `/api/admin/segmentation/rules/${triggerId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (response.ok) {
        await fetchTriggers(); // Refresh the list
      }
    } catch (error) {
      console.error("Error updating trigger status:", error);
    }
  };

  useEffect(() => {
    fetchTriggers();
    fetchAnalytics();
  }, []);

  const getStatusBadge = (status: string, isActive: boolean) => {
    if (!isActive) return <Badge variant="secondary">Paused</Badge>;
    switch (status) {
      case "ACTIVE":
        return <Badge variant="default">Active</Badge>;
      case "DRAFT":
        return <Badge variant="outline">Draft</Badge>;
      case "ARCHIVED":
        return <Badge variant="destructive">Archived</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SEGMENT_ENTER":
        return "🎯";
      case "SEGMENT_EXIT":
        return "👋";
      case "LIFECYCLE_CHANGE":
        return "🔄";
      case "BEHAVIOR_EVENT":
        return "⚡";
      case "TIME_BASED":
        return "⏰";
      default:
        return "📧";
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
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Triggers & Campaigns</h1>
          <p className="text-muted-foreground mt-2">
            Automated email marketing based on user segments and behaviors
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchTriggers}>
            <Settings className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button>
            <Zap className="h-4 w-4 mr-2" />
            Create Trigger
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Triggers
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{triggers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active automation rules
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Triggers
            </CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {triggers.filter(t => t.isActive).length}
            </div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Emails Sent Today
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.executions.find(e => e.status === "success")?._count
                .id || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Automated emails delivered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Failed Triggers
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analytics?.executions.find(e => e.status === "failed")?._count
                .id || 0}
            </div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="triggers" className="space-y-6">
        <TabsList>
          <TabsTrigger value="triggers">All Triggers</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="triggers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Triggers</CardTitle>
              <CardDescription>
                Manage automated email campaigns and triggers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trigger</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Executions</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {triggers.map(trigger => (
                    <TableRow key={trigger.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{trigger.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {trigger.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {getTypeIcon(trigger.type)}
                          </span>
                          <span className="text-sm">
                            {trigger.type.replace("_", " ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{trigger.actionType}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(trigger.status, trigger.isActive)}
                      </TableCell>
                      <TableCell>{trigger.priority}</TableCell>
                      <TableCell>{trigger._count?.executions || 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={trigger.isActive}
                            onCheckedChange={checked =>
                              toggleTriggerStatus(trigger.id, trigger.isActive)
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedTrigger(trigger)}
                          >
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Trigger Performance</CardTitle>
                <CardDescription>
                  Success rates and execution stats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics?.executions.map(execution => (
                    <div
                      key={execution.status}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            execution.status === "success"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {execution.status}
                        </Badge>
                      </div>
                      <div className="font-bold">{execution._count.id}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trigger Types Distribution</CardTitle>
                <CardDescription>Breakdown by automation type</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    "SEGMENT_ENTER",
                    "BEHAVIOR_EVENT",
                    "TIME_BASED",
                    "LIFECYCLE_CHANGE",
                  ].map(type => {
                    const count = triggers.filter(t => t.type === type).length;
                    return (
                      <div
                        key={type}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getTypeIcon(type)}</span>
                          <span>{type.replace("_", " ")}</span>
                        </div>
                        <div className="font-bold">{count}</div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recent" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Trigger Executions</CardTitle>
              <CardDescription>
                Latest automated email activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.recentExecutions.slice(0, 20).map(execution => (
                  <div
                    key={execution.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">
                          {getTypeIcon(execution.trigger.type)}
                        </span>
                        <span className="font-medium">
                          {execution.trigger.name}
                        </span>
                        <Badge
                          variant={
                            execution.status === "success"
                              ? "default"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {execution.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Executed at{" "}
                        {new Date(execution.executedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
                {(!analytics?.recentExecutions ||
                  analytics.recentExecutions.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No recent trigger executions
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Trigger Details Dialog */}
      {selectedTrigger && (
        <Dialog
          open={!!selectedTrigger}
          onOpenChange={() => setSelectedTrigger(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="text-lg">
                  {getTypeIcon(selectedTrigger.type)}
                </span>
                {selectedTrigger.name}
              </DialogTitle>
              <DialogDescription>
                {selectedTrigger.description}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTrigger.type}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Action</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTrigger.actionType}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTrigger.priority}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Cooldown</label>
                  <p className="text-sm text-muted-foreground">
                    {selectedTrigger.cooldownHours} hours
                  </p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Tags</label>
                <div className="flex gap-1 mt-1">
                  {selectedTrigger.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
