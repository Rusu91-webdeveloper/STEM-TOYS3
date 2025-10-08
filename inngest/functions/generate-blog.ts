import { inngest } from "../client";
import { OptimizedBlogGenerationService } from "@/lib/ai/optimized-blog-generation-service";
import { db } from "@/lib/db";

export const generateBlogJob = inngest.createFunction(
  { id: "generate-blog", name: "Generate Blog with AI" },
  { event: "blog/generate.requested" },
  async ({ event, step }) => {
    const { userId, prompt, options, jobId } = event.data;

    // Update job status: processing
    await step.run("update-status-processing", async () => {
      await db.aiJob.update({
        where: { id: jobId },
        data: { status: "PROCESSING", startedAt: new Date() },
      });
    });

    // Generate blog (no timeout limits!)
    const result = await step.run("generate-blog-content", async () => {
      const blogService = new OptimizedBlogGenerationService({
        primaryModel: "gpt-4o",
        useSimplifiedPrompts: true,
        skipAIIfSlow: true,
        maxStage1Time: 90000,
        maxStage2Time: 60000,
      });

      return await blogService.generateBlog(
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
    });

    // Save result
    await step.run("save-result", async () => {
      await db.aiJob.update({
        where: { id: jobId },
        data: {
          status: result.success ? "COMPLETED" : "FAILED",
          result: JSON.stringify(result),
          completedAt: new Date(),
          error: result.error || null,
        },
      });
    });

    return { success: true, jobId, result };
  }
);
