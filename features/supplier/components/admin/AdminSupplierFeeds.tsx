"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  RefreshCw,
  Plus,
  Save,
  Loader2,
  Shield,
  AlertCircle,
  Database,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type SupplierOption = {
  id: string;
  companyName?: string | null;
  name?: string | null;
  email?: string | null;
  status?: string | null;
};

type SupplierFeedRow = {
  id: string;
  supplierId: string;
  name: string | null;
  type: string;
  sourceUrl: string | null;
  authType: string;
  isActive: boolean;
  lastSyncStatus: string;
  lastSyncAt: string | null;
  lastError: string | null;
  pollingIntervalMinutes: number | null;
  supplier?: SupplierOption;
};

const FEED_TYPES = ["CSV", "XML", "API", "APP"];
const AUTH_TYPES = ["NONE", "API_KEY", "BEARER", "BASIC"];

const defaultMapping = JSON.stringify(
  {
    sku: "SKU",
    name: "Title",
    price: "Price",
    stock: "Stock",
    images: "Images",
  },
  null,
  2
);

export function AdminSupplierFeeds() {
  const [feeds, setFeeds] = useState<SupplierFeedRow[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SupplierFeedRow | null>(null);

  const [form, setForm] = useState({
    supplierId: "",
    name: "",
    type: "CSV",
    sourceUrl: "",
    authType: "NONE",
    apiKey: "",
    authHeader: "X-API-Key",
    username: "",
    password: "",
    headers: "{}",
    mapping: defaultMapping,
    pollingIntervalMinutes: "60",
    isActive: true,
  });

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const [feedsRes, suppliersRes] = await Promise.all([
        fetch("/api/admin/supplier-feeds"),
        fetch("/api/admin/suppliers?limit=100"),
      ]);
      if (!feedsRes.ok) throw new Error("Failed to load feeds");
      const feedsData = await feedsRes.json();
      if (!suppliersRes.ok) throw new Error("Failed to load suppliers");
      const suppliersData = await suppliersRes.json();
      setFeeds(feedsData.feeds || []);
      setSuppliers(suppliersData.suppliers || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({
      supplierId: "",
      name: "",
      type: "CSV",
      sourceUrl: "",
      authType: "NONE",
      apiKey: "",
      authHeader: "X-API-Key",
      username: "",
      password: "",
      headers: "{}",
      mapping: defaultMapping,
      pollingIntervalMinutes: "60",
      isActive: true,
    });
  };

  const openCreate = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (feed: SupplierFeedRow) => {
    setEditing(feed);
    setForm({
      supplierId: feed.supplierId,
      name: feed.name || "",
      type: feed.type,
      sourceUrl: feed.sourceUrl || "",
      authType: feed.authType || "NONE",
      apiKey: "",
      authHeader: "X-API-Key",
      username: "",
      password: "",
      headers: "{}",
      mapping: defaultMapping,
      pollingIntervalMinutes: String(feed.pollingIntervalMinutes ?? 60),
      isActive: feed.isActive,
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setError(null);

      const payload = {
        supplierId: form.supplierId || undefined,
        name: form.name || undefined,
        type: form.type,
        sourceUrl: form.sourceUrl || undefined,
        authType: form.authType,
        apiKey: form.apiKey || undefined,
        authHeader: form.authHeader || undefined,
        username: form.username || undefined,
        password: form.password || undefined,
        headers: safeJson(form.headers, {}),
        mapping: safeJson(form.mapping, {}),
        pollingIntervalMinutes: Number(form.pollingIntervalMinutes || 60),
        isActive: form.isActive,
      };

      const url = editing
        ? `/api/admin/supplier-feeds/${editing.id}`
        : "/api/admin/supplier-feeds";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save feed");
      }

      setDialogOpen(false);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save feed");
    } finally {
      setSaving(false);
    }
  };

  const handleSync = async (feedId: string) => {
    try {
      setSyncing(feedId);
      setError(null);
      const res = await fetch(`/api/admin/supplier-feeds/${feedId}/sync`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to start sync");
      }
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync feed");
    } finally {
      setSyncing(null);
    }
  };

  const supplierLabel = (id: string) => {
    const s = suppliers.find(su => su.id === id);
    if (!s) return id;
    return s.companyName || s.name || s.email || id;
  };

  const lastSyncDisplay = (feed: SupplierFeedRow) => {
    if (!feed.lastSyncAt) return "Never";
    return formatDistanceToNow(new Date(feed.lastSyncAt), { addSuffix: true });
  };

  const helperBlocks = useMemo(
    () => [
      {
        title: "Steps to add a feed",
        items: [
          "Pick the supplier and feed type (CSV/XML/API/APP).",
          "Paste the feed/API URL.",
          "Choose auth (API key/Bearer/Basic) and provide the key if needed.",
          "Set the field mapping (sku/name/price/stock/images).",
          "Save, then click Sync Now to pull products.",
        ],
      },
      {
        title: "Tips",
        items: [
          "CSV/XML from BaseLinker usually works with simple mappings.",
          "For API feeds, mapping keys must match JSON fields.",
          "If a sync fails, check the last error column.",
        ],
      },
    ],
    []
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Supplier Feeds</h1>
          <p className="text-sm text-muted-foreground">
            Add feeds/APIs for suppliers, run syncs, and monitor status.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={openCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Add feed
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {helperBlocks.map(block => (
          <Card key={block.title}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {block.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              {block.items.map(item => (
                <div key={item} className="flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Feeds
          </CardTitle>
          <CardDescription>Manage and sync supplier feeds.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last sync</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : feeds.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                      No feeds yet. Click “Add feed” to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  feeds.map(feed => (
                    <TableRow key={feed.id}>
                      <TableCell className="space-y-1">
                        <div className="font-medium">{feed.name || supplierLabel(feed.supplierId)}</div>
                        <div className="text-xs text-muted-foreground">
                          Supplier: {supplierLabel(feed.supplierId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{feed.type}</Badge>
                        <div className="text-xs text-muted-foreground">{feed.authType}</div>
                      </TableCell>
                      <TableCell className="max-w-[240px] truncate text-sm text-muted-foreground">
                        {feed.sourceUrl || "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={cn(
                            feed.lastSyncStatus === "SUCCESS" && "bg-green-100 text-green-800",
                            feed.lastSyncStatus === "FAILED" && "bg-red-100 text-red-800",
                            feed.lastSyncStatus === "RUNNING" && "bg-blue-100 text-blue-800",
                            "border"
                          )}
                        >
                          {feed.lastSyncStatus}
                        </Badge>
                        {!feed.isActive && (
                          <div className="text-[11px] text-muted-foreground">Inactive</div>
                        )}
                        {feed.lastError && (
                          <div className="text-[11px] text-destructive line-clamp-2">{feed.lastError}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {lastSyncDisplay(feed)}
                      </TableCell>
                      <TableCell className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(feed)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={!!syncing}
                          onClick={() => handleSync(feed.id)}
                        >
                          {syncing === feed.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                          )}
                          Sync now
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit feed" : "Add feed"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select
                value={form.supplierId}
                onValueChange={value => setForm(f => ({ ...f, supplierId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.companyName || s.name || s.email || s.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Name (optional)</Label>
              <Input
                placeholder="BaseLinker CSV"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Feed type</Label>
              <Select
                value={form.type}
                onValueChange={value => setForm(f => ({ ...f, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FEED_TYPES.map(t => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Feed/API URL</Label>
              <Input
                placeholder="https://..."
                value={form.sourceUrl}
                onChange={e => setForm(f => ({ ...f, sourceUrl: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Auth type</Label>
              <Select
                value={form.authType}
                onValueChange={value => setForm(f => ({ ...f, authType: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTH_TYPES.map(t => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>API key / token (if needed)</Label>
              <Input
                placeholder="key or token"
                value={form.apiKey}
                onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Auth header (default: X-API-Key)</Label>
              <Input
                value={form.authHeader}
                onChange={e => setForm(f => ({ ...f, authHeader: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Username (Basic auth)</Label>
              <Input
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Password (Basic auth)</Label>
              <Input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Headers (JSON)</Label>
              <Textarea
                className="min-h-[90px]"
                value={form.headers}
                onChange={e => setForm(f => ({ ...f, headers: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Field mapping (JSON)</Label>
              <Textarea
                className="min-h-[140px]"
                value={form.mapping}
                onChange={e => setForm(f => ({ ...f, mapping: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                Map your feed fields: sku, name, price, stock, images, categoryPath.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Polling interval (minutes)</Label>
              <Input
                type="number"
                min={5}
                value={form.pollingIntervalMinutes}
                onChange={e => setForm(f => ({ ...f, pollingIntervalMinutes: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-between space-y-2 rounded-md border p-3">
              <div className="space-y-1">
                <Label>Active</Label>
                <p className="text-xs text-muted-foreground">
                  If off, syncs will skip this feed.
                </p>
              </div>
              <Switch
                checked={form.isActive}
                onCheckedChange={checked => setForm(f => ({ ...f, isActive: checked }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save feed
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function safeJson<T>(value: string, fallback: T): T {
  try {
    const parsed = JSON.parse(value);
    return parsed as T;
  } catch {
    return fallback;
  }
}
