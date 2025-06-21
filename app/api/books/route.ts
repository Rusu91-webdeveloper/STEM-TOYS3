import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// Function to seed books if they don't exist
async function ensureBooksExist() {
  try {
    // Check if books exist
    const existingBooks = await db.book.count();
    if (existingBooks > 0) {
      // Books already exist in database, no need to seed
      return;
    }

    // Creating default books...

    // Create "Born for the Future" book
    const bornForTheFuture = await db.book.create({
      data: {
        name: "Born for the Future",
        slug: "born-for-the-future",
        author: "Casey Wrenly",
        description:
          "This groundbreaking book explores how early exposure to STEM concepts shapes cognitive development and prepares children for success in an increasingly technology-driven world. It eloquently illustrates how STEM toys are not just about technical skills; they are powerful catalysts for fostering essential human capabilities like critical thinking, problem-solving, and creativity.",
        price: 50, // 50 lei
        coverImage: "/born_for_the_future.png",
        metadata: {
          title:
            "Born for the Future: Preparing Children for a STEM-Powered World",
          description:
            "Discover how early STEM education shapes cognitive development and prepares children for success in a technology-driven future.",
          keywords: [
            "STEM education",
            "cognitive development",
            "future-ready skills",
            "child development",
            "educational books",
          ],
          author: "Casey Wrenly",
          publisher: "STEM Toys Education",
          publicationDate: "2023-09-15",
          isbn: "978-3-16-148410-0",
          pageCount: 120,
          language: ["English", "Romanian"],
          category: "Educational Books",
          targetAudience: "Parents, Educators, STEM Enthusiasts",
        },
        languages: {
          create: [
            {
              name: "English",
              code: "en-born-for-future",
              isAvailable: true,
            },
            {
              name: "Romanian",
              code: "ro-born-for-future",
              isAvailable: true,
            },
          ],
        },
      },
    });

    // Create "STEM Play for Neurodiverse Minds" book
    const stemPlayNeurodiverse = await db.book.create({
      data: {
        name: "STEM Play for Neurodiverse Minds",
        slug: "stem-play-for-neurodiverse-minds",
        author: "Casey Wrenly",
        description:
          "This essential guide explains how specially designed STEM toys can help children with ADHD and autism develop focus, reduce anxiety, and build social skills. It emphasizes understanding each child's individual way of thinking and learning, and leveraging their special interests to make STEM exploration a truly engaging experience.",
        price: 50, // 50 lei
        coverImage: "/STEM_play_for_neurodiverse_minds.jpg",
        metadata: {
          title:
            "STEM Play for Neurodiverse Minds: Supporting ADHD and Autism Through Engaged Learning",
          description:
            "Learn how specialized STEM activities can help neurodiverse children develop focus, reduce anxiety, and build essential skills through engaged learning.",
          keywords: [
            "neurodiversity",
            "ADHD",
            "autism",
            "STEM education",
            "special needs",
            "inclusive learning",
            "educational strategies",
          ],
          author: "Casey Wrenly",
          publisher: "STEM Toys Education",
          publicationDate: "2023-11-10",
          isbn: "978-3-16-148411-7",
          pageCount: 150,
          language: ["English", "Romanian"],
          category: "Educational Books",
          targetAudience:
            "Parents of Neurodiverse Children, Special Education Teachers, Therapists",
        },
        languages: {
          create: [
            {
              name: "English",
              code: "en-stem-play-neurodiverse",
              isAvailable: true,
            },
            {
              name: "Romanian",
              code: "ro-stem-play-neurodiverse",
              isAvailable: true,
            },
          ],
        },
      },
    });

    console.log(
      "✅ Default books created successfully (without digital files)"
    );
  } catch (error) {
    console.error("Error seeding books:", error);
    // Continue with the request even if seeding fails
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const slug = searchParams.get("slug");
    const language = searchParams.get("language");

    // Processing book request

    // Ensure books exist before querying them
    await ensureBooksExist();

    // Build where clause
    const where = {
      isActive: true, // Only return active books
      ...(slug ? { slug: slug } : {}),
    };

    const include = {
      languages: true,
      ...(language ? { languages: { where: { code: language } } } : {}),
    };

    try {
      const books = await db.book.findMany({
        where,
        include,
        orderBy: {
          createdAt: "desc",
        },
      });

      // Found matching books in database

      // Create response with books
      const response = NextResponse.json(books);

      // Add cache control header for CDN and browser caching
      response.headers.set(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=300"
      );

      return response;
    } catch (error) {
      console.error("Database query error:", error);
      return NextResponse.json(
        {
          error: "Database query failed",
          details: error instanceof Error ? error.message : String(error),
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error fetching books:", error);
    return NextResponse.json(
      { error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}
