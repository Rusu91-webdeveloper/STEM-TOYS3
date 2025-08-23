"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface EmailSequence {
  id: string;
  name: string;
  description?: string;
  trigger: string;
  isActive: boolean;
  maxEmails: number;
  delayBetweenEmails: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  steps: EmailSequenceStep[];
  _count: {
    steps: number;
    users: number;
  };
}

interface EmailSequenceStep {
  id: string;
  order: number;
  templateId: string;
  delayHours: number;
  subject?: string;
  content?: string;
  conditions?: any;
  template: {
    id: string;
    name: string;
    subject: string;
    category: string;
  };
}

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  category: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function EmailSequencesPage() {
  const [sequences, setSequences] = useState<EmailSequence[]>([]);
  const [_templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("all");
  const [isActiveFilter, setIsActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStepsDialogOpen, setIsStepsDialogOpen] = useState(false);
  const [selectedSequence, setSelectedSequence] =
    useState<EmailSequence | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    trigger: "none",
    isActive: true,
    maxEmails: 5,
    delayBetweenEmails: 24,
  });

  const triggers = [
    { value: "USER_REGISTRATION", label: "User Registration" },
    { value: "FIRST_PURCHASE", label: "First Purchase" },
    { value: "ABANDONED_CART", label: "Abandoned Cart" },
    { value: "ORDER_PLACED", label: "Order Placed" },
    { value: "ORDER_SHIPPED", label: "Order Shipped" },
    { value: "ORDER_DELIVERED", label: "Order Delivered" },
    { value: "INACTIVE_USER", label: "Inactive User" },
    { value: "BIRTHDAY", label: "Birthday" },
    { value: "CUSTOM", label: "Custom" },
  ];

  // Filter sequences
  const _filteredSequences = sequences.filter(sequence => {
    const matchesSearch = sequence.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesTrigger =
      triggerFilter === "all" || sequence.trigger === triggerFilter;
    const matchesActive =
      isActiveFilter === "all" ||
      (isActiveFilter === "active" && sequence.isActive) ||
      (isActiveFilter === "inactive" && !sequence.isActive);

    return matchesSearch && matchesTrigger && matchesActive;
  });

  // Fetch sequences
  const fetchSequences = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search,
        trigger: triggerFilter,
        isActive: isActiveFilter,
      });

      const response = await fetch(`/api/admin/email-sequences?${params}`);
      if (!response.ok) {
        throw new Error("Failed to fetch sequences");
      }

      const data = await response.json();
      setSequences(data.sequences);
      setPagination(data.pagination);
    } catch (error) {
      console.error("Error fetching sequences:", error);
      toast.error("Failed to fetch sequences");
    } finally {
      setLoading(false);
    }
  };

  // Fetch templates for step creation
  const fetchTemplates = async () => {
    try {
      const response = await fetch("/api/admin/email-templates?limit=100");
      if (response.ok) {
        const data = await response.json();
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    }
  };

  // Create sequence
  const createSequence = async () => {
    try {
      // Filter out "none" values before sending to API
      const apiData = {
        ...formData,
        trigger: formData.trigger === "none" ? "" : formData.trigger,
      };

      const response = await fetch("/api/admin/email-sequences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Failed to create sequence");
      }

      toast.success("Email sequence created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      fetchSequences();
    } catch (error) {
      console.error("Error creating sequence:", error);
      toast.error("Failed to create sequence");
    }
  };

  // Update sequence
  const updateSequence = async () => {
    if (!selectedSequence) return;

    try {
      // Filter out "none" values before sending to API
      const apiData = {
        ...formData,
        trigger: formData.trigger === "none" ? "" : formData.trigger,
      };

      const response = await fetch(
        `/api/admin/email-sequences/${selectedSequence.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Failed to update sequence");
      }

      toast.success("Email sequence updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      fetchSequences();
    } catch (error) {
      console.error("Error updating sequence:", error);
      toast.error("Failed to update sequence");
    }
  };

  // Delete sequence
  const deleteSequence = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/email-sequences/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error ?? "Failed to delete sequence");
      }

      toast.success("Email sequence deleted successfully");
      fetchSequences();
    } catch (error) {
      console.error("Error deleting sequence:", error);
      toast.error("Failed to delete sequence");
    }
  };

  // Toggle sequence active status
  const toggleSequenceStatus = async (sequence: EmailSequence) => {
    try {
      const response = await fetch(
        `/api/admin/email-sequences/${sequence.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !sequence.isActive }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update sequence");
      }

      toast.success(
        `Sequence ${sequence.isActive ? "deactivated" : "activated"} successfully`
      );
      fetchSequences();
    } catch (error) {
      console.error("Error toggling sequence status:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update sequence"
      );
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      trigger: "none",
      isActive: true,
      maxEmails: 5,
      delayBetweenEmails: 24,
    });
    setSelectedSequence(null);
  };

  // Open edit dialog
  const openEditDialog = (sequence: EmailSequence) => {
    setSelectedSequence(sequence);
    setFormData({
      name: sequence.name,
      description: sequence.description ?? "",
      trigger: sequence.trigger ?? "none",
      isActive: sequence.isActive,
      maxEmails: sequence.maxEmails,
      delayBetweenEmails: sequence.delayBetweenEmails,
    });
    setIsEditDialogOpen(true);
  };

  // Open steps dialog
  const openStepsDialog = (sequence: EmailSequence) => {
    setSelectedSequence(sequence);
    setIsStepsDialogOpen(true);
  };

  // Effects
  useEffect(() => {
    fetchSequences();
    fetchTemplates();
  }, [currentPage, search, triggerFilter, isActiveFilter]);

  if (loading && sequences.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading sequences...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Email Sequences</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Email Sequence</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Sequence name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Sequence description"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="trigger">Trigger</Label>
                <Select
                  value={formData.trigger === "none" ? "" : formData.trigger}
                  onValueChange={value =>
                    setFormData(prev => ({ ...prev, trigger: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggers.map(trigger => (
                      <SelectItem key={trigger.value} value={trigger.value}>
                        {trigger.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxEmails">Max Emails</Label>
                  <Input
                    id="maxEmails"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.maxEmails}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        maxEmails: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="delayBetweenEmails">Delay (hours)</Label>
                  <Input
                    id="delayBetweenEmails"
                    type="number"
                    min="1"
                    max="168"
                    value={formData.delayBetweenEmails}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        delayBetweenEmails: parseInt(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      isActive: e.target.checked,
                    }))
                  }
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={createSequence}>Create Sequence</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  placeholder="Search sequences..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="trigger-filter">Trigger</Label>
              <Select value={triggerFilter} onValueChange={setTriggerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All triggers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All triggers</SelectItem>
                  {triggers.map(trigger => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={isActiveFilter} onValueChange={setIsActiveFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="true">Active</SelectItem>
                  <SelectItem value="false">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setTriggerFilter("all");
                  setIsActiveFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sequences Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sequences ({pagination?.total || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Steps</TableHead>
                <TableHead>Active Users</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sequences.map(sequence => (
                <TableRow key={sequence.id}>
                  <TableCell className="font-medium">{sequence.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {triggers.find(t => t.value === sequence.trigger)
                        ?.label || sequence.trigger}
                    </Badge>
                  </TableCell>
                  <TableCell>{sequence._count.steps} steps</TableCell>
                  <TableCell>{sequence._count.users} users</TableCell>
                  <TableCell>
                    <Badge
                      variant={sequence.isActive ? "default" : "secondary"}
                    >
                      {sequence.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(sequence.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleSequenceStatus(sequence)}
                        title={sequence.isActive ? "Deactivate" : "Activate"}
                      >
                        {sequence.isActive ? (
                          <Switch checked={true} onCheckedChange={() => {}} />
                        ) : (
                          <Switch checked={false} onCheckedChange={() => {}} />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openStepsDialog(sequence)}
                        title="Manage Steps"
                      >
                        Settings
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(sequence)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSequence(sequence.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {currentPage} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage === pagination.pages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Email Sequence</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={e =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="Sequence name"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Sequence description"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-trigger">Trigger</Label>
              <Select
                value={formData.trigger === "none" ? "" : formData.trigger}
                onValueChange={value =>
                  setFormData(prev => ({ ...prev, trigger: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select trigger" />
                </SelectTrigger>
                <SelectContent>
                  {triggers.map(trigger => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      {trigger.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-maxEmails">Max Emails</Label>
                <Input
                  id="edit-maxEmails"
                  type="number"
                  min="1"
                  max="20"
                  value={formData.maxEmails}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      maxEmails: parseInt(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-delayBetweenEmails">Delay (hours)</Label>
                <Input
                  id="edit-delayBetweenEmails"
                  type="number"
                  min="1"
                  max="168"
                  value={formData.delayBetweenEmails}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      delayBetweenEmails: parseInt(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isActive"
                checked={formData.isActive}
                onChange={e =>
                  setFormData(prev => ({ ...prev, isActive: e.target.checked }))
                }
              />
              <Label htmlFor="edit-isActive">Active</Label>
            </div>
          </div>
          <div className="flex justify-end space-x-2 mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={updateSequence}>Update Sequence</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Steps Management Dialog */}
      <Dialog open={isStepsDialogOpen} onOpenChange={setIsStepsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Steps - {selectedSequence?.name}</DialogTitle>
          </DialogHeader>
          {selectedSequence && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Sequence Steps</h3>
                <Button size="sm">Add Step</Button>
              </div>

              {selectedSequence.steps.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No steps configured yet.</p>
                  <p className="text-sm">
                    Add steps to create your email sequence.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedSequence.steps.map((step, index) => (
                    <Card key={step.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge variant="outline">Step {step.order}</Badge>
                              <Badge variant="secondary">
                                {step.template.category}
                              </Badge>
                            </div>
                            <h4 className="font-medium">
                              {step.template.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {step.template.subject}
                            </p>
                            <p className="text-sm text-gray-500">
                              Delay: {step.delayHours} hours
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                            <Button variant="destructive" size="sm">
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
