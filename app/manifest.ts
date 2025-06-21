import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TechTots - STEM Toys for Curious Minds",
    short_name: "TechTots",
    description:
      "Discover the best STEM toys for curious minds at TechTots. Educational toys that make learning fun.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#4F46E5",
    icons: [
      {
        src: "/TechTots_LOGO.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
