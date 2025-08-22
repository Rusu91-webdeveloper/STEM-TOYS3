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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Clock,
  Users,
  Mail,
  Play,
  Pause,
  Edit,
  Copy,
  Trash2,
  Plus,
  MoreHorizontal,
  Eye,
  Settings,
  Calendar,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EmailSequence {
  id: string;
  name: string;
  description: string;
  trigger: string;
  status: "ACTIVE" | "PAUSED" | "DRAFT" | "COMPLETED";
  stepCount: number;
  activeUsers: number;
  totalSent: number;
  openRate: number;
  clickRate: number;
  createdAt: string;
  lastModified: string;
  metrics: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalUnsubscribed: number;
    conversionRate: number;
  };
}

export function EmailSequences() {
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newSequence, setNewSequence] = useState({
    name: "",
    description: "",
    trigger: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      const response = await fetch("/api/admin/email-sequences");
      if (response.ok) {
        const data = await response.json();
        // Transform the API data to match our interface
        const transformedSequences: EmailSequence[] = data.campaigns.map(
          (seq: any) => ({
            id: seq.id,
            name: seq.name,
            description: seq.description || "",
            trigger: seq.trigger,
            status: seq.status,
            stepCount: seq._count?.steps || 0,
            activeUsers: seq._count?.users || 0,
            totalSent: 0, // This would come from EmailEvent table
            openRate: 0, // This would come from EmailEvent table
            clickRate: 0, // This would come from EmailEvent table
            createdAt: seq.createdAt,
            lastModified: seq.updatedAt,
            metrics: {
              totalSent: 0,
              totalOpened: 0,
              totalClicked: 0,
              totalBounced: 0,
              totalUnsubscribed: 0,
              conversionRate: 0,
            },
          })
        );
        setSequences(transformedSequences);
      } else {
        console.error("Failed to fetch sequences");
        setSequences([]);
      }
    } catch (error) {
      console.error("Error fetching sequences:", error);
      setSequences([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "PAUSED":
        return "bg-yellow-100 text-yellow-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "COMPLETED":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <Play className="h-4 w-4" />;
      case "PAUSED":
        return <Pause className="h-4 w-4" />;
      case "DRAFT":
        return <Edit className="h-4 w-4" />;
      case "COMPLETED":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredSequences = sequences.filter(sequence => {
    const matchesSearch =
      sequence.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sequence.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || sequence.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (sequenceId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/email-sequences/${sequenceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Update local state
        setSequences(prev =>
          prev.map(seq =>
            seq.id === sequenceId ? { ...seq, status: newStatus as any } : seq
          )
        );
      } else {
        console.error("Failed to update sequence status");
      }
    } catch (error) {
      console.error("Error updating sequence status:", error);
    }
  };

  const handleCreateSequence = async () => {
    if (!newSequence.name || !newSequence.description || !newSequence.trigger) {
      // Show validation error
      const missingFields = [];
      if (!newSequence.name) missingFields.push("Sequence Name");
      if (!newSequence.description) missingFields.push("Description");
      if (!newSequence.trigger) missingFields.push("Trigger");

      alert(`Please fill in all required fields: ${missingFields.join(", ")}`);
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/email-sequences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newSequence.name,
          description: newSequence.description,
          trigger: newSequence.trigger,
          status: "DRAFT",
        }),
      });

      if (response.ok) {
        const newSeq = await response.json();

        // Add to local state
        const transformedSequence: EmailSequence = {
          id: newSeq.id,
          name: newSeq.name,
          description: newSeq.description || "",
          trigger: newSeq.trigger,
          status: newSeq.status,
          stepCount: 0,
          activeUsers: 0,
          totalSent: 0,
          openRate: 0,
          clickRate: 0,
          createdAt: newSeq.createdAt,
          lastModified: newSeq.updatedAt,
          metrics: {
            totalSent: 0,
            totalOpened: 0,
            totalClicked: 0,
            totalBounced: 0,
            totalUnsubscribed: 0,
            conversionRate: 0,
          },
        };

        setSequences(prev => [transformedSequence, ...prev]);

        // Reset form and close dialog
        setNewSequence({ name: "", description: "", trigger: "" });
        setIsCreateDialogOpen(false);

        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        const errorData = await response.json();
        alert(`Error creating sequence: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating sequence:", error);
      alert("Error creating sequence. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewSequence(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Sequence created successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Sequences</h2>
          <p className="text-muted-foreground">
            Manage automated email sequences and workflows
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Sequence
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Email Sequence</DialogTitle>
              <DialogDescription>
                Set up a new automated email sequence with triggers and steps.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Sequence Name *</label>
                <Input
                  placeholder="Enter sequence name"
                  value={newSequence.name}
                  onChange={e => handleInputChange("name", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description *</label>
                <Input
                  placeholder="Describe the sequence purpose"
                  value={newSequence.description}
                  onChange={e =>
                    handleInputChange("description", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Trigger *</label>
                <Select
                  value={newSequence.trigger}
                  onValueChange={value => handleInputChange("trigger", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER_REGISTERED">
                      User Registered
                    </SelectItem>
                    <SelectItem value="FIRST_PURCHASE">
                      First Purchase
                    </SelectItem>
                    <SelectItem value="ABANDONED_CART">
                      Cart Abandoned
                    </SelectItem>
                    <SelectItem value="ORDER_PLACED">Order Placed</SelectItem>
                    <SelectItem value="ORDER_SHIPPED">Order Shipped</SelectItem>
                    <SelectItem value="ORDER_DELIVERED">
                      Order Delivered
                    </SelectItem>
                    <SelectItem value="INACTIVE_USER">User Inactive</SelectItem>
                    <SelectItem value="BIRTHDAY">Birthday</SelectItem>
                    <SelectItem value="CUSTOM">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewSequence({ name: "", description: "", trigger: "" });
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateSequence}
                  disabled={
                    isCreating ||
                    !newSequence.name ||
                    !newSequence.description ||
                    !newSequence.trigger
                  }
                >
                  {isCreating ? "Creating..." : "Create Sequence"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <Input
            placeholder="Search sequences..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Sequences Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSequences.map(sequence => (
          <Card key={sequence.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{sequence.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {sequence.description}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Sequence
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={getStatusColor(sequence.status)}>
                  {getStatusIcon(sequence.status)}
                  <span className="ml-1 capitalize">
                    {sequence.status.toLowerCase()}
                  </span>
                </Badge>
                <Badge variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {sequence.stepCount} steps
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Trigger */}
                <div className="flex items-center space-x-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Trigger: {sequence.trigger.replace("_", " ").toLowerCase()}
                  </span>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {sequence.activeUsers}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Active Users
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {sequence.totalSent}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Sent
                    </div>
                  </div>
                </div>

                {/* Performance */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Open Rate</span>
                    <span className="font-medium">{sequence.openRate}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Click Rate</span>
                    <span className="font-medium">{sequence.clickRate}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {sequence.status === "ACTIVE" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(sequence.id, "PAUSED")}
                      className="flex-1"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  ) : sequence.status === "PAUSED" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(sequence.id, "ACTIVE")}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(sequence.id, "ACTIVE")}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Activate
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                {/* Last Modified */}
                <div className="text-xs text-muted-foreground">
                  Modified:{" "}
                  {new Date(sequence.lastModified).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredSequences.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No sequences found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first email sequence"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Sequence
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
