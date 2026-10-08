"use client";

import { Button } from "@/components/ui/button";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section
      role="alert"
      className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white p-6 sm:p-9"
    >
      <h1 className="text-xl font-semibold text-slate-950">
        Datele nu sunt disponibile acum
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-slate-500">
        Pagina nu a putut încărca informațiile magazinului. Reîncearcă pentru a
        vedea situația actuală.
      </p>
      <Button className="mt-6" onClick={reset}>
        Încearcă din nou
      </Button>
    </section>
  );
}
