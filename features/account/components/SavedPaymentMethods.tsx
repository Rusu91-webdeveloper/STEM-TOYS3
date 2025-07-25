"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreditCard,
  Plus,
  Trash2,
  Edit3,
  Shield,
  AlertCircle,
  CheckCircle,
  Star,
  StarOff,
  Calendar,
  User,
  MapPin,
  Loader2,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";


interface PaymentCard {
  id: string;
  cardType: string;
  lastFourDigits: string;
  expiryMonth: string;
  expiryYear: string;
  cardholderName: string;
  isDefault: boolean;
  billingAddressId?: string;
  createdAt: string;
  updatedAt: string;
}

const addCardSchema = z.object({
  cardholderName: z.string().min(1, "Cardholder name is required"),
  cardNumber: z
    .string()
    .min(13, "Card number is invalid")
    .max(19, "Card number is invalid"),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, "Invalid expiry month"),
  expiryYear: z.string().regex(/^\d{2}$/, "Invalid expiry year"),
  cvv: z.string().regex(/^\d{3,4}$/, "Invalid CVV code"),
  isDefault: z.boolean().default(false),
});

type AddCardFormData = z.infer<typeof addCardSchema>;

export function SavedPaymentMethods() {
  const [cards, setCards] = useState<PaymentCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AddCardFormData>({
    resolver: zodResolver(addCardSchema) as any,
  });

  // Load saved payment cards
  useEffect(() => {
    fetchCards();
  }, []);

  const fetchCards = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/account/payment-cards");
      if (response.ok) {
        const data = await response.json();
        setCards(data);
      } else {
        throw new Error("Failed to fetch payment cards");
      }
    } catch (err) {
      setError("Failed to load payment cards");
      console.error("Error fetching cards:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digit characters
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");

    // Add spaces every 4 digits
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(" ");
    } 
      return v;
    
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setValue("cardNumber", formatted.replace(/\s/g, ""));
    e.target.value = formatted;
  };

  const getCardIcon = (cardType: string) => {
    switch (cardType.toLowerCase()) {
      case "visa":
        return (
          <div className="bg-blue-500 text-white font-bold text-xs px-2 py-1 rounded">
            VISA
          </div>
        );
      case "mastercard":
        return (
          <div className="bg-red-500 text-white font-bold text-xs px-2 py-1 rounded">
            MC
          </div>
        );
      case "amex":
        return (
          <div className="bg-blue-700 text-white font-bold text-xs px-2 py-1 rounded">
            AMEX
          </div>
        );
      case "discover":
        return (
          <div className="bg-orange-500 text-white font-bold text-xs px-2 py-1 rounded">
            DISC
          </div>
        );
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleAddCard = async (data: AddCardFormData) => {
    try {
      setIsAdding(true);
      setError(null);

      const response = await fetch("/api/account/payment-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSuccess("Payment card added successfully!");
        setShowAddDialog(false);
        reset();
        await fetchCards();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add payment card");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to add payment card"
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) {
      return;
    }

    try {
      setIsDeleting(cardId);
      setError(null);

      const response = await fetch(`/api/account/payment-cards/${cardId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setSuccess("Payment card deleted successfully!");
        await fetchCards();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete payment card");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete payment card"
      );
    } finally {
      setIsDeleting(null);
    }
  };

  const handleSetDefault = async (cardId: string) => {
    try {
      setIsUpdating(cardId);
      setError(null);

      const response = await fetch(`/api/account/payment-cards/${cardId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isDefault: true }),
      });

      if (response.ok) {
        setSuccess("Default payment method updated!");
        await fetchCards();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update payment card");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update payment card"
      );
    } finally {
      setIsUpdating(null);
    }
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
          <p className="text-gray-600 mt-1">
            Manage your saved payment cards for faster checkout
          </p>
        </div>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add New Card
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Payment Card</DialogTitle>
              <DialogDescription>
                Add a new payment method to your account for faster checkout
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(handleAddCard)} className="space-y-4">
              {/* Cardholder Name */}
              <div className="space-y-2">
                <Label htmlFor="cardholderName">Cardholder Name</Label>
                <Input
                  id="cardholderName"
                  placeholder="John Doe"
                  {...register("cardholderName")}
                  className={errors.cardholderName ? "border-red-500" : ""}
                />
                {errors.cardholderName && (
                  <p className="text-sm text-red-600">
                    {errors.cardholderName.message}
                  </p>
                )}
              </div>

              {/* Card Number */}
              <div className="space-y-2">
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  onChange={handleCardNumberChange}
                  maxLength={19}
                  className={errors.cardNumber ? "border-red-500" : ""}
                />
                {errors.cardNumber && (
                  <p className="text-sm text-red-600">
                    {errors.cardNumber.message}
                  </p>
                )}
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="expiryMonth">Month</Label>
                  <Input
                    id="expiryMonth"
                    placeholder="MM"
                    maxLength={2}
                    {...register("expiryMonth")}
                    className={errors.expiryMonth ? "border-red-500" : ""}
                  />
                  {errors.expiryMonth && (
                    <p className="text-xs text-red-600">
                      {errors.expiryMonth.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiryYear">Year</Label>
                  <Input
                    id="expiryYear"
                    placeholder="YY"
                    maxLength={2}
                    {...register("expiryYear")}
                    className={errors.expiryYear ? "border-red-500" : ""}
                  />
                  {errors.expiryYear && (
                    <p className="text-xs text-red-600">
                      {errors.expiryYear.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    maxLength={4}
                    {...register("cvv")}
                    className={errors.cvv ? "border-red-500" : ""}
                  />
                  {errors.cvv && (
                    <p className="text-xs text-red-600">{errors.cvv.message}</p>
                  )}
                </div>
              </div>

              {/* Set as Default */}
              <div className="flex items-center space-x-2">
                <Checkbox id="isDefault" {...register("isDefault")} />
                <Label htmlFor="isDefault" className="text-sm">
                  Set as default payment method
                </Label>
              </div>

              {/* Security Notice */}
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your payment information is encrypted and stored securely. We
                  never store your CVV.
                </AlertDescription>
              </Alert>

              {/* Buttons */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddDialog(false)}
                  disabled={isAdding}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isAdding}>
                  {isAdding ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Card"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerts */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            {success}
          </AlertDescription>
        </Alert>
      )}

      {/* Cards List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      ) : cards.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Payment Methods
              </h3>
              <p className="text-gray-600 mb-6">
                Add a payment method to speed up your checkout process
              </p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Card
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cards.map(card => (
            <Card
              key={card.id}
              className={card.isDefault ? "border-blue-200 bg-blue-50" : ""}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {/* Card Icon */}
                    <div className="w-12 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      {getCardIcon(card.cardType)}
                    </div>

                    {/* Card Details */}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          •••• •••• •••• {card.lastFourDigits}
                        </span>
                        {card.isDefault && (
                          <Badge className="bg-blue-100 text-blue-800">
                            <Star className="w-3 h-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                        <span className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {card.cardholderName}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 mr-1" />
                          Expires {card.expiryMonth}/{card.expiryYear}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    {!card.isDefault && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(card.id)}
                        disabled={isUpdating === card.id}
                      >
                        {isUpdating === card.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <>
                            <StarOff className="w-3 h-3 mr-1" />
                            Set Default
                          </>
                        )}
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCard(card.id)}
                      disabled={isDeleting === card.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      {isDeleting === card.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="w-3 h-3 mr-1" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Security Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-base flex items-center text-blue-900">
            <Shield className="w-4 h-4 mr-2" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800">
          <ul className="space-y-2">
            <li>• Your payment information is encrypted and stored securely</li>
            <li>• We never store your CVV or full card numbers</li>
            <li>
              • All transactions are processed through secure payment gateways
            </li>
            <li>• You can delete your payment methods at any time</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
