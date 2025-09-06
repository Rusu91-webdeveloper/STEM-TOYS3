"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus,
  Settings,
  BarChart3,
  Play,
  Eye,
  Edit3,
  Trash2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SequenceManager } from "@/components/ui/SequenceManager";
import { SequenceTester } from "@/components/ui/SequenceTester";
import { SequenceFlowData } from "@/components/ui/SequenceFlowBuilder";

interface EmailSequence {
  id: string;
  name: string;
  description?: string;
  triggerType: "immediate" | "scheduled" | "event" | "manual";
  status: "draft" | "active" | "paused" | "completed";
  createdAt: Date;
  updatedAt: Date;
  flowData: SequenceFlowData;
  stats: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    openRate: number;
    clickRate: number;
    completionRate: number;
  };
  activeUsers: number;
}

export default function EmailSequencesPage() {
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSequence, setSelectedSequence] =
    useState<EmailSequence | null>(null);
  const [showTester, setShowTester] = useState(false);

  // Fetch sequences from API
  const fetchSequences = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/email-sequences");
      if (!response.ok) {
        throw new Error("Failed to fetch sequences");
      }

      const data = await response.json();

      // Transform API data to match our interface
      const transformedSequences: EmailSequence[] =
        data.sequences?.map((seq: any) => ({
          id: seq.id,
          name: seq.name,
          description: seq.description,
          triggerType: mapTriggerType(seq.trigger),
          status: mapStatus(seq.isActive),
          createdAt: new Date(seq.createdAt),
          updatedAt: new Date(seq.updatedAt),
          flowData: seq.flowData || createDefaultFlowData(seq),
          stats: {
            totalSent: seq.stats?.totalSent || 0,
            totalOpened: seq.stats?.totalOpened || 0,
            totalClicked: seq.stats?.totalClicked || 0,
            openRate: seq.stats?.openRate || 0,
            clickRate: seq.stats?.clickRate || 0,
            completionRate: seq.stats?.completionRate || 0,
          },
          activeUsers: seq._count?.users || 0,
        })) || [];

      setSequences(transformedSequences);
    } catch (error) {
      console.error("Error fetching sequences:", error);
      toast.error("Failed to fetch email sequences");
    } finally {
      setLoading(false);
    }
  };

  // Map API trigger to our trigger type
  const mapTriggerType = (trigger: string): EmailSequence["triggerType"] => {
    const triggerMap: Record<string, EmailSequence["triggerType"]> = {
      USER_REGISTRATION: "event",
      FIRST_PURCHASE: "event",
      ABANDONED_CART: "event",
      ORDER_PLACED: "event",
      ORDER_SHIPPED: "event",
      ORDER_DELIVERED: "event",
      INACTIVE_USER: "event",
      BIRTHDAY: "scheduled",
      CUSTOM: "manual",
    };
    return triggerMap[trigger] || "manual";
  };

  // Map API status to our status
  const mapStatus = (isActive: boolean): EmailSequence["status"] => {
    return isActive ? "active" : "draft";
  };

  // Create default flow data for existing sequences
  const createDefaultFlowData = (seq: any): SequenceFlowData => {
    return {
      nodes: [
        {
          id: "trigger_1",
          type: "trigger",
          title: "Start",
          description: "Sequence trigger",
          config: { triggerType: mapTriggerType(seq.trigger) },
          position: { x: 100, y: 100 },
          status: "active",
          nextNodes: [],
          prevNodes: [],
        },
      ],
      connections: [],
      metadata: {
        name: seq.name,
        description: seq.description,
        triggerType: mapTriggerType(seq.trigger),
        isActive: seq.isActive,
      },
    };
  };

  // Save sequence
  const handleSave = async (sequence: EmailSequence) => {
    try {
      const response = await fetch(
        `/api/admin/email-sequences/${sequence.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: sequence.name,
            description: sequence.description,
            triggerType: sequence.triggerType,
            isActive: sequence.status === "active",
            flowData: sequence.flowData,
            updatedAt: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save sequence");
      }

      const updatedSequence = await response.json();

      // Update local state
      setSequences(prev =>
        prev.map(seq =>
          seq.id === sequence.id ? { ...sequence, ...updatedSequence } : seq
        )
      );

      toast.success("Sequence saved successfully");
    } catch (error) {
      console.error("Error saving sequence:", error);
      toast.error("Failed to save sequence");
    }
  };

  // Delete sequence
  const handleDelete = async (sequenceId: string) => {
    try {
      const response = await fetch(`/api/admin/email-sequences/${sequenceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete sequence");
      }

      setSequences(prev => prev.filter(seq => seq.id !== sequenceId));
      toast.success("Sequence deleted successfully");
    } catch (error) {
      console.error("Error deleting sequence:", error);
      toast.error("Failed to delete sequence");
    }
  };

  // Test sequence
  const handleTest = (sequence: EmailSequence) => {
    setSelectedSequence(sequence);
    setShowTester(true);
  };

  // Load sequences on mount
  useEffect(() => {
    fetchSequences();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading email sequences...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Sequences</h1>
          <p className="text-gray-600 mt-2">
            Create and manage automated email workflows with visual flow builder
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {sequences.length} sequences
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {showTester && selectedSequence ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Testing: {selectedSequence.name}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTester(false)}
                >
                  Back to Sequences
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SequenceTester
                sequence={selectedSequence.flowData}
                onClose={() => setShowTester(false)}
              />
            </CardContent>
          </Card>
        ) : (
          <SequenceManager
            sequences={sequences}
            onSave={handleSave}
            onDelete={handleDelete}
            onTest={handleTest}
          />
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Sequences
                </p>
                <p className="text-2xl font-bold">{sequences.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Sequences
                </p>
                <p className="text-2xl font-bold">
                  {sequences.filter(s => s.status === "active").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Edit3 className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Draft Sequences
                </p>
                <p className="text-2xl font-bold">
                  {sequences.filter(s => s.status === "draft").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Eye className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">
                  {sequences.reduce((sum, s) => sum + s.activeUsers, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      {sequences.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {sequences
                      .reduce((sum, s) => sum + s.stats.totalSent, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Total Emails Sent</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {sequences.length > 0
                      ? (
                          sequences.reduce(
                            (sum, s) => sum + s.stats.openRate,
                            0
                          ) / sequences.length
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-600">Average Open Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {sequences.length > 0
                      ? (
                          sequences.reduce(
                            (sum, s) => sum + s.stats.clickRate,
                            0
                          ) / sequences.length
                        ).toFixed(1)
                      : 0}
                    %
                  </div>
                  <div className="text-sm text-gray-600">
                    Average Click Rate
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
