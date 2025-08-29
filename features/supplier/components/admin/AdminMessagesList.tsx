"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Eye,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Calendar,
  User,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

interface SupplierMessage {
  id: string;
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
  isRead: boolean;
  createdAt: string;
  attachments: string[];
  attachmentDetails?: Array<{
    url: string;
    name: string;
    size: number;
  }>;
  sender: {
    id: string;
    name: string;
    email: string;
  };
  supplier: {
    id: string;
    companyName: string;
    contactPersonName: string;
    contactPersonEmail: string;
  };
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
  NORMAL: {
    label: "Normal",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: Mail,
  },
  LOW: {
    label: "Low",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    icon: Mail,
  },
};

const categoryConfig = {
  GENERAL: { label: "General", color: "bg-gray-100 text-gray-800" },
  ACCOUNT: { label: "Account", color: "bg-blue-100 text-blue-800" },
  ORDER: { label: "Order", color: "bg-green-100 text-green-800" },
  SUPPORT: { label: "Support", color: "bg-purple-100 text-purple-800" },
  MARKETING: { label: "Marketing", color: "bg-yellow-100 text-yellow-800" },
  ANNOUNCEMENT: {
    label: "Announcement",
    color: "bg-indigo-100 text-indigo-800",
  },
};

export function AdminMessagesList() {
  const [messages, setMessages] = useState<SupplierMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [readFilter, setReadFilter] = useState<string>("ALL");
  const [selectedMessage, setSelectedMessage] =
    useState<SupplierMessage | null>(null);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/admin/supplier-messages");
      if (!response.ok) {
        throw new Error("Failed to fetch messages");
      }

      const data = await response.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const response = await fetch(
        `/api/admin/supplier-messages/${messageId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isRead: true }),
        }
      );

      if (response.ok) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId ? { ...msg, isRead: true } : msg
          )
        );
      }
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  };

  const filteredMessages = messages.filter(message => {
    const matchesSearch =
      message.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.supplier.companyName
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesPriority =
      priorityFilter === "ALL" || message.priority === priorityFilter;
    const matchesCategory =
      categoryFilter === "ALL" || message.category === categoryFilter;
    const matchesRead =
      readFilter === "ALL" ||
      (readFilter === "READ" && message.isRead) ||
      (readFilter === "UNREAD" && !message.isRead);

    return matchesSearch && matchesPriority && matchesCategory && matchesRead;
  });

  const unreadCount = messages.filter(msg => !msg.isRead).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplier Messages</h1>
          <p className="text-gray-600">
            {messages.length} total messages • {unreadCount} unread
          </p>
        </div>
        <Button onClick={fetchMessages} variant="outline">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search messages..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priorities</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Categories</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                  <SelectItem value="ACCOUNT">Account</SelectItem>
                  <SelectItem value="ORDER">Order</SelectItem>
                  <SelectItem value="SUPPORT">Support</SelectItem>
                  <SelectItem value="MARKETING">Marketing</SelectItem>
                  <SelectItem value="ANNOUNCEMENT">Announcement</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Status</label>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Messages</SelectItem>
                  <SelectItem value="UNREAD">Unread</SelectItem>
                  <SelectItem value="READ">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Messages ({filteredMessages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No messages found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMessages.map(message => {
                  const PriorityIcon = priorityConfig[message.priority].icon;
                  return (
                    <TableRow
                      key={message.id}
                      className={!message.isRead ? "bg-blue-50" : ""}
                    >
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {message.supplier.companyName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {message.sender.name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate">
                          {message.subject}
                          {message.attachments.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              📎 {message.attachments.length}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={priorityConfig[message.priority].color}
                        >
                          <PriorityIcon className="h-3 w-3 mr-1" />
                          {priorityConfig[message.priority].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={categoryConfig[message.category].color}
                        >
                          {categoryConfig[message.category].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(message.createdAt).toLocaleTimeString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        {message.isRead ? (
                          <Badge variant="secondary">Read</Badge>
                        ) : (
                          <Badge variant="default">Unread</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedMessage(message);
                                if (!message.isRead) {
                                  markAsRead(message.id);
                                }
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{message.subject}</DialogTitle>
                              <DialogDescription>
                                From {message.supplier.companyName} •{" "}
                                {new Date(message.createdAt).toLocaleString()}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="flex gap-2">
                                <Badge
                                  className={
                                    priorityConfig[message.priority].color
                                  }
                                >
                                  {priorityConfig[message.priority].label}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={
                                    categoryConfig[message.category].color
                                  }
                                >
                                  {categoryConfig[message.category].label}
                                </Badge>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">
                                  Supplier Information
                                </h4>
                                <div className="bg-gray-50 p-3 rounded-md space-y-1 text-sm">
                                  <div>
                                    <strong>Company:</strong>{" "}
                                    {message.supplier.companyName}
                                  </div>
                                  <div>
                                    <strong>Contact:</strong>{" "}
                                    {message.supplier.contactPersonName}
                                  </div>
                                  <div>
                                    <strong>Email:</strong>{" "}
                                    {message.supplier.contactPersonEmail}
                                  </div>
                                </div>
                              </div>

                              {message.attachments.length > 0 && (
                                <div>
                                  <h4 className="font-medium mb-2">
                                    Attachments ({message.attachments.length})
                                  </h4>
                                  <div className="space-y-2">
                                    {message.attachmentDetails
                                      ? // Use detailed attachment info if available
                                        message.attachmentDetails.map(
                                          (attachment, index) => (
                                            <div
                                              key={index}
                                              className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                            >
                                              <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium">
                                                  {attachment.name}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                  (
                                                  {(
                                                    attachment.size /
                                                    1024 /
                                                    1024
                                                  ).toFixed(2)}{" "}
                                                  MB)
                                                </span>
                                              </div>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  window.open(
                                                    attachment.url,
                                                    "_blank"
                                                  )
                                                }
                                              >
                                                <Download className="h-4 w-4 mr-1" />
                                                Download
                                              </Button>
                                            </div>
                                          )
                                        )
                                      : // Fallback to basic attachment info
                                        message.attachments.map(
                                          (url, index) => (
                                            <div
                                              key={index}
                                              className="flex items-center justify-between bg-gray-50 p-2 rounded"
                                            >
                                              <span className="text-sm">
                                                Attachment {index + 1}
                                              </span>
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  window.open(url, "_blank")
                                                }
                                              >
                                                <Download className="h-4 w-4 mr-1" />
                                                Download
                                              </Button>
                                            </div>
                                          )
                                        )}
                                  </div>
                                </div>
                              )}

                              <Separator />

                              <div>
                                <h4 className="font-medium mb-2">
                                  Message Content
                                </h4>
                                <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap">
                                  {message.content}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
