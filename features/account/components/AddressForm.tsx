"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
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
import { addressSchema } from "@/lib/validations";

// Romanian counties (județe)
const romanianCounties = [
  { code: "AB", name: "Alba" },
  { code: "AR", name: "Arad" },
  { code: "AG", name: "Argeș" },
  { code: "BC", name: "Bacău" },
  { code: "BH", name: "Bihor" },
  { code: "BN", name: "Bistrița-Năsăud" },
  { code: "BT", name: "Botoșani" },
  { code: "BV", name: "Brașov" },
  { code: "BR", name: "Brăila" },
  { code: "B", name: "București" },
  { code: "BZ", name: "Buzău" },
  { code: "CS", name: "Caraș-Severin" },
  { code: "CL", name: "Călărași" },
  { code: "CJ", name: "Cluj" },
  { code: "CT", name: "Constanța" },
  { code: "CV", name: "Covasna" },
  { code: "DB", name: "Dâmbovița" },
  { code: "DJ", name: "Dolj" },
  { code: "GL", name: "Galați" },
  { code: "GR", name: "Giurgiu" },
  { code: "GJ", name: "Gorj" },
  { code: "HR", name: "Harghita" },
  { code: "HD", name: "Hunedoara" },
  { code: "IL", name: "Ialomița" },
  { code: "IS", name: "Iași" },
  { code: "IF", name: "Ilfov" },
  { code: "MM", name: "Maramureș" },
  { code: "MH", name: "Mehedinți" },
  { code: "MS", name: "Mureș" },
  { code: "NT", name: "Neamț" },
  { code: "OT", name: "Olt" },
  { code: "PH", name: "Prahova" },
  { code: "SM", name: "Satu Mare" },
  { code: "SJ", name: "Sălaj" },
  { code: "SB", name: "Sibiu" },
  { code: "SV", name: "Suceava" },
  { code: "TR", name: "Teleorman" },
  { code: "TM", name: "Timiș" },
  { code: "TL", name: "Tulcea" },
  { code: "VS", name: "Vaslui" },
  { code: "VL", name: "Vâlcea" },
  { code: "VN", name: "Vrancea" },
];

// Major Romanian cities by county
const romanianCities = {
  B: ["București"],
  CJ: ["Cluj-Napoca", "Turda", "Câmpia Turzii", "Gherla", "Dej", "Huedin"],
  TM: ["Timișoara", "Lugoj", "Sânnicolau Mare", "Jimbolia", "Făget"],
  IS: ["Iași", "Pașcani", "Târgu Frumos", "Hârlău"],
  CT: ["Constanța", "Mangalia", "Medgidia", "Cernavodă", "Năvodari"],
  BV: ["Brașov", "Făgăraș", "Săcele", "Zărnești", "Codlea", "Râșnov"],
  // Add more cities for other counties as needed
};

// Extend the address schema to include the name field and isDefault
const extendedAddressSchema = addressSchema.extend({
  name: z.string().min(1, "Address nickname is required"),
  isDefault: z.boolean(),
});

type AddressFormValues = z.infer<typeof extendedAddressSchema>;

interface AddressFormProps {
  initialData?: Partial<AddressFormValues>;
  isEditing?: boolean;
  addressId?: string;
}

export function AddressForm({
  initialData,
  isEditing = false,
  addressId,
}: AddressFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCounty, setSelectedCounty] = useState<string>(
    initialData?.state || "B"
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AddressFormValues>({
    resolver: zodResolver(extendedAddressSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      fullName: initialData?.fullName ?? "",
      addressLine1: initialData?.addressLine1 ?? "",
      addressLine2: initialData?.addressLine2 ?? "",
      city: initialData?.city ?? "",
      state: initialData?.state ?? "B",
      postalCode: initialData?.postalCode ?? "",
      country: "RO", // Default to Romania and don't allow changes
      phone: initialData?.phone ?? "",
      isDefault: initialData?.isDefault ?? false,
    },
  });

  // Update available cities when county changes
  const handleCountyChange = (countyCode: string) => {
    setValue("state", countyCode);
    setSelectedCounty(countyCode);
    // Reset city when county changes
    setValue("city", "");
  };

  const onSubmit = async (data: AddressFormValues) => {
    setIsLoading(true);
    try {
      const endpoint = isEditing
        ? `/api/account/addresses/${addressId}`
        : "/api/account/addresses";

      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save address");
      }

      toast({
        title: isEditing ? "Address updated" : "Address added",
        description: isEditing
          ? "Your address has been updated successfully."
          : "Your new address has been added successfully.",
      });

      // Redirect back to addresses list
      router.push("/account/addresses");
      router.refresh();
    } catch (error) {
      console.error("Error saving address:", error);
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Address Nickname</Label>
          <Input
            id="name"
            placeholder="Acasă, Serviciu, etc."
            {...register("name")}
            className={errors.name ? "border-red-500" : ""}
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="fullName">Nume Complet</Label>
          <Input
            id="fullName"
            placeholder="Ion Popescu"
            {...register("fullName")}
            className={errors.fullName ? "border-red-500" : ""}
          />
          {errors.fullName && (
            <p className="text-sm text-red-500 mt-1">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="addressLine1">Adresa</Label>
          <Input
            id="addressLine1"
            placeholder="Strada Victoriei nr. 10"
            {...register("addressLine1")}
            className={errors.addressLine1 ? "border-red-500" : ""}
          />
          {errors.addressLine1 && (
            <p className="text-sm text-red-500 mt-1">
              {errors.addressLine1.message}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor="addressLine2">Detalii adresă (Opțional)</Label>
          <Input
            id="addressLine2"
            placeholder="Bloc, Scara, Etaj, Apartament"
            {...register("addressLine2")}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="state">Județ</Label>
            <Select
              defaultValue={watch("state")}
              onValueChange={handleCountyChange}
            >
              <SelectTrigger className={errors.state ? "border-red-500" : ""}>
                <SelectValue placeholder="Selectează județul" />
              </SelectTrigger>
              <SelectContent>
                {romanianCounties.map(county => (
                  <SelectItem key={county.code} value={county.code}>
                    {county.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.state && (
              <p className="text-sm text-red-500 mt-1">
                {errors.state.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="city">Oraș</Label>
            <Input
              id="city"
              placeholder="București"
              {...register("city")}
              className={errors.city ? "border-red-500" : ""}
            />
            {errors.city && (
              <p className="text-sm text-red-500 mt-1">{errors.city.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postalCode">Cod Poștal</Label>
            <Input
              id="postalCode"
              placeholder="010101"
              {...register("postalCode")}
              className={errors.postalCode ? "border-red-500" : ""}
            />
            {errors.postalCode && (
              <p className="text-sm text-red-500 mt-1">
                {errors.postalCode.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="country">Țara</Label>
            <Input
              id="country"
              value="România"
              disabled
              className="bg-gray-100"
            />
            <input type="hidden" value="RO" {...register("country")} />
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Număr de Telefon</Label>
          <Input
            id="phone"
            placeholder="0712 345 678"
            {...register("phone")}
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && (
            <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
          )}
        </div>

        <div className="flex items-center space-x-2 pt-4">
          <Checkbox
            id="isDefault"
            checked={watch("isDefault")}
            onCheckedChange={checked =>
              setValue("isDefault", checked as boolean)
            }
          />
          <Label htmlFor="isDefault" className="text-sm font-medium">
            Setează ca adresă implicită
          </Label>
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/account/addresses")}
          disabled={isLoading}
        >
          Anulează
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Se salvează..."
            : isEditing
              ? "Actualizează Adresa"
              : "Adaugă Adresa"}
        </Button>
      </div>
    </form>
  );
}
