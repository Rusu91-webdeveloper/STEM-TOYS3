"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MapPin, Edit, Trash } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";

interface Address {
  id: string;
  name: string;
  fullName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
}

export function AddressList() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAddresses() {
      try {
        const response = await fetch("/api/account/addresses");

        if (!response.ok) {
          throw new Error("Failed to fetch addresses");
        }

        const data = await response.json();
        setAddresses(data);
      } catch (error) {
        console.error("Error fetching addresses:", error);
        setError("Could not load addresses. Please try again.");
        toast({
          title: "Error",
          description: "Failed to load addresses",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchAddresses();
  }, []);

  const handleSetDefault = async (id: string) => {
    try {
      // Find the address to update
      const address = addresses.find((a) => a.id === id);
      if (!address) return;

      // Update the address with isDefault = true
      const response = await fetch(`/api/account/addresses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...address, isDefault: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to update default address");
      }

      // Update local state
      setAddresses(
        addresses.map((address) => ({
          ...address,
          isDefault: address.id === id,
        }))
      );

      toast({
        title: "Default address updated",
        description: "Your default address has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating default address:", error);
      toast({
        title: "Error",
        description: "Failed to update default address",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/account/addresses/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete address");
      }

      // Update local state
      setAddresses(addresses.filter((address) => address.id !== id));
      setAddressToDelete(null);

      toast({
        title: "Address deleted",
        description: "Your address has been deleted successfully.",
      });

      // Refresh the page to update any other components
      router.refresh();
    } catch (error) {
      console.error("Error deleting address:", error);
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2].map((i) => (
          <Card
            key={i}
            className="relative">
            <CardHeader>
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 border rounded-lg">
        <MapPin className="h-10 w-10 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">Error loading addresses</h3>
        <p className="text-gray-500 mb-6">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div className="text-center py-10 border rounded-lg">
        <MapPin className="h-10 w-10 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium mb-2">No addresses found</h3>
        <p className="text-gray-500 mb-6">
          You haven't added any addresses to your account yet.
        </p>
        <Button asChild>
          <Link href="/account/addresses/new">Add Your First Address</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
      {addresses.map((address) => (
        <Card
          key={address.id}
          className="relative">
          {address.isDefault && (
            <Badge className="absolute top-4 right-4 bg-green-500 hover:bg-green-600">
              Default
            </Badge>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {address.name}
            </CardTitle>
            <CardDescription>{address.fullName}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-1">
              <p>{address.addressLine1}</p>
              {address.addressLine2 && <p>{address.addressLine2}</p>}
              <p>
                {address.city}, {address.state} {address.postalCode}
              </p>
              <p>{address.country}</p>
              <p className="pt-2">{address.phone}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-2 pt-0">
            <Button
              variant="outline"
              asChild
              className="w-full sm:w-auto">
              <Link href={`/account/addresses/${address.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>

            {!address.isDefault && (
              <Button
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => handleSetDefault(address.id)}>
                Set as Default
              </Button>
            )}

            <AlertDialog
              open={addressToDelete === address.id}
              onOpenChange={(open) => !open && setAddressToDelete(null)}>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-red-500 hover:text-red-600"
                  onClick={() => setAddressToDelete(address.id)}>
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete this address from your account.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(address.id)}
                    className="bg-red-500 hover:bg-red-600">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
