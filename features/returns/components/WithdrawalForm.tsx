"use client";

import { useEffect, useState, type FormEvent } from "react";

import { useCsrfToken } from "@/hooks/useCsrfToken";
import { preparePrivateWithdrawalPage } from "@/lib/analytics/withdrawal-privacy";

type Receipt = { reference: string; receivedAt: string };
export function WithdrawalForm() {
  const csrf = useCsrfToken();
  const [privatePage, setPrivatePage] = useState(false);
  useEffect(() => {
    setPrivatePage(preparePrivateWithdrawalPage());
  }, []);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contract, setContract] = useState("");
  const [submissionId, setSubmissionId] = useState("");
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{
    receipt: Receipt;
    text: string;
    emailSent: boolean;
  } | null>(null);
  function prepare(event: FormEvent) {
    event.preventDefault();
    setSubmissionId(crypto.randomUUID());
    setReview(true);
    setError("");
  }
  async function confirm() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/returns/withdrawal", {
        method: "POST",
        credentials: "include",
        headers: csrf.addToHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          name,
          email,
          contract,
          submissionId,
          confirmed: true,
        }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error ?? "Nu am putut confirma înregistrarea.");
      setResult(data);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Reîncearcă trimiterea."
      );
      await csrf.refreshToken();
    } finally {
      setBusy(false);
    }
  }
  function download() {
    if (!result) return;
    const url = URL.createObjectURL(
      new Blob([result.text], { type: "text/plain;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.receipt.reference}.txt`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const button =
    "rounded-lg bg-blue-700 px-4 py-3 font-semibold text-white disabled:opacity-50";
  if (!privatePage)
    return <p aria-live="polite">Se pregătește formularul de retragere...</p>;
  if (result)
    return (
      <section
        aria-live="polite"
        className="space-y-4 rounded-xl border border-green-300 bg-green-50 p-5"
      >
        <h2 className="text-xl font-semibold">
          Declarația de retragere a fost înregistrată
        </h2>
        <p>Referință: {result.receipt.reference}</p>
        <p>
          {result.emailSent
            ? "Confirmarea de primire a fost trimisă prin email."
            : "Declarația este salvată, dar nu am putut confirma trimiterea emailului. Echipa va verifica livrarea confirmării. Descarcă acum dovada de primire."}
        </p>
        <pre className="whitespace-pre-wrap break-words text-sm">
          {result.text}
        </pre>
        <button className={button} onClick={download}>
          Descarcă confirmarea de primire
        </button>
      </section>
    );
  return (
    <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-5">
      {!review ? (
        <form onSubmit={prepare} className="space-y-4">
          <label className="block">
            Numele tău
            <input
              className="mt-1 block w-full rounded border p-3"
              autoComplete="name"
              required
              maxLength={150}
              value={name}
              onChange={event => setName(event.target.value)}
            />
          </label>
          <label className="block">
            Email pentru confirmarea de primire
            <input
              className="mt-1 block w-full rounded border p-3"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={event => setEmail(event.target.value)}
            />
          </label>
          <label className="block">
            Contractul / comanda și produsele vizate
            <textarea
              className="mt-1 block w-full rounded border p-3"
              required
              maxLength={1000}
              value={contract}
              onChange={event => setContract(event.target.value)}
              aria-describedby="contract-help"
            />
          </label>
          <p id="contract-help" className="text-sm text-slate-600">
            De exemplu: numărul comenzii și toate produsele sau numai produsele
            pentru care te retragi. Dacă nu ai numărul, descrie comanda
            suficient pentru identificare. Nu introduce date de card.
          </p>
          <button className={button} type="submit">
            Verifică declarația
          </button>
        </form>
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            Verifică înainte de trimitere
          </h2>
          <p>
            <strong>Nume:</strong> {name}
          </p>
          <p>
            <strong>Confirmare prin email:</strong> {email}
          </p>
          <p className="whitespace-pre-wrap break-words">
            <strong>Contract / produse:</strong> {contract}
          </p>
          <p>
            Prin confirmare, comunici: „Vă informez că mă retrag din contractul
            identificat mai sus.”
          </p>
          <button
            className={button}
            onClick={confirm}
            disabled={busy || csrf.loading || !csrf.token}
          >
            {busy ? "Se trimite..." : "Confirmați retragerea"}
          </button>
          <button
            className="ml-3 underline"
            onClick={() => {
              setReview(false);
              setError("");
            }}
            disabled={busy}
          >
            Editează declarația
          </button>
        </div>
      )}
      {csrf.error && (
        <p role="alert">
          Validarea de securitate nu este disponibilă.{" "}
          <button className="underline" onClick={csrf.refreshToken}>
            Reîncearcă validarea
          </button>
        </p>
      )}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
      <p className="text-sm text-slate-600">
        Folosim datele pentru înregistrarea și procesarea retragerii, conform{" "}
        <a className="underline" href="/privacy">
          politicii de confidențialitate
        </a>
        . Nu este necesar consimțământ de marketing.
      </p>
    </section>
  );
}
