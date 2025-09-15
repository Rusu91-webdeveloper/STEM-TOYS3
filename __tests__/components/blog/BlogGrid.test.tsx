/**
 * @jest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { BlogGrid, BlogPost } from "@/components/blog/BlogGrid";

// Mock Next.js Image component
jest.mock("next/image", () => ({
  __esModule: true,
  default: ({ src, alt, fill, ...props }: any) => (
    <img
      src={src}
      alt={alt}
      style={
        fill
          ? {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
            }
          : undefined
      }
      {...props}
    />
  ),
}));

// Mock date-fns
jest.mock("date-fns", () => ({
  format: (date: Date, formatStr: string) => "Jan 15, 2024",
}));

const mockBlogPosts: BlogPost[] = [
  {
    id: "1",
    title: "The Future of STEM Education",
    slug: "future-stem-education",
    excerpt:
      "Exploring how technology is transforming the way we teach science, technology, engineering, and mathematics.",
    coverImage: "/images/blog-1.jpg",
    stemCategory: "SCIENCE",
    publishedAt: "2024-01-15T10:00:00Z",
    author: {
      name: "Dr. Sarah Johnson",
      avatarUrl: "/images/author-1.jpg",
    },
    category: {
      id: "science",
      name: "Science",
      slug: "science",
    },
  },
  {
    id: "2",
    title: "Building Robots with Kids",
    slug: "building-robots-kids",
    excerpt:
      "A comprehensive guide to introducing robotics concepts to children through hands-on projects.",
    coverImage: null,
    stemCategory: "TECHNOLOGY",
    publishedAt: "2024-01-10T14:30:00Z",
    author: {
      name: "TechTots Team",
      avatarUrl: null,
    },
    category: {
      id: "technology",
      name: "Technology",
      slug: "technology",
    },
  },
];

const mockGetDefaultImage = (category: string) =>
  `/images/default-${category.toLowerCase()}.jpg`;

describe("BlogGrid", () => {
  it("renders blog posts correctly", () => {
    render(
      <BlogGrid
        blogPosts={mockBlogPosts}
        isLoading={false}
        error={null}
        getDefaultImage={mockGetDefaultImage}
      />
    );

    expect(
      screen.getByText("The Future of STEM Education")
    ).toBeInTheDocument();
    expect(screen.getByText("Building Robots with Kids")).toBeInTheDocument();
    expect(screen.getByText("Dr. Sarah Johnson")).toBeInTheDocument();
    expect(screen.getByText("TechTots Team")).toBeInTheDocument();
  });

  it("renders loading state correctly", () => {
    render(
      <BlogGrid
        blogPosts={[]}
        isLoading={true}
        error={null}
        getDefaultImage={mockGetDefaultImage}
      />
    );

    // Should render skeleton cards (check for grid with skeleton elements)
    const grid = document.querySelector(".grid");
    expect(grid).toBeInTheDocument();
    expect(grid?.children.length).toBeGreaterThan(0);
  });

  it("renders error state correctly", () => {
    const errorMessage = "Failed to fetch blog posts";
    render(
      <BlogGrid
        blogPosts={[]}
        isLoading={false}
        error={errorMessage}
        getDefaultImage={mockGetDefaultImage}
      />
    );

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it("renders empty state correctly", () => {
    render(
      <BlogGrid
        blogPosts={[]}
        isLoading={false}
        error={null}
        getDefaultImage={mockGetDefaultImage}
      />
    );

    expect(screen.getByText("No blog posts found")).toBeInTheDocument();
    expect(
      screen.getByText("Check back soon for new articles and insights!")
    ).toBeInTheDocument();
  });

  it("has proper responsive grid layout", () => {
    const { container } = render(
      <BlogGrid
        blogPosts={mockBlogPosts}
        isLoading={false}
        error={null}
        getDefaultImage={mockGetDefaultImage}
      />
    );

    const grid = container.querySelector(".grid");
    expect(grid).toHaveClass("grid-cols-2", "lg:grid-cols-3");
  });

  it("displays category badges correctly", () => {
    render(
      <BlogGrid
        blogPosts={mockBlogPosts}
        isLoading={false}
        error={null}
        getDefaultImage={mockGetDefaultImage}
      />
    );

    expect(screen.getByText("Science")).toBeInTheDocument();
    expect(screen.getByText("Technology")).toBeInTheDocument();
  });

  it("handles missing cover images with default images", () => {
    render(
      <BlogGrid
        blogPosts={mockBlogPosts}
        isLoading={false}
        error={null}
        getDefaultImage={mockGetDefaultImage}
      />
    );

    // The second post has no cover image, so it should use the default
    const images = screen.getAllByRole("img");
    expect(images.length).toBeGreaterThan(0);
  });

  it("displays formatted dates correctly", () => {
    render(
      <BlogGrid
        blogPosts={mockBlogPosts}
        isLoading={false}
        error={null}
        getDefaultImage={mockGetDefaultImage}
      />
    );

    // Should show formatted dates
    expect(screen.getAllByText("Jan 15, 2024")).toHaveLength(2);
  });
});
