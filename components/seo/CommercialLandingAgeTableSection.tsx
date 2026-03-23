export type CommercialAgeTableRow = {
  ageRange: string;
  productType: string;
  focus: string;
};

export type CommercialAgeTable = {
  kicker?: string;
  title: string;
  intro?: string;
  rows: CommercialAgeTableRow[];
};

type Props = {
  ageTable: CommercialAgeTable;
};

export function CommercialLandingAgeTableSection({ ageTable }: Props) {
  if (!ageTable.rows.length) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="rounded-[2rem] border border-slate-200/80 bg-white/92 px-6 py-8 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] sm:px-8">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">
            {ageTable.kicker ?? "Vârste și niveluri"}
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950">
            {ageTable.title}
          </h2>
          {ageTable.intro ? (
            <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
              {ageTable.intro}
            </p>
          ) : null}
        </div>

        <div className="mt-8 overflow-x-auto rounded-[1.25rem] border border-slate-200 bg-white">
          <table className="w-full min-w-[520px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/95">
                <th className="px-4 py-3 font-bold text-slate-900 sm:px-5">
                  Vârstă
                </th>
                <th className="px-4 py-3 font-bold text-slate-900 sm:px-5">
                  Tip de produs
                </th>
                <th className="px-4 py-3 font-bold text-slate-900 sm:px-5">
                  Ce urmărești
                </th>
              </tr>
            </thead>
            <tbody>
              {ageTable.rows.map(row => (
                <tr
                  key={row.ageRange}
                  className="border-b border-slate-100 last:border-b-0"
                >
                  <td className="align-top px-4 py-4 font-semibold text-slate-900 sm:px-5">
                    {row.ageRange}
                  </td>
                  <td className="align-top px-4 py-4 text-slate-700 sm:px-5">
                    {row.productType}
                  </td>
                  <td className="align-top px-4 py-4 text-slate-600 sm:px-5">
                    {row.focus}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
