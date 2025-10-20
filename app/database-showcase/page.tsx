import { redirect } from "next/navigation";
import { Metadata } from "next";
import { auth } from "@/lib/server/auth";
import { DatabaseShowcaseClient } from "./client";
import { parseSchema } from "@/lib/database/schema-analyzer";
import {
  transformToFlow,
  applyDagreLayout,
} from "@/lib/database/flow-transformer";

export const metadata: Metadata = {
  title: "Database Architecture Showcase | TechTots",
  description:
    "Explore our sophisticated database architecture featuring 90+ tables, advanced relationships, and enterprise-grade features for e-commerce and supplier management.",
  robots: {
    index: false, // Don't index this demo page
    follow: false,
  },
};

export default async function DatabaseShowcasePage() {
  const session = await auth();

  // Only allow VISITOR or ADMIN roles
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/database-showcase");
  }

  if (session.user.role !== "VISITOR" && session.user.role !== "ADMIN") {
    redirect("/");
  }

  // Parse the schema on the server side
  const schemaData = parseSchema();

  // Transform to React Flow format on the server
  const flow = transformToFlow(schemaData.models, schemaData.relations);
  const layoutedNodes = applyDagreLayout(flow.nodes, flow.edges, "TB");

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <DatabaseShowcaseClient
        models={schemaData.models}
        relations={schemaData.relations}
        enums={schemaData.enums}
        statistics={schemaData.statistics}
        nodes={layoutedNodes}
        edges={flow.edges}
      />
    </div>
  );
}
