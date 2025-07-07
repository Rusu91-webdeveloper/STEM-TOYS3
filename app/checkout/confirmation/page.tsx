import { Check, ShoppingBag } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Confirmare Comandă | TeechTots",
  description: "Comanda dvs. a fost plasată cu succes",
};

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  // Need to await searchParams when using it
  const params = await searchParams;
  const orderId = params.orderId || "123456789"; // Fallback for demo

  return (
    <div className="container max-w-4xl py-12">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Vă mulțumim pentru comandă!</h1>
        <p className="text-gray-600 text-lg">
          Comanda dvs. a fost plasată cu succes.
        </p>
      </div>

      <div className="bg-white rounded-lg border shadow-sm p-8 mb-8">
        <div className="flex flex-col md:flex-row justify-between border-b pb-6 mb-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">Detalii Comandă</h2>
            <p className="text-gray-600">Comanda #{orderId}</p>
            <p className="text-gray-600">
              Data: {new Date().toLocaleDateString("ro-RO")}
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-md inline-block">
              <p className="font-medium">Status Comandă: Procesare</p>
            </div>
          </div>
        </div>

        <p className="mb-6">
          Am trimis un email de confirmare cu detaliile comenzii la adresa dvs.
          de email. De asemenea, puteți vizualiza comanda în panoul de control
          al contului dvs.
        </p>

        <h3 className="font-semibold mb-2">Ce urmează?</h3>
        <ul className="space-y-2 mb-6 list-disc list-inside">
          <li>Comanda dvs. este pregătită pentru expediere</li>
          <li>Veți primi un email când comanda dvs. va fi expediată</li>
          <li>
            Puteți urmări statusul comenzii în{" "}
            <Link
              href="/account/orders"
              className="text-primary underline">
              istoricul comenzilor
            </Link>
          </li>
        </ul>

        <p className="text-gray-600 mb-6">
          Dacă aveți întrebări despre comanda dvs., vă rugăm să contactați
          echipa noastră de asistență la{" "}
          <a
            href="mailto:webira.rem.srl@gmail.com"
            className="text-primary underline">
            webira.rem.srl@gmail.com
          </a>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button
            asChild
            className="flex items-center gap-2">
            <Link href="/products">
              <ShoppingBag className="h-4 w-4" />
              Continuă Cumpărăturile
            </Link>
          </Button>
          <Button
            asChild
            variant="outline">
            <Link href="/account/orders">Vezi Comenzile Mele</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
