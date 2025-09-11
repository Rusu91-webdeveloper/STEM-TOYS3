import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import PillarSection from "@/features/home/components/PillarSection";

describe("PillarSection", () => {
  it("renders four pillar links with correct hrefs", () => {
    render(<PillarSection />);

    const links = [
      { name: /Ghid 2025/i, href: "/ghid-jucarii-stem-2025" },
      { name: /După vârstă/i, href: "/jucarii-stem-dupa-varsta" },
      { name: /Beneficii STEM/i, href: "/beneficiile-jucariilor-stem" },
      { name: /FAQ/i, href: "/faq" },
    ];

    links.forEach(({ name, href }) => {
      const anchor = screen.getByRole("link", { name: name });
      expect(anchor).toHaveAttribute("href", href);
    });
  });
});


