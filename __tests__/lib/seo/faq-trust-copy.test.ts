import fs from "node:fs";
import path from "node:path";

import { FAQ_ITEMS, FAQ_STRUCTURED_DATA } from "@/app/faq/content";

const projectRoot = process.cwd();

describe("FAQ trust copy", () => {
  it("keeps the visible questions and FAQPage schema identical", () => {
    expect(FAQ_STRUCTURED_DATA.mainEntity).toEqual(
      FAQ_ITEMS.map(({ question, answer }) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: {
          "@type": "Answer",
          text: answer,
        },
      }))
    );
  });

  it("contains no unsupported proof or urgency claims in FAQ source", () => {
    const faqSource = ["content.ts", "metadata.ts", "page.tsx"]
      .map(file =>
        fs.readFileSync(path.join(projectRoot, "app", "faq", file), "utf8")
      )
      .join("\n");

    expect(faqSource).not.toMatch(
      /10[.,]?000|10k|50[.,]?000|50k|87\s*%|92\s*%|families worldwide|4[.,]9\s*\/\s*5|sarah\s+m\.?|50 spots|quality guaranteed|stop worrying/i
    );
  });

  it("keeps the rocket description and shipping canonical accurate", () => {
    const giftPage = fs.readFileSync(
      path.join(projectRoot, "app", "cadouri-stem-6-8-ani", "page.tsx"),
      "utf8"
    );
    const shippingPage = fs.readFileSync(
      path.join(projectRoot, "app", "shipping", "page.tsx"),
      "utf8"
    );

    expect(giftPage).toContain("propulsie pe apă și presiunea");
    expect(giftPage).not.toContain("Crești cristale acasă");
    expect(shippingPage).toContain(
      'canonical: "https://www.techtots.ro/shipping"'
    );
  });
});
