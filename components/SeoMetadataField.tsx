"use client";

import { Info } from "lucide-react";
import { useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SeoMetadata = {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonical?: string;
};

interface SeoMetadataFieldProps {
  value: string | Record<string, any> | null;
  onChange: (value: string) => void;
  name?: string;
  label?: string;
  description?: string;
  defaultTitle?: string;
  defaultDescription?: string;
}

export default function SeoMetadataField({
  value,
  onChange,
  name = "metadata",
  label = "SEO Metadata",
  description = "Optimize search engine visibility by providing custom metadata",
  defaultTitle = "",
  defaultDescription = "",
}: SeoMetadataFieldProps) {
  // Parse existing metadata or create default structure
  const [metadata, setMetadata] = useState<SeoMetadata>(() => {
    if (!value)
      return {
        metaTitle: defaultTitle,
        metaDescription: defaultDescription,
        keywords: [],
      };

    if (typeof value === "string") {
      try {
        return JSON.parse(value);
      } catch {
        return {
          metaTitle: defaultTitle,
          metaDescription: defaultDescription,
          keywords: [],
        };
      }
    }

    return value as SeoMetadata;
  });

  // Update metadata and propagate changes to parent form
  const updateMetadata = (updatedData: Partial<SeoMetadata>) => {
    const newMetadata = { ...metadata, ...updatedData };
    setMetadata(newMetadata);
    onChange(JSON.stringify(newMetadata));
  };

  // Handle keywords input (comma separated)
  const handleKeywordsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const keywordsText = e.target.value;
    const keywordsArray = keywordsText
      .split(",")
      .map((k) => k.trim())
      .filter((k) => k);
    updateMetadata({ keywords: keywordsArray });
  };

  // Format keywords for display
  const keywordsForDisplay = metadata.keywords?.join(", ") || "";

  return (
    <div className="space-y-4 rounded-md border p-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{label}</Label>
        <Button
          variant="ghost"
          size="icon"
          title={description}>
          <Info className="h-4 w-4" />
        </Button>
      </div>

      <Accordion
        type="single"
        collapsible
        className="w-full">
        <AccordionItem value="seo-metadata">
          <AccordionTrigger>SEO Settings</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor={`${name}-title`}>
                  Meta Title{" "}
                  <span className="text-xs text-muted-foreground">
                    (50-60 characters)
                  </span>
                </Label>
                <Input
                  id={`${name}-title`}
                  value={metadata.metaTitle || ""}
                  onChange={(e) =>
                    updateMetadata({ metaTitle: e.target.value })
                  }
                  placeholder="Enter SEO-friendly title"
                  maxLength={60}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {metadata.metaTitle?.length || 0}/60
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${name}-description`}>
                  Meta Description{" "}
                  <span className="text-xs text-muted-foreground">
                    (120-160 characters)
                  </span>
                </Label>
                <Textarea
                  id={`${name}-description`}
                  value={metadata.metaDescription || ""}
                  onChange={(e) =>
                    updateMetadata({ metaDescription: e.target.value })
                  }
                  placeholder="Enter SEO-friendly description"
                  maxLength={160}
                  rows={3}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {metadata.metaDescription?.length || 0}/160
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${name}-keywords`}>
                  Keywords{" "}
                  <span className="text-xs text-muted-foreground">
                    (comma-separated)
                  </span>
                </Label>
                <Textarea
                  id={`${name}-keywords`}
                  value={keywordsForDisplay}
                  onChange={handleKeywordsChange}
                  placeholder="e.g., STEM toys, educational, science kit"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`${name}-canonical`}>
                  Canonical URL{" "}
                  <span className="text-xs text-muted-foreground">
                    (optional)
                  </span>
                </Label>
                <Input
                  id={`${name}-canonical`}
                  value={metadata.canonical || ""}
                  onChange={(e) =>
                    updateMetadata({ canonical: e.target.value })
                  }
                  placeholder="https://techtots.com/your-canonical-path"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
