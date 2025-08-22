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
  Mail,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Copy,
  Trash2,
  Play,
  Pause,
  Calendar,
  Target,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
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
import { Textarea } from "@/components/ui/textarea";

interface EmailCampaign {
  id: string;
  name: string;
  description: string;
  templateId: string;
  template: {
    id: string;
    name: string;
    slug: string;
  };
  subject: string;
  content: string;
  status: "DRAFT" | "SCHEDULED" | "SENDING" | "SENT" | "PAUSED" | "CANCELLED";
  scheduledAt: string | null;
  createdAt: string;
  updatedAt: string;
  metrics: {
    totalSent: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalUnsubscribed: number;
    openRate: number;
    clickRate: number;
  };
}

export function EmailCampaigns() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    templateId: "",
    subject: "",
    content: "",
    scheduledAt: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch("/api/admin/email-campaigns");
      if (response.ok) {
        const data = await response.json();
        // Transform the API data to match our interface
        const transformedCampaigns: EmailCampaign[] = data.campaigns.map(
          (campaign: any) => ({
            id: campaign.id,
            name: campaign.name,
            description: campaign.description || "",
            templateId: campaign.templateId,
            template: campaign.template,
            subject: campaign.subject,
            content: campaign.content,
            status: campaign.status,
            scheduledAt: campaign.scheduledAt,
            createdAt: campaign.createdAt,
            updatedAt: campaign.updatedAt,
            metrics: {
              totalSent: 0, // This would come from EmailEvent table
              totalOpened: 0,
              totalClicked: 0,
              totalBounced: 0,
              totalUnsubscribed: 0,
              openRate: 0,
              clickRate: 0,
            },
          })
        );
        setCampaigns(transformedCampaigns);
      } else {
        console.error("Failed to fetch campaigns");
        setCampaigns([]);
      }
    } catch (error) {
      console.error("Error fetching campaigns:", error);
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/admin/email-templates");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates || []);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT":
        return "bg-green-100 text-green-800";
      case "SENDING":
        return "bg-blue-100 text-blue-800";
      case "SCHEDULED":
        return "bg-yellow-100 text-yellow-800";
      case "PAUSED":
        return "bg-orange-100 text-orange-800";
      case "DRAFT":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SENT":
        return <CheckCircle className="h-4 w-4" />;
      case "SENDING":
        return <Play className="h-4 w-4" />;
      case "SCHEDULED":
        return <Clock className="h-4 w-4" />;
      case "PAUSED":
        return <Pause className="h-4 w-4" />;
      case "DRAFT":
        return <Edit className="h-4 w-4" />;
      case "CANCELLED":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Mail className="h-4 w-4" />;
    }
  };

  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch =
      campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || campaign.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateCampaign = async () => {
    if (
      !newCampaign.name ||
      !newCampaign.templateId ||
      !newCampaign.subject ||
      !newCampaign.content
    ) {
      const missingFields = [];
      if (!newCampaign.name) missingFields.push("Campaign Name");
      if (!newCampaign.templateId) missingFields.push("Template");
      if (!newCampaign.subject) missingFields.push("Subject");
      if (!newCampaign.content) missingFields.push("Content");

      alert(`Please fill in all required fields: ${missingFields.join(", ")}`);
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch("/api/admin/email-campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newCampaign.name,
          description: newCampaign.description,
          templateId: newCampaign.templateId,
          subject: newCampaign.subject,
          content: newCampaign.content,
          status: "DRAFT",
          scheduledAt: newCampaign.scheduledAt || null,
        }),
      });

      if (response.ok) {
        const newCampaignData = await response.json();

        // Add to local state
        const transformedCampaign: EmailCampaign = {
          id: newCampaignData.id,
          name: newCampaignData.name,
          description: newCampaignData.description || "",
          templateId: newCampaignData.templateId,
          template: newCampaignData.template,
          subject: newCampaignData.subject,
          content: newCampaignData.content,
          status: newCampaignData.status,
          scheduledAt: newCampaignData.scheduledAt,
          createdAt: newCampaignData.createdAt,
          updatedAt: newCampaignData.updatedAt,
          metrics: {
            totalSent: 0,
            totalOpened: 0,
            totalClicked: 0,
            totalBounced: 0,
            totalUnsubscribed: 0,
            openRate: 0,
            clickRate: 0,
          },
        };

        setCampaigns(prev => [transformedCampaign, ...prev]);

        // Reset form and close dialog
        setNewCampaign({
          name: "",
          description: "",
          templateId: "",
          subject: "",
          content: "",
          scheduledAt: "",
        });
        setIsCreateDialogOpen(false);

        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        const errorData = await response.json();
        alert(`Error creating campaign: ${errorData.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Error creating campaign:", error);
      alert("Error creating campaign. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewCampaign(prev => ({ ...prev, [field]: value }));
  };

  const handleTemplateChange = (templateId: string) => {
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (selectedTemplate) {
      setNewCampaign(prev => ({
        ...prev,
        templateId,
        subject: selectedTemplate.subject,
        content: selectedTemplate.content,
      }));
    }
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
                Campaign created successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Campaigns</h2>
          <p className="text-muted-foreground">
            Manage one-time email campaigns and broadcasts
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Email Campaign</DialogTitle>
              <DialogDescription>
                Create a new email campaign with template and scheduling
                options.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Campaign Name *</label>
                  <Input
                    placeholder="Enter campaign name"
                    value={newCampaign.name}
                    onChange={e => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Template *</label>
                  <Select
                    value={newCampaign.templateId}
                    onValueChange={handleTemplateChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map(template => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Describe the campaign purpose"
                  value={newCampaign.description}
                  onChange={e =>
                    handleInputChange("description", e.target.value)
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Subject *</label>
                <Input
                  placeholder="Enter email subject"
                  value={newCampaign.subject}
                  onChange={e => handleInputChange("subject", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Content *</label>
                <Textarea
                  placeholder="Enter email content (HTML supported)"
                  value={newCampaign.content}
                  onChange={e => handleInputChange("content", e.target.value)}
                  rows={10}
                />
              </div>
              <div>
                <label className="text-sm font-medium">
                  Schedule (Optional)
                </label>
                <Input
                  type="datetime-local"
                  value={newCampaign.scheduledAt}
                  onChange={e =>
                    handleInputChange("scheduledAt", e.target.value)
                  }
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewCampaign({
                      name: "",
                      description: "",
                      templateId: "",
                      subject: "",
                      content: "",
                      scheduledAt: "",
                    });
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateCampaign}
                  disabled={
                    isCreating ||
                    !newCampaign.name ||
                    !newCampaign.templateId ||
                    !newCampaign.subject ||
                    !newCampaign.content
                  }
                >
                  {isCreating ? "Creating..." : "Create Campaign"}
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
            placeholder="Search campaigns..."
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
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SCHEDULED">Scheduled</SelectItem>
            <SelectItem value="SENDING">Sending</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="PAUSED">Paused</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map(campaign => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {campaign.description}
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
                      Edit Campaign
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Target className="h-4 w-4 mr-2" />
                      Send Test
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={getStatusColor(campaign.status)}>
                  {getStatusIcon(campaign.status)}
                  <span className="ml-1 capitalize">
                    {campaign.status.toLowerCase()}
                  </span>
                </Badge>
                <Badge variant="outline">
                  <Mail className="h-3 w-3 mr-1" />
                  {campaign.template?.name || "No template"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Subject */}
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Subject:</span>
                  <span className="text-sm text-muted-foreground truncate">
                    {campaign.subject}
                  </span>
                </div>

                {/* Scheduled Date */}
                {campaign.scheduledAt && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Scheduled:{" "}
                      {new Date(campaign.scheduledAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {campaign.metrics.totalSent}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Total Sent
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {campaign.metrics.openRate}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Open Rate
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  {campaign.status === "DRAFT" && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Play className="h-4 w-4 mr-1" />
                      Send Now
                    </Button>
                  )}
                  {campaign.status === "SENDING" && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Pause className="h-4 w-4 mr-1" />
                      Pause
                    </Button>
                  )}
                  {campaign.status === "PAUSED" && (
                    <Button variant="outline" size="sm" className="flex-1">
                      <Play className="h-4 w-4 mr-1" />
                      Resume
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>

                {/* Last Modified */}
                <div className="text-xs text-muted-foreground">
                  Modified: {new Date(campaign.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCampaigns.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No campaigns found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first email campaign"}
            </p>
            {!searchTerm && statusFilter === "all" && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Campaign
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
