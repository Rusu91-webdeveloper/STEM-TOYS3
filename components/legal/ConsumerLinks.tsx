import Image from "next/image";

/** Official ANPC pictogram, displayed at the dimensions required by Order 270/2026. */
export function ConsumerLinks() {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-center gap-4 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-700 sm:justify-start">
      <a
        href="https://reclamatiisal.anpc.ro/"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="ANPC – Soluționarea Alternativă a Litigiilor (SAL)"
      >
        <Image
          src="/images/legal/anpc-sal-2026.png"
          alt="ANPC – Soluționarea Alternativă a Litigiilor"
          width={250}
          height={50}
          unoptimized
          className="h-[50px] w-[250px]"
        />
      </a>
      <a
        href="https://eservicii.anpc.ro/"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4"
      >
        ANPC – Depune o reclamație
      </a>
      <span>
        Telefonul Consumatorului:{" "}
        <a href="tel:0219551" className="underline">
          021 9551
        </a>
      </span>
    </div>
  );
}
