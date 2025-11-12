import type { TimelineStep } from "../data";

export function DeliveryTimeline({ timeline }: { timeline: TimelineStep[] }) {
  return (
    <section className="bg-slate-900/60 py-12 sm:py-16 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-semibold sm:text-3xl">Cronologia livrării TechTots</h2>
          <p className="mt-3 text-base text-slate-200 sm:text-lg">
            Proces desenat pentru a respecta promisiunea noastră:{" "}
            <strong>maximum 7 zile lucrătoare</strong> până la ușa ta.
          </p>
        </div>
        <div className="mt-10 space-y-4">
          {timeline.map((step) => (
            <div
              key={step.phase}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 shadow-lg shadow-black/20 transition hover:border-sky-500/40 hover:shadow-sky-500/20"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-sky-400">
                    {step.phase}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-200">{step.description}</p>
                </div>
                <div className="self-start rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-blue-100 backdrop-blur">
                  Livrare în curs
                </div>
              </div>
              <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-sky-500/0 via-sky-500/40 to-sky-500/0 opacity-0 transition group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


