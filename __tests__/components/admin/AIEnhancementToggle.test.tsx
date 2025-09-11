/**
 * AI Enhancement Toggle Component Tests
 * Unit tests for AI enhancement toggle component
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { AIEnhancementToggle } from "@/components/admin/AIEnhancementToggle";
import { EnhancementOptions } from "@/lib/ai";

describe("AIEnhancementToggle", () => {
  const defaultOptions: EnhancementOptions = {
    includeRomanianOptimization: true,
    includeSEOMetadata: true,
    includeLearningOutcomes: true,
    includeAgeGroup: true,
    includeStemDiscipline: true,
    includeProductType: true,
  };

  const defaultProps = {
    enabled: false,
    onToggle: jest.fn(),
    options: defaultOptions,
    onOptionsChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render with disabled state", () => {
    render(<AIEnhancementToggle {...defaultProps} />);

    expect(screen.getByText("AI Enhancement")).toBeInTheDocument();
    expect(screen.getByText("Disabled")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Use AI to automatically enhance product descriptions, generate SEO metadata, and optimize for the Romanian educational market."
      )
    ).toBeInTheDocument();
  });

  it("should render with enabled state", () => {
    render(<AIEnhancementToggle {...defaultProps} enabled={true} />);

    expect(screen.getByText("AI Enhancement")).toBeInTheDocument();
    expect(screen.getByText("Enabled")).toBeInTheDocument();
  });

  it("should call onToggle when switch is clicked", () => {
    render(<AIEnhancementToggle {...defaultProps} />);

    const switchElement = screen.getByRole("switch");
    fireEvent.click(switchElement);

    expect(defaultProps.onToggle).toHaveBeenCalledWith(true);
  });

  it("should show enhancement options when enabled", () => {
    render(<AIEnhancementToggle {...defaultProps} enabled={true} />);

    // Click to expand options
    const expandButton = screen.getByText("Enhancement Options (6/6 enabled)");
    fireEvent.click(expandButton);

    expect(
      screen.getByText("Romanian Market Optimization")
    ).toBeInTheDocument();
    expect(screen.getByText("SEO Optimization")).toBeInTheDocument();
    expect(screen.getByText("Learning Outcomes")).toBeInTheDocument();
    expect(screen.getByText("Age Group Classification")).toBeInTheDocument();
    expect(screen.getByText("STEM Discipline")).toBeInTheDocument();
    expect(screen.getByText("Product Type")).toBeInTheDocument();
  });

  it("should call onOptionsChange when option is toggled", () => {
    render(<AIEnhancementToggle {...defaultProps} enabled={true} />);

    // Expand options
    const expandButton = screen.getByText("Enhancement Options (6/6 enabled)");
    fireEvent.click(expandButton);

    // Toggle an option
    const optionSwitches = screen.getAllByRole("switch");
    const romanianOptionSwitch = optionSwitches.find(switchEl =>
      switchEl
        .closest("div")
        ?.textContent?.includes("Romanian Market Optimization")
    );

    if (romanianOptionSwitch) {
      fireEvent.click(romanianOptionSwitch);
      expect(defaultProps.onOptionsChange).toHaveBeenCalledWith({
        ...defaultOptions,
        includeRomanianOptimization: false,
      });
    }
  });

  it("should show correct count of enabled options", () => {
    const partialOptions: EnhancementOptions = {
      includeRomanianOptimization: true,
      includeSEOMetadata: false,
      includeLearningOutcomes: true,
      includeAgeGroup: false,
      includeStemDiscipline: true,
      includeProductType: false,
    };

    render(
      <AIEnhancementToggle
        {...defaultProps}
        enabled={true}
        options={partialOptions}
      />
    );

    expect(
      screen.getByText("Enhancement Options (3/6 enabled)")
    ).toBeInTheDocument();
  });

  it("should be disabled when disabled prop is true", () => {
    render(<AIEnhancementToggle {...defaultProps} disabled={true} />);

    const switchElement = screen.getByRole("switch");
    expect(switchElement).toBeDisabled();
  });

  it("should show AI enhancement benefits", () => {
    render(<AIEnhancementToggle {...defaultProps} enabled={true} />);

    // Expand options
    const expandButton = screen.getByText("Enhancement Options (6/6 enabled)");
    fireEvent.click(expandButton);

    expect(screen.getByText("AI Enhancement Benefits")).toBeInTheDocument();
    expect(
      screen.getByText(
        "• Automatically generate compelling product descriptions"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("• Optimize for Romanian educational standards")
    ).toBeInTheDocument();
    expect(
      screen.getByText("• Improve SEO with targeted keywords and metadata")
    ).toBeInTheDocument();
    expect(
      screen.getByText("• Reduce manual data entry by 80-90%")
    ).toBeInTheDocument();
  });

  it("should show option descriptions", () => {
    render(<AIEnhancementToggle {...defaultProps} enabled={true} />);

    // Expand options
    const expandButton = screen.getByText("Enhancement Options (6/6 enabled)");
    fireEvent.click(expandButton);

    expect(
      screen.getByText(
        "Align products with Romanian educational standards and curriculum"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Generate meta titles, descriptions, and keywords for better search visibility"
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Identify specific skills and competencies developed by each product"
      )
    ).toBeInTheDocument();
  });
});
