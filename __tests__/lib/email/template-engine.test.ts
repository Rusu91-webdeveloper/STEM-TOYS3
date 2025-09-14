/**
 * @jest-environment node
 */

import { TemplateEngine } from "@/lib/email/template-engine";

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    emailTemplate: {
      findUnique: jest.fn(),
    },
  },
}));

const { prisma } = require("@/lib/prisma");

describe("TemplateEngine", () => {
  const engine = new TemplateEngine();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("replaces variables and nested variables", async () => {
    prisma.emailTemplate.findUnique.mockResolvedValue({
      content: "Hello {{user.firstName}} {{user.lastName}} from {{site.name}}",
      isActive: true,
    });

    const html = await engine.renderTemplate("welcome", {
      user: { firstName: "Ana", lastName: "Pop" },
      site: { name: "TechTots" },
    });

    expect(html).toContain("Hello Ana Pop from TechTots");
  });

  it("handles conditionals", async () => {
    prisma.emailTemplate.findUnique.mockResolvedValue({
      content: "{{#if user.vip}}<p>VIP Content</p>{{/if}}<p>Always visible</p>",
      isActive: true,
    });

    const html1 = await engine.renderTemplate("vip", { user: { vip: true } });
    expect(html1).toContain("VIP Content");

    const html2 = await engine.renderTemplate("vip", { user: { vip: false } });
    expect(html2).not.toContain("VIP Content");
  });

  it("handles loops with each", async () => {
    prisma.emailTemplate.findUnique.mockResolvedValue({
      content: "<ul>{{#each products}}<li>{{this.name}}</li>{{/each}}</ul>",
      isActive: true,
    });

    const html = await engine.renderTemplate("list", {
      products: [{ name: "A" }, { name: "B" }],
    });

    expect(html).toContain("<li>A</li>");
    expect(html).toContain("<li>B</li>");
  });
});
