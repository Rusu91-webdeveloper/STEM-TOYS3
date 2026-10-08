import { DatabaseZap } from "lucide-react";
import Link from "next/link";

export function DisconnectedReport({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8">
      <DatabaseZap className="mb-5 h-8 w-8 text-amber-600" aria-hidden="true" />
      <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
      <p className="mt-3 leading-relaxed text-slate-600">
        Acest raport nu are încă o sursă completă de date reale. Cifrele
        demonstrative au fost retrase din interfață pentru a evita decizii
        bazate pe informații simulate.
      </p>
      <Link
        href="/admin/analytics"
        className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-violet-700 px-4 text-sm font-medium text-white hover:bg-violet-800"
      >
        Deschide rapoartele magazinului
      </Link>
    </div>
  );
}
