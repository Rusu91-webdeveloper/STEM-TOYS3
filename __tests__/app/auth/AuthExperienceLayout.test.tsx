/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";

import { AuthExperienceLayout } from "@/app/auth/components/AuthExperienceLayout";

describe("AuthExperienceLayout", () => {
  it("renders hero content, stats, and children", () => {
    const { container } = render(
      <AuthExperienceLayout
        eyebrow="Test Eyebrow"
        title="Test Title"
        subtitle="Test Subtitle"
        highlight="Test Highlight"
        stats={[
          { label: "Stat A", value: "100%" },
          { label: "Stat B", value: "24h" },
        ]}
      >
        <div data-testid="auth-children">Child Content</div>
      </AuthExperienceLayout>
    );

    expect(screen.getByText("Test Eyebrow")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByText("Test Subtitle")).toBeInTheDocument();
    expect(screen.getByText("Test Highlight")).toBeInTheDocument();

    const statElements = screen.getAllByRole("definition");
    expect(statElements).toHaveLength(2);
    expect(screen.getByTestId("auth-children")).toBeInTheDocument();

    const overlays = container.querySelectorAll('[aria-hidden="true"]');
    expect(overlays.length).toBeGreaterThanOrEqual(2);
  });

  it("applies home gradient classes for background continuity", () => {
    const { container } = render(
      <AuthExperienceLayout title="T" subtitle="S">
        <div>Child</div>
      </AuthExperienceLayout>
    );

    const root = container.firstChild as HTMLElement;
    expect(root).toHaveClass("bg-gradient-to-br");
    expect(root).toHaveClass("text-slate-100");
  });
});


