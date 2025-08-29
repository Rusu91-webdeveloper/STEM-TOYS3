"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { UploadButton } from "@uploadthing/react";
import { OurFileRouter } from "@/lib/uploadthing";
import {
  Loader2,
  Plus,
  MessageSquare,
  Send,
  AlertTriangle,
  Paperclip,
  X,
} from "lucide-react";

interface Ticket {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  priority: string;
  category: string;
  attachments: string[];
  attachmentDetails?: Array<{
    url: string;
    name: string;
    size: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

interface TicketDetail extends Ticket {
  description: string;
  responses: Array<{
    id: string;
    content: string;
    responder: { id: string; name: string; email: string };
    createdAt: string;
    attachments: string[];
    attachmentDetails?: Array<{
      url: string;
      name: string;
      size: number;
    }>;
  }>;
}

export function SupplierSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<TicketDetail | null>(
    null
  );
  const [filters, setFilters] = useState({
    status: "all",
    priority: "all",
    category: "all",
  });
  const [creating, setCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: "",
    description: "",
    category: "SUPPORT",
    priority: "MEDIUM",
    attachments: [] as Array<{
      url: string;
      name: string;
      size: number;
    }>,
  });
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (filters.status && filters.status !== "all")
        params.append("status", filters.status);
      if (filters.priority && filters.priority !== "all")
        params.append("priority", filters.priority);
      if (filters.category && filters.category !== "all")
        params.append("category", filters.category);
      const res = await fetch(`/api/supplier/tickets?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
      setSelectedTicket(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tickets");
    } finally {
      setLoading(false);
    }
  };

  const openTicket = async (id: string) => {
    try {
      const res = await fetch(`/api/supplier/tickets/${id}`);
      if (!res.ok) throw new Error("Failed to load ticket");
      const data = await res.json();
      setSelectedTicket(data.ticket);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load ticket");
    }
  };

  const createTicket = async () => {
    try {
      setCreating(true);
      
      const formData = new FormData();
      formData.append("subject", newTicket.subject);
      formData.append("description", newTicket.description);
      formData.append("category", newTicket.category);
      formData.append("priority", newTicket.priority);

      // Add attachment details
      newTicket.attachments.forEach((attachment, index) => {
        formData.append("attachmentUrls", attachment.url);
        formData.append("attachmentNames", attachment.name);
        formData.append("attachmentSizes", attachment.size.toString());
      });

      const res = await fetch("/api/supplier/tickets", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to create ticket");
      await fetchTickets();
      setNewTicket({
        subject: "",
        description: "",
        category: "SUPPORT",
        priority: "MEDIUM",
        attachments: [],
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create ticket");
    } finally {
      setCreating(false);
    }
  };

  const removeAttachment = (index: number) => {
    setNewTicket(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  const sendReply = async () => {
    if (!selectedTicket || !reply.trim()) return;
    try {
      setReplying(true);
      const res = await fetch(
        `/api/supplier/tickets/${selectedTicket.id}/responses`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: reply }),
        }
      );
      if (!res.ok) throw new Error("Failed to send reply");
      setReply("");
      await openTicket(selectedTicket.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send reply");
    } finally {
      setReplying(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-600 mt-1">
            Create and manage support tickets with TechTots.
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> New Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Support Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Subject"
                value={newTicket.subject}
                onChange={e =>
                  setNewTicket(s => ({ ...s, subject: e.target.value }))
                }
              />
              <Textarea
                rows={5}
                placeholder="Describe your issue..."
                value={newTicket.description}
                onChange={e =>
                  setNewTicket(s => ({ ...s, description: e.target.value }))
                }
              />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={newTicket.category}
                    onValueChange={v =>
                      setNewTicket(s => ({ ...s, category: v }))
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
                <div>
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={newTicket.priority}
                    onValueChange={v =>
                      setNewTicket(s => ({ ...s, priority: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Attachments</label>
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
                        setNewTicket(prev => ({
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
                      allowedContent: "Images, documents, and archives up to 10MB",
                    }}
                  />
                </div>
                {newTicket.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {newTicket.attachments.map((attachment, index) => (
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
              <div className="flex justify-end">
                <Button 
                  onClick={createTicket} 
                  disabled={creating || isUploading || !newTicket.subject || !newTicket.description}
                >
                  {creating
                    ? "Creating..."
                    : isUploading
                      ? "Uploading..."
                      : "Create Ticket"}
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

      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <Select
              value={filters.status}
              onValueChange={v => setFilters(s => ({ ...s, status: v }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="PENDING_SUPPLIER">
                  Pending Supplier
                </SelectItem>
                <SelectItem value="PENDING_CUSTOMER">
                  Pending Customer
                </SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.priority}
              onValueChange={v => setFilters(s => ({ ...s, priority: v }))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="LOW">Low</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HIGH">High</SelectItem>
                <SelectItem value="URGENT">Urgent</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.category}
              onValueChange={v => setFilters(s => ({ ...s, category: v }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="ACCOUNT">Account</SelectItem>
                <SelectItem value="ORDER">Order</SelectItem>
                <SelectItem value="SUPPORT">Support</SelectItem>
                <SelectItem value="MARKETING">Marketing</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Tickets ({tickets.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-gray-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading...
                  </div>
                ) : tickets.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    No tickets found
                  </div>
                ) : (
                  tickets.map(t => (
                    <div
                      key={t.id}
                      className={`p-4 border-b cursor-pointer hover:bg-gray-50 ${selectedTicket?.id === t.id ? "bg-blue-50" : ""}`}
                      onClick={() => openTicket(t.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{t.subject}</div>
                          <div className="text-xs text-gray-500">
                            {t.ticketNumber}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{t.priority}</Badge>
                          <Badge>{t.status}</Badge>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          {!selectedTicket ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  Select a ticket to view details
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>{selectedTicket.subject}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-gray-600 mb-4">
                  {selectedTicket.description}
                </div>
                <Separator />
                <div className="space-y-4 mt-4">
                  {selectedTicket.responses.map(r => (
                    <div key={r.id} className="p-3 bg-gray-50 rounded">
                      <div className="text-sm text-gray-700 whitespace-pre-wrap">
                        {r.content}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {r.responder.name} •{" "}
                        {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Input
                    placeholder="Write a reply..."
                    value={reply}
                    onChange={e => setReply(e.target.value)}
                  />
                  <Button
                    onClick={sendReply}
                    disabled={replying || !reply.trim()}
                  >
                    {replying ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}{" "}
                    Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
