"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DestinationEvidence } from "@/lib/returns/return-destination";
import {
  destinationInstruction,
  type ReturnDestination,
} from "@/lib/returns/return-destination-display";

interface Props {
  returnId: string;
  status: string;
  isDigital?: boolean;
  destination?: ReturnDestination;
  evidence?: DestinationEvidence | null;
  contract?: string | null;
  warehouseAddress?: string | null;
  headers: Record<string, string>;
  onSaved: (
    destination: ReturnDestination,
    evidence: DestinationEvidence | null
  ) => void;
}

export function ReturnDestinationReview(props: Props) {
  const [target, setTarget] = useState("COMPANY");
  const [condition, setCondition] = useState("SEALED_UNUSED");
  const [confirmation, setConfirmation] = useState("");
  const [dates, setDates] = useState<Record<string, string>>({});
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const canEdit = props.status === "PENDING";
  const kidstory = props.contract === "KIDSTORY_2026";
  if (props.isDigital)
    return <p>Produs digital: fără colet sau adresă de expediere.</p>;

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const body =
        target === "COMPANY"
          ? { target }
          : {
              target,
              condition,
              confirmation,
              ...checks,
              ...Object.fromEntries(
                Object.entries(dates)
                  .filter(([, value]) => value)
                  .map(([key, value]) => [key, new Date(value).toISOString()])
              ),
            };
      const response = await fetch(
        `/api/returns/${props.returnId}/destination`,
        {
          method: "PATCH",
          headers: props.headers,
          body: JSON.stringify(body),
        }
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Destinația nu a fost salvată.");
      setMessage(destinationInstruction(result.destination));
      props.onSaved(result.destination, result.destinationReview);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Verificarea a eșuat."
      );
    } finally {
      setSaving(false);
    }
  }

  const dateFields = kidstory
    ? [
        ["authorizationIssuedAt", "Data și ora emiterii ARP"],
        [
          "supplierInvoiceAt",
          "Data facturii furnizorului (defect inițial / produs greșit)",
        ],
        ["deliveredAt", "Livrare confirmată (produs greșit)"],
        ["expectedArrivalAt", "Sosire estimată la depozit"],
      ]
    : [
        ["deliveredAt", "Livrare confirmată (retur standard)"],
        ["expectedArrivalAt", "Sosire estimată la depozit"],
      ];
  const checkFields = [
    ["contractActiveConfirmed", "Colaborarea și contractul sunt în vigoare"],
    [
      "warehouseConfirmed",
      "Depozitul din baza de date este confirmat pentru acest retur",
    ],
    [
      "warrantyConfirmed",
      "Furnizorul a confirmat remedierea în garanție (defect)",
    ],
    ...(kidstory
      ? [
          [
            "originalDocumentsConfirmed",
            "Produs sigilat, nefolosit, nemontat și documente originale (retragere)",
          ],
        ]
      : [
          [
            "descriptionMatchesConfirmed",
            "Produsul este sigilat, nefolosit, nedeteriorat și descrierea corespunde (retragere)",
          ],
        ]),
  ];

  return (
    <section
      className="min-w-0 space-y-3 break-words rounded-lg border p-4"
      aria-label="Verificarea destinației returului"
    >
      <h3 className="font-semibold">Destinația returului</h3>
      <p className="text-sm">
        {props.destination
          ? destinationInstruction(props.destination)
          : "Implicit: adresa companiei TechTots."}
      </p>
      <p className="text-sm text-muted-foreground">
        Salvează verificarea înainte de aprobare. Condițiile furnizorului nu
        resping returul clientului și nu transferă penalități comerciale către
        acesta.
      </p>
      {props.evidence && (
        <details className="text-sm">
          <summary>Dovada verificării salvate</summary>
          <p>
            Verificat la{" "}
            {new Date(props.evidence.reviewedAt).toLocaleString("ro-RO")} de{" "}
            {props.evidence.reviewer}.
          </p>
          <p>{props.evidence.confirmation}</p>
          <p>
            Stare: {props.evidence.checks.condition}; sosire estimată:{" "}
            {new Date(props.evidence.checks.expectedArrivalAt).toLocaleString(
              "ro-RO"
            )}
            .
          </p>
        </details>
      )}
      {canEdit && (
        <>
          <label className="block text-sm">
            Trimite către
            <select
              className="mt-1 w-full rounded-md border bg-background p-2"
              value={target}
              onChange={event => setTarget(event.target.value)}
            >
              <option value="COMPANY">TechTots / adresa companiei</option>
              <option value="SUPPLIER" disabled={!props.contract}>
                Furnizor, după verificarea contractului
              </option>
            </select>
          </label>
          {target === "SUPPLIER" && (
            <div className="space-y-3">
              <p className="text-sm">
                Depozit în baza de date:{" "}
                {props.warehouseAddress || "Adresă lipsă — folosește TechTots."}
              </p>
              <p className="text-sm text-muted-foreground">
                Înregistrează întâi confirmarea furnizorului ca APPROVED,
                numărul ARP pentru KidStory și termenul de sosire agreat.
                Termenul de răspuns intern nu este dovadă de autorizare.
              </p>
              <label className="block text-sm">
                Stare verificată
                <select
                  className="mt-1 w-full rounded-md border bg-background p-2"
                  value={condition}
                  onChange={event => setCondition(event.target.value)}
                >
                  <option value="SEALED_UNUSED">
                    Sigilat și nefolosit — retragere
                  </option>
                  <option value="MANUFACTURING_DEFECT">
                    Defect de fabricație / garanție
                  </option>
                  <option value="WRONG_ITEM">Produs livrat greșit</option>
                </select>
              </label>
              {dateFields.map(([key, label]) => (
                <label
                  key={key}
                  htmlFor={`destination-${props.returnId}-${key}`}
                  className="block text-sm"
                >
                  {label}
                  <Input
                    id={`destination-${props.returnId}-${key}`}
                    type="datetime-local"
                    value={dates[key] || ""}
                    onChange={event =>
                      setDates(previous => ({
                        ...previous,
                        [key]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
              <label
                htmlFor={`destination-${props.returnId}-confirmation`}
                className="block text-sm"
              >
                Dovada confirmării furnizorului (referință și detalii)
                <Input
                  id={`destination-${props.returnId}-confirmation`}
                  value={confirmation}
                  maxLength={2000}
                  onChange={event => setConfirmation(event.target.value)}
                />
              </label>
              {checkFields.map(([key, label]) => (
                <label key={key} className="flex gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checks[key] || false}
                    onChange={event =>
                      setChecks(previous => ({
                        ...previous,
                        [key]: event.target.checked,
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
          <Button disabled={saving} onClick={save}>
            {saving ? "Se verifică…" : "Salvează destinația"}
          </Button>
        </>
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
