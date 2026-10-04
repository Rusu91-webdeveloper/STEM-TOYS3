import Image from "next/image";

/** Official Commission RGB asset; never crop, recolour or redraw the notice. */
export function LegalGuaranteeNotice() {
  return (
    <details className="relative rounded-xl border border-blue-200 bg-white p-3 text-slate-900">
      <summary className="cursor-pointer font-medium underline underline-offset-4">
        Drepturile tale privind garanția legală
      </summary>
      <div className="absolute left-0 top-full z-[60] mt-2 max-h-[65vh] w-[min(36rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-blue-200 bg-white p-3 shadow-xl">
        <Image
          src="/images/legal/eu-legal-guarantee-ro.svg"
          alt="Notificarea UE privind garanția legală de conformitate: minimum 2 ani, remedii fără costuri și pașii pentru solicitarea acestora."
          width={595}
          height={842}
          unoptimized
          className="h-auto w-full"
        />
        <a
          className="mt-3 block underline"
          href="https://europa.eu/youreurope/garan%C8%9Bii"
        >
          Citește informațiile UE despre garanții (destinația codului QR)
        </a>
        <a
          className="mt-2 block underline"
          href="/images/legal/eu-legal-guarantee-ro.svg"
          target="_blank"
          rel="noopener noreferrer"
        >
          Deschide notificarea la dimensiunea completă
        </a>
      </div>
    </details>
  );
}
