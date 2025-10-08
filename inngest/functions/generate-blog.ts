import { inngest } from "../client";
import { OptimizedBlogGenerationService } from "@/lib/ai/optimized-blog-generation-service";
import { db } from "@/lib/db";
import { StemCategory } from "@prisma/client";

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

// Helper function to find or create blog category
async function findOrCreateBlogCategory(stemCategory: StemCategory) {
  const categoryNameMap: Record<StemCategory, string> = {
    SCIENCE: "Știință",
    TECHNOLOGY: "Tehnologie",
    ENGINEERING: "Inginerie",
    MATHEMATICS: "Matematică",
    GENERAL: "Educație STEM",
  };

  const categoryName = categoryNameMap[stemCategory] || "Educație STEM";
  const slug = generateSlug(categoryName);

  // Try to find existing category
  let category = await db.category.findFirst({
    where: {
      OR: [
        { name: { equals: categoryName, mode: "insensitive" } },
        { slug: slug },
      ],
    },
  });

  // Create category if it doesn't exist
  if (!category) {
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

export const generateBlogJob = inngest.createFunction(
  { id: "generate-blog", name: "Generate Blog with AI" },
  { event: "blog/generate.requested" },
  async ({ event, step }) => {
    const { userId, prompt, options, jobId } = event.data;

    console.log(`🚀 [Inngest] Starting blog generation job: ${jobId}`);

    // Update job status: processing
    const processingUpdate = await step.run(
      "update-status-processing",
      async () => {
        try {
          console.log(`📝 [Inngest] Updating job ${jobId} to PROCESSING`);
          console.log(`📝 [Inngest] Database connection test...`);

          const updated = await db.aiJob.update({
            where: { id: jobId },
            data: { status: "PROCESSING", startedAt: new Date() },
          });

          console.log(
            `✅ [Inngest] Job ${jobId} status updated to PROCESSING`,
            updated
          );
          return {
            success: true,
            status: "PROCESSING",
            jobId: updated.id,
            updatedAt: updated.startedAt,
          };
        } catch (error) {
          console.error(
            `❌ [Inngest] Failed to update job status to PROCESSING:`,
            error
          );
          console.error(`❌ [Inngest] Error details:`, {
            name: error instanceof Error ? error.name : "Unknown",
            message: error instanceof Error ? error.message : String(error),
            code: (error as any)?.code,
            meta: (error as any)?.meta,
          });
          // Return error info so we can see it in Inngest UI
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
            errorCode: (error as any)?.code,
          };
        }
      }
    );

    console.log(`📊 [Inngest] Processing update result:`, processingUpdate);

    // If processing update failed, stop here
    if (!processingUpdate.success) {
      console.error(
        `❌ [Inngest] Cannot continue - failed to update to PROCESSING`
      );
      return {
        success: false,
        error: "Failed to update job status to PROCESSING",
        details: processingUpdate,
      };
    }

    // Generate blog (no timeout limits!)
    const result = await step.run("generate-blog-content", async () => {
      try {
        console.log(
          `🤖 [Inngest] Starting AI blog generation for job ${jobId}`
        );
        const blogService = new OptimizedBlogGenerationService({
          primaryModel: "gpt-4o",
          useSimplifiedPrompts: true,
          skipAIIfSlow: true,
          maxStage1Time: 90000,
          maxStage2Time: 60000,
        });

        const generationResult = await blogService.generateBlog(
          {
            prompt,
            targetStemCategory: options?.targetStemCategory,
            targetAudience: options?.targetAudience,
            tone: options?.tone ?? "educational",
            includeCallToAction: options?.includeCallToAction ?? true,
            keywordFocus: options?.keywordFocus,
          },
          {
            includeSEO: options?.includeSEO ?? true,
            includeCoverImage: options?.includeCoverImage ?? true,
            targetStemCategory: options?.targetStemCategory,
            targetAudience: options?.targetAudience,
            tone: options?.tone ?? "educational",
            includeCallToAction: options?.includeCallToAction ?? true,
            keywordFocus: options?.keywordFocus,
            saveToDatabase: false,
            autoPublish: false,
          }
        );

        console.log(
          `✅ [Inngest] AI generation completed for job ${jobId}. Success: ${generationResult.success}`
        );
        return generationResult;
      } catch (error) {
        console.error(
          `❌ [Inngest] AI generation failed for job ${jobId}:`,
          error
        );
        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Unknown error during generation",
          content: null,
          metadata: null,
        };
      }
    });

    console.log(`📊 [Inngest] Generation result success:`, result.success);

    // Save result
    const saveResult = await step.run("save-result", async () => {
      try {
        console.log(
          `💾 [Inngest] Saving result for job ${jobId}. Success: ${result.success}`
        );

        const finalStatus = result.success ? "COMPLETED" : "FAILED";
        const resultString = JSON.stringify(result);

        console.log(
          `📊 [Inngest] Result size: ${resultString.length} characters`
        );
        console.log(`📊 [Inngest] Final status will be: ${finalStatus}`);

        const updated = await db.aiJob.update({
          where: { id: jobId },
          data: {
            status: finalStatus,
            result: resultString,
            completedAt: new Date(),
            error: result.error || null,
          },
        });

        console.log(
          `✅ [Inngest] Job ${jobId} completed with status: ${finalStatus}`
        );
        console.log(`✅ [Inngest] Updated job:`, {
          id: updated.id,
          status: updated.status,
          completedAt: updated.completedAt,
        });

        return {
          success: true,
          status: finalStatus,
          jobId: updated.id,
          resultSize: resultString.length,
          completedAt: updated.completedAt,
        };
      } catch (error) {
        console.error(
          `❌ [Inngest] Failed to save result for job ${jobId}:`,
          error
        );
        console.error(`❌ [Inngest] Save error details:`, {
          name: error instanceof Error ? error.name : "Unknown",
          message: error instanceof Error ? error.message : String(error),
          code: (error as any)?.code,
          meta: (error as any)?.meta,
        });

        // Try to at least mark the job as failed
        try {
          const failedUpdate = await db.aiJob.update({
            where: { id: jobId },
            data: {
              status: "FAILED",
              error: `Failed to save result: ${error instanceof Error ? error.message : "Unknown error"}`,
              completedAt: new Date(),
            },
          });
          console.log(
            `⚠️ [Inngest] Job ${jobId} marked as FAILED due to save error`
          );
          return {
            success: false,
            markedAsFailed: true,
            error: error instanceof Error ? error.message : String(error),
          };
        } catch (fallbackError) {
          console.error(
            `❌ [Inngest] Could not even mark job as FAILED:`,
            fallbackError
          );
          return {
            success: false,
            markedAsFailed: false,
            error: error instanceof Error ? error.message : String(error),
            fallbackError:
              fallbackError instanceof Error
                ? fallbackError.message
                : String(fallbackError),
          };
        }
      }
    });

    console.log(`📊 [Inngest] Save result:`, saveResult);

    // Save blog to database (if generation was successful)
    let blogPost = null;
    if (saveResult.success && result.success && result.generatedBlog) {
      blogPost = await step.run("save-to-blog-table", async () => {
        try {
          console.log(
            `📝 [Inngest] Saving blog to Blog table for job ${jobId}`
          );

          const generatedBlog = result.generatedBlog;
          const stemCategory =
            generatedBlog.stemCategory ||
            options?.targetStemCategory ||
            "GENERAL";

          // Find or create category
          const category = await findOrCreateBlogCategory(
            stemCategory as StemCategory
          );

          console.log(
            `📂 [Inngest] Using category: ${category.name} (${category.id})`
          );

          // Generate unique slug
          let slug = generatedBlog.slug || generateSlug(generatedBlog.title);
          const existingBlog = await db.blog.findUnique({ where: { slug } });

          // If slug exists, append timestamp
          if (existingBlog) {
            slug = `${slug}-${Date.now()}`;
            console.log(`⚠️ [Inngest] Slug conflict, using: ${slug}`);
          }

          // Create blog post
          const blog = await db.blog.create({
            data: {
              title: generatedBlog.title,
              slug: slug,
              excerpt: generatedBlog.excerpt || generatedBlog.title,
              content: generatedBlog.content,
              coverImage: generatedBlog.coverImage || null,
              categoryId: category.id,
              authorId: userId,
              tags: generatedBlog.tags || [],
              metadata: {
                aiGenerated: true,
                aiMetadata: generatedBlog.aiMetadata,
                seoMetadata: generatedBlog.seoMetadata,
                jobId: jobId,
              },
              isPublished: false, // Save as draft
              readingTime: generatedBlog.readingTime || 5,
              stemCategory: stemCategory as StemCategory,
              socialShares: 0,
            },
          });

          console.log(`✅ [Inngest] Blog saved to database: ${blog.id}`);
          console.log(`📰 [Inngest] Blog title: "${blog.title}"`);
          console.log(`🔗 [Inngest] Blog slug: ${blog.slug}`);

          return {
            success: true,
            blogId: blog.id,
            slug: blog.slug,
            title: blog.title,
          };
        } catch (error) {
          console.error(
            `❌ [Inngest] Failed to save blog to Blog table:`,
            error
          );
          console.error(`❌ [Inngest] Blog save error details:`, {
            name: error instanceof Error ? error.name : "Unknown",
            message: error instanceof Error ? error.message : String(error),
            code: (error as any)?.code,
            meta: (error as any)?.meta,
          });

          // Don't fail the job if blog save fails - result is already saved
          return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
          };
        }
      });

      console.log(`📊 [Inngest] Blog post result:`, blogPost);

      // Update the AiJob result to include blogPost info
      if (blogPost?.success) {
        try {
          const updatedResult = {
            ...result,
            blogPost: blogPost,
          };
          await db.aiJob.update({
            where: { id: jobId },
            data: {
              result: JSON.stringify(updatedResult),
            },
          });
          console.log(`✅ [Inngest] Updated AiJob result with blogPost info`);
        } catch (error) {
          console.error(
            `⚠️ [Inngest] Failed to update result with blogPost:`,
            error
          );
        }
      }
    } else {
      console.log(
        `⚠️ [Inngest] Skipping blog save - generation not successful`
      );
    }

    console.log(`🎉 [Inngest] Blog generation job ${jobId} fully completed`);

    return {
      success: saveResult.success,
      jobId,
      result,
      processingUpdate,
      saveResult,
      blogPost,
    };
  }
);
