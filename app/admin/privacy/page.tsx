"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

type Policy = {
  id: string;
  category: string;
  retentionPeriod: number;
  autoDelete: boolean;
};
type Pending = {
  id: string;
  createdAt: string;
  responseDueAt: string;
  overdue: boolean;
  user: { email: string; name: string | null };
};
const categories = {
  logs: "Evenimente email",
  analytics_data: "Metrici de performanță",
};
const endpoint = "/api/admin/gdpr/retention";
async function read(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok)
    throw new Error("Accesul de administrator sau datele nu sunt disponibile.");
  return response.json();
}
async function write(url: string, method: string, data: unknown) {
  const token = await read("/api/csrf-token");
  if (!token.csrfToken)
    throw new Error("Validarea de securitate nu este disponibilă.");
  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-CSRF-Token": token.csrfToken,
    },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "Operația nu a fost finalizată.");
  return result;
}
export default function PrivacyOperationsPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [requests, setRequests] = useState<Pending[]>([]);
  const [inventory, setInventory] = useState<{
    total: number;
    withCardData: number;
    withCvv: number;
  } | null>(null);
  const [status, setStatus] = useState("Se încarcă...");
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState("logs");
  const [days, setDays] = useState("");
  const [automate, setAutomate] = useState(false);
  const [confirmed, setConfirmed] = useState<string | null>(null);
  async function load() {
    const [retention, pending, cards] = await Promise.all([
      read(endpoint),
      read("/api/admin/privacy/requests"),
      read("/api/admin/privacy/inventory"),
    ]);
    setPolicies(retention.policies);
    setRequests(pending.requests);
    setInventory(cards.legacyCards);
  }
  useEffect(() => {
    let active = true;
    Promise.all([
      read(endpoint),
      read("/api/admin/privacy/requests"),
      read("/api/admin/privacy/inventory"),
    ])
      .then(([retention, pending, cards]) => {
        if (!active) return;
        setPolicies(retention.policies);
        setRequests(pending.requests);
        setInventory(cards.legacyCards);
        setStatus("Date încărcate.");
      })
      .catch(error => {
        if (active) setStatus(error.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function save() {
    if (busy) return;
    setBusy(true);
    try {
      await write(endpoint, "POST", {
        category,
        retentionPeriod: Number(days),
        autoDelete: automate,
      });
      await load();
      setStatus("Politica a fost salvată.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Eroare");
    } finally {
      setBusy(false);
    }
  }
  async function process(requestId: string) {
    if (busy || confirmed !== requestId) return;
    setBusy(true);
    try {
      const result = await write("/api/admin/privacy/requests", "POST", {
        requestId,
        confirmProcessing: true,
      });
      await load();
      setConfirmed(null);
      setStatus(
        result.status === "completed"
          ? "Datele contului au fost eliminate; dovezile tranzacțiilor sunt păstrate."
          : "Există comenzi sau retururi în curs. Cererea rămâne pentru verificare și răspuns către client."
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Eroare");
    } finally {
      setBusy(false);
    }
  }
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6 text-slate-900">
      <h1 className="text-2xl font-bold">Operațiuni de confidențialitate</h1>
      <p role="status">{status}</p>
      <section className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="text-xl font-semibold">
          Inventarul cardurilor istorice
        </h2>
        {inventory && (
          <p>
            Înregistrări: {inventory.total} · Cu date de card criptate:{" "}
            {inventory.withCardData} · Cu CVV criptat: {inventory.withCvv}
          </p>
        )}
        <p className="text-sm">
          Sunt citite numai totaluri, fără decriptare. Orice rezultat peste zero
          necesită o operație separată de eliminare. Copiile de siguranță se
          verifică separat la furnizor.
        </p>
      </section>
      <section className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="text-xl font-semibold">Retenția aplicației</h2>
        <p className="text-sm">
          Politicile active rulează în mentenanța zilnică, în loturi de maximum
          500 de înregistrări pe categorie. Comenzile, facturile și dovezile
          consimțământului sunt păstrate pentru verificarea obligațiilor legale.
          GA4, Meta, emailul și copiile de siguranță au setări separate la
          furnizori.
        </p>
        <ul>
          {policies.map(policy => (
            <li key={policy.id}>
              {policy.category}: {policy.retentionPeriod} zile ·{" "}
              {policy.autoDelete && policy.category in categories
                ? "automat"
                : "verificare manuală sau automatizare oprită"}
            </li>
          ))}
        </ul>
        <label className="block">
          Categorie{" "}
          <select
            className="border p-2"
            value={category}
            onChange={event => {
              setCategory(event.target.value);
              setDays("");
              setAutomate(false);
            }}
          >
            {Object.entries(categories).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          Zile de păstrare{" "}
          <input
            className="border p-2"
            type="number"
            min="1"
            max="3650"
            step="1"
            value={days}
            onChange={event => setDays(event.target.value)}
          />
        </label>
        <label className="block">
          <input
            type="checkbox"
            checked={automate}
            onChange={event => setAutomate(event.target.checked)}
          />{" "}
          Activează ștergerea automată pentru această categorie
        </label>
        <Button
          onClick={save}
          disabled={
            busy ||
            !days ||
            !Number.isInteger(Number(days)) ||
            Number(days) < 1 ||
            Number(days) > 3650
          }
        >
          Salvează politica
        </Button>
      </section>
      <section className="space-y-3 rounded-xl border bg-white p-5">
        <h2 className="text-xl font-semibold">
          Cereri de ștergere în așteptare
        </h2>
        <p className="text-sm">
          Verifică și răspunde clientului în termenul legal de o lună.
          Procesarea de mai jos este posibilă numai pentru o cerere confirmată
          de client și după închiderea comenzilor și retururilor. Nu elimină
          evidențele legale și nu trimite automat mesaje.
        </p>
        {inventory !== null && requests.length === 0 && (
          <p>Nu există cereri în lista încărcată.</p>
        )}
        {requests.map(request => (
          <div key={request.id} className="space-y-2 border-t py-3">
            <p>
              {request.user.name} · {request.user.email} ·{" "}
              {new Date(request.createdAt).toLocaleDateString("ro-RO")}
            </p>
            <p
              className={
                request.overdue ? "font-semibold text-red-700" : "text-sm"
              }
            >
              Răspuns până la{" "}
              {new Date(request.responseDueAt).toLocaleDateString("ro-RO")}
              {request.overdue
                ? " · Termen depășit — verifică și răspunde clientului"
                : ""}
            </p>
            <label className="block">
              <input
                type="checkbox"
                checked={confirmed === request.id}
                onChange={event =>
                  setConfirmed(event.target.checked ? request.id : null)
                }
              />{" "}
              Confirm procesarea ireversibilă a cererii clientului
            </label>
            <Button
              variant="destructive"
              onClick={() => process(request.id)}
              disabled={busy || confirmed !== request.id}
            >
              Procesează cererea
            </Button>
          </div>
        ))}
      </section>
    </main>
  );
}
