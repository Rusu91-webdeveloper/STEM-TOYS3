import { Inngest } from "inngest";

// Inngest client configuration with environment variable validation
const eventKey = process.env.INNGEST_EVENT_KEY;
const signingKey = process.env.INNGEST_SIGNING_KEY;

// Log configuration status (without exposing sensitive values)
if (process.env.NODE_ENV !== "production") {
  console.log("[Inngest Client] Configuration status:");
  console.log(`  - Event Key: ${eventKey ? "✓ Set" : "✗ Not set"}`);
  console.log(`  - Signing Key: ${signingKey ? "✓ Set" : "✗ Not set"}`);
  console.log(`  - Environment: ${process.env.NODE_ENV || "development"}`);
}

export const inngest = new Inngest({
  id: "stem-toys-blog-generation",
  name: "STEM Toys Blog Generator",
  // Event key is required for sending events
  eventKey: eventKey,
  // Signing key is required for verifying webhook requests from Inngest
  // This is automatically used by the serve() handler
});
