"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Ticket,
  Bell,
  AlertCircle,
  CheckCircle,
  Clock,
  User,
  Building2,
  Paperclip,
  Eye,
  EyeOff,
  Search,
  Filter,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Message {
  id: string;
  supplierId: string;
  supplierName: string;
  senderId: string;
  senderName: string;
  senderType: "ADMIN" | "SUPPLIER";
  subject: string;
  content: string;
  isRead: boolean;
  readAt?: Date;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  category:
    | "GENERAL"
    | "ACCOUNT"
    | "ORDER"
    | "SUPPORT"
    | "MARKETING"
    | "ANNOUNCEMENT";
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface SupportTicket {
  id: string;
  supplierId: string;
  supplierName: string;
  ticketNumber: string;
  subject: string;
  description: string;
  status:
    | "OPEN"
    | "PENDING_CUSTOMER"
    | "PENDING_SUPPLIER"
    | "RESOLVED"
    | "CLOSED"
    | "REOPENED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  category:
    | "GENERAL"
    | "ACCOUNT"
    | "ORDER"
    | "SUPPORT"
    | "MARKETING"
    | "ANNOUNCEMENT";
  assignedTo?: string;
  assignedAdminName?: string;
  createdAt: Date;
  updatedAt: Date;
  closedAt?: Date;
  responseCount: number;
  lastResponseAt?: Date;
}

interface Notification {
  id: string;
  supplierId: string;
  supplierName: string;
  type: "INFO" | "WARNING" | "ERROR" | "SUCCESS";
  title: string;
  message: string;
  isRead: boolean;
  readAt?: Date;
  actionUrl?: string;
  createdAt: Date;
}

export function CommunicationHub() {
  const [activeTab, setActiveTab] = useState("messages");
  const [messages, setMessages] = useState<Message[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Message composition
  const [newMessage, setNewMessage] = useState({
    supplierId: "",
    subject: "",
    content: "",
    priority: "NORMAL" as const,
    category: "GENERAL" as const,
  });

  // Ticket creation
  const [newTicket, setNewTicket] = useState({
    supplierId: "",
    subject: "",
    description: "",
    priority: "MEDIUM" as const,
    category: "GENERAL" as const,
  });

  // Filters
  const [messageFilter, setMessageFilter] = useState({
    supplier: "all",
    status: "all",
    priority: "all",
  });

  const [ticketFilter, setTicketFilter] = useState({
    supplier: "all",
    status: "all",
    priority: "all",
  });

  useEffect(() => {
    fetchCommunicationData();
  }, []);

  const fetchCommunicationData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch messages, tickets, and notifications
      const [messagesRes, ticketsRes, notificationsRes] = await Promise.all([
        fetch("/api/admin/communication/messages"),
        fetch("/api/admin/communication/tickets"),
        fetch("/api/admin/communication/notifications"),
      ]);

      if (!messagesRes.ok || !ticketsRes.ok || !notificationsRes.ok) {
        throw new Error("Failed to fetch communication data");
      }

      const [messagesData, ticketsData, notificationsData] = await Promise.all([
        messagesRes.json(),
        ticketsRes.json(),
        notificationsRes.json(),
      ]);

      setMessages(messagesData.messages || []);
      setTickets(ticketsData.tickets || []);
      setNotifications(notificationsData.notifications || []);
    } catch (err) {
      console.error("Error fetching communication data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load communication data"
      );
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    try {
      const response = await fetch("/api/admin/communication/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMessage),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Reset form and refresh data
      setNewMessage({
        supplierId: "",
        subject: "",
        content: "",
        priority: "NORMAL",
        category: "GENERAL",
      });
      await fetchCommunicationData();
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err instanceof Error ? err.message : "Failed to send message");
    }
  };

  const createTicket = async () => {
    try {
      const response = await fetch("/api/admin/communication/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTicket),
      });

      if (!response.ok) {
        throw new Error("Failed to create ticket");
      }

      // Reset form and refresh data
      setNewTicket({
        supplierId: "",
        subject: "",
        description: "",
        priority: "MEDIUM",
        category: "GENERAL",
      });
      await fetchCommunicationData();
    } catch (err) {
      console.error("Error creating ticket:", err);
      setError(err instanceof Error ? err.message : "Failed to create ticket");
    }
  };

  const markMessageAsRead = async (messageId: string) => {
    try {
      await fetch(`/api/admin/communication/messages/${messageId}/read`, {
        method: "POST",
      });
      await fetchCommunicationData();
    } catch (err) {
      console.error("Error marking message as read:", err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "NORMAL":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "LOW":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-red-100 text-red-800 border-red-200";
      case "PENDING_CUSTOMER":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PENDING_SUPPLIER":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "RESOLVED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CLOSED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading communication data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Communication Hub
          </h1>
          <p className="text-gray-600 mt-2">
            Manage messages, support tickets, and notifications with suppliers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCommunicationData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Unread Messages
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {messages.filter(m => !m.isRead).length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Open Tickets
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {tickets.filter(t => t.status === "OPEN").length}
                </p>
              </div>
              <Ticket className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Unread Notifications
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {notifications.filter(n => !n.isRead).length}
                </p>
              </div>
              <Bell className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Response Time
                </p>
                <p className="text-2xl font-bold text-gray-900">2.4h</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communication Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="messages" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages ({messages.length})
          </TabsTrigger>
          <TabsTrigger value="tickets" className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Support Tickets ({tickets.length})
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="flex items-center gap-2"
          >
            <Bell className="h-4 w-4" />
            Notifications ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="compose" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Compose
          </TabsTrigger>
        </TabsList>

        {/* Messages Tab */}
        <TabsContent value="messages" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Messages</CardTitle>
              <CardDescription>
                Direct communication with suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <Select
                  value={messageFilter.supplier}
                  onValueChange={value =>
                    setMessageFilter({ ...messageFilter, supplier: value })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {/* Add supplier options */}
                  </SelectContent>
                </Select>

                <Select
                  value={messageFilter.status}
                  onValueChange={value =>
                    setMessageFilter({ ...messageFilter, status: value })
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="unread">Unread</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Messages List */}
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {messages
                    .filter(msg => {
                      if (
                        messageFilter.supplier !== "all" &&
                        msg.supplierId !== messageFilter.supplier
                      )
                        return false;
                      if (messageFilter.status === "unread" && msg.isRead)
                        return false;
                      if (messageFilter.status === "read" && !msg.isRead)
                        return false;
                      return true;
                    })
                    .map(message => (
                      <Card
                        key={message.id}
                        className={`cursor-pointer transition-colors ${!message.isRead ? "bg-blue-50 border-blue-200" : ""}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  className={getPriorityColor(message.priority)}
                                >
                                  {message.priority}
                                </Badge>
                                <Badge variant="outline">
                                  {message.category}
                                </Badge>
                                {!message.isRead && (
                                  <Badge className="bg-blue-100 text-blue-800">
                                    New
                                  </Badge>
                                )}
                              </div>
                              <h4 className="font-medium text-gray-900 mb-1">
                                {message.subject}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {message.content}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{message.supplierName}</span>
                                <span>
                                  {new Date(
                                    message.createdAt
                                  ).toLocaleDateString()}
                                </span>
                                {message.attachments.length > 0 && (
                                  <span className="flex items-center gap-1">
                                    <Paperclip className="h-3 w-3" />
                                    {message.attachments.length}
                                  </span>
                                )}
                              </div>
                            </div>
                            {!message.isRead && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => markMessageAsRead(message.id)}
                                className="ml-4"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Support Tickets</CardTitle>
              <CardDescription>
                Track and manage supplier support requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <Select
                  value={ticketFilter.supplier}
                  onValueChange={value =>
                    setTicketFilter({ ...ticketFilter, supplier: value })
                  }
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {/* Add supplier options */}
                  </SelectContent>
                </Select>

                <Select
                  value={ticketFilter.status}
                  onValueChange={value =>
                    setTicketFilter({ ...ticketFilter, status: value })
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="OPEN">Open</SelectItem>
                    <SelectItem value="PENDING_CUSTOMER">
                      Pending Customer
                    </SelectItem>
                    <SelectItem value="PENDING_SUPPLIER">
                      Pending Supplier
                    </SelectItem>
                    <SelectItem value="RESOLVED">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Tickets List */}
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {tickets
                    .filter(ticket => {
                      if (
                        ticketFilter.supplier !== "all" &&
                        ticket.supplierId !== ticketFilter.supplier
                      )
                        return false;
                      if (
                        ticketFilter.status !== "all" &&
                        ticket.status !== ticketFilter.status
                      )
                        return false;
                      return true;
                    })
                    .map(ticket => (
                      <Card
                        key={ticket.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge
                                  className={getStatusColor(ticket.status)}
                                >
                                  {ticket.status.replace("_", " ")}
                                </Badge>
                                <Badge
                                  className={getPriorityColor(ticket.priority)}
                                >
                                  {ticket.priority}
                                </Badge>
                                <span className="text-sm text-gray-500">
                                  #{ticket.ticketNumber}
                                </span>
                              </div>
                              <h4 className="font-medium text-gray-900 mb-1">
                                {ticket.subject}
                              </h4>
                              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                {ticket.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>{ticket.supplierName}</span>
                                <span>
                                  {new Date(
                                    ticket.createdAt
                                  ).toLocaleDateString()}
                                </span>
                                {ticket.assignedAdminName && (
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {ticket.assignedAdminName}
                                  </span>
                                )}
                                <span>{ticket.responseCount} responses</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Automated notifications sent to suppliers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {notifications.map(notification => (
                    <Alert
                      key={notification.id}
                      className={
                        !notification.isRead ? "bg-blue-50 border-blue-200" : ""
                      }
                    >
                      <div className="flex items-start gap-3">
                        {notification.type === "SUCCESS" && (
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                        )}
                        {notification.type === "WARNING" && (
                          <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                        )}
                        {notification.type === "ERROR" && (
                          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                        )}
                        {notification.type === "INFO" && (
                          <Bell className="h-5 w-5 text-blue-600 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.isRead && (
                              <Badge className="bg-blue-100 text-blue-800">
                                New
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>{notification.supplierName}</span>
                            <span>
                              {new Date(
                                notification.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Alert>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compose Tab */}
        <TabsContent value="compose" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Compose Message */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Send Message
                </CardTitle>
                <CardDescription>
                  Send a direct message to a supplier
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={newMessage.supplierId}
                  onValueChange={value =>
                    setNewMessage({ ...newMessage, supplierId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>{/* Add supplier options */}</SelectContent>
                </Select>

                <Input
                  placeholder="Subject"
                  value={newMessage.subject}
                  onChange={e =>
                    setNewMessage({ ...newMessage, subject: e.target.value })
                  }
                />

                <Select
                  value={newMessage.priority}
                  onValueChange={(value: any) =>
                    setNewMessage({ ...newMessage, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Message content..."
                  value={newMessage.content}
                  onChange={e =>
                    setNewMessage({ ...newMessage, content: e.target.value })
                  }
                  rows={6}
                />

                <Button onClick={sendMessage} className="w-full">
                  Send Message
                </Button>
              </CardContent>
            </Card>

            {/* Create Ticket */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create Support Ticket
                </CardTitle>
                <CardDescription>
                  Create a support ticket for a supplier issue
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select
                  value={newTicket.supplierId}
                  onValueChange={value =>
                    setNewTicket({ ...newTicket, supplierId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>{/* Add supplier options */}</SelectContent>
                </Select>

                <Input
                  placeholder="Subject"
                  value={newTicket.subject}
                  onChange={e =>
                    setNewTicket({ ...newTicket, subject: e.target.value })
                  }
                />

                <Select
                  value={newTicket.priority}
                  onValueChange={(value: any) =>
                    setNewTicket({ ...newTicket, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  placeholder="Describe the issue..."
                  value={newTicket.description}
                  onChange={e =>
                    setNewTicket({ ...newTicket, description: e.target.value })
                  }
                  rows={6}
                />

                <Button onClick={createTicket} className="w-full">
                  Create Ticket
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
