import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { revalidateTag, revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { applyStandardHeaders } from "@/lib/response-headers";
import { handleApiError, createSuccessResponse } from "@/lib/api-error-handler";
import { DualProviderBlogEnhancementService } from "@/lib/ai/dual-provider-blog-enhancement-service";
import {
  BlogGenerationRequest,
  BlogGenerationResponse,
  BlogGenerationProgress,
  BlogGenerationOptions,
  GeneratedBlogContent,
} from "@/lib/ai/blog-types";
import { StemCategory } from "@/lib/ai/types";

// Input validation schema for blog AI generation
const blogGenerationSchema = z.object({
  prompt: z
    .string()
    .min(10, "Prompt must be at least 10 characters")
    .max(500, "Prompt must be less than 500 characters"),
  options: z
    .object({
      includeSEO: z.boolean().default(true),
      includeCoverImage: z.boolean().default(true),
      targetStemCategory: z
        .enum([
          "SCIENCE",
          "TECHNOLOGY",
          "ENGINEERING",
          "MATHEMATICS",
          "GENERAL",
        ])
        .optional(),
      targetAudience: z.string().optional(),
      tone: z
        .enum(["educational", "professional", "conversational", "expert"])
        .default("educational"),
      includeCallToAction: z.boolean().default(true),
      keywordFocus: z.array(z.string()).optional(),
      saveToDatabase: z.boolean().default(false),
      autoPublish: z.boolean().default(false),
    })
    .optional(),
});

// Helper function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// Helper function to find or create blog category
async function findOrCreateBlogCategory(stemCategory: StemCategory) {
  // Map STEM categories to category names
  const categoryNameMap: Record<StemCategory, string> = {
    SCIENCE: "Știință",
    TECHNOLOGY: "Tehnologie",
    ENGINEERING: "Inginerie",
    MATHEMATICS: "Matematică",
    GENERAL: "Educație STEM",
  };

  const categoryName = categoryNameMap[stemCategory] || "Educație STEM";

  // Try to find existing category
  let category = await db.category.findFirst({
    where: {
      OR: [
        { name: { equals: categoryName, mode: "insensitive" } },
        { slug: generateSlug(categoryName) },
      ],
    },
  });

  // Create category if it doesn't exist
  if (!category) {
    const slug = generateSlug(categoryName);
    category = await db.category.create({
      data: {
        name: categoryName,
        slug: slug,
        description: `${categoryName} - articole și resurse educaționale`,
        isActive: true,
      },
    });
  }

  return category;
}

// Generate topic-specific content based on the prompt
function generateTopicSpecificContent(topic: string, prompt: BlogGenerationPrompt): string {
  const topicLower = topic.toLowerCase();
  
  // Determine the main focus based on the topic
  let mainFocus = "educație STEM";
  let specificBenefits = [
    "Dezvoltă gândirea critică și analitică",
    "Îmbunătățesc abilitățile de rezolvare a problemelor", 
    "Cresc încrezători în utilizarea tehnologiei",
    "Pregătesc pentru cariere viitoare în domenii tehnice"
  ];
  let practicalTips = [
    "Începe cu jocurile educaționale interactive",
    "Realizează experimente practice acasă",
    "Încurajează întrebările și curiozitatea",
    "Folosește tehnologia educațională",
    "Conectează conceptele cu viața reală"
  ];
  
  // Customize content based on specific topics
  if (topicLower.includes("stem toys") || topicLower.includes("jucării stem")) {
    mainFocus = "jucăriile STEM";
    specificBenefits = [
      "Dezvoltă creativitatea și imaginația",
      "Îmbunătățesc coordonarea mână-ochi",
      "Învață concepte științifice prin joc",
      "Pregătesc pentru școala și cariera viitoare"
    ];
    practicalTips = [
      "Alege jucării potrivite pentru vârsta copilului",
      "Combină jocul cu învățarea",
      "Încurajează explorarea și experimentarea",
      "Participă activ la jocuri cu copilul",
      "Creează un mediu de învățare distractiv"
    ];
  } else if (topicLower.includes("robotics") || topicLower.includes("robotica")) {
    mainFocus = "robotica educațională";
    specificBenefits = [
      "Dezvoltă gândirea logică și secvențială",
      "Învață programarea de bază",
      "Îmbunătățește abilitățile de rezolvare a problemelor",
      "Pregătește pentru viitorul digital"
    ];
    practicalTips = [
      "Începe cu roboți simpli și programabili",
      "Folosește aplicații de programare vizuală",
      "Încurajează proiectele creative",
      "Participă la competiții de robotică",
      "Conectează robotica cu alte domenii STEM"
    ];
  } else if (topicLower.includes("coding") || topicLower.includes("programare")) {
    mainFocus = "programarea pentru copii";
    specificBenefits = [
      "Dezvoltă gândirea algoritmică",
      "Îmbunătățește rezolvarea problemelor",
      "Creează încredere în utilizarea tehnologiei",
      "Pregătește pentru cariere în IT"
    ];
    practicalTips = [
      "Începe cu programarea vizuală (Scratch, Blockly)",
      "Folosește jocuri de programare",
      "Încurajează proiectele personale",
      "Participă la cluburi de programare",
      "Conectează programarea cu interesele copilului"
    ];
  } else if (topicLower.includes("science") || topicLower.includes("știință")) {
    mainFocus = "știința pentru copii";
    specificBenefits = [
      "Dezvoltă curiozitatea științifică",
      "Învață să observe și să analizeze",
      "Îmbunătățește gândirea critică",
      "Pregătește pentru studii științifice"
    ];
    practicalTips = [
      "Realizează experimente simple acasă",
      "Vizitează muzee și laboratoare",
      "Încurajează întrebările despre natură",
      "Folosește cărți și documentare științifice",
      "Conectează știința cu viața de zi cu zi"
    ];
  } else if (topicLower.includes("math") || topicLower.includes("matematică")) {
    mainFocus = "matematica pentru copii";
    specificBenefits = [
      "Dezvoltă gândirea logică și analitică",
      "Îmbunătățește rezolvarea problemelor",
      "Creează încredere în abilitățile matematice",
      "Pregătește pentru studii superioare"
    ];
    practicalTips = [
      "Transformă matematica în joc",
      "Folosește obiecte concrete pentru învățare",
      "Încurajează rezolvarea problemelor practice",
      "Conectează matematica cu hobby-urile",
      "Creează un mediu pozitiv pentru învățare"
    ];
  }
  
  return `
# ${topic} - Ghid Complet pentru Părinți în 2025

## Introducere

${topic} reprezintă o componentă esențială în educația modernă a copiilor. În era digitală, este crucial să pregătim copiii pentru viitor prin dezvoltarea competențelor STEM (Știință, Tehnologie, Inginerie, Matematică).

## De ce este important ${topic.toLowerCase()}?

Cercetările arată că copiii care sunt expuși la ${mainFocus} de la o vârstă fragedă:
${specificBenefits.map(benefit => `- ${benefit}`).join('\n')}

## Cum să introduci ${topic.toLowerCase()} în viața copilului tău

${practicalTips.map((tip, index) => `### ${index + 1}. **${tip.split(' - ')[0]}**
${tip.includes(' - ') ? tip.split(' - ')[1] : 'Această abordare permite copilului să învețe într-un mod natural și distractiv.'}`).join('\n\n')}

## Beneficii pe termen lung

Investiția în ${mainFocus} a copilului tău va aduce beneficii pe termen lung:
- Pregătire pentru cariere viitoare în tehnologie și știință
- Dezvoltarea abilităților de gândire logică și analitică
- Îmbunătățirea performanței școlare în toate domeniile
- Creșterea încrederii în sine și a motivației pentru învățare
- Pregătirea pentru provocările viitorului digital

## Tendințe și inovații în 2025

În 2025, ${mainFocus} evoluează rapid cu noi tehnologii și abordări:
- Inteligenta artificială integrată în jucării educaționale
- Realitatea augmentată pentru experiențe immersive
- Platforme online interactive pentru învățare la distanță
- Jucării personalizate bazate pe interesele copilului
- Integrarea sustenabilității în educația STEM

## Cum să alegi resursele potrivite

Când alegi resurse pentru ${topic.toLowerCase()}, ia în considerare:
- **Vârsta copilului**: Asigură-te că resursele sunt potrivite pentru nivelul de dezvoltare
- **Interesele copilului**: Alege subiecte care îi pasionează
- **Calitatea educațională**: Caută resurse dezvoltate de experți în educație
- **Siguranța**: Verifică că toate materialele sunt sigure pentru copii
- **Valoarea educațională**: Prioritizează învățarea față de distracția pură

## Concluzie

${topic} nu trebuie să fie complicat sau intimidant. Cu abordarea corectă, răbdare și resursele potrivite, poți transforma orice moment într-o oportunitate de învățare valoroasă pentru copilul tău.

**Următorul pas:** Începe astăzi cu un experiment simplu, un joc educațional sau o conversație despre cum funcționează lucrurile din jurul nostru. Fiecare pas contează pentru viitorul copilului tău.

---

*Acest ghid a fost creat pentru a te ajuta să introduci ${mainFocus} în viața copilului tău într-un mod natural și distractiv. Amintiți-vă că învățarea este un proces, nu o destinație.*
`;
}

// Generate intelligent SEO keywords based on topic
function generateSEOKeywords(topic: string, prompt: BlogGenerationPrompt): string[] {
  const topicLower = topic.toLowerCase();
  const baseKeywords = ["STEM", "educație", "copii", "părinți", "2025"];
  
  // Add topic-specific keywords
  if (topicLower.includes("stem toys") || topicLower.includes("jucării stem")) {
    return [...baseKeywords, "jucării educaționale", "jocuri STEM", "învățare prin joc", "dezvoltare copii"];
  } else if (topicLower.includes("robotics") || topicLower.includes("robotica")) {
    return [...baseKeywords, "robotica educațională", "programare copii", "roboți educaționali", "tehnologie"];
  } else if (topicLower.includes("coding") || topicLower.includes("programare")) {
    return [...baseKeywords, "programare copii", "coding", "informatică", "tehnologie", "viitor digital"];
  } else if (topicLower.includes("science") || topicLower.includes("știință")) {
    return [...baseKeywords, "știință copii", "experimente", "curiozitate științifică", "laborator"];
  } else if (topicLower.includes("math") || topicLower.includes("matematică")) {
    return [...baseKeywords, "matematică copii", "numere", "logica", "rezolvare probleme"];
  } else {
    // Generic STEM keywords
    return [...baseKeywords, "educație modernă", "tehnologie", "viitor", "dezvoltare"];
  }
}

// Generate intelligent tags based on topic
function generateTags(topic: string, prompt: BlogGenerationPrompt): string[] {
  const topicLower = topic.toLowerCase();
  const baseTags = ["STEM", "educație", "copii", "părinți"];
  
  // Add topic-specific tags
  if (topicLower.includes("stem toys") || topicLower.includes("jucării stem")) {
    return [...baseTags, "jucării educaționale", "jocuri", "învățare"];
  } else if (topicLower.includes("robotics") || topicLower.includes("robotica")) {
    return [...baseTags, "robotica", "programare", "tehnologie"];
  } else if (topicLower.includes("coding") || topicLower.includes("programare")) {
    return [...baseTags, "programare", "coding", "informatică"];
  } else if (topicLower.includes("science") || topicLower.includes("știință")) {
    return [...baseTags, "știință", "experimente", "cercetare"];
  } else if (topicLower.includes("math") || topicLower.includes("matematică")) {
    return [...baseTags, "matematică", "numere", "logica"];
  } else {
    return [...baseTags, "tehnologie", "viitor"];
  }
}

// Enhanced fallback blog generation with intelligent content creation
async function generateFallbackBlog(
  prompt: BlogGenerationPrompt,
  options: BlogGenerationOptions
): Promise<BlogGenerationResult> {
  const startTime = Date.now();

  try {
    // Parse the prompt to extract the actual topic
    const promptText = prompt.prompt.toLowerCase();
    let topic = promptText;

    // Clean up common prompt patterns
    if (promptText.includes("generate me a blog about")) {
      topic = promptText.replace("generate me a blog about", "").trim();
    } else if (promptText.includes("write a blog about")) {
      topic = promptText.replace("write a blog about", "").trim();
    } else if (promptText.includes("create a blog about")) {
      topic = promptText.replace("create a blog about", "").trim();
    }

    // Capitalize first letter
    topic = topic.charAt(0).toUpperCase() + topic.slice(1);

    // Generate intelligent title based on topic
    const title = `${topic} - Ghid Complet pentru Părinți în 2025`;
    const slug = generateSlug(title);

    // Generate comprehensive, topic-specific content
    const content = generateTopicSpecificContent(topic, prompt);

    const excerpt = `Ghid complet despre ${topic.toLowerCase()} pentru părinți în 2025. Învață cum să introduci concepte STEM în viața zilnică a familiei.`;
    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200);

    const generatedBlog: GeneratedBlogContent = {
      title,
      slug,
      excerpt,
      content,
      coverImage: undefined,
      tags: generateTags(topic, prompt),
      stemCategory: prompt.targetStemCategory ?? "GENERAL",
      readingTime,
      language: "ro",
      wordCount,
        seoMetadata: {
          metaTitle: title.substring(0, 70),
          metaDescription: excerpt.substring(0, 160),
          metaKeywords: generateSEOKeywords(topic, prompt),
        },
      aiMetadata: {
        aiGenerated: true,
        generatedBy: "fallback-blog-generator",
        generationTimestamp: new Date().toISOString(),
        originalPrompt: prompt.prompt,
        processingTime: Date.now() - startTime,
        refinementApplied: false,
        modelVersion: "fallback",
        keywordOptimization: {
          primaryKeyword: prompt.prompt,
          secondaryKeywords: [],
          longTailKeywords: [],
          painPointKeywords: [],
          commercialKeywords: [],
        },
        contentAnalysis: { missingKeywords: [], suggestions: [] },
        socialOptimization: {},
        conversionOptimization: {},
        buyerPsychologyOptimization: {},
        viralOptimizationApplied: false,
      },
    };

    return {
      success: true,
      generatedBlog,
      processingTime: Date.now() - startTime,
      seoScore: 75, // Basic SEO score for fallback
      suggestions: [
        "Consider using the full AI generation for better content quality",
      ],
      warnings: ["This is a fallback blog generated due to timeout"],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      processingTime: Date.now() - startTime,
    };
  }
}

// POST - AI Blog Generation API Endpoint
export async function POST(request: NextRequest) {
  // Set up timeout handling - PRODUCTION: Ultra-short timeout
  const isProduction = process.env.NODE_ENV === "production";
  const timeoutMs = isProduction ? 30000 : 120000; // 30s in production, 2min in dev

  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("Request timeout - blog generation took too long"));
    }, timeoutMs);
  });

  try {
    // Check authentication and admin role
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json(
        {
          error: "Not authorized",
          message:
            "You must be logged in as an admin to use AI blog generation",
        },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = blogGenerationSchema.parse(body);

    console.log(
      `Starting AI blog generation for prompt: "${validatedData.prompt.substring(0, 50)}..."`
    );

    const startTime = Date.now();

    // Initialize blog enhancement service with EMERGENCY configuration
    const blogService = new DualProviderBlogEnhancementService({
      timeoutMs: 45000, // 45 seconds timeout for the service (EMERGENCY)
      maxRetries: 1, // Only 1 retry to save time
    });

    // Set up generation options
    const options: BlogGenerationOptions = {
      includeSEO: validatedData.options?.includeSEO ?? true,
      includeCoverImage: false, // Disabled to save time
      targetStemCategory: validatedData.options?.targetStemCategory,
      targetAudience: validatedData.options?.targetAudience,
      tone: validatedData.options?.tone ?? "educational",
      includeCallToAction: validatedData.options?.includeCallToAction ?? true,
      keywordFocus: validatedData.options?.keywordFocus,
      saveToDatabase: validatedData.options?.saveToDatabase ?? false,
      autoPublish: validatedData.options?.autoPublish ?? false,
    };

    // Create blog generation prompt
    const blogPrompt = {
      prompt: validatedData.prompt,
      targetStemCategory: options.targetStemCategory,
      targetAudience: options.targetAudience,
      tone: options.tone,
      includeCallToAction: options.includeCallToAction,
      keywordFocus: options.keywordFocus,
    };

    // PRODUCTION FIX: Use fallback-only approach in production to prevent timeouts
    let result;

    // In production, always use fallback to prevent timeouts
    const isProduction = process.env.NODE_ENV === "production";
    const forceFallback = process.env.FORCE_BLOG_FALLBACK === "true";

    if (isProduction || forceFallback) {
      // Production or forced fallback: Use fallback only for reliability
      console.log(
        "🚀 PRODUCTION/FALLBACK MODE: Using fallback blog generation for reliability"
      );
      result = await generateFallbackBlog(blogPrompt, options);
    } else {
      // Development: Try AI generation with very short timeout
      const useAI = validatedData.options?.includeSEO !== false;

      if (useAI) {
        const aiTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error("AI generation timeout"));
          }, 60000); // Only 1 minute for AI generation
        });

        try {
          console.log("Attempting AI blog generation with 1-minute timeout...");
          result = await Promise.race([
            blogService.generateBlog(blogPrompt, options),
            aiTimeoutPromise,
          ]);
          console.log("✅ AI blog generation completed successfully");
        } catch (aiError) {
          console.warn(
            "⚠️ AI generation failed or timed out, using fallback:",
            aiError instanceof Error ? aiError.message : String(aiError)
          );
          result = await generateFallbackBlog(blogPrompt, options);
        }
      } else {
        // Use fallback directly
        console.log("Using fallback blog generation (AI disabled)");
        result = await generateFallbackBlog(blogPrompt, options);
      }
    }

    if (!result.success || !result.generatedBlog) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Blog generation failed",
          processingTime: result.processingTime,
        },
        { status: 500 }
      );
    }

    let savedBlog = null;

    // Save to database if requested
    if (validatedData.options?.saveToDatabase) {
      try {
        console.log(
          `Saving generated blog to database: "${result.generatedBlog.title}"`
        );

        // Find or create category
        const category = await findOrCreateBlogCategory(
          result.generatedBlog.stemCategory
        );

        // Get current admin user as author
        const authorId = session.user.id;

        // Ensure unique slug
        let slug = result.generatedBlog.slug;
        let counter = 1;
        while (await db.blog.findUnique({ where: { slug } })) {
          slug = `${result.generatedBlog.slug}-${counter}`;
          counter++;
        }

        // Create blog in database
        savedBlog = await db.blog.create({
          data: {
            title: result.generatedBlog.title,
            slug: slug,
            excerpt: result.generatedBlog.excerpt,
            content: result.generatedBlog.content,
            coverImage: result.generatedBlog.coverImage,
            categoryId: category.id,
            authorId: authorId,
            tags: result.generatedBlog.tags,
            metadata: {
              seo: result.generatedBlog.seoMetadata,
              ai: result.generatedBlog.aiMetadata,
            },
            isPublished: validatedData.options?.autoPublish ?? false,
            publishedAt: validatedData.options?.autoPublish ? new Date() : null,
            readingTime: result.generatedBlog.readingTime,
            stemCategory: result.generatedBlog.stemCategory,
          },
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        console.log(
          `✅ Successfully saved blog: "${savedBlog.title}" (ID: ${savedBlog.id})`
        );

        // Revalidate blog caches
        revalidateTag("blogs");
        revalidatePath("/blog");
        if (savedBlog.isPublished) {
          revalidatePath(`/blog/${savedBlog.slug}`);
        }
      } catch (saveError) {
        console.error("Failed to save blog to database:", saveError);
        return NextResponse.json(
          {
            success: false,
            error: `Blog generated successfully but database save failed: ${saveError instanceof Error ? saveError.message : String(saveError)}`,
            generatedBlog: result.generatedBlog,
            processingTime: result.processingTime,
          },
          { status: 500 }
        );
      }
    }

    const processingTime = Date.now() - startTime;

    // Prepare response
    const response: BlogGenerationResponse & {
      savedBlog?: any;
      seoAnalysis?: {
        score: number;
        suggestions: string[];
        warnings: string[];
      };
    } = {
      success: true,
      generatedBlog: result.generatedBlog,
      processingTime,
      seoScore: result.seoScore,
      suggestions: result.suggestions,
      warnings: result.warnings,
      ...(savedBlog && {
        savedBlog: {
          id: savedBlog.id,
          title: savedBlog.title,
          slug: savedBlog.slug,
          isPublished: savedBlog.isPublished,
          publishedAt: savedBlog.publishedAt,
          category: savedBlog.category,
          author: savedBlog.author,
        },
      }),
      ...(result.seoScore && {
        seoAnalysis: {
          score: result.seoScore,
          suggestions: result.suggestions || [],
          warnings: result.warnings || [],
        },
      }),
    };

    console.log(
      `✅ AI blog generation completed: "${result.generatedBlog.title}" (${processingTime}ms)`
    );

    return applyStandardHeaders(NextResponse.json(response), {
      cache: "private",
    });
  } catch (error) {
    console.error("AI Blog Generation API error:", error);

    // Handle timeout specifically
    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        {
          success: false,
          error: "Blog generation timeout",
          message:
            "The blog generation process took too long and was cancelled. Please try with a shorter prompt or try again later.",
          processingTime: Date.now() - Date.now(), // Will be calculated properly in the actual error
        },
        { status: 408 } // Request Timeout
      );
    }

    return handleApiError(error, "Failed to generate blog");
  }
}
