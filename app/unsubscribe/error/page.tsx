import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Eroare la dezabonare | TechTots",
  description:
    "A apărut o eroare la procesarea dezabonării de la newsletter-ul TechTots.",
};

export default function UnsubscribeErrorPage() {
  return (
    <div className="container mx-auto py-16 md:py-24 max-w-2xl">
      <div className="bg-white rounded-lg shadow-md p-6 md:p-8 text-center">
        <div className="text-red-600 mb-4">
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
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-4">
          Eroare la dezabonare
        </h1>
        <p className="mb-6">
          A apărut o eroare la procesarea dezabonării tale. Te rugăm să încerci
          din nou.
        </p>
        <p className="mb-8 text-gray-600">
          Dacă problema persistă, te rugăm să ne contactezi direct la adresa de
          email
          <a
            href="mailto:support@techtots.ro"
            className="text-primary hover:underline mx-1">
            support@techtots.ro
          </a>
          pentru asistență.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/unsubscribe">
            <Button variant="outline">Încearcă din nou</Button>
          </Link>
          <Link href="/">
            <Button>Înapoi la pagina principală</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
