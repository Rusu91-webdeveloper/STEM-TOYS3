import Link from "next/link";

type SectionHeadline = {
  kicker: string;
  title: string;
  intro?: string;
};

type LandingSectionLink = {
  href: string;
  label: string;
  description: string;
};

type Props = {
  clusters: LandingSectionLink[];
  clustersHeadline?: SectionHeadline;
};

export function CommercialLandingClustersSection({
  clusters,
  clustersHeadline,
}: Props) {
  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/90 px-6 py-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] sm:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-700">
            {clustersHeadline?.kicker ?? "Alte pagini utile"}
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">
            {clustersHeadline?.title ?? "Unde poți merge mai departe"}
          </h2>
          {clustersHeadline?.intro !== undefined &&
          clustersHeadline.intro === "" ? null : (
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              {clustersHeadline?.intro ??
                "Linkuri spre subiecte diferite: vârstă, cadou, materie sau tip de joc — ca să nu rămâi blocat într-un singur catalog."}
            </p>
          )}
        </div>

        <div
          className={`mt-8 grid gap-4 ${
            clusters.length === 4
              ? "md:grid-cols-2 xl:grid-cols-4"
              : "md:grid-cols-2 xl:grid-cols-3"
          }`}
        >
          {clusters.map(cluster => (
            <Link
              key={cluster.href}
              href={cluster.href}
              className="group rounded-[1.5rem] border border-slate-200 bg-slate-50/90 p-5 transition hover:border-sky-300 hover:bg-white hover:shadow-[0_20px_45px_-30px_rgba(14,116,144,0.45)]"
            >
              <p className="text-lg font-bold text-slate-900 group-hover:text-sky-800">
                {cluster.label}
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {cluster.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
