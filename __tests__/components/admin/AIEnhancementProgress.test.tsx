/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { AIEnhancementProgress } from "@/components/admin/AIEnhancementProgress";
import { EnhancementProgress } from "@/lib/ai";

describe("AIEnhancementProgress", () => {
  const mockProgress: EnhancementProgress = {
    total: 10,
    processed: 5,
    successful: 4,
    failed: 1,
    errors: [{ product: "Test Product", error: "Test error" }],
    startTime: Date.now(),
    estimatedTimeRemaining: 5000,
  };

  it("should render progress component with valid progress data", () => {
    render(<AIEnhancementProgress progress={mockProgress} />);

    expect(screen.getByText("AI Enhancement Progress")).toBeInTheDocument();
    expect(screen.getByText("5 / 10 products")).toBeInTheDocument();
    expect(screen.getByText("50.0% complete")).toBeInTheDocument();
  });

  it("should not render when progress is null", () => {
    const { container } = render(
      <AIEnhancementProgress progress={null as any} />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should display error information when errors exist", () => {
    render(<AIEnhancementProgress progress={mockProgress} />);

    expect(screen.getByText("Recent Errors:")).toBeInTheDocument();
    expect(screen.getByText("Test Product:")).toBeInTheDocument();
    expect(screen.getByText("Test error")).toBeInTheDocument();
  });

  it("should display completion message when processing is complete", () => {
    const completedProgress: EnhancementProgress = {
      ...mockProgress,
      processed: 10,
      total: 10,
    };

    render(<AIEnhancementProgress progress={completedProgress} />);

    expect(screen.getByText(/AI enhancement completed!/)).toBeInTheDocument();
    expect(
      screen.getByText(/4 out of 10 products were successfully enhanced/)
    ).toBeInTheDocument();
  });

  it("should handle missing startTime gracefully", () => {
    const progressWithoutStartTime = {
      ...mockProgress,
      startTime: undefined as any,
    };

    // Should not throw an error
    expect(() => {
      render(<AIEnhancementProgress progress={progressWithoutStartTime} />);
    }).not.toThrow();
  });
});
