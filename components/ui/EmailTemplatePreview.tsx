"use client";

import { Eye, Mail, Monitor, Smartphone, Tablet } from "lucide-react";
import { useState } from "react";

import { Badge } from "./badge";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

interface EmailTemplatePreviewProps {
  template: {
    id: string;
    name: string;
    subject: string;
    content: string;
    category: string;
    variables: string[];
  };
  className?: string;
}

export function EmailTemplatePreview({
  template,
  className = "",
}: EmailTemplatePreviewProps) {
  const [previewMode, setPreviewMode] = useState<
    "desktop" | "tablet" | "mobile"
  >("desktop");
  const widths = { desktop: "100%", tablet: "768px", mobile: "375px" };
  const variables = Array.from(
    new Set([
      ...template.variables,
      ...Array.from(
        (template.subject + template.content).matchAll(/\{\{([^}]+)\}\}/g),
        match => match[1].trim()
      ),
    ])
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Eye className="h-5 w-5" /> Previzualizare șablon
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1" aria-label="Lățime previzualizare">
              {(
                [
                  ["desktop", "Desktop", Monitor],
                  ["tablet", "Tabletă", Tablet],
                  ["mobile", "Telefon", Smartphone],
                ] as const
              ).map(([mode, label, Icon]) => (
                <Button
                  key={mode}
                  aria-label={label}
                  aria-pressed={previewMode === mode}
                  variant={previewMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode(mode)}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
            <Badge variant="secondary">{template.category}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Conținutul salvat este afișat fără date de exemplu. Variabilele
            rămân vizibile până când sunt completate la trimitere.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Tabs defaultValue="preview">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="preview">
                <Mail className="mr-2 h-4 w-4" /> Email
              </TabsTrigger>
              <TabsTrigger value="source">HTML salvat</TabsTrigger>
            </TabsList>
            <TabsContent value="preview" className="p-3 sm:p-6">
              <p className="mb-3 break-words font-medium">{template.subject}</p>
              <div className="flex justify-center overflow-x-auto">
                <iframe
                  title={`Conținut email: ${template.name}`}
                  sandbox=""
                  referrerPolicy="no-referrer"
                  srcDoc={template.content}
                  className="h-[600px] max-w-full rounded border bg-white"
                  style={{ width: widths[previewMode] }}
                />
              </div>
            </TabsContent>
            <TabsContent value="source" className="p-4">
              <p className="mb-3 break-words font-mono text-sm">
                {template.subject}
              </p>
              <pre className="max-h-96 overflow-auto rounded bg-muted p-4 text-xs">
                <code>{template.content}</code>
              </pre>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      {variables.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Variabile de completat</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {variables.map(variable => (
              <code key={variable} className="rounded bg-muted p-2 text-xs">
                {`{{${variable}}}`}
              </code>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
