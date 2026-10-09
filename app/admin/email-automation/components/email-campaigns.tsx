"use client";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  emailCampaignList,
  emailTemplateList,
  savedEmailCampaign,
} from "@/lib/admin/email-contracts";
import { useEmailResource } from "@/lib/admin/use-email-resource";
type Campaign = z.infer<typeof savedEmailCampaign>;
const empty = {
  name: "",
  description: "",
  templateId: "",
  subject: "",
  content: "",
};
const statuses: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Acceptată de furnizor",
  SENDING: "În procesare",
  PAUSED: "În pauză — verifică rezultatele",
  SCHEDULED: "Programată în baza de date",
  CANCELLED: "Anulată",
};
export function EmailCampaigns() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const list = useEmailResource(
    `/api/admin/email-campaigns?${new URLSearchParams({ page: String(page), search })}`,
    emailCampaignList
  );
  const templates = useEmailResource(
    `/api/admin/email-templates?${new URLSearchParams({ limit: "100", isActive: "true", search: templateSearch })}`,
    emailTemplateList
  );
  const [editing, setEditing] = useState<Campaign | "new" | null>(null);
  const [form, setForm] = useState(empty);
  const [selected, setSelected] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState("");
  const [testMode, setTestMode] = useState(true);
  const [busy, setBusy] = useState(false);
  const [sendResult, setSendResult] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<"send" | Campaign | null>(
    null
  );
  const update = async (url: string, method: string, body?: unknown) => {
    setBusy(true);
    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Operațiunea a eșuat");
      setEditing(null);
      await list.refresh();
      toast.success("Campania a fost salvată");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Operațiunea a eșuat"
      );
    } finally {
      setBusy(false);
    }
  };
  const send = async () => {
    if (!selected) return;
    const recipientEmails = [
      ...new Set(
        recipients
          .split(/[\s,;]+/)
          .filter(Boolean)
          .map(email => email.toLowerCase())
      ),
    ];
    if (!recipientEmails.length) {
      setSendResult("Introdu cel puțin o adresă email.");
      return;
    }
    setBusy(true);
    setSendResult(null);
    try {
      const response = await fetch(
        `/api/admin/email-campaigns/${selected.id}/send`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recipientEmails, testMode }),
        }
      );
      const result = await response.json();
      if (result.summary) {
        setSendResult(
          `${result.summary.successful} acceptate de furnizor, ${result.summary.failed} eșuate. ${result.results
            .filter((item: { success: boolean }) => !item.success)
            .map(
              (item: { email: string; error?: string }) =>
                `${item.email}: ${item.error ?? "Eșuat"}`
            )
            .join("; ")}`
        );
        await list.refresh();
        if (!testMode) {
          setSelected({
            ...selected,
            status: result.summary.failed ? "PAUSED" : "SENT",
          });
        }
      } else throw new Error(result.error || "Trimiterea a eșuat");
    } catch (error) {
      setSendResult(
        error instanceof Error ? error.message : "Trimiterea a eșuat"
      );
    } finally {
      setBusy(false);
    }
  };
  const edit = (campaign?: Campaign) => {
    setEditing(campaign ?? "new");
    setForm(
      campaign
        ? {
            name: campaign.name,
            description: campaign.description ?? "",
            templateId: campaign.templateId,
            subject: campaign.subject,
            content: campaign.content,
          }
        : empty
    );
  };
  return (
    <div className="space-y-4">
      <AlertDialog
        open={confirmation !== null}
        onOpenChange={open => {
          if (!open) setConfirmation(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmation === "send"
                ? "Confirmă trimiterea"
                : "Șterge draftul"}
            </AlertDialogTitle>
            <AlertDialogDescription className="break-all">
              {confirmation === "send"
                ? `Trimiți ${testMode ? "testul" : "campania"} „${selected?.name}” către: ${recipients}`
                : `Ștergi draftul „${confirmation?.name}”? Această acțiune nu poate fi anulată.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Renunță</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() => {
                if (confirmation === "send") void send();
                else if (confirmation)
                  void update(
                    `/api/admin/email-campaigns/${confirmation.id}`,
                    "DELETE"
                  );
              }}
            >
              Confirmă
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <h2 className="text-xl font-semibold">Campanii email</h2>
      <p className="text-sm text-slate-600">
        Creează un draft dintr-un șablon, verifică subiectul și conținutul, apoi
        alege explicit destinatarii. Campaniile pot fi trimise către abonați
        activi; un test folosește o singură adresă.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => edit()}>Creează campanie</Button>
        <Button
          variant="outline"
          disabled={list.loading}
          onClick={() => void list.refresh()}
        >
          Reîncarcă
        </Button>
      </div>
      <Input
        aria-label="Caută campanii"
        placeholder="Numele campaniei"
        value={search}
        onChange={e => {
          setPage(1);
          setSearch(e.target.value);
        }}
      />
      {editing && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editing === "new" ? "Campanie nouă" : "Editează draftul"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault();
                const { templateId, ...fields } = form;
                void update(
                  editing === "new"
                    ? "/api/admin/email-campaigns"
                    : `/api/admin/email-campaigns/${editing.id}`,
                  editing === "new" ? "POST" : "PUT",
                  editing === "new" ? { ...fields, templateId } : fields
                );
              }}
            >
              <label htmlFor="campaign-name" className="block">
                Nume
                <Input
                  id="campaign-name"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </label>
              {editing === "new" && (
                <div className="space-y-2">
                  <Input
                    aria-label="Caută șabloane pentru campanie"
                    placeholder="Caută șablonul după nume"
                    value={templateSearch}
                    onChange={e => setTemplateSearch(e.target.value)}
                  />
                  {templates.error ? (
                    <div role="alert">
                      {templates.error}
                      <Button
                        type="button"
                        onClick={() => void templates.refresh()}
                      >
                        Reîncearcă
                      </Button>
                    </div>
                  ) : (
                    <label className="block">
                      Șablon
                      <select
                        required
                        className="block w-full rounded border p-2"
                        value={form.templateId}
                        onChange={e => {
                          const template = templates.data?.templates.find(
                            item => item.id === e.target.value
                          );
                          if (template)
                            setForm({
                              ...form,
                              templateId: template.id,
                              subject: template.subject,
                              content: template.content,
                            });
                        }}
                      >
                        <option value="">Alege șablonul activ</option>
                        {templates.data?.templates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </div>
              )}
              <label htmlFor="campaign-description" className="block">
                Descriere
                <Input
                  id="campaign-description"
                  value={form.description}
                  onChange={e =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </label>
              <label htmlFor="campaign-subject" className="block">
                Subiect
                <Input
                  id="campaign-subject"
                  required
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                />
              </label>
              <label htmlFor="campaign-content" className="block">
                Conținut HTML
                <Textarea
                  id="campaign-content"
                  required
                  rows={8}
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                />
              </label>
              <p className="text-sm text-slate-500">
                Completează variabilele șablonului înainte de trimitere. Draftul
                păstrează conținutul ales; salvarea nu trimite emailuri.
              </p>
              <div className="flex gap-3">
                <Button disabled={busy} type="submit">
                  Salvează draftul
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(null)}
                >
                  Renunță
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
      {selected && (
        <Card>
          <CardHeader>
            <CardTitle>Previzualizare: {selected.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="font-medium">{selected.subject}</p>
            <iframe
              title="Previzualizare campanie"
              sandbox=""
              referrerPolicy="no-referrer"
              srcDoc={selected.content}
              className="h-80 w-full rounded border bg-white"
            />
            {selected.status === "DRAFT" && (
              <>
                <label htmlFor="campaign-recipients" className="block">
                  Destinatari
                  <Textarea
                    id="campaign-recipients"
                    rows={3}
                    value={recipients}
                    onChange={e => setRecipients(e.target.value)}
                    placeholder="Introdu adresele, separate prin virgulă sau pe linii diferite"
                  />
                </label>
                <label className="flex gap-2">
                  <input
                    type="checkbox"
                    checked={testMode}
                    onChange={e => setTestMode(e.target.checked)}
                  />
                  Trimitere de test către o singură adresă (nu încheie campania)
                </label>
                <Button disabled={busy} onClick={() => setConfirmation("send")}>
                  {busy
                    ? "Se trimite…"
                    : testMode
                      ? "Trimite testul"
                      : "Trimite campania"}
                </Button>
              </>
            )}
            {sendResult && (
              <p role="status" className="break-words rounded border p-3">
                {sendResult}
              </p>
            )}
            <Button
              variant="outline"
              onClick={() => {
                setSelected(null);
                setSendResult(null);
              }}
            >
              Închide
            </Button>
          </CardContent>
        </Card>
      )}
      {list.loading ? (
        <p role="status">Se încarcă campaniile…</p>
      ) : list.error ? (
        <div role="alert">
          <p>{list.error}</p>
          <Button onClick={() => void list.refresh()}>Reîncearcă</Button>
        </div>
      ) : (
        list.data && (
          <>
            <p>{list.data.pagination.total} campanii salvate</p>
            {!list.data.campaigns.length ? (
              <p>Nu există campanii pentru această selecție.</p>
            ) : (
              list.data.campaigns.map(campaign => (
                <Card key={campaign.id}>
                  <CardHeader>
                    <CardTitle>{campaign.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">
                      {statuses[campaign.status]} · {campaign.template.name}
                    </p>
                    <p>{campaign.subject}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelected(campaign);
                          setRecipients("");
                          setTestMode(true);
                          setSendResult(null);
                        }}
                      >
                        Previzualizare și trimitere
                      </Button>
                      {campaign.status === "DRAFT" && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => edit(campaign)}
                          >
                            Editează
                          </Button>
                          <Button
                            variant="outline"
                            disabled={busy}
                            onClick={() => setConfirmation(campaign)}
                          >
                            Șterge draftul
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
              >
                Înapoi
              </Button>
              <span>Pagina {page}</span>
              <Button
                variant="outline"
                disabled={page >= list.data.pagination.pages}
                onClick={() => setPage(page + 1)}
              >
                Înainte
              </Button>
            </div>
          </>
        )
      )}
    </div>
  );
}
