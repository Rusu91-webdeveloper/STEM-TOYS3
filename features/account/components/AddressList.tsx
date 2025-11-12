"use client";

import { MapPin, Edit, Trash } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

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
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  glassCardClass,
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

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
      const address = addresses.find(a => a.id === id);
      if (!address) return;

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

      setAddresses(prev =>
        prev.map(addr => ({
          ...addr,
          isDefault: addr.id === id,
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

      setAddresses(prev => prev.filter(address => address.id !== id));
      setAddressToDelete(null);

      toast({
        title: "Address deleted",
        description: "Your address has been deleted successfully.",
      });

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
      <div className="grid gap-6 text-slate-100 md:grid-cols-2">
        {[1, 2].map(i => (
          <Card
            key={i}
            className={cn(
              glassCardClass,
              "border-white/10 bg-slate-900/60 p-0 shadow-lg shadow-black/30"
            )}
          >
            <CardHeader className="space-y-2">
              <Skeleton className="h-6 w-32 rounded bg-white/10" />
              <Skeleton className="h-4 w-24 rounded bg-white/10" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-4 w-full rounded bg-white/10" />
              <Skeleton className="h-4 w-3/4 rounded bg-white/10" />
              <Skeleton className="h-4 w-1/2 rounded bg-white/10" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full rounded bg-white/10" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          glassPanelClass,
          "space-y-4 rounded-3xl border-white/10 bg-slate-900/70 p-10 text-center text-slate-100 shadow-xl shadow-black/30"
        )}
      >
        <MapPin className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="text-lg font-semibold">Error loading addresses</h3>
        <p className="text-slate-300">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          className={cn(
            "mx-auto inline-flex min-w-[200px] justify-center transition hover:scale-[1.02]",
            gradientButtonClass
          )}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (addresses.length === 0) {
    return (
      <div
        className={cn(
          glassPanelClass,
          "space-y-4 rounded-3xl border-white/10 bg-slate-900/70 p-10 text-center text-slate-100 shadow-xl shadow-black/30"
        )}
      >
        <MapPin className="mx-auto h-10 w-10 text-slate-400" />
        <h3 className="text-lg font-semibold">No addresses found</h3>
        <p className="text-slate-300">
          You haven't added any addresses to your account yet.
        </p>
        <Button
          asChild
          className={cn(
            "mx-auto inline-flex min-w-[200px] justify-center transition hover:scale-[1.02]",
            gradientButtonClass
          )}
        >
          <Link href="/account/addresses/new">Add Your First Address</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 text-slate-100 md:grid-cols-2">
      {addresses.map(address => (
        <Card
          key={address.id}
          className={cn(
            glassCardClass,
            "relative border-white/10 bg-slate-900/60 shadow-lg shadow-black/30"
          )}
        >
          {address.isDefault && (
            <Badge className="absolute right-5 top-5 border border-emerald-400/40 bg-emerald-500/20 text-emerald-100">
              Default
            </Badge>
          )}
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-100">
              <MapPin className="h-4 w-4 text-sky-300" />
              {address.name}
            </CardTitle>
            <CardDescription className="text-slate-300">
              {address.fullName}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm text-slate-200">
              <p>{address.addressLine1}</p>
              {address.addressLine2 && <p>{address.addressLine2}</p>}
              <p>
                {address.city}, {address.state} {address.postalCode}
              </p>
              <p>{address.country}</p>
              <p className="pt-2 text-slate-300">{address.phone}</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2 pt-0 sm:flex-row">
            <Button
              variant="outline"
              asChild
              className="w-full border-white/20 bg-white/10 text-slate-100 transition hover:border-white/30 hover:bg-white/15 sm:w-auto"
            >
              <Link href={`/account/addresses/${address.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>

            {!address.isDefault && (
              <Button
                variant="outline"
                className="w-full border-sky-400/40 bg-sky-500/20 text-sky-100 transition hover:border-sky-400/60 hover:bg-sky-500/25 sm:w-auto"
                onClick={() => handleSetDefault(address.id)}
              >
                Set as Default
              </Button>
            )}

            <AlertDialog
              open={addressToDelete === address.id}
              onOpenChange={open => !open && setAddressToDelete(null)}
            >
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full border-rose-400/40 bg-rose-500/15 text-rose-200 transition hover:border-rose-400/60 hover:bg-rose-500/25 sm:w-auto"
                  onClick={() => setAddressToDelete(address.id)}
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-white/15 bg-slate-900/85 text-slate-100 backdrop-blur">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-300">
                    This will permanently delete this address from your account.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-white/20 bg-white/10 text-slate-100 hover:border-white/30 hover:bg-white/15">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleDelete(address.id)}
                    className="bg-rose-500 text-white hover:bg-rose-600"
                  >
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
