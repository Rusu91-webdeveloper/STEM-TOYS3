import { readCodHoldSettlement } from "@/lib/checkout/cod-hold-evidence";

const messages = {
  released:
    "Autorizarea a fost eliberată în Stripe. Disponibilul afișat depinde de banca emitentă.",
  expired:
    "Autorizarea a expirat. Nu există o sumă rezervată și nu se creează o nouă debitare.",
  already_released:
    "Stripe confirmă că autorizarea era deja anulată. Nu este necesară o a doua eliberare.",
  captured_review:
    "Există o încasare în Stripe. Verifică suma și dreptul la rambursare; aceasta nu este o simplă eliberare de autorizare.",
  review_required:
    "Starea sau identificarea plății necesită verificare manuală în Stripe.",
  retry_required:
    "Eliberarea nu a fost confirmată. Mentenanța zilnică reîncearcă; poți relua salvarea stării comenzii pentru verificare imediată.",
  not_required: "Nu este înregistrată o autorizare.",
};

export function CodHoldSettlementNotice({ notes }: { notes?: string | null }) {
  const settlement = readCodHoldSettlement(notes);
  if (!settlement) return null;
  return (
    <div
      className="mt-3 space-y-1 rounded border bg-white p-3 text-sm"
      role="status"
    >
      <p className="font-semibold">Starea autorizării de transport</p>
      <p>{messages[settlement.outcome]}</p>
      {settlement.expiresAt && (
        <p>
          Termen Stripe:{" "}
          {new Date(settlement.expiresAt).toLocaleString("ro-RO", {
            timeZone: "Europe/Bucharest",
          })}
        </p>
      )}
    </div>
  );
}
