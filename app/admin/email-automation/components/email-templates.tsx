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
  Edit,
  Copy,
  Trash2,
  Plus,
  MoreHorizontal,
  Eye,
  Settings,
  Mail,
  Tag,
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

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  subject: string;
  content: string;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export function EmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "",
    subject: "",
    content: "",
  });
  const [isCreating, setIsCreating] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/admin/email-templates');
      if (response.ok) {
        const data = await response.json();
        // Transform the API data to match our interface
        const transformedTemplates: EmailTemplate[] = data.templates.map((template: Record<string, unknown>) => ({
          id: template.id as string,
          name: template.name as string,
          slug: template.slug as string,
          description: (template.description as string) ?? '',
          category: (template.category as string) ?? 'General',
          subject: template.subject as string,
          content: template.content as string,
          variables: (template.variables as string[]) ?? [],
          createdAt: template.createdAt as string,
          updatedAt: template.updatedAt as string,
          usageCount: 0, // This would come from usage tracking
        }));
        setTemplates(transformedTemplates);
      } else {
        console.error('Failed to fetch templates');
        setTemplates([]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "welcome":
        return "bg-blue-100 text-blue-800";
      case "order":
        return "bg-green-100 text-green-800";
      case "marketing":
        return "bg-purple-100 text-purple-800";
      case "abandoned cart":
        return "bg-orange-100 text-orange-800";
      case "password reset":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || template.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const handleCreateTemplate = async () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      const missingFields = [];
      if (!newTemplate.name) missingFields.push("Template Name");
      if (!newTemplate.subject) missingFields.push("Subject");
      if (!newTemplate.content) missingFields.push("Content");

      console.error(`Please fill in all required fields: ${missingFields.join(", ")}`);
      return;
    }

    setIsCreating(true);
    try {
      const response = await fetch('/api/admin/email-templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTemplate.name,
          description: newTemplate.description,
          category: newTemplate.category || 'General',
          subject: newTemplate.subject,
          content: newTemplate.content,
          variables: [], // Extract variables from content
        }),
      });

      if (response.ok) {
        const newTemplateData = await response.json();
        
        // Add to local state
        const transformedTemplate: EmailTemplate = {
          id: newTemplateData.id,
          name: newTemplateData.name,
          slug: newTemplateData.slug,
          description: newTemplateData.description ?? '',
          category: newTemplateData.category ?? 'General',
          subject: newTemplateData.subject,
          content: newTemplateData.content,
          variables: newTemplateData.variables ?? [],
          createdAt: newTemplateData.createdAt,
          updatedAt: newTemplateData.updatedAt,
          usageCount: 0,
        };

        setTemplates(prev => [transformedTemplate, ...prev]);

        // Reset form and close dialog
        setNewTemplate({ name: "", description: "", category: "", subject: "", content: "" });
        setIsCreateDialogOpen(false);

        // Show success message
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
      } else {
        const errorData = await response.json();
        console.error(`Error creating template: ${errorData.error ?? 'Unknown error'}`);
      }
    } catch (error) {
      console.error("Error creating template:", error);
              console.error("Error creating template. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setNewTemplate(prev => ({ ...prev, [field]: value }));
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
            <Edit className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Template created successfully!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Email Templates</h2>
          <p className="text-muted-foreground">
            Create and manage reusable email templates
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Email Template</DialogTitle>
              <DialogDescription>
                Create a new email template with variables and styling.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="template-name" className="text-sm font-medium">Template Name *</label>
                  <Input
                    id="template-name"
                    placeholder="Enter template name"
                    value={newTemplate.name}
                    onChange={e => handleInputChange("name", e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="template-category" className="text-sm font-medium">Category</label>
                  <Select
                    value={newTemplate.category}
                    onValueChange={value => handleInputChange("category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Welcome">Welcome</SelectItem>
                      <SelectItem value="Order">Order</SelectItem>
                      <SelectItem value="Marketing">Marketing</SelectItem>
                      <SelectItem value="Abandoned Cart">Abandoned Cart</SelectItem>
                      <SelectItem value="Password Reset">Password Reset</SelectItem>
                      <SelectItem value="General">General</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label htmlFor="template-description" className="text-sm font-medium">Description</label>
                <Input
                  id="template-description"
                  placeholder="Describe the template purpose"
                  value={newTemplate.description}
                  onChange={e => handleInputChange("description", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="template-subject" className="text-sm font-medium">Subject *</label>
                <Input
                  id="template-subject"
                  placeholder="Enter email subject"
                  value={newTemplate.subject}
                  onChange={e => handleInputChange("subject", e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="template-content" className="text-sm font-medium">Content *</label>
                <Textarea
                  id="template-content"
                  placeholder="Enter email content (HTML supported)"
                  value={newTemplate.content}
                  onChange={e => handleInputChange("content", e.target.value)}
                  rows={10}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use variables like $&#123;&#123;user.name&#125;&#125;, $&#123;&#123;order.total&#125;&#125;, etc.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setNewTemplate({ name: "", description: "", category: "", subject: "", content: "" });
                  }}
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTemplate}
                  disabled={
                    isCreating ||
                    !newTemplate.name ||
                    !newTemplate.subject ||
                    !newTemplate.content
                  }
                >
                  {isCreating ? "Creating..." : "Create Template"}
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
            placeholder="Search templates..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="welcome">Welcome</SelectItem>
            <SelectItem value="order">Order</SelectItem>
            <SelectItem value="marketing">Marketing</SelectItem>
            <SelectItem value="abandoned cart">Abandoned Cart</SelectItem>
            <SelectItem value="password reset">Password Reset</SelectItem>
            <SelectItem value="general">General</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {template.description}
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
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Template
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
                <Badge className={getCategoryColor(template.category)}>
                  <Tag className="h-3 w-3 mr-1" />
                  {template.category}
                </Badge>
                <Badge variant="outline">
                  <Mail className="h-3 w-3 mr-1" />
                  {template.usageCount} uses
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
                    {template.subject}
                  </span>
                </div>

                {/* Variables */}
                {template.variables.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium">Variables:</div>
                    <div className="flex flex-wrap gap-1">
                      {template.variables.map((variable, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Preview */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Content Preview:</div>
                  <div className="text-sm text-muted-foreground line-clamp-3">
                    {template.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>

                {/* Last Modified */}
                <div className="text-xs text-muted-foreground">
                  Modified: {new Date(template.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Edit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No templates found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || categoryFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first email template"}
            </p>
            {!searchTerm && categoryFilter === "all" && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
