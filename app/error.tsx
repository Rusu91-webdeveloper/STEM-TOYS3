"use client";

import Link from "next/link";
import { useEffect } from "react";

import { recoverChunkLoad } from "@/lib/recovery/chunk-recovery";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
    recoverChunkLoad(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <h1 className="text-4xl font-bold mb-4">Pagina nu s-a încărcat</h1>
      <p className="text-lg mb-6 text-muted-foreground">
        Reîncearcă încărcarea paginii. Dacă problema continuă, contactează-ne.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
        >
          Reîncearcă
        </button>
        <Link
          href="/"
          className="px-4 py-2 bg-secondary text-white rounded-md hover:bg-secondary/90 transition-colors"
        >
          Înapoi la pagina principală
        </Link>
      </div>
    </div>
  );
}
