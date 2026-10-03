import { LegalPageShell } from "@/components/legal/LegalPageShell";
import { COMPANY_LEGAL } from "@/lib/config/company-legal";

import { PrivacyProcessing } from "./PrivacyProcessing";
import { PrivacyProviders } from "./PrivacyProviders";
import { PrivacyRetentionRights } from "./PrivacyRetentionRights";

const toc = [
  { id: "intro", label: "1. Operatorul și contactul" },
  { id: "colectare", label: "2. Datele și sursele lor" },
  { id: "utilizare", label: "3. Scopuri și temeiuri" },
  { id: "cookies", label: "4. Cookie-uri și opțiuni" },
  { id: "partajare", label: "5. Destinatarii datelor" },
  { id: "transferuri", label: "6. Transferuri internaționale" },
  { id: "retentie", label: "7. Cât păstrăm datele" },
  { id: "securitate", label: "8. Securitate" },
  { id: "copii", label: "9. Date despre copii" },
  { id: "drepturi", label: "10. Drepturile tale" },
  { id: "modificari", label: "11. Actualizări" },
];

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Politica de confidențialitate"
      description="Cine prelucrează datele tale la TechTots, în ce scopuri, cui le transmite și ce opțiuni ai."
      lastUpdated="3 octombrie 2026"
    >
      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start">
        <nav
          aria-label="Cuprins"
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="font-semibold text-slate-900">Cuprins</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {toc.map(item => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="text-sky-800 underline-offset-4 hover:underline"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <article className="prose prose-sm max-w-none rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm prose-headings:scroll-mt-28 prose-a:text-sky-800 prose-a:break-words sm:prose-base sm:p-8">
          <section id="intro" className="scroll-mt-28">
            <h2>1. Operatorul și contactul</h2>
            <p>
              Magazinul TechTots, disponibil la techtots.ro, este operat de{" "}
              <strong>{COMPANY_LEGAL.name}</strong>, CUI {COMPANY_LEGAL.cui},
              înregistrată la Registrul Comerțului sub nr.{" "}
              {COMPANY_LEGAL.regCom}, cu adresa {COMPANY_LEGAL.address}.
              Societatea este operatorul datelor personale descrise aici.
            </p>
            <p id="contact" className="scroll-mt-28">
              Pentru întrebări sau cereri privind datele personale:{" "}
              <a href={`mailto:${COMPANY_LEGAL.email}`}>
                {COMPANY_LEGAL.email}
              </a>
              , telefon{" "}
              <a href={`tel:${COMPANY_LEGAL.phone}`}>+40 771 248 029</a>, sau
              adresa poștală de mai sus.
            </p>
            <p>
              Această politică este o informare. Citirea ei sau folosirea
              site-ului nu reprezintă consimțământ pentru publicitate ori
              cookie-uri opționale.
            </p>
          </section>
          <PrivacyProcessing />
          <PrivacyProviders />
          <PrivacyRetentionRights />
        </article>
      </div>
    </LegalPageShell>
  );
}
