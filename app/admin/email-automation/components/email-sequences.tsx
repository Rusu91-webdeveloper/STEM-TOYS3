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
  status: "active" | "paused" | "draft" | "completed";
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
      // Mock data - replace with actual API calls
      const mockSequences: EmailSequence[] = [
        {
          id: "1",
          name: "Welcome Series",
          description: "3-email welcome sequence for new subscribers",
          trigger: "user_registered",
          status: "active",
          stepCount: 3,
          activeUsers: 284,
          totalSent: 852,
          openRate: 79.8,
          clickRate: 25.4,
          createdAt: "2024-01-15",
          lastModified: "2024-01-20",
          metrics: {
            totalSent: 852,
            totalOpened: 680,
            totalClicked: 173,
            totalBounced: 12,
            totalUnsubscribed: 5,
            conversionRate: 20.3,
          },
        },
        {
          id: "2",
          name: "Abandoned Cart Recovery",
          description: "Recover abandoned carts with targeted emails",
          trigger: "cart_abandoned",
          status: "active",
          stepCount: 4,
          activeUsers: 156,
          totalSent: 468,
          openRate: 72.1,
          clickRate: 18.7,
          createdAt: "2024-01-10",
          lastModified: "2024-01-18",
          metrics: {
            totalSent: 468,
            totalOpened: 337,
            totalClicked: 63,
            totalBounced: 8,
            totalUnsubscribed: 3,
            conversionRate: 18.7,
          },
        },
        {
          id: "3",
          name: "Post-Purchase Follow-up",
          description: "Follow-up sequence after successful purchase",
          trigger: "order_completed",
          status: "paused",
          stepCount: 2,
          activeUsers: 89,
          totalSent: 178,
          openRate: 85.2,
          clickRate: 32.1,
          createdAt: "2024-01-05",
          lastModified: "2024-01-15",
          metrics: {
            totalSent: 178,
            totalOpened: 152,
            totalClicked: 49,
            totalBounced: 2,
            totalUnsubscribed: 1,
            conversionRate: 32.1,
          },
        },
        {
          id: "4",
          name: "Re-engagement Campaign",
          description: "Re-engage inactive users",
          trigger: "user_inactive",
          status: "draft",
          stepCount: 3,
          activeUsers: 0,
          totalSent: 0,
          openRate: 0,
          clickRate: 0,
          createdAt: "2024-01-25",
          lastModified: "2024-01-25",
          metrics: {
            totalSent: 0,
            totalOpened: 0,
            totalClicked: 0,
            totalBounced: 0,
            totalUnsubscribed: 0,
            conversionRate: 0,
          },
        },
      ];

      setSequences(mockSequences);
    } catch (error) {
      console.error("Error fetching sequences:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play className="h-4 w-4" />;
      case "paused":
        return <Pause className="h-4 w-4" />;
      case "draft":
        return <Edit className="h-4 w-4" />;
      case "completed":
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
      // This would call your API to update sequence status
      console.log(`Updating sequence ${sequenceId} status to ${newStatus}`);

      // Update local state
      setSequences(prev =>
        prev.map(seq =>
          seq.id === sequenceId ? { ...seq, status: newStatus as any } : seq
        )
      );
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
      // This would call your API to create a new sequence
      console.log("Creating new sequence:", newSequence);

      // Create mock sequence for demo
      const mockNewSequence: EmailSequence = {
        id: Date.now().toString(),
        name: newSequence.name,
        description: newSequence.description,
        trigger: newSequence.trigger,
        status: "draft",
        stepCount: 0,
        activeUsers: 0,
        totalSent: 0,
        openRate: 0,
        clickRate: 0,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString(),
        metrics: {
          totalSent: 0,
          totalOpened: 0,
          totalClicked: 0,
          totalBounced: 0,
          totalUnsubscribed: 0,
          conversionRate: 0,
        },
      };

      // Add to local state
      setSequences(prev => [mockNewSequence, ...prev]);

      // Reset form and close dialog
      setNewSequence({ name: "", description: "", trigger: "" });
      setIsCreateDialogOpen(false);

      // Show success message
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
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
                    <SelectItem value="user_registered">
                      User Registered
                    </SelectItem>
                    <SelectItem value="cart_abandoned">
                      Cart Abandoned
                    </SelectItem>
                    <SelectItem value="order_completed">
                      Order Completed
                    </SelectItem>
                    <SelectItem value="user_inactive">User Inactive</SelectItem>
                    <SelectItem value="product_viewed">
                      Product Viewed
                    </SelectItem>
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
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
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
                  <span className="ml-1 capitalize">{sequence.status}</span>
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
                    Trigger: {sequence.trigger.replace("_", " ")}
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
                  {sequence.status === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(sequence.id, "paused")}
                      className="flex-1"
                    >
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  ) : sequence.status === "paused" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(sequence.id, "active")}
                      className="flex-1"
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(sequence.id, "active")}
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
