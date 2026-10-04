"use client";

import { useEffect, useState } from "react";

import { useCsrfToken } from "@/hooks/useCsrfToken";
import { receiptText, type WithdrawalReceipt } from "@/lib/returns/withdrawal";

export default function WithdrawalsPage() {
  const csrf = useCsrfToken();
  const [requests, setRequests] = useState<WithdrawalReceipt[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const endpoint = "/api/admin/withdrawals";
  async function load(next?: string) {
    const response = await fetch(
      endpoint + (next ? `?cursor=${encodeURIComponent(next)}` : ""),
      { cache: "no-store" }
    );
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);
    setRequests(previous =>
      next ? [...previous, ...data.requests] : data.requests
    );
    setCursor(data.nextCursor);
  }
  useEffect(() => {
    load().catch(() =>
      setError("Accesul ADMIN sau declarațiile nu sunt disponibile.")
    );
  }, []);
  async function act(reference: string, action: "retry_email" | "reviewed") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: csrf.addToHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ reference, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      await load();
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Operația a eșuat."
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Retrageri din contract</h1>
      <p>
        Verifică prompt declarațiile primite, inclusiv cele cu email netrimis.
        Confirmarea înregistrează notificarea clientului; verifică separat
        identitatea/comanda, termenul legal, expedierea și rambursarea. Marcarea
        ca verificată nu modifică o comandă sau o plată. Înregistrarea
        refuzului/nepreluării COD nu încasează garanția. Verifică declarațiile
        de retragere, termenul rambursării și eliberarea autorizării; dreptul
        legal de retragere nu este supus unei penalități de refuz.
      </p>
      <button
        className="underline"
        onClick={() =>
          load().catch(() => setError("Lista nu este disponibilă."))
        }
      >
        Reîncarcă lista
      </button>
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      {requests.length === 0 && !error && <p>Nu sunt declarații afișate.</p>}
      {requests.map(receipt => (
        <section
          key={receipt.reference}
          className="space-y-3 rounded border p-4"
        >
          <h2 className="font-semibold break-all">{receipt.reference}</h2>
          <pre className="whitespace-pre-wrap break-words text-sm">
            {receiptText(receipt)}
          </pre>
          <p>
            Confirmare client:{" "}
            {receipt.customerNotified ? "trimisă" : "netrimisă"}. Notificare
            magazin: {receipt.merchantNotified ? "trimisă" : "netrimisă"}.
          </p>
          {!receipt.customerNotified || !receipt.merchantNotified ? (
            <button
              className="rounded bg-blue-700 p-3 text-white disabled:opacity-50"
              disabled={busy || !csrf.token}
              onClick={() => act(receipt.reference, "retry_email")}
            >
              Reîncearcă emailurile netrimise
            </button>
          ) : null}
          <p>Verificare: {receipt.reviewedAt ?? "în așteptare"}</p>
          {!receipt.reviewedAt && (
            <button
              className="ml-2 underline"
              disabled={busy || !csrf.token}
              onClick={() => act(receipt.reference, "reviewed")}
            >
              Marchează ca verificată
            </button>
          )}
        </section>
      ))}
      {cursor && (
        <button
          className="underline"
          onClick={() =>
            load(cursor).catch(() =>
              setError("Pagina următoare nu este disponibilă.")
            )
          }
        >
          Încarcă declarații mai vechi
        </button>
      )}
    </div>
  );
}
