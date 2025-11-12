import type { Commitment } from "../data";

export function DeliveryCommitments({ commitments }: { commitments: Commitment[] }) {
  return (
    <section className="container mx-auto px-4 py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur sm:grid-cols-2 lg:grid-cols-3">
          {commitments.map((item) => (
            <article
              key={item.title}
              className="flex flex-col rounded-2xl bg-slate-900/60 p-5 shadow-lg shadow-black/20 transition hover:-translate-y-1 hover:border-sky-500/40 hover:bg-slate-900/80 hover:shadow-sky-500/20"
            >
              <span className="text-3xl">{item.icon}</span>
              <h2 className="mt-4 text-lg font-semibold text-white">{item.title}</h2>
              <p className="mt-2 text-sm text-slate-200">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


