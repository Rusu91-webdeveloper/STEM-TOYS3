"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { clearCartStorage } from "@/features/cart/lib/cartStorage";
import { useTranslation } from "@/lib/i18n";

export function AccountPrivacyPanel() {
  const { language } = useTranslation();
  const en = language === "en";
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  async function deleteAccount() {
    if (!confirmed || busy) return;
    setBusy(true);
    setMessage(null);
    setFailed(false);
    try {
      const csrfResponse = await fetch("/api/csrf-token", {
        credentials: "include",
        cache: "no-store",
      });
      if (!csrfResponse.ok) throw new Error("csrf");
      const { csrfToken } = await csrfResponse.json();
      if (!csrfToken) throw new Error("csrf");
      const response = await fetch("/api/gdpr/delete", {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ confirmDeletion: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "delete");
      setMessage(result.message);
      setConfirmed(false);
      if (result.status === "completed") {
        clearCartStorage();
        await signOut({ callbackUrl: "/" });
      }
    } catch (error) {
      setFailed(true);
      setMessage(
        error instanceof Error && !["csrf", "delete"].includes(error.message)
          ? error.message
          : en
            ? "Deletion did not complete. Try again or contact info@techtots.ro."
            : "Ștergerea nu a fost finalizată. Încearcă din nou sau contactează info@techtots.ro."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="rounded-xl border border-red-200 bg-white p-6 text-slate-900"
      aria-labelledby="account-privacy-heading"
    >
      <h2 id="account-privacy-heading" className="text-xl font-semibold">
        {en
          ? "Your data and account deletion"
          : "Datele tale și ștergerea contului"}
      </h2>
      <p className="mt-3 text-sm">
        {en
          ? "Download your data before deleting your account. Deletion removes profile data, unused addresses, reviews, your wishlist and saved card records, and closes access. Transaction records and a minimal request audit may be retained for legal obligations and claims."
          : "Descarcă datele înainte de ștergerea contului. Ștergerea elimină datele profilului, adresele nefolosite în comenzi, recenziile, lista de dorințe și cardurile salvate și închide accesul. Evidențele tranzacțiilor și dovada minimă a solicitării pot fi păstrate pentru obligații legale și apărarea drepturilor."}
      </p>
      <p className="mt-3 text-sm">
        {en
          ? "Open orders or returns require a recorded request and manual review. Administrative and supplier accounts require contacting support. For external providers or other retained records, contact info@techtots.ro; requests receive a response within one month."
          : "Comenzile sau retururile în curs necesită înregistrarea cererii și verificare manuală. Pentru conturile administrative și de furnizor, contactează asistența. Pentru furnizori externi sau alte evidențe păstrate, scrie la info@techtots.ro; răspundem cererilor în cel mult o lună."}
      </p>
      <a
        className="mt-4 inline-block font-medium text-blue-700 underline"
        href="/api/gdpr/export"
      >
        {en ? "Download my data (JSON)" : "Descarcă datele mele (JSON)"}
      </a>
      <label className="my-4 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={confirmed}
          disabled={busy}
          onChange={event => setConfirmed(event.target.checked)}
          className="mt-1"
        />
        <span>
          {en
            ? "I confirm deletion of my account data. This action cannot be undone."
            : "Confirm ștergerea datelor contului. Această acțiune nu poate fi anulată."}
        </span>
      </label>
      <Button
        type="button"
        variant="destructive"
        disabled={!confirmed || busy}
        onClick={deleteAccount}
      >
        {busy
          ? en
            ? "Processing…"
            : "Se procesează…"
          : en
            ? "Delete my account"
            : "Șterge contul meu"}
      </Button>
      {message && (
        <p role={failed ? "alert" : "status"} className="mt-4 text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
