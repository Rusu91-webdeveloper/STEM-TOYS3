import { createMetadata } from "@/lib/metadata";

export const metadata = createMetadata({
  title:
    "STEM Toy Categories | Science, Technology, Engineering, Math & Educational Books",
  description:
    "Explore our comprehensive collection of STEM educational toys organized by categories: Science experiments, Technology gadgets, Engineering kits, Math games, and Educational books for children.",
  keywords: [
    "STEM toys",
    "educational toys",
    "science toys",
    "technology toys",
    "engineering toys",
    "math toys",
    "educational books",
    "children learning",
    "STEM education",
  ],
  openGraph: {
    title: "STEM Toy Categories - Educational Learning Categories",
    description:
      "Discover STEM educational toys in Science, Technology, Engineering, Math, and Educational Books categories. Perfect for children's learning and development.",
    type: "website",
    images: [
      {
        url: "/images/category_banner_science_01.png",
        width: 1200,
        height: 630,
        alt: "STEM Toy Categories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "STEM Toy Categories - Educational Learning",
    description:
      "Explore Science, Technology, Engineering, Math, and Educational Books categories for children's STEM education.",
    images: ["/images/category_banner_science_01.png"],
  },
});
