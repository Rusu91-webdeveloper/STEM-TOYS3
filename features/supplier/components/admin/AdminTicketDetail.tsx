"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  User,
  FileText,
  Send,
  Paperclip,
  Eye,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Building2,
  Calendar,
  Download,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UploadButton } from "@uploadthing/react";
import { OurFileRouter } from "@/lib/uploadthing";

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status: "OPEN" | "PENDING_CUSTOMER" | "PENDING_SUPPLIER" | "RESOLVED" | "CLOSED" | "REOPENED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category: string;
  assignedTo: string | null;
  attachments: string[];
  attachmentDetails?: Array<{
    url: string;
    name: string;
    size: number;
  }>;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  supplier: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPersonEmail: string;
    phone?: string;
    website?: string;
  };
  assignedAdmin: {
    id: string;
    name: string;
    email: string;
  } | null;
  responses: Array<{
    id: string;
    content: string;
    responderType: string;
    isInternal: boolean;
    attachments: string[];
    attachmentDetails?: Array<{
      url: string;
      name: string;
      size: number;
    }>;
    createdAt: string;
    updatedAt: string;
    responder: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

interface Admin {
  id: string;
  name: string;
  email: string;
}

interface AdminTicketDetailProps {
  ticket: Ticket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTicketUpdate: () => void;
}

const priorityConfig = {
  URGENT: {
    label: "Urgent",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: AlertTriangle,
  },
  HIGH: {
    label: "High",
    color: "bg-orange-100 text-orange-800 border-orange-200",
    icon: AlertTriangle,
  },
  MEDIUM: {
    label: "Medium",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    icon: Clock,
  },
  LOW: {
    label: "Low",
    color: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
};

const statusConfig = {
  OPEN: {
    label: "Open",
    color: "bg-blue-100 text-blue-800 border-blue-200",
  },
  PENDING_CUSTOMER: {
    label: "Pending Customer",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  PENDING_SUPPLIER: {
    label: "Pending Supplier",
    color: "bg-orange-100 text-orange-800 border-orange-200",
  },
  RESOLVED: {
    label: "Resolved",
    color: "bg-green-100 text-green-800 border-green-200",
  },
  CLOSED: {
    label: "Closed",
    color: "bg-gray-100 text-gray-800 border-gray-200",
  },
  REOPENED: {
    label: "Reopened",
    color: "bg-purple-100 text-purple-800 border-purple-200",
  },
};

export function AdminTicketDetail({
  ticket,
  open,
  onOpenChange,
  onTicketUpdate,
}: AdminTicketDetailProps) {
  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"details" | "responses" | "assign">("details");
  
  // Response form state
  const [responseContent, setResponseContent] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [responseAttachments, setResponseAttachments] = useState<Array<{
    url: string;
    name: string;
    size: number;
  }>>([]);
  const [sendingResponse, setSendingResponse] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Assignment form state
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [assigning, setAssigning] = useState(false);
  
  // Status update state
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusNote, setStatusNote] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (ticket) {
      setCurrentTicket(ticket);
      setNewStatus(ticket.status);
      fetchAdmins();
    }
  }, [ticket]);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/tickets/admins");
      if (res.ok) {
        const data = await res.json();
        setAdmins(data.admins || []);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    }
  };

  const fetchTicketDetails = async () => {
    if (!ticket) return;
    
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/tickets/${ticket.id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentTicket(data.ticket);
      }
    } catch (error) {
      setError("Failed to fetch ticket details");
    } finally {
      setLoading(false);
    }
  };

  const handleSendResponse = async () => {
    if (!currentTicket || !responseContent.trim()) return;

    try {
      setSendingResponse(true);
      setError(null);

      const formData = new FormData();
      formData.append("content", responseContent.trim());
      formData.append("isInternal", isInternal.toString());

      // Add attachment details
      responseAttachments.forEach((attachment, index) => {
        formData.append("attachmentUrls", attachment.url);
        formData.append("attachmentNames", attachment.name);
        formData.append("attachmentSizes", attachment.size.toString());
      });

      const res = await fetch(`/api/admin/tickets/${currentTicket.id}/responses`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Failed to send response");

      const data = await res.json();
      
      // Reset form
      setResponseContent("");
      setIsInternal(false);
      setResponseAttachments([]);
      
      // Refresh ticket data
      await fetchTicketDetails();
      onTicketUpdate();
      
      // Show success message
      setError(null);
    } catch (error) {
      setError("Failed to send response");
    } finally {
      setSendingResponse(false);
    }
  };

  const removeResponseAttachment = (index: number) => {
    setResponseAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleAssignTicket = async () => {
    if (!currentTicket) return;

    try {
      setAssigning(true);
      setError(null);

      const res = await fetch(`/api/admin/tickets/${currentTicket.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assignedTo: selectedAdmin || null,
        }),
      });

      if (!res.ok) throw new Error("Failed to assign ticket");

      const data = await res.json();
      
      // Refresh ticket data
      await fetchTicketDetails();
      onTicketUpdate();
      
      // Reset form
      setSelectedAdmin("");
      setActiveTab("details");
      
      // Show success message
      setError(null);
    } catch (error) {
      setError("Failed to assign ticket");
    } finally {
      setAssigning(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!currentTicket || !newStatus) return;

    try {
      setUpdatingStatus(true);
      setError(null);

      const res = await fetch(`/api/admin/tickets/${currentTicket.id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          note: statusNote,
        }),
      });

      if (!res.ok) throw new Error("Failed to update status");

      const data = await res.json();
      
      // Refresh ticket data
      await fetchTicketDetails();
      onTicketUpdate();
      
      // Reset form
      setStatusNote("");
      
      // Show success message
      setError(null);
    } catch (error) {
      setError("Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    return config ? config.color : "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getPriorityColor = (priority: string) => {
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return config ? config.color : "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (!currentTicket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>{currentTicket.ticketNumber}</span>
            <span className="text-gray-500">-</span>
            <span>{currentTicket.subject}</span>
          </DialogTitle>
          <DialogDescription>
            Support ticket from {currentTicket.supplier.companyName}
          </DialogDescription>
        </DialogHeader>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Tab Navigation */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab("details")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "details"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("responses")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "responses"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Responses ({currentTicket.responses.length})
          </button>
          <button
            onClick={() => setActiveTab("assign")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "assign"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Assign
          </button>
        </div>

        <div className="flex-1 overflow-hidden">
          {activeTab === "details" && (
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Ticket Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ticket Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Status</Label>
                        <Badge className={getStatusColor(currentTicket.status)}>
                          {statusConfig[currentTicket.status]?.label || currentTicket.status}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Priority</Label>
                        <Badge className={getPriorityColor(currentTicket.priority)}>
                          {priorityConfig[currentTicket.priority]?.label || currentTicket.priority}
                        </Badge>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Category</Label>
                        <div className="text-sm">{currentTicket.category}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Created</Label>
                        <div className="text-sm">{formatDate(currentTicket.createdAt)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-500">Last Updated</Label>
                        <div className="text-sm">{formatDate(currentTicket.updatedAt)}</div>
                      </div>
                      {currentTicket.closedAt && (
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Closed</Label>
                          <div className="text-sm">{formatDate(currentTicket.closedAt)}</div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Description */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-gray-50 rounded-md whitespace-pre-wrap">
                      {currentTicket.description}
                    </div>
                    
                    {/* Display attachments if any */}
                    {currentTicket.attachments.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">Attachments:</div>
                        <div className="space-y-2">
                          {currentTicket.attachmentDetails
                            ? // Use detailed attachment info if available
                              currentTicket.attachmentDetails.map((attachment, index) => (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                >
                                  <div className="flex items-center gap-2">
                                    <Paperclip className="w-4 h-4 text-gray-500" />
                                    <div>
                                      <a
                                        href={attachment.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:underline font-medium"
                                      >
                                        {attachment.name}
                                      </a>
                                      <span className="text-xs text-gray-500 ml-2">
                                        ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            : // Fallback to basic attachment info
                              currentTicket.attachments.map((attachment, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                                >
                                  <Paperclip className="w-4 h-4 text-gray-500" />
                                  <a
                                    href={attachment}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    Attachment {index + 1}
                                  </a>
                                </div>
                              ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Supplier Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Supplier Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-blue-50 rounded-md">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Company</Label>
                          <div className="font-medium">{currentTicket.supplier.companyName}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Contact Person</Label>
                          <div className="font-medium">{currentTicket.supplier.contactPersonName}</div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-500">Email</Label>
                          <div className="text-sm">{currentTicket.supplier.contactPersonEmail}</div>
                        </div>
                        {currentTicket.supplier.phone && (
                          <div>
                            <Label className="text-sm font-medium text-gray-500">Phone</Label>
                            <div className="text-sm">{currentTicket.supplier.phone}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      <Button onClick={() => setActiveTab("responses")}>
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Respond
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab("assign")}>
                        <User className="w-4 h-4 mr-2" />
                        Assign
                      </Button>
                      <Button variant="outline" onClick={() => setActiveTab("responses")}>
                        <FileText className="w-4 h-4 mr-2" />
                        View Responses
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          )}

          {activeTab === "responses" && (
            <div className="h-[60vh] flex flex-col">
              {/* Response Form */}
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-lg">Add Response</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="response-content">Response</Label>
                      <Textarea
                        id="response-content"
                        placeholder="Type your response..."
                        value={responseContent}
                        onChange={(e) => setResponseContent(e.target.value)}
                        rows={4}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm font-medium">Attachments</Label>
                      <div className="mt-2">
                        <UploadButton<OurFileRouter, "ticketAttachment">
                          endpoint="ticketAttachment"
                          onClientUploadComplete={(res: any) => {
                            console.log("Files uploaded successfully:", res);
                            setIsUploading(false);
                            if (res) {
                              // Handle both array and single object responses
                              const files = Array.isArray(res) ? res : [res];
                              const newAttachments = files.map((file: any) => ({
                                url: file.fileUrl,
                                name: file.fileName,
                                size: file.fileSize,
                              }));
                              setResponseAttachments(prev => [...prev, ...newAttachments]);
                            }
                          }}
                          onUploadError={(error: Error) => {
                            console.error("Upload error:", error);
                            setIsUploading(false);
                            setError(`Upload failed: ${error.message}`);
                          }}
                          onUploadBegin={(fileName: string) => {
                            console.log("Upload started for:", fileName);
                            setIsUploading(true);
                          }}
                          className="ut-button:bg-blue-600 ut-button:hover:bg-blue-700 ut-button:text-white ut-button:rounded-md ut-button:px-4 ut-button:py-2 ut-button:font-medium"
                          content={{
                            button: (
                              <div className="flex items-center gap-2">
                                <Paperclip className="w-4 h-4" />
                                {isUploading ? "Uploading..." : "Add Files"}
                              </div>
                            ),
                            allowedContent: "Images, documents, and archives up to 10MB",
                          }}
                        />
                      </div>
                      {responseAttachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {responseAttachments.map((attachment, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <Paperclip className="w-4 h-4 text-gray-500" />
                                <div>
                                  <span className="text-sm font-medium">
                                    {attachment.name}
                                  </span>
                                  <span className="text-xs text-gray-500 ml-2">
                                    ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeResponseAttachment(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="internal-note"
                        checked={isInternal}
                        onCheckedChange={(checked) => setIsInternal(checked as boolean)}
                      />
                      <Label htmlFor="internal-note">Internal note (not visible to supplier)</Label>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleSendResponse}
                        disabled={!responseContent.trim() || sendingResponse || isUploading}
                      >
                        {sendingResponse
                          ? "Sending..."
                          : isUploading
                            ? "Uploading..."
                            : "Send Response"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Responses History */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="text-lg">Response History</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[40vh]">
                    <div className="space-y-4">
                      {currentTicket.responses.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No responses yet
                        </div>
                      ) : (
                        currentTicket.responses.map((response) => (
                          <div
                            key={response.id}
                            className={`p-4 rounded-lg border ${
                              response.isInternal
                                ? "bg-yellow-50 border-yellow-200"
                                : "bg-white border-gray-200"
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{response.responder.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {response.responderType}
                                </Badge>
                                {response.isInternal && (
                                  <Badge variant="outline" className="text-xs bg-yellow-100">
                                    Internal
                                  </Badge>
                                )}
                              </div>
                              <span className="text-sm text-gray-500">
                                {formatDate(response.createdAt)}
                              </span>
                            </div>
                            <div className="whitespace-pre-wrap">{response.content}</div>
                            
                            {/* Display attachments if any */}
                            {response.attachments.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <div className="text-sm font-medium text-gray-700 mb-2">Attachments:</div>
                                <div className="space-y-1">
                                  {response.attachmentDetails
                                    ? // Use detailed attachment info if available
                                      response.attachmentDetails.map((attachment, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                        >
                                          <div className="flex items-center gap-2">
                                            <Paperclip className="w-4 h-4 text-gray-500" />
                                            <div>
                                              <a
                                                href={attachment.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline font-medium"
                                              >
                                                {attachment.name}
                                              </a>
                                              <span className="text-xs text-gray-500 ml-2">
                                                ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ))
                                    : // Fallback to basic attachment info
                                      response.attachments.map((attachment, index) => (
                                        <div
                                          key={index}
                                          className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                                        >
                                          <Paperclip className="w-4 h-4 text-gray-500" />
                                          <a
                                            href={attachment}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline"
                                          >
                                            Attachment {index + 1}
                                          </a>
                                        </div>
                                      ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "assign" && (
            <div className="h-[60vh] space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Assign Ticket</CardTitle>
                  <CardDescription>
                    Assign this ticket to a specific admin or leave unassigned
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="assign-admin">Assign to</Label>
                      <Select value={selectedAdmin} onValueChange={setSelectedAdmin}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an admin or leave unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Unassigned</SelectItem>
                          {admins.map((admin) => (
                            <SelectItem key={admin.id} value={admin.id}>
                              {admin.name} ({admin.email})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleAssignTicket}
                        disabled={assigning}
                      >
                        {assigning ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Assigning...
                          </>
                        ) : (
                          <>
                            <User className="w-4 h-4 mr-2" />
                            Assign Ticket
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Update Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select value={newStatus} onValueChange={setNewStatus}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status-note">Note (optional)</Label>
                      <Textarea
                        id="status-note"
                        placeholder="Add a note about this status change..."
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        onClick={handleUpdateStatus}
                        disabled={updatingStatus}
                      >
                        {updatingStatus ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Updating...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Update Status
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
