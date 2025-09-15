/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import {
  CategoriesGrid,
  CategoryData,
} from "@/app/categories/components/CategoriesGrid";

// Mock the translation hook
jest.mock("@/lib/i18n", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockCategories: CategoryData[] = [
  {
    id: "1",
    name: "Science",
    nameKey: "science",
    description: "Explore the wonders of science through hands-on experiments",
    slug: "science",
    image: "/images/science.jpg",
    productCount: 25,
    isActive: true,
  },
  {
    id: "2",
    name: "Technology",
    nameKey: "technology",
    description: "Discover the latest in technology and programming",
    slug: "technology",
    image: "/images/technology.jpg",
    productCount: 18,
    isActive: true,
  },
];

describe("CategoriesGrid", () => {
  it("renders categories correctly", () => {
    render(<CategoriesGrid categories={mockCategories} />);

    expect(screen.getByText("Science")).toBeInTheDocument();
    expect(screen.getByText("Technology")).toBeInTheDocument();
    expect(screen.getByText("25 produse")).toBeInTheDocument();
    expect(screen.getByText("18 produse")).toBeInTheDocument();
  });

  it("renders educational benefits for science category", () => {
    render(<CategoriesGrid categories={mockCategories} />);

    expect(screen.getByText("Curiozitate științifică")).toBeInTheDocument();
    expect(screen.getByText("Experimente practice")).toBeInTheDocument();
    expect(screen.getByText("Gândire critică")).toBeInTheDocument();
  });

  it("renders educational benefits for technology category", () => {
    render(<CategoriesGrid categories={mockCategories} />);

    expect(screen.getByText("Programare")).toBeInTheDocument();
    expect(screen.getByText("Robotică")).toBeInTheDocument();
    expect(screen.getByText("AI & Inovație")).toBeInTheDocument();
  });

  it("has proper responsive grid layout", () => {
    const { container } = render(
      <CategoriesGrid categories={mockCategories} />
    );
    const grid = container.querySelector(".grid");

    expect(grid).toHaveClass("grid-cols-1", "md:grid-cols-2");
  });

  it("shows CTA text for each category", () => {
    render(<CategoriesGrid categories={mockCategories} />);

    const ctaElements = screen.getAllByText("Explorează categoria");
    expect(ctaElements).toHaveLength(2);
  });

  it("handles empty categories array", () => {
    const { container } = render(<CategoriesGrid categories={[]} />);

    const grid = container.querySelector(".grid");
    expect(grid).toBeInTheDocument();
    expect(grid?.children).toHaveLength(0);
  });
});
