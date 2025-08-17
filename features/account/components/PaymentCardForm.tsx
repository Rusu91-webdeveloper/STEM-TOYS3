"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreditCard,
  ShieldCheck,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

// Luhn algorithm for credit card validation
const validateLuhn = (cardNumber: string): boolean => {
  const cleanNumber = cardNumber.replace(/\D/g, "");

  if (cleanNumber.length < 13 || cleanNumber.length > 19) {
    return false;
  }

  let sum = 0;
  let double = false;

  // Start from the rightmost digit
  for (let i = cleanNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(cleanNumber.charAt(i), 10);

    if (double) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    double = !double;
  }

  return sum % 10 === 0;
};

// Credit card validation schema
const cardSchema = z.object({
  cardholderName: z.string().min(1, "Cardholder name is required"),
  cardNumber: z
    .string()
    .min(13, "Card number must be at least 13 digits")
    .max(19, "Card number must be at most 19 digits")
    .regex(/^[0-9]+$/, "Card number must only contain digits")
    .refine(validateLuhn, "Invalid card number - please check the number"),
  expiryMonth: z.string().regex(/^(0[1-9]|1[0-2])$/, "Invalid expiry month"),
  expiryYear: z
    .string()
    .regex(/^\d{2}$/, "Invalid expiry year")
    .refine(
      year => {
        const currentYear = new Date().getFullYear() % 100;
        return parseInt(year, 10) >= currentYear;
      },
      {
        message: "Expiry year must be in the future",
      }
    ),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
  isDefault: z.boolean().default(false),
  billingAddressId: z.string().optional(),
});

// Schema with additional checks for expiry date
const paymentCardSchema = cardSchema.refine(
  data => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear() % 100;
    const currentMonth = currentDate.getMonth() + 1;
    const expiryYear = parseInt(data.expiryYear, 10);
    const expiryMonth = parseInt(data.expiryMonth, 10);

    // If the card expires this year, make sure the month is in the future
    if (expiryYear === currentYear && expiryMonth < currentMonth) {
      return false;
    }
    return true;
  },
  {
    message: "Card has expired",
    path: ["expiryMonth"],
  }
);

type PaymentCardFormValues = z.infer<typeof paymentCardSchema>;

interface PaymentCardFormProps {
  initialData?: Partial<PaymentCardFormValues>;
  isEditing?: boolean;
  cardId?: string;
  addresses?: Array<{ id: string; name: string }>;
}

export function PaymentCardForm({
  initialData,
  isEditing = false,
  cardId,
  addresses = [],
}: PaymentCardFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [cardNumberInput, setCardNumberInput] = useState(
    initialData?.cardNumber || ""
  );
  const [cardType, setCardType] = useState<string | null>(null);
  const [isCardValid, setIsCardValid] = useState<boolean | null>(null);
  const [isExpired, setIsExpired] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    control,
    trigger,
  } = useForm<PaymentCardFormValues>({
    resolver: zodResolver(paymentCardSchema) as any,
    defaultValues: {
      cardholderName: initialData?.cardholderName || "",
      cardNumber: initialData?.cardNumber || "",
      expiryMonth: initialData?.expiryMonth || "",
      expiryYear: initialData?.expiryYear || "",
      cvv: initialData?.cvv || "",
      isDefault: initialData?.isDefault || false,
      billingAddressId: initialData?.billingAddressId || "none",
    },
  });

  // Watch for changes to expiry date fields
  const expiryMonth = watch("expiryMonth");
  const expiryYear = watch("expiryYear");

  // Check expiry date whenever month or year changes
  useEffect(() => {
    if (expiryMonth && expiryYear) {
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear() % 100;
      const currentMonth = currentDate.getMonth() + 1;
      const expMonth = parseInt(expiryMonth, 10);
      const expYear = parseInt(expiryYear, 10);

      setIsExpired(
        expYear < currentYear ||
          (expYear === currentYear && expMonth < currentMonth)
      );

      // Trigger validation
      trigger(["expiryMonth", "expiryYear"]);
    }
  }, [expiryMonth, expiryYear, trigger]);

  // Function to detect card type from number
  useEffect(() => {
    const detectCardType = (number: string) => {
      const cleanNumber = number.replace(/\D/g, "");

      if (/^4/.test(cleanNumber)) return "visa";
      if (/^5[1-5]/.test(cleanNumber)) return "mastercard";
      if (/^3[47]/.test(cleanNumber)) return "amex";
      if (/^6(?:011|5)/.test(cleanNumber)) return "discover";

      return null;
    };

    // Validate card number
    const cleanNumber = cardNumberInput.replace(/\D/g, "");
    if (cleanNumber.length >= 13) {
      setIsCardValid(validateLuhn(cleanNumber));
    } else {
      setIsCardValid(null);
    }

    setCardType(detectCardType(cardNumberInput));
  }, [cardNumberInput]);

  // Format card number as it's typed
  const formatCardNumber = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    let formattedValue = "";

    // Format based on card type
    if (cardType === "amex") {
      // AMEX: XXXX XXXXXX XXXXX
      for (let i = 0; i < cleanValue.length; i++) {
        if (i === 4 || i === 10) formattedValue += " ";
        formattedValue += cleanValue[i];
      }
    } else {
      // Others: XXXX XXXX XXXX XXXX
      for (let i = 0; i < cleanValue.length; i++) {
        if (i > 0 && i % 4 === 0) formattedValue += " ";
        formattedValue += cleanValue[i];
      }
    }

    return formattedValue;
  };

  // Handle card number input change
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedValue = formatCardNumber(value);
    setCardNumberInput(formattedValue);
    setValue("cardNumber", value.replace(/\D/g, "")); // Store only digits
    trigger("cardNumber"); // Trigger validation
  };

  const onSubmit = async (data: PaymentCardFormValues) => {
    setIsLoading(true);
    try {
      const endpoint = isEditing
        ? `/api/account/payment-cards/${cardId}`
        : "/api/account/payment-cards";

      const method = isEditing ? "PUT" : "POST";

      // Process the billingAddressId
      if (data.billingAddressId === "none") {
        data.billingAddressId = undefined;
      }

      // For editing, we don't need to send card number and CVV
      const payload = isEditing
        ? {
            cardholderName: data.cardholderName,
            expiryMonth: data.expiryMonth,
            expiryYear: data.expiryYear,
            isDefault: data.isDefault,
            billingAddressId: data.billingAddressId,
          }
        : data;

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save payment card");
      }

      toast({
        title: isEditing ? "Card updated" : "Card added",
        description: isEditing
          ? "Your payment card has been updated successfully."
          : "Your new payment card has been added successfully.",
      });

      // Redirect back to payment methods list
      router.push("/account/payment-methods");
      router.refresh();
    } catch (error) {
      console.error("Error saving payment card:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Generate month options (01-12)
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    return {
      value: month.toString().padStart(2, "0"),
      label: month.toString().padStart(2, "0"),
    };
  });

  // Generate year options (current year + 10 years)
  const currentYear = new Date().getFullYear() % 100;
  const yearOptions = Array.from({ length: 11 }, (_, i) => {
    const year = currentYear + i;
    return {
      value: year.toString().padStart(2, "0"),
      label: year.toString().padStart(2, "0"),
    };
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <Label htmlFor="cardholderName">Cardholder Name</Label>
        <Input
          id="cardholderName"
          placeholder="John Doe"
          {...register("cardholderName")}
          className={errors.cardholderName ? "border-red-500" : ""}
        />
        {errors.cardholderName && (
          <p className="text-sm text-red-500 mt-1">
            {errors.cardholderName.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="cardNumber">
          <div className="flex items-center">
            <span>Card Number</span>
            {cardType && (
              <span className="ml-2 flex items-center">
                <div
                  className={`
                    text-xs px-1.5 font-bold text-white rounded
                    ${cardType === "visa" ? "bg-blue-500" : ""}
                    ${cardType === "mastercard" ? "bg-red-500" : ""}
                    ${cardType === "amex" ? "bg-blue-700" : ""}
                    ${cardType === "discover" ? "bg-orange-500" : ""}
                  `}
                >
                  {cardType === "visa" && "VISA"}
                  {cardType === "mastercard" && "MC"}
                  {cardType === "amex" && "AMEX"}
                  {cardType === "discover" && "DISC"}
                </div>
              </span>
            )}
          </div>
        </Label>
        <div className="relative">
          <Input
            id="cardNumber"
            placeholder="XXXX XXXX XXXX XXXX"
            value={cardNumberInput}
            onChange={handleCardNumberChange}
            className={`${errors.cardNumber ? "border-red-500" : ""} ${
              isCardValid === true && !errors.cardNumber
                ? "border-green-500"
                : ""
            } pr-10`}
            disabled={isEditing} // Card number can't be edited
          />
          {isCardValid !== null && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {isCardValid ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
          )}
        </div>
        {errors.cardNumber && (
          <p className="text-sm text-red-500 mt-1">
            {errors.cardNumber.message}
          </p>
        )}
        {cardType === null && cardNumberInput.length > 0 && (
          <p className="text-sm text-amber-600 mt-1">
            Card type not recognized. Please check the number.
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="expiryDate">Expiry Date</Label>
          <div className="flex space-x-2">
            <Select
              onValueChange={value => setValue("expiryMonth", value)}
              defaultValue={watch("expiryMonth")}
            >
              <SelectTrigger
                className={`${errors.expiryMonth || isExpired ? "border-red-500" : ""} bg-white`}
              >
                <SelectValue placeholder="MM" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {monthOptions.map(month => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={value => setValue("expiryYear", value)}
              defaultValue={watch("expiryYear")}
            >
              <SelectTrigger
                className={`${errors.expiryYear || isExpired ? "border-red-500" : ""} bg-white`}
              >
                <SelectValue placeholder="YY" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                {yearOptions.map(year => (
                  <SelectItem key={year.value} value={year.value}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {(errors.expiryMonth || errors.expiryYear || isExpired) && (
            <p className="text-sm text-red-500 mt-1">
              {errors.expiryMonth?.message ||
                errors.expiryYear?.message ||
                "Card has expired"}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="cvv">CVV</Label>
          <div className="relative">
            <Input
              id="cvv"
              placeholder={cardType === "amex" ? "4 digits" : "3 digits"}
              {...register("cvv")}
              className={`${errors.cvv ? "border-red-500" : ""} bg-white`}
              type="password"
              disabled={isEditing} // CVV can't be edited
              maxLength={cardType === "amex" ? 4 : 3}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          {errors.cvv && (
            <p className="text-sm text-red-500 mt-1">{errors.cvv.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            {cardType === "amex"
              ? "4 digits on the front"
              : "3 digits on the back of your card"}
          </p>
        </div>
      </div>

      {addresses.length > 0 && (
        <div>
          <Label htmlFor="billingAddressId">Billing Address</Label>
          <Select
            onValueChange={value => setValue("billingAddressId", value)}
            defaultValue={watch("billingAddressId") || "none"}
          >
            <SelectTrigger className="bg-white">
              <SelectValue placeholder="Select a billing address" />
            </SelectTrigger>
            <SelectContent className="bg-white">
              <SelectItem value="none">None</SelectItem>
              {addresses.map(address => (
                <SelectItem key={address.id} value={address.id}>
                  {address.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox
          id="isDefault"
          checked={watch("isDefault")}
          onCheckedChange={checked => setValue("isDefault", checked as boolean)}
        />
        <Label htmlFor="isDefault" className="text-sm font-medium">
          Set as default payment method
        </Label>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2 bg-gray-50 p-4 rounded-lg">
        <ShieldCheck className="h-5 w-5 text-green-600" />
        <p>
          Your payment information is encrypted and stored securely. We never
          store complete card details on our servers.
        </p>
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/account/payment-methods")}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || isCardValid === false || isExpired}
        >
          {isLoading ? "Saving..." : isEditing ? "Update Card" : "Add Card"}
        </Button>
      </div>
    </form>
  );
}
