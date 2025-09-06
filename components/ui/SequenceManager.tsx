"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Play,
  Pause,
  Edit3,
  Trash2,
  Copy,
  Eye,
  Settings,
  Users,
  Mail,
  Clock,
  TrendingUp,
  Filter,
  MoreHorizontal,
  Zap,
  Target,
  Calendar,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  SequenceFlowBuilder,
  SequenceFlowData,
  SequenceNode,
} from "./SequenceFlowBuilder";
import { cn } from "@/lib/utils";

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

interface SequenceManagerProps {
  sequences?: EmailSequence[];
  onSave: (sequence: EmailSequence) => void;
  onDelete: (sequenceId: string) => void;
  onTest: (sequence: EmailSequence) => void;
  className?: string;
}

export function SequenceManager({
  sequences = [],
  onSave,
  onDelete,
  onTest,
  className = "",
}: SequenceManagerProps) {
  const [activeTab, setActiveTab] = useState<"list" | "builder">("list");
  const [selectedSequence, setSelectedSequence] =
    useState<EmailSequence | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<
    "name" | "createdAt" | "updatedAt" | "activeUsers"
  >("updatedAt");

  // Filter and sort sequences
  const filteredSequences = sequences
    .filter(seq => {
      const matchesSearch =
        seq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        seq.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || seq.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "createdAt":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "updatedAt":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "activeUsers":
          return b.activeUsers - a.activeUsers;
        default:
          return 0;
      }
    });

  // Create new sequence
  const createNewSequence = () => {
    const newSequence: EmailSequence = {
      id: `seq_${Date.now()}`,
      name: "New Email Sequence",
      description: "",
      triggerType: "immediate",
      status: "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
      flowData: {
        nodes: [],
        connections: [],
        metadata: {
          name: "New Email Sequence",
          triggerType: "immediate",
          isActive: false,
        },
      },
      stats: {
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        openRate: 0,
        clickRate: 0,
        completionRate: 0,
      },
      activeUsers: 0,
    };

    setSelectedSequence(newSequence);
    setIsCreatingNew(true);
    setActiveTab("builder");
  };

  // Handle sequence save
  const handleSave = (flowData: SequenceFlowData) => {
    if (!selectedSequence) return;

    const updatedSequence: EmailSequence = {
      ...selectedSequence,
      flowData,
      updatedAt: new Date(),
      status: flowData.metadata.isActive ? "active" : "draft",
    };

    onSave(updatedSequence);
    setSelectedSequence(null);
    setIsCreatingNew(false);
    setActiveTab("list");
  };

  // Handle sequence test
  const handleTest = (flowData: SequenceFlowData) => {
    if (!selectedSequence) return;
    onTest({ ...selectedSequence, flowData });
  };

  // Get status color
  const getStatusColor = (status: EmailSequence["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-500";
      case "paused":
        return "bg-yellow-500";
      case "draft":
        return "bg-gray-500";
      case "completed":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

  // Get status label
  const getStatusLabel = (status: EmailSequence["status"]) => {
    switch (status) {
      case "active":
        return "Active";
      case "paused":
        return "Paused";
      case "draft":
        return "Draft";
      case "completed":
        return "Completed";
      default:
        return "Unknown";
    }
  };

  // Get trigger type icon
  const getTriggerIcon = (triggerType: EmailSequence["triggerType"]) => {
    switch (triggerType) {
      case "immediate":
        return Zap;
      case "scheduled":
        return Calendar;
      case "event":
        return Target;
      case "manual":
        return Play;
      default:
        return Zap;
    }
  };

  return (
    <div className={cn("w-full h-full", className)}>
      <Tabs
        value={activeTab}
        onValueChange={value => setActiveTab(value as "list" | "builder")}
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Sequences ({sequences.length})
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Flow Builder
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Email Sequences</h2>
              <p className="text-gray-600">
                Manage your automated email workflows
              </p>
            </div>
            <Button onClick={createNewSequence}>
              <Plus className="w-4 h-4 mr-2" />
              New Sequence
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search sequences..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={value => setSortBy(value as any)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="updatedAt">Last Updated</SelectItem>
                <SelectItem value="createdAt">Created Date</SelectItem>
                <SelectItem value="activeUsers">Active Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sequences Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSequences.map(sequence => {
              const TriggerIcon = getTriggerIcon(sequence.triggerType);
              const nodeCount = sequence.flowData.nodes.length;
              const connectionCount = sequence.flowData.connections.length;

              return (
                <Card
                  key={sequence.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">
                          {sequence.name}
                        </CardTitle>
                        {sequence.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {sequence.description}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedSequence(sequence);
                              setActiveTab("builder");
                            }}
                          >
                            <Edit3 className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onTest(sequence)}>
                            <Play className="w-4 h-4 mr-2" />
                            Test
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Copy className="w-4 h-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(sequence.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Status and Trigger */}
                    <div className="flex items-center justify-between">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "text-white",
                          getStatusColor(sequence.status)
                        )}
                      >
                        {getStatusLabel(sequence.status)}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <TriggerIcon className="w-4 h-4" />
                        {sequence.triggerType}
                      </div>
                    </div>

                    {/* Flow Info */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4 text-gray-500" />
                          {nodeCount} steps
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="w-4 h-4 text-gray-500" />
                          {connectionCount} paths
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        {sequence.activeUsers} users
                      </div>
                    </div>

                    {/* Stats */}
                    {sequence.stats.totalSent > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Open Rate</span>
                          <span>{sequence.stats.openRate.toFixed(1)}%</span>
                        </div>
                        <Progress
                          value={sequence.stats.openRate}
                          className="h-2"
                        />

                        <div className="flex justify-between text-sm">
                          <span>Click Rate</span>
                          <span>{sequence.stats.clickRate.toFixed(1)}%</span>
                        </div>
                        <Progress
                          value={sequence.stats.clickRate}
                          className="h-2"
                        />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedSequence(sequence);
                          setActiveTab("builder");
                        }}
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onTest(sequence)}
                      >
                        <Play className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Empty State */}
          {filteredSequences.length === 0 && (
            <div className="text-center py-12">
              <Zap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">
                {sequences.length === 0
                  ? "No sequences yet"
                  : "No sequences found"}
              </h3>
              <p className="text-gray-600 mb-4">
                {sequences.length === 0
                  ? "Create your first email sequence to get started"
                  : "Try adjusting your search or filter criteria"}
              </p>
              {sequences.length === 0 && (
                <Button onClick={createNewSequence}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Sequence
                </Button>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="builder" className="h-[calc(100vh-200px)]">
          {selectedSequence ? (
            <SequenceFlowBuilder
              initialData={selectedSequence.flowData}
              onSave={handleSave}
              onTest={handleTest}
              className="h-full"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Settings className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">
                  No sequence selected
                </h3>
                <p className="text-gray-600 mb-4">
                  Choose a sequence to edit or create a new one
                </p>
                <Button onClick={createNewSequence}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Sequence
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
