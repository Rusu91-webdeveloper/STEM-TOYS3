"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, ArrowLeft, ShoppingBag, Check, X } from "lucide-react";
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
import {
  RETURN_POLICY_COURIER_PAYS_RO,
  RETURN_PHOTO_LIMIT,
  RETURN_POLICY_CUSTOMER_PAYS_RO,
  RETURN_POLICY_EVIDENCE_RO,
  RETURN_POLICY_SELLER_PAYS_RO,
  RETURN_REASON_HELP_TEXT_RO,
  RETURN_REASON_LABELS_RO,
  RETURN_RESPONSIBILITY_LABELS_RO,
  RETURN_REASON_VALUES,
  RETURN_WINDOW_LABEL_RO,
  getResponsibilityForReturnReason,
  isWithinReturnWindowForOrder,
} from "@/lib/returns/policy";

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
    .min(1, "Selectează cel puțin un produs pentru retur"),
  reason: z.enum(
    RETURN_REASON_VALUES,
    {
      required_error: "Te rugăm să selectezi motivul returului",
    }
  ),
  details: z.string().optional(),
  photos: z.array(z.string()).min(1, "Încarcă cel puțin o fotografie"),
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
    message:
      "Fotografiile sunt obligatorii pentru această cerere. Încarcă cel puțin o fotografie clară.",
    path: ["photos"],
  }
);

type ReturnFormValues = z.infer<typeof returnSchema>;

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
  const selectedResponsibility = selectedReason
    ? getResponsibilityForReturnReason(selectedReason)
    : null;
  const selectedReasonHelp = selectedReason
    ? RETURN_REASON_HELP_TEXT_RO[selectedReason]
    : null;
  
  // Photos are required for every return request to keep supplier evidence together.
  const photosRequired = true;

  const isWithin14Days = (currentOrder: Order) =>
    currentOrder.status === "DELIVERED" &&
    isWithinReturnWindowForOrder({
      createdAt: currentOrder.createdAt,
      deliveredAt: currentOrder.deliveredAt,
    });

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
            title: "Perioada de retur a expirat",
            description:
              `Produsele pot fi returnate doar în primele ${RETURN_WINDOW_LABEL_RO} de la livrare.`,
            variant: "destructive",
          });
          router.push(`/account/orders/${orderId}`);
        }
      } catch (error) {
        console.error("Error fetching order:", error);
        toast({
          title: "Eroare",
          description:
            "Nu am putut încărca detaliile comenzii. Încearcă din nou puțin mai târziu.",
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
        throw new Error(data.error || "Nu am putut trimite cererea de retur.");
      }

      setSubmitted(true);
      toast({
        title: "Cererea de retur a fost trimisă",
        description: `Am salvat cererea pentru ${values.orderItemIds.length} produs(e), împreună cu fotografiile încărcate.`,
      });

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/account/returns");
      }, 2000);
    } catch (error) {
      console.error("Error submitting returns:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Nu am putut trimite cererea de retur.",
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
          <h3 className="text-lg font-medium mb-2">Comandă indisponibilă</h3>
          <p className="text-gray-500 mb-4">
            Nu am găsit comanda pe care încerci să o returnezi.
          </p>
          <Link href="/account/orders" className="text-primary hover:underline">
            Vezi toate comenzile
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
            <h2 className="text-2xl font-bold mb-2">Retur înregistrat</h2>
            <p className="text-gray-500 mb-4">
              Cererea ta de retur a fost înregistrată pentru toate produsele
              selectate. Ai la dispoziție {RETURN_WINDOW_LABEL_RO} de la
              livrare, iar fotografiile au fost salvate împreună cu cererea.
            </p>
            <div className="mt-6">
              <Link href="/account/returns">
                <Button>Vezi retururile tale</Button>
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
          <h1 className="text-2xl font-bold">Returnare produse</h1>
        </div>

        <div className="text-sm text-gray-500 flex items-center space-x-1">
          <ShoppingBag className="h-4 w-4" />
          <span>Comanda #{order.orderNumber}</span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selectează produsele pentru retur</CardTitle>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                <p>
                  Returul se poate solicita în primele <strong>{RETURN_WINDOW_LABEL_RO}</strong> de la livrare.
                </p>
                <p className="mt-1">
                  {selectedResponsibility === "SUPPLIER"
                    ? RETURN_POLICY_SELLER_PAYS_RO
                    : selectedResponsibility === "COURIER"
                      ? RETURN_POLICY_COURIER_PAYS_RO
                      : RETURN_POLICY_CUSTOMER_PAYS_RO}
                </p>
                <p className="mt-1">{RETURN_POLICY_EVIDENCE_RO}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-3">Produse din comandă</h3>

                {order.items.filter(
                  item =>
                    order.status === "DELIVERED" &&
                    item.returnStatus === "NONE" &&
                    !item.isDigital
                ).length === 0 ? (
                  <div className="text-sm text-muted-foreground">
                    Nu există produse eligibile pentru retur.
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
                                          Cantitate: {item.quantity} ·{" "}
                                          {formatPrice(item.price)}
                                        </div>
                                        {item.returnStatus !== "NONE" && (
                                          <div className="mt-2">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                              Retur {item.returnStatus.toLowerCase()}
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
                    <FormLabel>Motivul returului</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selectează un motiv" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(RETURN_REASON_LABELS_RO).map(([key, label]) => (
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

              {selectedReason && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                  <p>
                    <strong>Încadrare automată:</strong>{" "}
                    {RETURN_RESPONSIBILITY_LABELS_RO[selectedResponsibility || "UNDECIDED"]}
                  </p>
                  {selectedReasonHelp && <p className="mt-1">{selectedReasonHelp}</p>}
                </div>
              )}

              <FormField
                control={form.control}
                name="details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Explică pe scurt ce s-a întâmplat</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder={
                          selectedReason === "MISSING_PARTS"
                            ? "Spune-ne ce piese lipsesc din cutie."
                            : selectedReason === "WRONG_ITEM_SHIPPED"
                              ? "Spune-ne ce ai comandat și ce ai primit."
                              : selectedReason === "DAMAGED_IN_TRANSIT"
                                ? "Descrie starea cutiei și cum a fost afectat produsul."
                                : selectedReason === "DAMAGED_OR_DEFECTIVE"
                                  ? "Descrie defectul sau problema de funcționare."
                                  : "Descrie pe scurt motivul returului și starea produsului."
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Photo Upload Section - ALWAYS Required for claims */}
              {photosRequired && (
                <FormField
                  control={form.control}
                  name="photos"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Fotografii <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <div className="text-sm text-gray-600">
                            Încarcă fotografii clare cu produsul, ambalajul și problema semnalată. Cel puțin o fotografie este obligatorie.
                            Pozele se salvează cu cererea și ne ajută să documentăm cazul în relația cu furnizorul.
                          </div>
                          
                          {/* Upload Button */}
                          {photos.length < RETURN_PHOTO_LIMIT && (
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
                                    title: "Încărcarea a eșuat",
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
                              Se încarcă fotografiile...
                            </div>
                          )}

                          <p className="text-xs text-gray-500">
                            Imagini de până la 5MB, maximum {RETURN_PHOTO_LIMIT}.
                          </p>
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
                Anulează
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Se procesează...
                  </>
                ) : (
                  "Trimite cererea de retur"
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
