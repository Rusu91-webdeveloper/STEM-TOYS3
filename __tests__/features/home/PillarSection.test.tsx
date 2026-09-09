import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PillarSection from "@/features/home/components/PillarSection";

describe("PillarSection", () => {
  it("renders four pillar links with correct hrefs", () => {
    render(<PillarSection />);

    const links = [
      { name: /Ghid STEM 2026/i, href: "/ghid-jucarii-stem-2026" },
      { name: /Cadouri 6–8 ani/i, href: "/cadouri-stem-6-8-ani" },
      { name: /Beneficii STEM/i, href: "/beneficiile-jucariilor-stem" },
      { name: /Întrebări frecvente/i, href: "/faq" },
    ];

    links.forEach(({ name, href }) => {
      const anchor = screen.getByRole("link", { name: name });
      expect(anchor).toHaveAttribute("href", href);
    });
  });
});
