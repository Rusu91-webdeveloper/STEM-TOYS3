"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  Share2,
  Copy,
  Mail,
  MessageCircle,
  Star,
  ShoppingCart,
  Trash2,
  Eye,
  EyeOff,
  Bell,
  BellOff,
  Plus,
  Filter,
  Grid,
  List,
  Edit,
  Save,
  X,
  Users,
  Gift,
  Tag,
  Calendar,
  TrendingDown,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";

interface WishlistItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number;
    images: string[];
    category?: {
      name: string;
      slug: string;
    };
    isActive: boolean;
    stockQuantity?: number;
  };
  note?: string;
  priceAlert?: boolean;
  targetPrice?: number;
  addedAt: Date;
  collectionId?: string;
  priority?: "low" | "medium" | "high";
  tags?: string[];
}

interface WishlistCollection {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  items: WishlistItem[];
  createdAt: Date;
  updatedAt: Date;
  collaborators?: string[];
  color?: string;
}

interface EnhancedWishlistProps {
  initialItems?: WishlistItem[];
  initialCollections?: WishlistCollection[];
  className?: string;
  canShare?: boolean;
  canCreateCollections?: boolean;
}

const PRIORITY_COLORS = {
  low: "bg-gray-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
};

const COLLECTION_COLORS = [
  "bg-blue-500",
  "bg-green-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-orange-500",
  "bg-teal-500",
];

export function EnhancedWishlist({
  initialItems = [],
  initialCollections = [],
  className,
  canShare = true,
  canCreateCollections = true,
}: EnhancedWishlistProps) {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();

  const [items, setItems] = useState<WishlistItem[]>(initialItems);
  const [collections, setCollections] =
    useState<WishlistCollection[]>(initialCollections);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"added" | "price" | "name" | "priority">(
    "added"
  );
  const [filterBy, setFilterBy] = useState<
    "all" | "available" | "sale" | "alerts"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal states
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCreateCollectionOpen, setIsCreateCollectionOpen] = useState(false);
  const [isEditingItem, setIsEditingItem] = useState<string | null>(null);
  const [shareableLink, setShareableLink] = useState("");

  // Form states
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  const [newCollectionColor, setNewCollectionColor] = useState(
    COLLECTION_COLORS[0]
  );
  const [newCollectionPublic, setNewCollectionPublic] = useState(false);

  // Load data from API
  useEffect(() => {
    loadWishlistData();
  }, []);

  const loadWishlistData = async () => {
    try {
      const response = await fetch("/api/account/wishlist?include=collections");
      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
        setCollections(data.collections || []);
      }
    } catch (error) {
      console.error("Failed to load wishlist data:", error);
    }
  };

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items;

    // Filter by collection
    if (activeCollection) {
      filtered = filtered.filter(
        item => item.collectionId === activeCollection
      );
    } else if (activeCollection === null) {
      filtered = filtered.filter(item => !item.collectionId);
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        item =>
          item.product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.tags?.some(tag =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // Category filter
    switch (filterBy) {
      case "available":
        filtered = filtered.filter(
          item => item.product.isActive && (item.product.stockQuantity || 0) > 0
        );
        break;
      case "sale":
        filtered = filtered.filter(
          item =>
            item.product.compareAtPrice &&
            item.product.compareAtPrice > item.product.price
        );
        break;
      case "alerts":
        filtered = filtered.filter(item => item.priceAlert);
        break;
    }

    // Sort items
    switch (sortBy) {
      case "price":
        filtered.sort((a, b) => a.product.price - b.product.price);
        break;
      case "name":
        filtered.sort((a, b) => a.product.name.localeCompare(b.product.name));
        break;
      case "priority":
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        filtered.sort(
          (a, b) =>
            (priorityOrder[b.priority || "low"] || 0) -
            (priorityOrder[a.priority || "low"] || 0)
        );
        break;
      case "added":
      default:
        filtered.sort(
          (a, b) =>
            new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
        );
        break;
    }

    return filtered;
  }, [items, activeCollection, searchQuery, filterBy, sortBy]);

  const handleRemoveItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/account/wishlist/${itemId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setItems(prev => prev.filter(item => item.id !== itemId));
        toast({
          title: t("itemRemoved", "Item Removed"),
          description: t(
            "itemRemovedFromWishlist",
            "Item has been removed from your wishlist."
          ),
        });
      }
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast({
        title: t("error", "Error"),
        description: t("failedToRemoveItem", "Failed to remove item."),
        variant: "destructive",
      });
    }
  };

  const handleUpdateItem = async (
    itemId: string,
    updates: Partial<WishlistItem>
  ) => {
    try {
      const response = await fetch(`/api/account/wishlist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        setItems(prev =>
          prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
          )
        );
        toast({
          title: t("itemUpdated", "Item Updated"),
          description: t(
            "wishlistItemUpdated",
            "Wishlist item has been updated."
          ),
        });
      }
    } catch (error) {
      console.error("Failed to update item:", error);
      toast({
        title: t("error", "Error"),
        description: t("failedToUpdateItem", "Failed to update item."),
        variant: "destructive",
      });
    }
  };

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) return;

    try {
      const response = await fetch("/api/account/wishlist/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newCollectionName,
          description: newCollectionDescription,
          color: newCollectionColor,
          isPublic: newCollectionPublic,
        }),
      });

      if (response.ok) {
        const collection = await response.json();
        setCollections(prev => [...prev, collection]);
        setNewCollectionName("");
        setNewCollectionDescription("");
        setNewCollectionPublic(false);
        setIsCreateCollectionOpen(false);

        toast({
          title: t("collectionCreated", "Collection Created"),
          description: t(
            "newCollectionCreated",
            "Your new collection has been created."
          ),
        });
      }
    } catch (error) {
      console.error("Failed to create collection:", error);
      toast({
        title: t("error", "Error"),
        description: t(
          "failedToCreateCollection",
          "Failed to create collection."
        ),
        variant: "destructive",
      });
    }
  };

  const handleShareWishlist = async (method: "link" | "email" | "social") => {
    try {
      const collectionId = activeCollection || "main";
      const response = await fetch("/api/account/wishlist/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collectionId,
          method,
          includeNotes: false, // Could be a user option
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setShareableLink(data.shareUrl);

        if (method === "link") {
          navigator.clipboard.writeText(data.shareUrl);
          toast({
            title: t("linkCopied", "Link Copied"),
            description: t(
              "shareableLinkCopied",
              "Shareable link has been copied to clipboard."
            ),
          });
        }
      }
    } catch (error) {
      console.error("Failed to create share link:", error);
      toast({
        title: t("error", "Error"),
        description: t(
          "failedToCreateShareLink",
          "Failed to create share link."
        ),
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, quantity: 1 }),
      });

      if (response.ok) {
        toast({
          title: t("addedToCart", "Added to Cart"),
          description: t(
            "productAddedToCart",
            "Product has been added to your cart."
          ),
        });
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
    }
  };

  const ItemCard = ({ item }: { item: WishlistItem }) => {
    const isOnSale =
      item.product.compareAtPrice &&
      item.product.compareAtPrice > item.product.price;
    const isOutOfStock =
      !item.product.isActive || (item.product.stockQuantity || 0) <= 0;

    return (
      <Card
        className={cn(
          "group relative overflow-hidden transition-all duration-200",
          viewMode === "grid" ? "h-full" : "flex-row",
          isOutOfStock && "opacity-60"
        )}
      >
        <CardContent
          className={cn(
            "p-4",
            viewMode === "list" && "flex items-center gap-4"
          )}
        >
          {/* Product Image */}
          <div
            className={cn(
              "relative rounded-lg overflow-hidden bg-gray-100",
              viewMode === "grid"
                ? "aspect-square mb-3"
                : "w-24 h-24 flex-shrink-0"
            )}
          >
            {item.product.images.length > 0 ? (
              <Image
                src={item.product.images[0]}
                alt={item.product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No Image
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {isOnSale && (
                <Badge variant="destructive" className="text-xs">
                  {t("sale", "Sale")}
                </Badge>
              )}
              {item.priority && item.priority !== "low" && (
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-xs text-white",
                    PRIORITY_COLORS[item.priority]
                  )}
                >
                  {t(item.priority, item.priority)}
                </Badge>
              )}
            </div>

            {/* Price Alert Indicator */}
            {item.priceAlert && (
              <div className="absolute top-2 right-2">
                <Bell className="h-4 w-4 text-blue-500" />
              </div>
            )}

            {/* Out of Stock Overlay */}
            {isOutOfStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="secondary" className="text-white bg-red-500">
                  {t("outOfStock", "Out of Stock")}
                </Badge>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className={cn("space-y-2", viewMode === "list" && "flex-1")}>
            {/* Category */}
            {item.product.category && (
              <Badge variant="outline" className="text-xs">
                {item.product.category.name}
              </Badge>
            )}

            {/* Title */}
            <h3
              className={cn(
                "font-semibold line-clamp-2 group-hover:text-primary transition-colors",
                viewMode === "grid" ? "text-sm" : "text-base"
              )}
            >
              <Link href={`/products/${item.product.slug}`}>
                {item.product.name}
              </Link>
            </h3>

            {/* Price */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">
                {formatPrice(item.product.price)}
              </span>
              {isOnSale && (
                <span className="text-sm text-muted-foreground line-through">
                  {formatPrice(item.product.compareAtPrice!)}
                </span>
              )}
              {item.targetPrice && item.product.price <= item.targetPrice && (
                <Badge
                  variant="secondary"
                  className="text-xs bg-green-500 text-white"
                >
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {t("targetReached", "Target Reached")}
                </Badge>
              )}
            </div>

            {/* Note */}
            {item.note && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {item.note}
              </p>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {item.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Added Date */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {new Date(item.addedAt).toLocaleDateString()}
            </div>
          </div>

          {/* Actions */}
          <div
            className={cn(
              "flex gap-2",
              viewMode === "grid" ? "mt-3" : "flex-col ml-auto"
            )}
          >
            <Button
              size="sm"
              onClick={() => handleAddToCart(item.product.id)}
              disabled={isOutOfStock}
              className="flex-1"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {t("addToCart", "Add to Cart")}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setIsEditingItem(item.id)}>
                  <Edit className="h-4 w-4 mr-2" />
                  {t("editItem", "Edit Item")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleUpdateItem(item.id, { priceAlert: !item.priceAlert })
                  }
                >
                  {item.priceAlert ? (
                    <BellOff className="h-4 w-4 mr-2" />
                  ) : (
                    <Bell className="h-4 w-4 mr-2" />
                  )}
                  {item.priceAlert
                    ? t("disableAlert", "Disable Alert")
                    : t("enableAlert", "Enable Alert")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleRemoveItem(item.id)}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("remove", "Remove")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">
            {t("myWishlist", "My Wishlist")}
          </h2>
          <p className="text-muted-foreground">
            {t("wishlistItemsCount", `${filteredAndSortedItems.length} items`)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canShare && (
            <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Share2 className="h-4 w-4 mr-2" />
                  {t("share", "Share")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t("shareWishlist", "Share Wishlist")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {t(
                      "shareWishlistDescription",
                      "Share your wishlist with friends and family"
                    )}
                  </p>

                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleShareWishlist("link")}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <Copy className="h-4 w-4" />
                      <span className="text-xs">
                        {t("copyLink", "Copy Link")}
                      </span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleShareWishlist("email")}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <Mail className="h-4 w-4" />
                      <span className="text-xs">{t("email", "Email")}</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => handleShareWishlist("social")}
                      className="flex flex-col gap-1 h-auto py-3"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="text-xs">{t("social", "Social")}</span>
                    </Button>
                  </div>

                  {shareableLink && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {t("shareableLink", "Shareable Link")}
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={shareableLink}
                          readOnly
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(shareableLink);
                            toast({
                              title: t("linkCopied", "Link Copied"),
                              description: t(
                                "linkCopiedToClipboard",
                                "Link copied to clipboard"
                              ),
                            });
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}

          {canCreateCollections && (
            <Dialog
              open={isCreateCollectionOpen}
              onOpenChange={setIsCreateCollectionOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  {t("newCollection", "New Collection")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {t("createCollection", "Create Collection")}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">
                      {t("collectionName", "Collection Name")}
                    </label>
                    <Input
                      value={newCollectionName}
                      onChange={e => setNewCollectionName(e.target.value)}
                      placeholder={t(
                        "enterCollectionName",
                        "Enter collection name"
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      {t("description", "Description")} (
                      {t("optional", "Optional")})
                    </label>
                    <Textarea
                      value={newCollectionDescription}
                      onChange={e =>
                        setNewCollectionDescription(e.target.value)
                      }
                      placeholder={t("enterDescription", "Enter description")}
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">
                      {t("color", "Color")}
                    </label>
                    <div className="flex gap-2 mt-2">
                      {COLLECTION_COLORS.map(color => (
                        <button
                          key={color}
                          className={cn(
                            "w-8 h-8 rounded-full border-2",
                            color,
                            newCollectionColor === color
                              ? "border-gray-900 scale-110"
                              : "border-gray-300"
                          )}
                          onClick={() => setNewCollectionColor(color)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newCollectionPublic}
                      onCheckedChange={setNewCollectionPublic}
                    />
                    <label className="text-sm">
                      {t("makePublic", "Make this collection public")}
                    </label>
                  </div>

                  <Button onClick={handleCreateCollection} className="w-full">
                    {t("createCollection", "Create Collection")}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Collections Tabs */}
      {collections.length > 0 && (
        <Tabs
          value={activeCollection || "all"}
          onValueChange={value =>
            setActiveCollection(value === "all" ? null : value)
          }
        >
          <TabsList
            className="grid w-full"
            style={{
              gridTemplateColumns: `repeat(${collections.length + 1}, 1fr)`,
            }}
          >
            <TabsTrigger value="all">
              {t("allItems", "All Items")} (
              {items.filter(item => !item.collectionId).length})
            </TabsTrigger>
            {collections.map(collection => (
              <TabsTrigger key={collection.id} value={collection.id}>
                <div
                  className={cn("w-3 h-3 rounded-full mr-2", collection.color)}
                />
                {collection.name} ({collection.items.length})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        {/* Search and Filters */}
        <div className="flex gap-2 flex-1 max-w-2xl">
          <Input
            placeholder={t("searchWishlist", "Search wishlist...")}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1"
          />

          <Select
            value={filterBy}
            onValueChange={(value: any) => setFilterBy(value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("allItems", "All Items")}</SelectItem>
              <SelectItem value="available">
                {t("available", "Available")}
              </SelectItem>
              <SelectItem value="sale">{t("onSale", "On Sale")}</SelectItem>
              <SelectItem value="alerts">
                {t("priceAlerts", "Price Alerts")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View and Sort Controls */}
        <div className="flex gap-2">
          <Select
            value={sortBy}
            onValueChange={(value: any) => setSortBy(value)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="added">
                {t("dateAdded", "Date Added")}
              </SelectItem>
              <SelectItem value="name">{t("name", "Name")}</SelectItem>
              <SelectItem value="price">{t("price", "Price")}</SelectItem>
              <SelectItem value="priority">
                {t("priority", "Priority")}
              </SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none"
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Items Grid/List */}
      {filteredAndSortedItems.length > 0 ? (
        <div
          className={cn(
            "gap-4",
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col space-y-4"
          )}
        >
          {filteredAndSortedItems.map(item => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Card className="text-center p-8">
          <CardContent className="space-y-4">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto" />
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {searchQuery
                  ? t("noResultsFound", "No Results Found")
                  : t("emptyWishlist", "Your Wishlist is Empty")}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? t(
                      "tryDifferentSearch",
                      "Try a different search term or filter"
                    )
                  : t(
                      "addProductsToWishlist",
                      "Start adding products you love to your wishlist"
                    )}
              </p>
              {!searchQuery && (
                <Button asChild>
                  <Link href="/products">
                    {t("browseProducts", "Browse Products")}
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
