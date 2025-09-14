import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VariablesSchema = z.record(z.any());

export class TemplateEngine {
  async renderTemplate(
    templateSlug: string,
    variables: Record<string, unknown>
  ): Promise<string> {
    const safeVars = VariablesSchema.parse(variables || {});
    const template = await prisma.emailTemplate.findUnique({
      where: { slug: templateSlug, isActive: true },
    });

    if (!template) {
      throw new Error(`Email template '${templateSlug}' not found or inactive`);
    }

    // Start with stored content
    let content = template.content;

    // Process loops before simple replacements
    content = this.processLoops(content, safeVars);
    // Process conditionals
    content = this.processConditionals(content, safeVars);
    // Replace variables
    content = this.replaceVariables(content, safeVars);

    return content;
  }

  private replaceVariables(
    template: string,
    variables: Record<string, unknown>
  ): string {
    let result = template;

    // Simple variables {{key}}
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(
        new RegExp(`\\{\\{${key}\\}\\}`, "g"),
        String(value ?? "")
      );
    }

    // Nested variables {{a.b}}
    for (const [key, value] of Object.entries(variables)) {
      if (value && typeof value === "object" && value !== null) {
        for (const [nestedKey, nestedValue] of Object.entries(
          value as Record<string, unknown>
        )) {
          result = result.replace(
            new RegExp(`\\{\\{${key}\\.${nestedKey}\\}\\}`, "g"),
            String(nestedValue ?? "")
          );
        }
      }
    }

    return result;
  }

  private processConditionals(
    template: string,
    variables: Record<string, unknown>
  ): string {
    const conditionalRegex = /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
    return template.replace(
      conditionalRegex,
      (_match, path: string, content: string) => {
        const value = this.getValueByPath(variables, path);
        if (value) {
          // Recurse variable replacements inside block
          return this.replaceVariables(content, variables);
        }
        return "";
      }
    );
  }

  private processLoops(
    template: string,
    variables: Record<string, unknown>
  ): string {
    const eachRegex = /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g;
    return template.replace(
      eachRegex,
      (_match, path: string, block: string) => {
        const list = this.getValueByPath(variables, path);
        if (!Array.isArray(list) || list.length === 0) return "";
        return list
          .map((item: any) =>
            this.replaceVariables(block, { ...variables, this: item })
          )
          .join("");
      }
    );
  }

  private getValueByPath(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split(".");
    let current: any = obj;
    for (const part of parts) {
      if (current == null) return undefined;
      current = current[part];
    }
    return current;
  }
}
