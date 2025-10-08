/**
 * Check Failed Job in Database
 *
 * This script checks the details of a specific failed job in the database
 * to help diagnose why Inngest function execution is failing.
 *
 * Usage: node scripts/check-failed-job.js [jobId]
 */

// Get job ID from command line or use the one from the issue
const jobId = process.argv[2] || "cmghkabcr0004l204gbv85nxy";

console.log(`🔍 Checking job: ${jobId}\n`);

// Need to use dynamic import for ESM modules
import("dotenv/config")
  .then(() => {
    import("../lib/db.js")
      .then(({ db }) => {
        return db.aiJob.findUnique({
          where: { id: jobId },
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        });
      })
      .then(job => {
        if (!job) {
          console.log("❌ Job not found in database");
          console.log(`\nJob ID: ${jobId}`);
          console.log("\nPossible reasons:");
          console.log("  - Job ID is incorrect");
          console.log("  - Job was created but database commit failed");
          console.log("  - Database connection issue");
          return;
        }

        console.log("📊 Job Details");
        console.log("─".repeat(60));
        console.log(`ID:          ${job.id}`);
        console.log(`Type:        ${job.type}`);
        console.log(`Status:      ${job.status}`);
        console.log(`User:        ${job.user?.email || job.userId}`);
        console.log(`Created:     ${job.createdAt}`);
        console.log(`Started:     ${job.startedAt || "N/A"}`);
        console.log(`Completed:   ${job.completedAt || "N/A"}`);
        console.log("─".repeat(60));

        // Parse input
        try {
          const input = JSON.parse(job.input);
          console.log("\n📝 Input:");
          console.log(`  Prompt: ${input.prompt?.substring(0, 80)}...`);
          console.log(
            `  Options: ${JSON.stringify(input.options || {}, null, 2)}`
          );
        } catch (e) {
          console.log("\n⚠️  Could not parse input");
        }

        // Parse result
        if (job.result) {
          try {
            const result = JSON.parse(job.result);
            console.log("\n✅ Result:");
            console.log(`  Success: ${result.success}`);
            if (result.generatedBlog) {
              console.log(`  Title: ${result.generatedBlog.title}`);
              console.log(
                `  Content Length: ${result.generatedBlog.content?.length || 0} chars`
              );
            }
          } catch (e) {
            console.log("\n📄 Result (raw):");
            console.log(job.result.substring(0, 200));
          }
        } else {
          console.log("\n⚠️  No result yet (empty string)");
        }

        // Show error
        if (job.error) {
          console.log("\n❌ Error:");
          console.log("─".repeat(60));
          console.log(job.error);
          console.log("─".repeat(60));
        } else {
          console.log("\n💡 No error recorded in database");
          console.log(
            "   (Function might be failing before it can update the job)"
          );
        }

        // Duration
        if (job.startedAt && job.completedAt) {
          const duration =
            (new Date(job.completedAt) - new Date(job.startedAt)) / 1000;
          console.log(`\n⏱️  Duration: ${duration} seconds`);
        }

        // Recommendations
        console.log("\n🔍 Next Steps:");
        console.log("─".repeat(60));

        if (job.status === "PENDING") {
          console.log("Status is PENDING - Function never started executing");
          console.log("\nCheck:");
          console.log("  1. Inngest Dashboard for execution attempts");
          console.log("  2. Error logs in Inngest Dashboard");
          console.log("  3. Vercel logs: vercel logs --follow");
        } else if (job.status === "PROCESSING") {
          console.log(
            "Status is PROCESSING - Function started but didn't complete"
          );
          console.log("\nCheck:");
          console.log("  1. Inngest Dashboard for current execution status");
          console.log(
            "  2. Function might still be running (can take 3-5 minutes)"
          );
        } else if (job.status === "FAILED") {
          console.log(
            "Status is FAILED - Function executed but encountered an error"
          );
          console.log("\nCheck:");
          console.log("  1. Error message above");
          console.log("  2. Inngest Dashboard for detailed error logs");
          console.log("  3. Verify AI API keys are set in Vercel");
        } else if (job.status === "COMPLETED") {
          console.log("Status is COMPLETED - Success! ✅");
        }

        process.exit(0);
      })
      .catch(error => {
        console.error("❌ Database error:", error.message);
        console.error("\nFull error:", error);
        process.exit(1);
      });
  })
  .catch(error => {
    console.error("❌ Failed to load dependencies:", error.message);
    process.exit(1);
  });
