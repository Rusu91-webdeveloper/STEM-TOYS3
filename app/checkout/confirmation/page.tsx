import { CheckCircle, Package, Mail, Clock, Truck } from "lucide-react";
import Link from "next/link";
import React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
// import { getTranslations } from "@/lib/i18n/server";

export const metadata = {
  title: "Confirmare Comandă | TechTots",
  description: "Comanda dvs. a fost plasată cu succes.",
};

export default async function OrderConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  // const t = await getTranslations();
  const params = await searchParams;
  const orderId = params.orderId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12">
      <div className="container max-w-4xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6 animate-bounce">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-gray-900">
            Vă mulțumim pentru comandă!
          </h1>
          <p className="text-gray-600 text-xl max-w-2xl mx-auto">
            Comanda dvs. a fost plasată cu succes și este în curs de procesare.
          </p>
        </div>

        {/* Order Details Card */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row justify-between border-b border-gray-200 pb-6 mb-6">
              <div>
                <h2 className="text-2xl font-semibold mb-3 text-gray-900">
                  Detalii Comandă
                </h2>
                <div className="space-y-2">
                  <p className="text-gray-700 font-medium">
                    Comanda #{orderId || "N/A"}
                  </p>
                  <p className="text-gray-600">
                    Data:{" "}
                    {new Date().toLocaleDateString("ro-RO", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="bg-blue-50 text-blue-700 px-6 py-3 rounded-lg inline-block border border-blue-200">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <p className="font-semibold">Status: Procesare</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Ce urmează?
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Email de confirmare
                    </h4>
                    <p className="text-sm text-gray-600">
                      Veți primi un email cu detaliile comenzii în câteva minute
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <Clock className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Procesare comandă
                    </h4>
                    <p className="text-sm text-gray-600">
                      Comanda dvs. este pregătită pentru expediere
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <div className="p-2 bg-green-100 rounded-full">
                    <Truck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">
                      Notificare expediere
                    </h4>
                    <p className="text-sm text-gray-600">
                      Veți primi un email când comanda va fi expediată
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h4 className="font-semibold text-blue-900 mb-3">
                Informații importante
              </h4>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  Puteți urmări statusul comenzii în{" "}
                  <Link
                    href="/account/orders"
                    className="text-blue-600 underline font-medium hover:text-blue-800"
                  >
                    istoricul comenzilor
                  </Link>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  Pentru întrebări, contactați-ne la{" "}
                  <a
                    href="mailto:webira.rem.srl@gmail.com"
                    className="text-blue-600 underline font-medium hover:text-blue-800"
                  >
                    webira.rem.srl@gmail.com
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                  Numărul de comandă este:{" "}
                  <span className="font-mono font-semibold text-blue-900">
                    {orderId || "N/A"}
                  </span>
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                asChild
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
              >
                <Link href="/products">
                  <Package className="h-5 w-5" />
                  Continuă Cumpărăturile
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="px-8 py-3 text-lg border-2 hover:bg-gray-50"
              >
                <Link href="/account/orders">Vezi Comenzile Mele</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
