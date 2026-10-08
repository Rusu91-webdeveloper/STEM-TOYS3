import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PillarSection from "@/features/home/components/PillarSection";

describe("PillarSection", () => {
  it("renders four pillar links with correct hrefs", () => {
    render(<PillarSection />);

    const links = [
      { name: /Ghid STEM 2026/i, href: "/ghid-jucarii-stem-2026" },
      { name: /Găsește un cadou/i, href: "/alege-cadoul" },
      { name: /Beneficii STEM/i, href: "/beneficiile-jucariilor-stem" },
      { name: /Întrebări frecvente/i, href: "/faq" },
    ];

    links.forEach(({ name, href }) => {
      const anchor = screen.getByRole("link", { name: name });
      expect(anchor).toHaveAttribute("href", href);
    });
  });
});
