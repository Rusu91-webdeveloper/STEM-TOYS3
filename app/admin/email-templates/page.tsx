"use client";

import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Copy,
  Download,
  Upload,
  Settings,
  Save,
  X,
  Check,
  AlertCircle,
  Info,
  Zap,
  Palette,
  Type,
  Image as ImageIcon,
  Mail,
  Calendar,
  User,
  Package,
  Globe,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  FileText,
  Code,
  Smartphone,
  Monitor,
  Tablet,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { EmailImageUploader } from "@/components/ui/EmailImageUploader";
import { EmailTemplatePreview } from "@/components/ui/EmailTemplatePreview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EmailTemplate {
  id: string;
  name: string;
  slug: string;
  subject: string;
  content: string;
  category: string;
  isActive: boolean;
  variables: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function EmailTemplatesPage() {
  const { data: session, status } = useSession();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isActiveFilter, setIsActiveFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<EmailTemplate | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    subject: "",
    content: "",
    category: "other",
    isActive: true,
    variables: [] as string[],
    images: [] as any[], // Store uploaded images
  });

  // Enhanced UI state
  const [isAdvancedMode, setIsAdvancedMode] = useState(false);
  const [showVariablePanel, setShowVariablePanel] = useState(true);
  const [showImagePanel, setShowImagePanel] = useState(true);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [selectedTab, setSelectedTab] = useState("content");
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [templateStats, setTemplateStats] = useState({
    wordCount: 0,
    variableCount: 0,
    imageCount: 0,
  });

  const categories = [
    "welcome",
    "order-confirmation",
    "order-shipped",
    "order-delivered",
    "password-reset",
    "email-verification",
    "abandoned-cart",
    "newsletter",
    "promotional",
    "other",
  ];

  const commonVariables = [
    "{{user.name}}",
    "{{user.email}}",
    "{{order.number}}",
    "{{order.total}}",
    "{{order.items}}",
    "{{product.name}}",
    "{{product.price}}",
    "{{site.name}}",
    "{{site.url}}",
    "{{image.0}}",
    "{{image.1}}",
    "{{image.2}}",
    "{{image.3}}",
    "{{image.4}}",
  ];

  // Fetch templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        search,
        category: categoryFilter,
        isActive: isActiveFilter,
      });

      const response = await fetch(`/api/admin/email-templates?${params}`);
      if (!response.ok) {
        let errorMessage = "Failed to fetch templates";
        try {
          const error = await response.json();
          errorMessage = error.error ?? errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      // Debug logging for development
      if (process.env.NODE_ENV === "development") {
        console.log("Email templates fetched:", {
          templatesCount: data.templates?.length || 0,
          pagination: data.pagination,
          rawData: data,
        });
      }

      setTemplates(data.templates || []);
      setPagination(
        data.pagination || { total: 0, page: 1, limit: 10, pages: 0 }
      );
    } catch (error) {
      console.error("Error fetching templates:", error);
      toast.error("Failed to fetch templates");
    } finally {
      setLoading(false);
    }
  };

  // Enhanced create template function
  const createTemplate = async () => {
    // Validate template before creating
    const validationErrors = validateTemplate();
    if (validationErrors.length > 0) {
      toast.error(`Validation failed: ${validationErrors.join(", ")}`);
      return;
    }

    setIsSaving(true);
    try {
      const apiData = {
        ...formData,
        category: formData.category === "none" ? "other" : formData.category,
      };

      const response = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        let errorMessage = "Failed to create template";
        try {
          const error = await response.json();
          errorMessage = error.error ?? errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success("Email template created successfully");
      setIsCreateDialogOpen(false);
      resetForm();
      setHasUnsavedChanges(false);

      await fetchTemplates();

      if (process.env.NODE_ENV === "development") {
        console.log("Template created successfully, refreshing list...");
      }
    } catch (error) {
      console.error("Error creating template:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Failed to create template";

      if (errorMessage.includes("Unauthorized")) {
        toast.error(
          "You need to be logged in as an admin to create email templates"
        );
      } else if (errorMessage.includes("Validation error")) {
        toast.error("Please check your input and try again");
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Enhanced update template function
  const updateTemplate = async () => {
    if (!selectedTemplate) return;

    const validationErrors = validateTemplate();
    if (validationErrors.length > 0) {
      toast.error(`Validation failed: ${validationErrors.join(", ")}`);
      return;
    }

    setIsSaving(true);
    try {
      const apiData = {
        ...formData,
        category: formData.category === "none" ? "other" : formData.category,
      };

      const response = await fetch(
        `/api/admin/email-templates/${selectedTemplate.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(apiData),
        }
      );

      if (!response.ok) {
        let errorMessage = "Failed to update template";
        try {
          const error = await response.json();
          errorMessage = error.error ?? errorMessage;
        } catch (parseError) {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success("Email template updated successfully");
      setIsEditDialogOpen(false);
      resetForm();
      setHasUnsavedChanges(false);
      await fetchTemplates();
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error("Failed to update template");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete template
  const deleteTemplate = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/email-templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        let errorMessage = "Failed to delete template";
        try {
          const error = await response.json();
          errorMessage = error.error ?? errorMessage;
        } catch (parseError) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      toast.success("Email template deleted successfully");
      fetchTemplates();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error("Failed to delete template");
    }
  };

  // Enhanced reset form function
  const resetForm = () => {
    setFormData({
      name: "",
      slug: "",
      subject: "",
      content: "",
      category: "other",
      isActive: true,
      variables: [],
      images: [],
    });
    setSelectedTemplate(null);
    setHasUnsavedChanges(false);
    setIsAdvancedMode(false);
    setSelectedTab("content");
    setTemplateStats({ wordCount: 0, variableCount: 0, imageCount: 0 });
  };

  // Enhanced open edit dialog function
  const openEditDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      slug: template.slug,
      subject: template.subject,
      content: template.content,
      category: template.category ?? "other",
      isActive: template.isActive,
      variables: template.variables,
      images: [], // Will be loaded from metadata if available
    });
    setHasUnsavedChanges(false);
    setIsEditDialogOpen(true);
    calculateTemplateStats(template.content, []);
  };

  // Open preview dialog
  const openPreviewDialog = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setIsPreviewDialogOpen(true);
  };

  // Enhanced utility functions
  const generateSlug = (name: string) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

  const calculateTemplateStats = useCallback(
    (content: string, images: any[]) => {
      const wordCount = content
        .replace(/<[^>]*>/g, "")
        .split(/\s+/)
        .filter(word => word.length > 0).length;
      const variableCount = (content.match(/\{\{[^}]+\}\}/g) || []).length;
      const imageCount = images.length;

      setTemplateStats({ wordCount, variableCount, imageCount });
    },
    []
  );

  const validateTemplate = () => {
    const errors: string[] = [];

    if (!formData.name.trim()) errors.push("Template name is required");
    if (!formData.slug.trim()) errors.push("Template slug is required");
    if (!formData.subject.trim()) errors.push("Email subject is required");
    if (!formData.content.trim()) errors.push("Email content is required");
    if (formData.slug.includes(" ")) errors.push("Slug cannot contain spaces");

    return errors;
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: generateSlug(name),
    }));
    setHasUnsavedChanges(true);
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({
      ...prev,
      content,
    }));
    setHasUnsavedChanges(true);
    calculateTemplateStats(content, formData.images);
  };

  const addVariable = (variable: string) => {
    setFormData(prev => ({
      ...prev,
      content: prev.content + variable,
    }));
    setHasUnsavedChanges(true);
  };

  const duplicateTemplate = async (template: EmailTemplate) => {
    try {
      const duplicateData = {
        ...formData,
        name: `${template.name} (Copy)`,
        slug: generateSlug(`${template.name} (Copy)`),
        subject: template.subject,
        content: template.content,
        category: template.category,
        isActive: false, // Start as inactive
      };

      const response = await fetch("/api/admin/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicateData),
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate template");
      }

      toast.success("Template duplicated successfully");
      await fetchTemplates();
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast.error("Failed to duplicate template");
    }
  };

  const exportTemplate = (template: EmailTemplate) => {
    const exportData = {
      name: template.name,
      slug: template.slug,
      subject: template.subject,
      content: template.content,
      category: template.category,
      variables: template.variables,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.slug}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Template exported successfully");
  };

  // Check if user is authenticated and has admin role
  const isAuthenticated = status === "authenticated";
  const isAdmin = isAuthenticated && session?.user?.role === "ADMIN";

  // Enhanced effects
  useEffect(() => {
    if (isAdmin) {
      fetchTemplates();
    }
  }, [currentPage, search, categoryFilter, isActiveFilter, isAdmin]);

  useEffect(() => {
    calculateTemplateStats(formData.content, formData.images);
  }, [formData.content, formData.images, calculateTemplateStats]);

  // Warn user about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error message if user is not authenticated or not admin
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              {!isAuthenticated
                ? "You need to be logged in to access this page."
                : "You need admin privileges to access email templates."}
            </p>
            <p className="text-sm text-gray-500">
              Current role: {session?.user?.role || "Not authenticated"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading && templates.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading templates...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Mail className="h-8 w-8 text-blue-600" />
            Email Templates
          </h1>
          <p className="text-gray-600">
            Create and manage email templates for your automated campaigns
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTemplates()}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
            </TooltipTrigger>
            <TooltipContent>Refresh templates list</TooltipContent>
          </Tooltip>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button
                onClick={() => resetForm()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Email Template
                </DialogTitle>
              </DialogHeader>

              <Tabs
                value={selectedTab}
                onValueChange={setSelectedTab}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger
                    value="content"
                    className="flex items-center gap-2"
                  >
                    <Type className="h-4 w-4" />
                    Content
                  </TabsTrigger>
                  <TabsTrigger
                    value="settings"
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </TabsTrigger>
                  <TabsTrigger
                    value="variables"
                    className="flex items-center gap-2"
                  >
                    <Zap className="h-4 w-4" />
                    Variables
                  </TabsTrigger>
                  <TabsTrigger
                    value="preview"
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="content" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content Editor */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-lg font-semibold">
                          Email Content
                        </Label>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{templateStats.wordCount} words</span>
                          <span>•</span>
                          <span>{templateStats.variableCount} variables</span>
                        </div>
                      </div>

                      <RichTextEditor
                        value={formData.content}
                        onChange={handleContentChange}
                        placeholder="Create your email content..."
                        height={400}
                        showVariableHelper={true}
                        variables={commonVariables}
                        onVariableClick={addVariable}
                        templateCategory={formData.category}
                        subject={formData.subject}
                        enableSmartSuggestions={true}
                      />
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-4">
                      {/* Template Stats */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            Template Stats
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Words:</span>
                            <span className="font-medium">
                              {templateStats.wordCount}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Variables:</span>
                            <span className="font-medium">
                              {templateStats.variableCount}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Images:</span>
                            <span className="font-medium">
                              {templateStats.imageCount}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Quick Variables */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Quick Variables
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-2">
                            {commonVariables.slice(0, 8).map(variable => (
                              <Button
                                key={variable}
                                variant="outline"
                                size="sm"
                                onClick={() => addVariable(variable)}
                                className="text-xs"
                              >
                                {variable}
                              </Button>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Images */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" />
                            Images
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <EmailImageUploader
                            onImageUploaded={image => {
                              setFormData(prev => ({
                                ...prev,
                                images: [...prev.images, image],
                              }));
                              setHasUnsavedChanges(true);
                            }}
                            onImageDeleted={imageId => {
                              setFormData(prev => ({
                                ...prev,
                                images: prev.images.filter(
                                  img => img.id !== imageId
                                ),
                              }));
                              setHasUnsavedChanges(true);
                            }}
                            maxImages={5}
                            maxSizeInMB={5}
                          />
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Template Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={e => handleNameChange(e.target.value)}
                          placeholder="e.g., Welcome Email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="slug">Slug</Label>
                        <Input
                          id="slug"
                          value={formData.slug}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              slug: e.target.value,
                            }))
                          }
                          placeholder="welcome-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={formData.category}
                          onValueChange={value =>
                            setFormData(prev => ({ ...prev, category: value }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(category => (
                              <SelectItem key={category} value={category}>
                                {category
                                  .replace("-", " ")
                                  .replace(/\b\w/g, l => l.toUpperCase())}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="subject">Email Subject</Label>
                        <Input
                          id="subject"
                          value={formData.subject}
                          onChange={e =>
                            setFormData(prev => ({
                              ...prev,
                              subject: e.target.value,
                            }))
                          }
                          placeholder="e.g., Welcome to {{site.name}}!"
                        />
                      </div>

                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <Label htmlFor="isActive" className="text-base">
                            Active
                          </Label>
                          <p className="text-sm text-gray-500">
                            Enable this template for use
                          </p>
                        </div>
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={checked =>
                            setFormData(prev => ({
                              ...prev,
                              isActive: checked,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="variables" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {commonVariables.map(variable => (
                      <Button
                        key={variable}
                        variant="outline"
                        className="h-auto p-3 flex flex-col items-start"
                        onClick={() => addVariable(variable)}
                      >
                        <code className="text-sm font-mono">{variable}</code>
                        <span className="text-xs text-gray-500 mt-1">
                          {variable.includes("user.")
                            ? "User data"
                            : variable.includes("order.")
                              ? "Order data"
                              : variable.includes("product.")
                                ? "Product data"
                                : variable.includes("site.")
                                  ? "Site data"
                                  : variable.includes("image.")
                                    ? "Image placeholder"
                                    : "Other"}
                        </span>
                      </Button>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4 mt-4">
                  {formData.content ? (
                    <EmailTemplatePreview
                      template={{
                        id: "preview",
                        name: formData.name || "Preview Template",
                        subject: formData.subject || "Preview Subject",
                        content: formData.content,
                        category: formData.category,
                        variables: commonVariables,
                      }}
                    />
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Add some content to see the preview</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {hasUnsavedChanges && (
                    <Alert className="py-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        You have unsaved changes
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={createTemplate}
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Template
                      </>
                    )}
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Enhanced Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search">Search Templates</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name, subject, or content..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="category-filter">Category</Label>
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category
                          .replace("-", " ")
                          .replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select
                  value={isActiveFilter}
                  onValueChange={setIsActiveFilter}
                >
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
                    setCategoryFilter("all");
                    setIsActiveFilter("all");
                  }}
                  className="w-full"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Templates Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Templates ({pagination?.total || 0})
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>
                  {templates.length} of {pagination?.total || 0} templates
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No templates found
                </h3>
                <p className="text-gray-500 mb-4">
                  {search ||
                  categoryFilter !== "all" ||
                  isActiveFilter !== "all"
                    ? "Try adjusting your filters to see more templates."
                    : "Get started by creating your first email template."}
                </p>
                {!search &&
                  categoryFilter === "all" &&
                  isActiveFilter === "all" && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Template
                    </Button>
                  )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {templates.map(template => (
                    <TableRow key={template.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{template.name}</div>
                          <div className="text-sm text-gray-500 font-mono">
                            {template.slug}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {template.category.replace("-", " ")}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={template.subject}>
                          {template.subject}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={template.isActive ? "default" : "secondary"}
                          className={
                            template.isActive
                              ? "bg-green-100 text-green-800"
                              : ""
                          }
                        >
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(template.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openPreviewDialog(template)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Preview template</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => duplicateTemplate(template)}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Duplicate template</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportTemplate(template)}
                              >
                                <Download className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Export template</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(template)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit template</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteTemplate(template.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete template</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Enhanced Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-500">
                  Showing {(currentPage - 1) * 10 + 1} to{" "}
                  {Math.min(currentPage * 10, pagination.total)} of{" "}
                  {pagination.total} templates
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: Math.min(5, pagination.pages) },
                      (_, i) => {
                        const page = i + 1;
                        return (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        );
                      }
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
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

        {/* Enhanced Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5" />
                Edit Email Template
              </DialogTitle>
            </DialogHeader>

            <Tabs
              value={selectedTab}
              onValueChange={setSelectedTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger
                  value="content"
                  className="flex items-center gap-2"
                >
                  <Type className="h-4 w-4" />
                  Content
                </TabsTrigger>
                <TabsTrigger
                  value="settings"
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </TabsTrigger>
                <TabsTrigger
                  value="variables"
                  className="flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Variables
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-lg font-semibold">
                        Email Content
                      </Label>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <span>{templateStats.wordCount} words</span>
                        <span>•</span>
                        <span>{templateStats.variableCount} variables</span>
                      </div>
                    </div>

                    <RichTextEditor
                      value={formData.content}
                      onChange={handleContentChange}
                      placeholder="Create your email content..."
                      height={400}
                      showVariableHelper={true}
                      variables={commonVariables}
                      onVariableClick={addVariable}
                      templateCategory={formData.category}
                      subject={formData.subject}
                      enableSmartSuggestions={true}
                    />
                  </div>

                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Info className="h-4 w-4" />
                          Template Stats
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Words:</span>
                          <span className="font-medium">
                            {templateStats.wordCount}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Variables:</span>
                          <span className="font-medium">
                            {templateStats.variableCount}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Images:</span>
                          <span className="font-medium">
                            {templateStats.imageCount}
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <ImageIcon className="h-4 w-4" />
                          Images
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <EmailImageUploader
                          onImageUploaded={image => {
                            setFormData(prev => ({
                              ...prev,
                              images: [...prev.images, image],
                            }));
                            setHasUnsavedChanges(true);
                          }}
                          onImageDeleted={imageId => {
                            setFormData(prev => ({
                              ...prev,
                              images: prev.images.filter(
                                img => img.id !== imageId
                              ),
                            }));
                            setHasUnsavedChanges(true);
                          }}
                          maxImages={5}
                          maxSizeInMB={5}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-name">Template Name</Label>
                      <Input
                        id="edit-name"
                        value={formData.name}
                        onChange={e => handleNameChange(e.target.value)}
                        placeholder="e.g., Welcome Email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-slug">Slug</Label>
                      <Input
                        id="edit-slug"
                        value={formData.slug}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            slug: e.target.value,
                          }))
                        }
                        placeholder="welcome-email"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-category">Category</Label>
                      <Select
                        value={formData.category}
                        onValueChange={value =>
                          setFormData(prev => ({ ...prev, category: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category} value={category}>
                              {category
                                .replace("-", " ")
                                .replace(/\b\w/g, l => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="edit-subject">Email Subject</Label>
                      <Input
                        id="edit-subject"
                        value={formData.subject}
                        onChange={e =>
                          setFormData(prev => ({
                            ...prev,
                            subject: e.target.value,
                          }))
                        }
                        placeholder="e.g., Welcome to {{site.name}}!"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <Label htmlFor="edit-isActive" className="text-base">
                          Active
                        </Label>
                        <p className="text-sm text-gray-500">
                          Enable this template for use
                        </p>
                      </div>
                      <Switch
                        id="edit-isActive"
                        checked={formData.isActive}
                        onCheckedChange={checked =>
                          setFormData(prev => ({
                            ...prev,
                            isActive: checked,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="variables" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {commonVariables.map(variable => (
                    <Button
                      key={variable}
                      variant="outline"
                      className="h-auto p-3 flex flex-col items-start"
                      onClick={() => addVariable(variable)}
                    >
                      <code className="text-sm font-mono">{variable}</code>
                      <span className="text-xs text-gray-500 mt-1">
                        {variable.includes("user.")
                          ? "User data"
                          : variable.includes("order.")
                            ? "Order data"
                            : variable.includes("product.")
                              ? "Product data"
                              : variable.includes("site.")
                                ? "Site data"
                                : variable.includes("image.")
                                  ? "Image placeholder"
                                  : "Other"}
                      </span>
                    </Button>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="preview" className="space-y-4 mt-4">
                {formData.content ? (
                  <EmailTemplatePreview
                    template={{
                      id: selectedTemplate?.id || "preview",
                      name: formData.name || "Preview Template",
                      subject: formData.subject || "Preview Subject",
                      content: formData.content,
                      category: formData.category,
                      variables: commonVariables,
                    }}
                  />
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Add some content to see the preview</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <Alert className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      You have unsaved changes
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={updateTemplate}
                  disabled={isSaving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Template
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Enhanced Preview Dialog */}
        <Dialog
          open={isPreviewDialogOpen}
          onOpenChange={setIsPreviewDialogOpen}
        >
          <DialogContent className="max-w-7xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview Email Template
              </DialogTitle>
            </DialogHeader>
            {selectedTemplate && (
              <EmailTemplatePreview
                template={selectedTemplate}
                className="mt-4"
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
