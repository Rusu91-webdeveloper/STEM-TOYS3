"use client";
import Link from "next/link";
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
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  emailSequenceList,
  emailTemplateList,
  savedEmailSequence,
} from "@/lib/admin/email-contracts";
import { useEmailResource } from "@/lib/admin/use-email-resource";
type Sequence = z.infer<typeof savedEmailSequence>;
const triggers = [
  "USER_REGISTRATION",
  "FIRST_PURCHASE",
  "ABANDONED_CART",
  "ORDER_PLACED",
  "ORDER_SHIPPED",
  "ORDER_DELIVERED",
  "INACTIVE_USER",
  "BIRTHDAY",
  "CUSTOM",
];
const initial = {
  name: "",
  description: "",
  trigger: "USER_REGISTRATION",
  maxEmails: 5,
  cooldownHours: 24,
  isActive: false,
  steps: [] as { templateId: string; delayHours: number }[],
};
export default function EmailSequencesPage() {
  const [templateSearch, setTemplateSearch] = useState("");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Sequence | "new" | null>(null);
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState<Sequence | null>(null);
  const list = useEmailResource(
    `/api/admin/email-sequences?${new URLSearchParams({ page: String(page), search })}`,
    emailSequenceList
  );
  const templates = useEmailResource(
    `/api/admin/email-templates?${new URLSearchParams({ limit: "100", isActive: "true", search: templateSearch })}`,
    emailTemplateList
  );
  const edit = (sequence?: Sequence) => {
    setEditing(sequence ?? "new");
    setForm(
      sequence
        ? {
            name: sequence.name,
            description: sequence.description ?? "",
            trigger: sequence.trigger,
            maxEmails: sequence.maxEmails,
            cooldownHours: sequence.cooldownHours,
            isActive: sequence.isActive,
            steps: sequence.steps.map(step => ({
              templateId: step.templateId,
              delayHours: step.delayHours,
            })),
          }
        : { ...initial, steps: [] }
    );
  };
  const mutate = async (url: string, method: string, body?: unknown) => {
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
      toast.success("Modificarea a fost salvată");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Operațiunea a eșuat"
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="min-w-0 space-y-5 p-4 sm:p-6">
      <AlertDialog
        open={deleting !== null}
        onOpenChange={open => {
          if (!open) setDeleting(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Șterge secvența</AlertDialogTitle>
            <AlertDialogDescription>
              Ștergi secvența „{deleting?.name}”? Această acțiune nu poate fi
              anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Renunță</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() => {
                if (deleting)
                  void mutate(
                    `/api/admin/email-sequences/${deleting.id}`,
                    "DELETE"
                  );
              }}
            >
              Șterge
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <h1 className="text-3xl font-bold">Secvențe email</h1>
      <p className="text-slate-600">
        Secvențele și pașii salvați în baza de date. Numărul participanților
        provine din înscrierile existente.
      </p>
      <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
        Activarea salvează configurația. Înregistrarea participanților și
        procesarea automată depind de motorul de automatizare; pagina nu
        certifică funcționarea lui și nu trimite emailuri la salvare.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => edit()}>Creează secvență</Button>
        <Button asChild variant="outline">
          <Link href="/admin/email-automation">Istoric și statistici</Link>
        </Button>
        <Button
          variant="outline"
          disabled={list.loading}
          onClick={() => void list.refresh()}
        >
          Reîncarcă
        </Button>
      </div>
      <Input
        aria-label="Caută secvențe"
        placeholder="Numele secvenței"
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
              {editing === "new" ? "Secvență nouă" : `Editează ${editing.name}`}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault();
                const { steps, ...fields } = form;
                void mutate(
                  editing === "new"
                    ? "/api/admin/email-sequences"
                    : `/api/admin/email-sequences/${editing.id}`,
                  editing === "new" ? "POST" : "PUT",
                  editing !== "new" && editing._count.users > 0
                    ? fields
                    : { ...fields, steps }
                );
              }}
            >
              <div>
                <Label htmlFor="sequence-name">Nume</Label>
                <Input
                  id="sequence-name"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="sequence-description">Descriere</Label>
                <Input
                  id="sequence-description"
                  value={form.description}
                  onChange={e =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>
              <div className="flex flex-wrap gap-4">
                <label>
                  Eveniment{" "}
                  <select
                    className="block rounded border p-2"
                    value={form.trigger}
                    onChange={e =>
                      setForm({ ...form, trigger: e.target.value })
                    }
                  >
                    {Array.from(new Set([...triggers, form.trigger])).map(
                      trigger => (
                        <option key={trigger}>{trigger}</option>
                      )
                    )}
                  </select>
                </label>
                <label>
                  Limită emailuri{" "}
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={form.maxEmails}
                    onChange={e =>
                      setForm({ ...form, maxEmails: Number(e.target.value) })
                    }
                  />
                </label>
                <label>
                  Reînscriere după (ore){" "}
                  <Input
                    type="number"
                    min={0}
                    value={form.cooldownHours}
                    onChange={e =>
                      setForm({
                        ...form,
                        cooldownHours: Number(e.target.value),
                      })
                    }
                  />
                </label>
              </div>
              <label className="flex gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                />
                Configurație activă
              </label>
              <fieldset
                disabled={
                  busy || (editing !== "new" && editing._count.users > 0)
                }
                className="space-y-3"
              >
                <legend className="font-medium">
                  Pași în ordinea trimiterii
                </legend>
                <Input
                  aria-label="Caută șabloane pentru secvență"
                  placeholder="Caută șablonul după nume"
                  value={templateSearch}
                  onChange={e => setTemplateSearch(e.target.value)}
                />
                {templates.error && (
                  <p role="alert">
                    Șabloanele nu au putut fi încărcate.{" "}
                    <button
                      type="button"
                      className="underline"
                      onClick={() => void templates.refresh()}
                    >
                      Reîncearcă
                    </button>
                  </p>
                )}
                {form.steps.map((step, index) => (
                  <div
                    key={index}
                    className="flex flex-wrap items-end gap-3 rounded border p-3"
                  >
                    <label>
                      Pas {index + 1}
                      <select
                        aria-label={`Șablon pas ${index + 1}`}
                        required
                        className="block max-w-full rounded border p-2"
                        value={step.templateId}
                        onChange={e =>
                          setForm({
                            ...form,
                            steps: form.steps.map((item, i) =>
                              i === index
                                ? { ...item, templateId: e.target.value }
                                : item
                            ),
                          })
                        }
                      >
                        <option value="">Alege șablonul</option>
                        {templates.data?.templates.map(template => (
                          <option key={template.id} value={template.id}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label htmlFor={`sequence-delay-${index}`}>
                      Întârziere (ore)
                      <Input
                        id={`sequence-delay-${index}`}
                        type="number"
                        min={0}
                        max={8760}
                        value={step.delayHours}
                        onChange={e =>
                          setForm({
                            ...form,
                            steps: form.steps.map((item, i) =>
                              i === index
                                ? {
                                    ...item,
                                    delayHours: Number(e.target.value),
                                  }
                                : item
                            ),
                          })
                        }
                      />
                    </label>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() =>
                        setForm({
                          ...form,
                          steps: form.steps.filter((_, i) => i !== index),
                        })
                      }
                    >
                      Elimină pasul
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  disabled={
                    form.steps.length >= form.maxEmails ||
                    templates.loading ||
                    !!templates.error
                  }
                  onClick={() =>
                    setForm({
                      ...form,
                      steps: [...form.steps, { templateId: "", delayHours: 0 }],
                    })
                  }
                >
                  Adaugă pas
                </Button>
              </fieldset>
              {editing !== "new" && editing._count.users > 0 && (
                <p className="text-sm">
                  Pașii sunt protejați deoarece există participanți în această
                  secvență.
                </p>
              )}
              <div className="flex gap-3">
                <Button type="submit" disabled={busy}>
                  Salvează
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
      {list.loading ? (
        <p role="status">Se încarcă secvențele…</p>
      ) : list.error ? (
        <div role="alert">
          <p>{list.error}</p>
          <Button onClick={() => void list.refresh()}>Reîncearcă</Button>
        </div>
      ) : (
        list.data && (
          <>
            <p>{list.data.pagination.total} secvențe salvate</p>
            {!list.data.sequences.length ? (
              <p>Nu există secvențe pentru această selecție.</p>
            ) : (
              list.data.sequences.map(sequence => (
                <Card key={sequence.id}>
                  <CardHeader>
                    <CardTitle>{sequence.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p>{sequence.description}</p>
                    <p className="text-sm">
                      {sequence.isActive
                        ? "Configurație activă"
                        : "Configurație inactivă"}{" "}
                      · {sequence.trigger} · {sequence._count.steps} pași ·{" "}
                      {sequence._count.users} participanți înscriși
                    </p>
                    <ol className="space-y-1">
                      {sequence.steps.map(step => (
                        <li key={step.id}>
                          {step.order}. {step.subject} — întârziere{" "}
                          {step.delayHours} ore
                        </li>
                      ))}
                    </ol>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() => edit(sequence)}
                      >
                        Editează
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy}
                        onClick={() =>
                          void mutate(
                            `/api/admin/email-sequences/${sequence.id}`,
                            "PUT",
                            { isActive: !sequence.isActive }
                          )
                        }
                      >
                        {sequence.isActive ? "Dezactivează" : "Activează"}
                      </Button>
                      <Button
                        variant="outline"
                        disabled={busy || sequence._count.users > 0}
                        onClick={() => setDeleting(sequence)}
                      >
                        Șterge
                      </Button>
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
