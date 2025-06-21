"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/currency";
import { useState, useEffect } from "react";
import type { Product } from "@/types/product";
import { toast } from "@/components/ui/use-toast";

// Mock data for STEM categories
const categories = [
  {
    name: "Science",
    description: "Discover the wonders of the natural world",
    slug: "science",
    image: "/images/category_banner_science_01.png",
  },
  {
    name: "Technology",
    description: "Explore coding, robotics, and digital innovation",
    slug: "technology",
    image: "/images/category_banner_technology_01.png",
  },
  {
    name: "Engineering",
    description: "Build, design, and solve problems",
    slug: "engineering",
    image: "/images/category_banner_engineering_01.png",
  },
  {
    name: "Mathematics",
    description: "Make numbers fun and engaging",
    slug: "math",
    image: "/images/category_banner_math_01.png",
  },
  {
    name: "Educational Books",
    description: "Educational books to inspire young minds",
    slug: "educational-books",
    image: "/images/category_banner_books_01.jpg",
  },
];

export default function Home() {
  const { t, language } = useTranslation();
  const { formatPrice } = useCurrency();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch featured products from the database
  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        const response = await fetch("/api/products?featured=true");
        if (!response.ok) {
          throw new Error("Failed to fetch featured products");
        }
        const data = await response.json();

        // Limit to 4 products to display on the home page
        const limitedData = data.slice(0, 4);
        setFeaturedProducts(limitedData);
      } catch (error) {
        console.error("Error fetching featured products:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  // Translate category names and descriptions based on current language
  const translatedCategories = categories.map((category) => ({
    ...category,
    name: t(category.name as any, category.name),
    description: t(
      (category.slug + "ToysDescription") as any,
      category.description
    ),
  }));

  // Function to get a fallback image based on stem category
  const getFallbackImage = (product: Product) => {
    const stemCategory = product.attributes?.stemCategory as string | undefined;

    switch (stemCategory?.toLowerCase()) {
      case "science":
        return "https://placehold.co/600x400/10B981/FFFFFF.png?text=Science";
      case "technology":
        return "https://placehold.co/600x400/4F46E5/FFFFFF.png?text=Technology";
      case "engineering":
        return "https://placehold.co/600x400/F59E0B/FFFFFF.png?text=Engineering";
      case "mathematics":
        return "https://placehold.co/600x400/3B82F6/FFFFFF.png?text=Math";
      default:
        return "https://placehold.co/600x400/6B7280/FFFFFF.png?text=STEM+Toy";
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section - Enhanced for better visibility on all device sizes */}
      <section className="relative h-[50vh] sm:h-[60vh] md:h-[70vh] min-h-[300px] sm:min-h-[400px] md:min-h-[600px] max-h-[800px] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/homepage_hero_banner_01.png"
            alt={t("discoverCollection" as any)}
            fill
            sizes="100vw"
            style={{ objectFit: "cover" }}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
        </div>
        <div className="container relative z-10 text-white mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <div className="max-w-xl sm:max-w-2xl md:max-w-3xl">
            <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-2 md:mb-4 drop-shadow-md animate-fade-in">
              {t("inspireMinds")}
            </h1>
            <p className="text-base sm:text-lg md:text-2xl mb-4 md:mb-8 max-w-2xl drop-shadow-md animate-fade-in">
              {t("discoverCollection")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                asChild
                size="lg"
                className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-2 sm:py-5 md:py-6 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white border-0 relative overflow-hidden group animate-bounce">
                <Link
                  href="/products"
                  className="flex items-center">
                  {t("shopAllProducts")}
                  <span className="ml-2 transform transition-transform group-hover:translate-x-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4 sm:w-5 sm:h-5">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </span>
                  <span className="absolute -z-10 inset-0 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></span>
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-sm sm:text-base md:text-lg px-4 sm:px-6 md:px-8 py-2 sm:py-5 md:py-6 bg-orange-500 text-white border-orange-500 hover:bg-orange-600 hover:border-orange-600 rounded-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105 mt-3 sm:mt-0 animate-bounce">
                <Link href="/categories">{t("exploreCategories")}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* STEM Categories - Improved responsiveness */}
      <section className="py-10 sm:py-12 md:py-16 bg-muted">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
            {t("stemCategories")}
          </h2>
          <p className="text-center text-muted-foreground mb-8 sm:mb-10 max-w-3xl mx-auto px-2">
            {t("stemCategoriesDesc")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
            {translatedCategories.map((category) => (
              <Link
                href={`/products?category=${category.slug}`}
                key={category.slug}>
                <div className="bg-background rounded-lg overflow-hidden shadow-md transition-all duration-300 hover:shadow-xl hover:translate-y-[-5px] h-full flex flex-col">
                  <div className="relative h-32 sm:h-40 md:h-48 w-full">
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      style={{ objectFit: "cover" }}
                    />
                  </div>
                  <div className="p-3 sm:p-4 md:p-5 flex flex-col flex-grow">
                    <h3 className="text-base sm:text-lg md:text-xl font-bold mb-1 sm:mb-2">
                      {category.name}
                    </h3>
                    <p className="text-muted-foreground text-xs sm:text-sm md:text-base mb-3 sm:mb-4">
                      {category.description}
                    </p>
                    <div className="mt-auto">
                      <span className="text-primary text-xs sm:text-sm font-medium inline-flex items-center">
                        {t("exploreCategories").split(" ")[0]} {category.name}{" "}
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-3 h-3 sm:w-4 sm:h-4 ml-1">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products - Improved responsiveness and currency display */}
      <section className="py-10 sm:py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <div className="mb-8 text-center">
            <span className="inline-block px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-full mb-2">
              {t("recommendedForYou" as any, "Recommended For You")}
            </span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
              {t("featuredProducts")}
            </h2>
            <p className="text-center text-muted-foreground mb-0 max-w-3xl mx-auto px-2">
              {t("featuredProductsDesc")}
            </p>
          </div>

          {isLoading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-background rounded-lg overflow-hidden shadow-md border border-gray-200 h-full flex flex-col animate-pulse">
                  <div className="relative h-40 sm:h-52 w-full bg-gray-200"></div>
                  <div className="p-4 sm:p-5 flex flex-col flex-grow space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-6 bg-gray-200 rounded w-2/3"></div>
                    <div className="h-16 bg-gray-200 rounded w-full"></div>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : featuredProducts.length === 0 ? (
            // No products found message
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {t("noFeaturedProducts" as any, "No featured products found.")}
              </p>
            </div>
          ) : (
            // Product grid
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
              {featuredProducts.map((product) => (
                <Link
                  href={`/products/${product.slug}`}
                  key={product.id}
                  className="block">
                  <div className="bg-background rounded-lg overflow-hidden shadow-md border border-gray-200 transition-all duration-300 hover:shadow-xl h-full flex flex-col">
                    <div className="relative h-40 sm:h-52 w-full">
                      <Image
                        src={
                          product.images && product.images.length > 0
                            ? product.images[0]
                            : getFallbackImage(product)
                        }
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 25vw"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                    <div className="p-4 sm:p-5 flex flex-col flex-grow">
                      <div className="inline-block px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground mb-2">
                        {t(
                          ((product.attributes?.stemCategory as string) ||
                            "general") as any,
                          (
                            (product.attributes?.stemCategory as string) ||
                            "General"
                          )
                            .charAt(0)
                            .toUpperCase() +
                            (
                              (product.attributes?.stemCategory as string) ||
                              "general"
                            )
                              .slice(1)
                              .toLowerCase()
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-2">
                        {product.name}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mb-4 flex-grow line-clamp-2">
                        {product.description}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-sm sm:text-base md:text-lg font-bold">
                          {formatPrice(product.price)}
                        </span>
                        <Button
                          size="sm"
                          className="transition-all hover:scale-105 text-xs sm:text-sm py-1 px-2 sm:px-3">
                          {t("viewDetails")}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 sm:mt-10 md:mt-12 text-center">
            <Button
              asChild
              size="lg"
              className="text-sm sm:text-base px-4 sm:px-6 py-2 sm:py-5 rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white border-0">
              <Link
                href="/products"
                className="flex items-center">
                {t("viewAllProducts")}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 sm:w-5 sm:h-5 ml-2">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Educational Books Section */}
      <section className="py-10 sm:py-12 md:py-16 bg-muted">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 sm:mb-6 text-center">
            {t("educationalBooks" as any, "Educational Books")}
          </h2>
          <p className="text-center text-muted-foreground mb-8 sm:mb-10 max-w-3xl mx-auto px-2">
            {t(
              "educationalBooksDesc" as any,
              "Discover our collection of educational books designed to inspire young minds"
            )}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
            {/* Book 1: STEM Play for Neurodiverse Minds */}
            <div className="bg-background rounded-xl overflow-hidden shadow-lg border border-gray-200 flex flex-col md:flex-row">
              <div className="md:w-2/5 relative p-4">
                <div className="aspect-[3/4] relative shadow-lg rounded-md overflow-hidden book-cover-effect max-w-[120px] sm:max-w-[150px] md:max-w-none mx-auto md:mx-0">
                  <Image
                    src="/STEM_play_for_neurodiverse_minds.jpg"
                    alt={t(
                      "stemPlayBook" as any,
                      "STEM Play for Neurodiverse Minds"
                    )}
                    fill
                    sizes="(max-width: 768px) 120px, (max-width: 1024px) 150px, 33vw"
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105 duration-300"
                  />
                  <div className="absolute inset-0 border-4 border-opacity-10 border-black rounded-md"></div>
                </div>
              </div>
              <div className="p-6 md:w-3/5 flex flex-col">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">
                  {t("stemPlayBook" as any, "STEM Play for Neurodiverse Minds")}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t(
                    "stemPlayBookDesc" as any,
                    "A comprehensive guide to engaging neurodiverse children with STEM activities that promote learning through play."
                  )}
                </p>
                <div className="mt-auto space-y-4">
                  <div className="flex items-center">
                    <div className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 mr-2">
                      {t(
                        "availableInTwoLanguages" as any,
                        "Available in 2 languages"
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      asChild
                      className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800 px-1 text-xs sm:text-sm md:text-base h-auto py-2 sm:py-2.5">
                      <Link href="/products/stem-play-for-neurodiverse-minds">
                        <span className="mr-2">🇬🇧</span>{" "}
                        {language === "ro"
                          ? "Cumpără"
                          : t("buyInEnglish" as any, "Buy")}
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="flex items-center justify-center bg-gradient-to-r from-yellow-600 to-red-600 px-1 text-xs sm:text-sm md:text-base h-auto py-2 sm:py-2.5">
                      <Link href="/products/stem-play-for-neurodiverse-minds">
                        <span className="mr-2">🇷🇴</span>{" "}
                        {language === "ro"
                          ? "Cumpără"
                          : t("buyInRomanian" as any, "Buy")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Book 2: Born for the Future */}
            <div className="bg-background rounded-xl overflow-hidden shadow-lg border border-gray-200 flex flex-col md:flex-row">
              <div className="md:w-2/5 relative p-4">
                <div className="aspect-[3/4] relative shadow-lg rounded-md overflow-hidden book-cover-effect max-w-[120px] sm:max-w-[150px] md:max-w-none mx-auto md:mx-0">
                  <Image
                    src="/born_for_the_future.png"
                    alt={t("bornFutureBook" as any, "Born for the Future")}
                    fill
                    sizes="(max-width: 768px) 120px, (max-width: 1024px) 150px, 33vw"
                    style={{ objectFit: "cover" }}
                    className="transition-transform hover:scale-105 duration-300"
                  />
                  <div className="absolute inset-0 border-4 border-opacity-10 border-black rounded-md"></div>
                </div>
              </div>
              <div className="p-6 md:w-3/5 flex flex-col">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">
                  {t("bornFutureBook" as any, "Born for the Future")}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {t(
                    "bornFutureBookDesc" as any,
                    "An inspiring book that prepares children for the technological world of tomorrow through engaging stories and activities."
                  )}
                </p>
                <div className="mt-auto space-y-4">
                  <div className="flex items-center">
                    <div className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 mr-2">
                      {t(
                        "availableInTwoLanguages" as any,
                        "Available in 2 languages"
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Button
                      asChild
                      className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-800 px-1 text-xs sm:text-sm md:text-base h-auto py-2 sm:py-2.5">
                      <Link href="/products/born-for-the-future">
                        <span className="mr-2">🇬🇧</span>{" "}
                        {language === "ro"
                          ? "Cumpără"
                          : t("buyInEnglish" as any, "Buy")}
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="flex items-center justify-center bg-gradient-to-r from-yellow-600 to-red-600 px-1 text-xs sm:text-sm md:text-base h-auto py-2 sm:py-2.5">
                      <Link href="/products/born-for-the-future">
                        <span className="mr-2">🇷🇴</span>{" "}
                        {language === "ro"
                          ? "Cumpără"
                          : t("buyInRomanian" as any, "Buy")}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="text-base px-6 py-5 sm:px-8 sm:py-6 rounded-lg shadow-md hover:shadow-lg transition-all hover:scale-105">
              <Link href="/products?category=educational-books">
                {t("viewAllBooks" as any, "View All Educational Books")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <style
        jsx
        global>{`
        .book-cover-effect {
          box-shadow: 5px 5px 15px rgba(0, 0, 0, 0.2);
          transition: all 0.3s ease;
        }
        .book-cover-effect:hover {
          box-shadow: 7px 7px 20px rgba(0, 0, 0, 0.3);
          transform: translateY(-5px);
        }

        /* Responsive book sizing */
        @media (max-width: 768px) {
          .book-cover-effect {
            max-width: 120px;
            margin: 0 auto;
          }
        }

        @media (min-width: 769px) and (max-width: 1024px) {
          .book-cover-effect {
            max-width: 150px;
          }
        }
      `}</style>

      {/* Value Proposition - Improved for better centering and responsiveness */}
      <section className="py-8 sm:py-10 md:py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 md:mb-12 text-center">
            {t("whyChooseTechTots")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8 lg:gap-12">
            <div className="text-center bg-primary-foreground/10 rounded-lg p-4 sm:p-6 md:p-8 transition-transform hover:scale-105">
              <div className="flex justify-center mb-4 sm:mb-5 md:mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-14">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 md:mb-3">
                {t("cognitiveDevelopment" as any)}
              </h3>
              <p className="text-primary-foreground/90 text-xs sm:text-sm md:text-base">
                {t("cognitiveDevelopmentDesc" as any)}
              </p>
            </div>

            <div className="text-center bg-primary-foreground/10 rounded-lg p-4 sm:p-6 md:p-8 transition-transform hover:scale-105">
              <div className="flex justify-center mb-4 sm:mb-5 md:mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-14">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 md:mb-3">
                {t("qualitySafety" as any, "Quality & Safety")}
              </h3>
              <p className="text-primary-foreground/90 text-xs sm:text-sm md:text-base">
                {t(
                  "qualitySafetyDesc" as any,
                  "All our products meet or exceed safety standards and are built to last."
                )}
              </p>
            </div>

            <div className="text-center bg-primary-foreground/10 rounded-lg p-4 sm:p-6 md:p-8 transition-transform hover:scale-105">
              <div className="flex justify-center mb-4 sm:mb-5 md:mb-6">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-14">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                  />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2 md:mb-3">
                {t("futureReady" as any)}
              </h3>
              <p className="text-primary-foreground/90 text-xs sm:text-sm md:text-base">
                {t("futureReadyDesc" as any)}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
