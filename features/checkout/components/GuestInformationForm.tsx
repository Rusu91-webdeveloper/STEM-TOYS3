"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  Mail,
  User,
  Shield,
  ArrowRight,
  UserPlus,
  Lock,
  Info,
} from "lucide-react";
import { useSession } from "next-auth/react";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useTranslation } from "@/lib/i18n";


import { GuestInformation } from "../types";

const guestInformationSchema = z
  .object({
    email: z.string().email("Please enter a valid email address"),
    createAccount: z.boolean().optional(),
    password: z.string().optional(),
    marketingOptIn: z.boolean().optional(),
  })
  .refine(
    data => {
      if (data.createAccount && (!data.password || data.password.length < 6)) {
        return false;
      }
      return true;
    },
    {
      message:
        "Password must be at least 6 characters long when creating an account",
      path: ["password"],
    }
  );

type GuestInformationFormData = z.infer<typeof guestInformationSchema>;

interface GuestInformationFormProps {
  initialData?: GuestInformation;
  onSubmit: (data: GuestInformation) => void;
  onLoginRedirect: () => void;
}

export function GuestInformationForm({
  initialData,
  onSubmit,
  onLoginRedirect,
}: GuestInformationFormProps) {
  const { t } = useTranslation();
  const { data: session } = useSession();
  const [showPasswordField, setShowPasswordField] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GuestInformationFormData>({
    resolver: zodResolver(guestInformationSchema),
    defaultValues: {
      email: initialData?.email || "",
      createAccount: initialData?.createAccount || false,
      password: initialData?.password || "",
      marketingOptIn: initialData?.marketingOptIn || false,
    },
  });

  const watchCreateAccount = watch("createAccount");

  // Handle create account checkbox change
  const handleCreateAccountChange = (checked: boolean) => {
    setValue("createAccount", checked);
    setShowPasswordField(checked);
    if (!checked) {
      setValue("password", "");
    }
  };

  const handleFormSubmit = (data: GuestInformationFormData) => {
    const guestInfo: GuestInformation = {
      email: data.email,
      createAccount: data.createAccount,
      password: data.createAccount ? data.password : undefined,
      marketingOptIn: data.marketingOptIn,
    };

    onSubmit(guestInfo);
  };

  // If user is already authenticated, skip this step
  if (session?.user) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Continue as Guest
        </h2>
        <p className="text-gray-600">
          Enter your email to proceed with checkout, or login to your account
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guest Checkout Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-600" />
              Guest Checkout
            </CardTitle>
            <CardDescription>
              Quick checkout without creating an account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit(handleFormSubmit)}
              className="space-y-4"
            >
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  {...register("email")}
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              {/* Create Account Option */}
              <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="createAccount"
                    checked={watchCreateAccount}
                    onCheckedChange={handleCreateAccountChange}
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="createAccount"
                      className="text-sm font-medium"
                    >
                      Create an account for faster future checkouts
                    </Label>
                    <p className="text-xs text-gray-600">
                      Save your information and track your orders easily
                    </p>
                  </div>
                </div>

                {/* Password Field (conditional) */}
                {showPasswordField && (
                  <div className="space-y-2 ml-6">
                    <Label htmlFor="password">Choose a Password *</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 6 characters"
                      {...register("password")}
                      className={errors.password ? "border-red-500" : ""}
                    />
                    {errors.password && (
                      <p className="text-sm text-red-600">
                        {errors.password.message}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Marketing Opt-in */}
              <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <Checkbox id="marketingOptIn" {...register("marketingOptIn")} />
                <div className="space-y-1">
                  <Label htmlFor="marketingOptIn" className="text-sm">
                    Send me updates about new products and special offers
                  </Label>
                  <p className="text-xs text-gray-500">
                    You can unsubscribe at any time
                  </p>
                </div>
              </div>

              {/* Security Notice */}
              <Alert className="border-green-200 bg-green-50">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800 text-sm">
                  Your information is secure and will only be used to process
                  your order
                </AlertDescription>
              </Alert>

              {/* Submit Button */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>Processing...</>
                ) : (
                  <>
                    Continue to Shipping
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Existing Account Login */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-green-600" />
              Returning Customer
            </CardTitle>
            <CardDescription>
              Already have an account? Sign in for a faster checkout
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>Saved addresses and payment methods</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <UserPlus className="w-4 h-4" />
                <span>Order history and tracking</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Lock className="w-4 h-4" />
                <span>Enhanced account security</span>
              </div>
            </div>

            <Separator />

            <Button
              variant="outline"
              className="w-full"
              onClick={onLoginRedirect}
            >
              Sign In to Your Account
            </Button>

            <p className="text-xs text-center text-gray-500">
              Don't have an account? You can create one during checkout
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Benefits Section */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
        <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-600" />
          Why provide your email?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <strong>Order Confirmation:</strong> We'll send you a receipt and
            tracking information
          </div>
          <div>
            <strong>Order Updates:</strong> Get notified about shipping status
            and delivery
          </div>
          <div>
            <strong>Customer Support:</strong> We can assist you with any
            order-related questions
          </div>
        </div>
      </div>
    </div>
  );
}
