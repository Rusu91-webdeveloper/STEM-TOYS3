import React from "react";
import { AddressList } from "@/features/account/components/AddressList";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PlusCircle } from "lucide-react";

export const metadata = {
  title: "Address Book | My Account",
  description: "Manage your shipping and billing addresses",
};

export default function AddressesPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Address Book</h2>
          <p className="text-sm text-muted-foreground">
            Manage your shipping and billing addresses
          </p>
        </div>
        <Button asChild>
          <Link href="/account/addresses/new">
            <PlusCircle className="h-4 w-4 mr-2" />
            Add New Address
          </Link>
        </Button>
      </div>

      <AddressList />
    </div>
  );
}
