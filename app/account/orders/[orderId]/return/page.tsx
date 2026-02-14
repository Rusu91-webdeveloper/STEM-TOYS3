"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, ShoppingBag, Check, Upload, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, use } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/lib/currency";

// Define return types
interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    images: string[];
  };
  isDigital: boolean;
  returnStatus: string;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  deliveredAt?: string;
}

// Create the return form schema
const returnSchema = z.object({
  orderItemIds: z
    .array(z.string())
    .min(1, "Please select at least one item to return"),
  reason: z.enum(
    [
      "DOES_NOT_MEET_EXPECTATIONS",
      "DAMAGED_OR_DEFECTIVE",
      "WRONG_ITEM_SHIPPED",
      "CHANGED_MIND",
      "ORDERED_WRONG_PRODUCT",
      "OTHER",
    ],
    {
      required_error: "Please select a reason for your return",
    }
  ),
  details: z.string().optional(),
  photos: z.array(z.string()).min(1, "At least one photo is required for claims"),
}).refine(
  (data) => {
    // Photos are ALWAYS required for claims (missing parts, defects, damage-in-transit)
    // This ensures proper documentation for supplier processing
    if (!data.photos || data.photos.length === 0) {
      return false;
    }
    return true;
  },
  {
    message: "Photos/videos are required for all return claims. Please upload at least one photo showing the issue.",
    path: ["photos"],
  }
);

type ReturnFormValues = z.infer<typeof returnSchema>;

// Define reason display labels
const reasonLabels = {
  DOES_NOT_MEET_EXPECTATIONS: "Does not meet expectations",
  DAMAGED_OR_DEFECTIVE: "Damaged or defective",
  WRONG_ITEM_SHIPPED: "Wrong item shipped",
  CHANGED_MIND: "Changed my mind",
  ORDERED_WRONG_PRODUCT: "Ordered wrong product",
  OTHER: "Other reason",
};

interface ReturnPageProps {
  params: Promise<{ orderId: string }>;
}

export default function InitiateReturn({ params }: ReturnPageProps) {
  // Use React's use hook to access params in client component
  const { orderId } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  // Set up form with validation
  const form = useForm<ReturnFormValues>({
    resolver: zodResolver(returnSchema),
    defaultValues: {
      orderItemIds: [],
      reason: undefined,
      details: "",
      photos: [],
    },
  });

  // Add state for uploading photos
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  
  // Get photos from form watch
  const photos = form.watch("photos") || [];
  const selectedReason = form.watch("reason");
  
  // Photos are ALWAYS required for claims (per plan requirement)
  const photosRequired = true;

  // Calculate if order is within 14-day return window (changed from 30 days)
  const isWithin14Days = (order: Order) => {
    if (order.status !== "DELIVERED") {
      return false;
    }

    // Use deliveredAt if available, otherwise fall back to order creation date
    const referenceDate = order.deliveredAt
      ? new Date(order.deliveredAt)
      : new Date(order.createdAt);

    const today = new Date();
    const diffTime = today.getTime() - referenceDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Allow returns within 14 days of delivery (or order creation if deliveredAt is not set)
    return diffDays <= 14;
  };

  // Fetch order details
  useEffect(() => {
    if (!orderId) return;
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/account/orders/${orderId}`);

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();
        setOrder(data.order);

        // Check if order is within return window
        if (data.order && !isWithin14Days(data.order)) {
          toast({
            title: "Return period expired",
            description:
              "Items can only be returned within 14 days of delivery.",
            variant: "destructive",
          });
          router.push(`/account/orders/${orderId}`);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast({
          title: "Error",
          description: "Failed to load order details. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router, toast]);

  // Handle form submission
  const onSubmit = async (values: ReturnFormValues) => {
    try {
      setSubmitting(true);

      // Use the new bulk return endpoint
      const response = await fetch("/api/returns/create-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderItemIds: values.orderItemIds,
          reason: values.reason,
          details: values.details,
          photos: values.photos || [],
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate return");
      }

      setSubmitted(true);
      toast({
        title: "Returns initiated",
        description: `Successfully submitted return request for ${values.orderItemIds.length} item(s). You will receive one confirmation email for all items.`,
      });

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/account/returns");
      }, 2000);
    } catch (error) {
      console.error("Error submitting returns:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to submit return request.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mt-6">
        <div className="bg-white p-8 rounded-xl shadow-sm text-center">
          <h3 className="text-lg font-medium mb-2">Order not found</h3>
          <p className="text-gray-500 mb-4">
            We couldn&apos;t find the order you&apos;re looking for.
          </p>
          <Link href="/account/orders" className="text-primary hover:underline">
            View all orders
          </Link>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mt-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="pt-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Return Initiated</h2>
            <p className="text-gray-500 mb-4">
              Your return request has been submitted successfully for all
              selected items. Please note that items must be returned within 14
              days of delivery. You&apos;ll receive one confirmation email with
              details for all items in this return request.
            </p>
            <div className="mt-6">
              <Link href="/account/returns">
                <Button>View Your Returns</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href={`/account/orders/${orderId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Return Items</h1>
        </div>

        <div className="text-sm text-gray-500 flex items-center space-x-1">
          <ShoppingBag className="h-4 w-4" />
          <span>Order #{order.orderNumber}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Items to Return</CardTitle>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-3">Order Items</h3>

                {order.items.filter(
                  item =>
                    order.status === "DELIVERED" &&
                    item.returnStatus === "NONE" &&
                    !item.isDigital
                ).length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    No items eligible for return.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="orderItemIds"
                      render={({ field }) => (
                        <FormItem>
                          <div className="space-y-3">
                            {order.items
                              .filter(
                                item =>
                                  order.status === "DELIVERED" &&
                                  item.returnStatus === "NONE" &&
                                  !item.isDigital
                              )
                              .map(item => {
                                const disabled =
                                  order.status !== "DELIVERED" ||
                                  item.returnStatus !== "NONE" ||
                                  item.isDigital;
                                return (
                                  <div
                                    key={item.id}
                                    className={`flex p-4 border rounded-lg ${field.value.includes(item.id) ? "border-primary bg-primary/5" : "border-gray-200"} ${disabled ? "opacity-50 pointer-events-none" : ""}`}
                                  >
                                    <FormControl>
                                      <input
                                        type="checkbox"
                                        className="hidden"
                                        checked={field.value.includes(item.id)}
                                        onChange={e => {
                                          if (e.target.checked) {
                                            field.onChange([
                                              ...field.value,
                                              item.id,
                                            ]);
                                          } else {
                                            field.onChange(
                                              field.value.filter(
                                                id => id !== item.id
                                              )
                                            );
                                          }
                                        }}
                                        disabled={disabled}
                                      />
                                    </FormControl>

                                    <div
                                      className={`flex flex-1 items-center space-x-4 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                                      onClick={() => {
                                        // Prevent interaction with disabled items
                                        if (disabled) return;
                                        
                                        if (field.value.includes(item.id)) {
                                          field.onChange(
                                            field.value.filter(
                                              id => id !== item.id
                                            )
                                          );
                                        } else {
                                          field.onChange([
                                            ...field.value,
                                            item.id,
                                          ]);
                                        }
                                      }}
                                    >
                                      {item.product.images?.[0] && (
                                        <div className="relative h-16 w-16 rounded overflow-hidden">
                                          <Image
                                            src={item.product.images[0]}
                                            alt={item.name}
                                            className="object-cover"
                                            fill
                                          />
                                        </div>
                                      )}

                                      <div className="flex-1">
                                        <h4 className="font-medium">
                                          {item.name}
                                        </h4>
                                        <div className="text-sm text-gray-500 mt-1">
                                          Quantity: {item.quantity} ·{" "}
                                          {formatPrice(item.price)}
                                        </div>
                                        {item.returnStatus !== "NONE" && (
                                          <div className="mt-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                              Return {item.returnStatus.toLowerCase()}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      <div
                                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${field.value.includes(item.id) ? "border-primary bg-primary" : "border-gray-300"}`}
                                      >
                                        {field.value.includes(item.id) && (
                                          <Check className="h-3 w-3 text-white" />
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for return</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(reasonLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch("reason") === "OTHER" && (
                <FormField
                  control={form.control}
                  name="details"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Please explain the reason for your return
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Tell us more about why you're returning this item..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Photo Upload Section - ALWAYS Required for claims */}
              {photosRequired && (
                <FormField
                  control={form.control}
                  name="photos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Photos <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="text-sm text-gray-600">
                            Please upload photos/videos showing the issue (missing parts, defects, or damage-in-transit). At least one photo is required. 
                            This helps us process your return quickly.
                          </div>
                          
                          {/* Upload Button */}
                          {photos.length < 5 && (
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                              <UploadButton<OurFileRouter, "returnPhoto">
                                endpoint="returnPhoto"
                                onClientUploadComplete={(res) => {
                                  if (res) {
                                    const uploadedUrls = res.map((file: any) => file.fileUrl || file.url);
                                    field.onChange([...field.value, ...uploadedUrls]);
                                    setUploadingPhotos(false);
                                  }
                                }}
                                onUploadError={(error) => {
                                  console.error("Upload error:", error);
                                  setUploadingPhotos(false);
                                  toast({
                                    title: "Upload failed",
                                    description: error.message,
                                    variant: "destructive",
                                  });
                                }}
                                onUploadBegin={() => {
                                  setUploadingPhotos(true);
                                }}
                                className="ut-button:bg-primary ut-button:hover:bg-primary/90 ut-button:text-white"
                              />
                            </div>
                          )}

                          {/* Display uploaded photos */}
                          {photos.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {photos.map((photoUrl, index) => (
                                <div key={index} className="relative group">
                                  <div className="relative aspect-square rounded-lg overflow-hidden border">
                                    <Image
                                      src={photoUrl}
                                      alt={`Return photo ${index + 1}`}
                                      fill
                                      className="object-cover"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const newPhotos = photos.filter((_, i) => i !== index);
                                        field.onChange(newPhotos);
                                      }}
                                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <X className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {uploadingPhotos && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Uploading photos...
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </CardContent>

            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                type="button"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Submit Return Request"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
