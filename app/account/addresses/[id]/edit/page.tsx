"use client";

import { useParams } from "next/navigation";
import React, { useEffect, useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { AddressForm } from "@/features/account/components/AddressForm";
import type { Address } from "@/types/address";

export default function EditAddressPage() {
  const params = useParams();
  const addressId = params.id as string;
  const [address, setAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAddress() {
      try {
        const response = await fetch(`/api/account/addresses/${addressId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch address");
        }

        const data = await response.json();
        setAddress(data);
      } catch (error) {
        console.error("Error fetching address:", error);
        setError("Could not load address. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load address details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAddress();
  }, [addressId]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="bg-card rounded-lg border p-6 space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Edit Address</h2>
          <p className="text-sm text-muted-foreground">
            Update your address information
          </p>
        </div>
        <div className="bg-red-50 text-red-800 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Edit Address</h2>
        <p className="text-sm text-muted-foreground">
          Update your address information
        </p>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <AddressForm
          initialData={address}
          isEditing={true}
          addressId={addressId}
        />
      </div>
    </div>
  );
}
