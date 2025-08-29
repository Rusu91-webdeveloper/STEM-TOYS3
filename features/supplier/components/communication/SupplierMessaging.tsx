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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { UploadButton } from "@uploadthing/react";
import { OurFileRouter } from "@/lib/uploadthing";
import {
  Mail,
  Send,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Clock,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Paperclip,
  Trash2,
  Reply,
  Forward,
  Upload,
  X,
} from "lucide-react";

interface SupplierMessage {
  id: string;
  subject: string;
  content: string;
  senderType: "SUPPLIER" | "ADMIN" | "SYSTEM";
  sender: {
    name: string;
    email: string;
  };
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  category:
    | "GENERAL"
    | "ACCOUNT"
    | "ORDER"
    | "SUPPORT"
    | "MARKETING"
    | "ANNOUNCEMENT";
  isRead: boolean;
  readAt?: string;
  attachments: string[];
  attachmentDetails?: Array<{
    url: string;
    name: string;
    size: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface ComposeMessageData {
  subject: string;
  content: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  category:
    | "GENERAL"
    | "ACCOUNT"
    | "ORDER"
    | "SUPPORT"
    | "MARKETING"
    | "ANNOUNCEMENT";
  attachments: Array<{
    url: string;
    name: string;
    size: number;
  }>;
}

const priorityConfig = {
  LOW: { label: "Low", color: "bg-gray-100 text-gray-800" },
  NORMAL: { label: "Normal", color: "bg-blue-100 text-blue-800" },
  HIGH: { label: "High", color: "bg-orange-100 text-orange-800" },
  URGENT: { label: "Urgent", color: "bg-red-100 text-red-800" },
};

const categoryConfig = {
  GENERAL: { label: "General", icon: MessageSquare },
  ACCOUNT: { label: "Account", icon: MessageSquare },
  ORDER: { label: "Order", icon: MessageSquare },
  SUPPORT: { label: "Support", icon: MessageSquare },
  MARKETING: { label: "Marketing", icon: MessageSquare },
  ANNOUNCEMENT: { label: "Announcement", icon: MessageSquare },
};

export function SupplierMessaging() {
  const [messages, setMessages] = useState<SupplierMessage[]>([]);
  const [selectedMessage, setSelectedMessage] =
    useState<SupplierMessage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [filterPriority, setFilterPriority] = useState<string>("ALL");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState<ComposeMessageData>({
    subject: "",
    content: "",
    priority: "NORMAL",
    category: "GENERAL",
    attachments: [],
  });

  // State for tracking upload status
  const [isUploading, setIsUploading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/supplier/messages");
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(`/api/supplier/messages/${messageId}/read`, {
        method: "PUT",
      });

      if (response.ok) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, isRead: true, readAt: new Date().toISOString() }
              : msg
          )
        );
      }
    } catch (error) {
      console.error("Failed to mark message as read:", error);
    }
  };

  const sendMessage = async () => {
    try {
      setSending(true);
      setError(null);

      const formData = new FormData();
      formData.append("subject", composeData.subject);
      formData.append("content", composeData.content);
      formData.append("priority", composeData.priority);
      formData.append("category", composeData.category);

      // Add attachment details
      composeData.attachments.forEach((attachment, index) => {
        formData.append("attachmentUrls", attachment.url);
        formData.append("attachmentNames", attachment.name);
        formData.append("attachmentSizes", attachment.size.toString());
      });

      const response = await fetch("/api/supplier/messages", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send message");
      }

      const result = await response.json();
      console.log("Message sent successfully:", result);

      // Reset form and close dialog
      setComposeData({
        subject: "",
        content: "",
        priority: "NORMAL",
        category: "GENERAL",
        attachments: [],
      });
      setComposeOpen(false);

      // Refresh messages
      fetchMessages();
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const removeAttachment = (index: number) => {
    setComposeData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  // Filter messages based on search and filters
  const filteredMessages = messages.filter(message => {
    const matchesSearch =
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      filterCategory === "ALL" || message.category === filterCategory;
    const matchesPriority =
      filterPriority === "ALL" || message.priority === filterPriority;
    const matchesUnread = !showUnreadOnly || !message.isRead;

    return matchesSearch && matchesCategory && matchesPriority && matchesUnread;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-600 mt-1">
            Communicate with TechTots team and receive important updates.
          </p>
        </div>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Compose Message
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Compose New Message</DialogTitle>
              <DialogDescription>
                Send a message to the TechTots team. We'll respond within 24
                hours.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={composeData.subject}
                  onChange={e =>
                    setComposeData(prev => ({
                      ...prev,
                      subject: e.target.value,
                    }))
                  }
                  placeholder="Enter message subject"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={composeData.priority}
                    onValueChange={(value: any) =>
                      setComposeData(prev => ({ ...prev, priority: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="NORMAL">Normal</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={composeData.category}
                    onValueChange={(value: any) =>
                      setComposeData(prev => ({ ...prev, category: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">General</SelectItem>
                      <SelectItem value="ACCOUNT">Account</SelectItem>
                      <SelectItem value="ORDER">Order</SelectItem>
                      <SelectItem value="SUPPORT">Support</SelectItem>
                      <SelectItem value="MARKETING">Marketing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={composeData.content}
                  onChange={e =>
                    setComposeData(prev => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="Enter your message..."
                  rows={6}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Attachments</label>
                <div className="mt-2">
                  <UploadButton<OurFileRouter, "messageAttachment">
                    endpoint="messageAttachment"
                    onClientUploadComplete={(res: any) => {
                      console.log("Files uploaded successfully:", res);
                      setIsUploading(false);
                      if (res) {
                        // Handle both array and single object responses
                        const files = Array.isArray(res) ? res : [res];
                        const newAttachments = files.map((file: any) => ({
                          url: file.url,
                          name: file.name,
                          size: file.size,
                        }));
                        setComposeData(prev => ({
                          ...prev,
                          attachments: [...prev.attachments, ...newAttachments],
                        }));
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
                      allowedContent: "Images, documents, and PDFs up to 10MB",
                    }}
                  />
                </div>
                {composeData.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {composeData.attachments.map((attachment, index) => (
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
                          onClick={() => removeAttachment(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setComposeOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={sendMessage}
                  disabled={
                    sending ||
                    isUploading ||
                    !composeData.subject ||
                    !composeData.content
                  }
                >
                  {sending
                    ? "Sending..."
                    : isUploading
                      ? "Uploading..."
                      : "Send Message"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Categories</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="ACCOUNT">Account</SelectItem>
                <SelectItem value="ORDER">Order</SelectItem>
                <SelectItem value="SUPPORT">Support</SelectItem>
                <SelectItem value="MARKETING">Marketing</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="NORMAL">Normal</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={showUnreadOnly ? "default" : "outline"}
              onClick={() => setShowUnreadOnly(!showUnreadOnly)}
            >
              {showUnreadOnly ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
              <span className="ml-2">Unread Only</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Messages ({filteredMessages.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {filteredMessages.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No messages found
                  </div>
                ) : (
                  filteredMessages.map(message => (
                    <div
                      key={message.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${
                        !message.isRead ? "bg-blue-50" : ""
                      } ${selectedMessage?.id === message.id ? "bg-blue-100" : ""}`}
                      onClick={() => {
                        setSelectedMessage(message);
                        if (!message.isRead) {
                          markAsRead(message.id);
                        }
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`font-medium ${!message.isRead ? "font-semibold" : ""}`}
                            >
                              {message.subject}
                            </span>
                            {!message.isRead && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 truncate">
                            {message.content}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">
                              {message.sender.name}
                            </span>
                            <Badge
                              className={priorityConfig[message.priority].color}
                            >
                              {priorityConfig[message.priority].label}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              {new Date(message.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Detail */}
        <div className="lg:col-span-2">
          {selectedMessage ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{selectedMessage.subject}</CardTitle>
                    <CardDescription>
                      From: {selectedMessage.sender.name} (
                      {selectedMessage.sender.email})
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={priorityConfig[selectedMessage.priority].color}
                    >
                      {priorityConfig[selectedMessage.priority].label}
                    </Badge>
                    <Badge variant="outline">
                      {categoryConfig[selectedMessage.category].label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4" />
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                    {selectedMessage.isRead && (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        Read{" "}
                        {new Date(selectedMessage.readAt!).toLocaleString()}
                      </>
                    )}
                  </div>

                  <Separator />

                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">
                      {selectedMessage.content}
                    </p>
                  </div>

                  {selectedMessage.attachments.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="font-medium mb-2">Attachments</h4>
                        <div className="space-y-2">
                          {selectedMessage.attachmentDetails
                            ? // Use detailed attachment info if available
                              selectedMessage.attachmentDetails.map(
                                (attachment, index) => (
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
                                          (
                                          {(
                                            attachment.size /
                                            1024 /
                                            1024
                                          ).toFixed(2)}{" "}
                                          MB)
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )
                              )
                            : // Fallback to basic attachment info
                              selectedMessage.attachments.map(
                                (attachment, index) => (
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
                                )
                              )}
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Reply className="w-4 h-4 mr-2" />
                      Reply
                    </Button>
                    <Button variant="outline" size="sm">
                      <Forward className="w-4 h-4 mr-2" />
                      Forward
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center text-gray-500">
                  <Mail className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>Select a message to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
