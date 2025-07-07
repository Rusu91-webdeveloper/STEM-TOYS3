import { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Dezabonare cu succes | TechTots",
  description: "Te-ai dezabonat cu succes de la newsletter-ul TechTots.",
};

export default function UnsubscribeSuccessPage() {
  return (
    <div className="container mx-auto py-16 md:py-24 max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
        <div className="text-green-600 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-4">
          Dezabonare cu succes
        </h1>
        <p className="mb-6">
          Te-ai dezabonat cu succes de la newsletter-ul nostru. Nu vei mai primi
          email-uri de la noi.
        </p>
        <p className="mb-8 text-gray-600">
          Dacă te-ai dezabonat din greșeală sau te răzgândești, te poți abona
          din nou oricând de pe site-ul nostru.
        </p>
        <div className="flex justify-center">
          <Link href="/">
            <Button>Înapoi la pagina principală</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
