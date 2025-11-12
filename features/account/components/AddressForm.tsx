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
import {
  glassPanelClass,
  gradientButtonClass,
} from "@/features/home/components/homeTheme";
import { toast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
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

const romanianCities = {
  B: ["București"],
  CJ: ["Cluj-Napoca", "Turda", "Câmpia Turzii", "Gherla", "Dej", "Huedin"],
  TM: ["Timișoara", "Lugoj", "Sânnicolau Mare", "Jimbolia", "Făget"],
  IS: ["Iași", "Pașcani", "Târgu Frumos", "Hârlău"],
  CT: ["Constanța", "Mangalia", "Medgidia", "Cernavodă", "Năvodari"],
  BV: ["Brașov", "Făgăraș", "Săcele", "Zărnești", "Codlea", "Râșnov"],
};

const extendedAddressSchema = addressSchema.extend({
  name: z.string().min(1, "Address nickname is required"),
  isDefault: z.boolean().default(false),
});

type AddressFormValues = z.infer<typeof extendedAddressSchema> & {
  isDefault: boolean;
};

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
    resolver: zodResolver(extendedAddressSchema) as any,
    defaultValues: {
      name: initialData?.name || "",
      fullName: initialData?.fullName || "",
      addressLine1: initialData?.addressLine1 || "",
      addressLine2: initialData?.addressLine2 || "",
      city: initialData?.city || "",
      state: initialData?.state || "B",
      postalCode: initialData?.postalCode || "",
      country: "RO",
      phone: initialData?.phone || "",
      isDefault: initialData?.isDefault ?? false,
    },
  });

  const handleCountyChange = (countyCode: string) => {
    setValue("state", countyCode);
    setSelectedCounty(countyCode);
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

  const renderError = (message?: string) =>
    message ? <p className="mt-1 text-sm text-rose-300">{message}</p> : null;

  const inputClasses = (hasError?: boolean) =>
    cn(
      "border border-white/15 bg-white/10 text-slate-100 placeholder:text-slate-400 transition-all focus:border-sky-400/60 focus:ring-sky-400/20",
      hasError && "border-rose-400"
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 text-slate-100">
      <div className={cn(glassPanelClass, "space-y-4 border-white/10 bg-slate-900/70 p-6 shadow-xl shadow-black/30")}
      >
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-slate-200">
            Address Nickname
          </Label>
          <Input
            id="name"
            placeholder="Acasă, Serviciu, etc."
            {...register("name")}
            className={inputClasses(!!errors.name)}
          />
          {renderError(errors.name?.message)}
        </div>

        <div>
          <Label htmlFor="fullName" className="text-sm font-medium text-slate-200">
            Nume Complet
          </Label>
          <Input
            id="fullName"
            placeholder="Ion Popescu"
            {...register("fullName")}
            className={inputClasses(!!errors.fullName)}
          />
          {renderError(errors.fullName?.message)}
        </div>

        <div>
          <Label htmlFor="addressLine1" className="text-sm font-medium text-slate-200">
            Adresa
          </Label>
          <Input
            id="addressLine1"
            placeholder="Strada Victoriei nr. 10"
            {...register("addressLine1")}
            className={inputClasses(!!errors.addressLine1)}
          />
          {renderError(errors.addressLine1?.message)}
        </div>

        <div>
          <Label htmlFor="addressLine2" className="text-sm font-medium text-slate-200">
            Detalii adresă (Opțional)
          </Label>
          <Input
            id="addressLine2"
            placeholder="Bloc, Scara, Etaj, Apartament"
            {...register("addressLine2")}
            className={inputClasses()}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="state" className="text-sm font-medium text-slate-200">
              Județ
            </Label>
            <Select defaultValue={watch("state")} onValueChange={handleCountyChange}>
              <SelectTrigger className={cn(inputClasses(!!errors.state))}>
                <SelectValue placeholder="Selectează județul" />
              </SelectTrigger>
              <SelectContent className="border-white/15 bg-slate-900/85 text-slate-100 backdrop-blur">
                {romanianCounties.map(county => (
                  <SelectItem key={county.code} value={county.code}>
                    {county.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {renderError(errors.state?.message)}
          </div>

          <div>
            <Label htmlFor="city" className="text-sm font-medium text-slate-200">
              Oraș
            </Label>
            <Input
              id="city"
              placeholder="București"
              {...register("city")}
              className={inputClasses(!!errors.city)}
            />
            {renderError(errors.city?.message)}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="postalCode" className="text-sm font-medium text-slate-200">
              Cod Poștal
            </Label>
            <Input
              id="postalCode"
              placeholder="010101"
              {...register("postalCode")}
              className={inputClasses(!!errors.postalCode)}
            />
            {renderError(errors.postalCode?.message)}
          </div>

          <div>
            <Label htmlFor="country" className="text-sm font-medium text-slate-200">
              Țara
            </Label>
            <Input
              id="country"
              value="România"
              disabled
              className={cn(
                inputClasses(),
                "cursor-not-allowed border-white/20 bg-white/15 text-slate-200"
              )}
            />
            <input type="hidden" value="RO" {...register("country")} />
          </div>
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm font-medium text-slate-200">
            Număr de Telefon
          </Label>
          <Input
            id="phone"
            placeholder="0712 345 678"
            {...register("phone")}
            className={inputClasses(!!errors.phone)}
          />
          {renderError(errors.phone?.message)}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Checkbox
            id="isDefault"
            checked={watch("isDefault")}
            onCheckedChange={checked => setValue("isDefault", checked as boolean)}
            className="border-white/25 text-sky-300 data-[state=checked]:border-sky-400 data-[state=checked]:bg-sky-500"
          />
          <Label htmlFor="isDefault" className="text-sm font-medium text-slate-200">
            Setează ca adresă implicită
          </Label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/account/addresses")}
          disabled={isLoading}
          className="border-white/20 bg-white/10 text-slate-100 transition hover:border-white/30 hover:bg-white/15"
        >
          Anulează
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className={cn(
            "px-6 transition hover:scale-[1.01]",
            gradientButtonClass
          )}
        >
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
