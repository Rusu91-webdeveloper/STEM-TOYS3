"use client";

import { useState } from "react";
import { Database, Sparkles, BarChart3, Github } from "lucide-react";
import { Node, Edge } from "@xyflow/react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SchemaVisualization } from "@/features/database-showcase/components/SchemaVisualization";
import { FeatureHighlights } from "@/features/database-showcase/components/FeatureHighlights";
import { DatabaseStats } from "@/features/database-showcase/components/DatabaseStats";

interface SchemaModel {
  name: string;
  fields: any[];
  indexes: string[];
  uniqueConstraints: string[];
  relations: any[];
  domain: string;
}

interface SchemaRelation {
  from: string;
  to: string;
  type: string;
  fieldName: string;
}

interface SchemaEnum {
  name: string;
  values: string[];
}

interface SchemaStatistics {
  totalModels: number;
  totalRelations: number;
  totalIndexes: number;
  totalEnums: number;
  totalFields: number;
  jsonFields: number;
  arrayFields: number;
  uniqueConstraints: number;
  securityFeatures: number;
  automationFeatures: number;
}

interface DatabaseShowcaseClientProps {
  models: SchemaModel[];
  relations: SchemaRelation[];
  enums: SchemaEnum[];
  statistics: SchemaStatistics;
  nodes: Node[];
  edges: Edge[];
}

export function DatabaseShowcaseClient({
  models,
  relations,
  enums,
  statistics,
  nodes,
  edges,
}: DatabaseShowcaseClientProps) {
  const [activeTab, setActiveTab] = useState("diagram");

  return (
    <div className="container mx-auto px-4 py-12 space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6 py-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
          <Sparkles className="w-4 h-4" />
          <span>Enterprise-Grade Database Architecture</span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 tracking-tight">
          Database Schema Showcase
        </h1>

        <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
          Explore a sophisticated, production-ready database architecture
          powering a complete e-commerce platform with supplier marketplace,
          advanced CRM, and intelligent automation.
        </p>

        {/* Quick Stats */}
        <div className="flex items-center justify-center gap-8 pt-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600">
              {statistics.totalModels}
            </div>
            <div className="text-sm text-gray-600 mt-1">Database Tables</div>
          </div>
          <div className="w-px h-12 bg-gray-300"></div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600">
              {statistics.totalRelations}
            </div>
            <div className="text-sm text-gray-600 mt-1">Relationships</div>
          </div>
          <div className="w-px h-12 bg-gray-300"></div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600">
              {statistics.totalIndexes}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              Performance Indexes
            </div>
          </div>
          <div className="w-px h-12 bg-gray-300"></div>
          <div className="text-center">
            <div className="text-4xl font-bold text-amber-600">
              {statistics.totalEnums}
            </div>
            <div className="text-sm text-gray-600 mt-1">Type-Safe Enums</div>
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="flex items-center justify-center gap-4 pt-4">
          <Button
            size="lg"
            onClick={() => setActiveTab("diagram")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Database className="w-5 h-5 mr-2" />
            Explore Schema
          </Button>
          <Button size="lg" variant="outline" asChild>
            <a
              href="https://github.com/yourusername/project"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="w-5 h-5 mr-2" />
              View on GitHub
            </a>
          </Button>
        </div>
      </div>

      {/* Tabbed Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-8"
      >
        <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 h-auto">
          <TabsTrigger
            value="diagram"
            className="flex items-center gap-2 py-3 text-base"
          >
            <Database className="w-5 h-5" />
            <span className="hidden sm:inline">Schema Diagram</span>
            <span className="sm:hidden">Diagram</span>
          </TabsTrigger>
          <TabsTrigger
            value="features"
            className="flex items-center gap-2 py-3 text-base"
          >
            <Sparkles className="w-5 h-5" />
            <span className="hidden sm:inline">Feature Breakdown</span>
            <span className="sm:hidden">Features</span>
          </TabsTrigger>
          <TabsTrigger
            value="statistics"
            className="flex items-center gap-2 py-3 text-base"
          >
            <BarChart3 className="w-5 h-5" />
            <span className="hidden sm:inline">Statistics</span>
            <span className="sm:hidden">Stats</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagram" className="space-y-6">
          <div className="text-center space-y-2 mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Interactive Database Schema
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Click on any table to view detailed information. Use the minimap
              for navigation and search to find specific tables or fields.
            </p>
          </div>
          <SchemaVisualization 
            models={models} 
            relations={relations}
            initialNodes={nodes}
            initialEdges={edges}
          />

          {/* Instructions */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 max-w-4xl mx-auto">
            <h3 className="font-semibold text-gray-900 mb-3">
              How to Navigate
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong>Click & Drag</strong> to pan around the diagram
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong>Scroll</strong> to zoom in and out
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong>Click on a table</strong> to see detailed field
                  information
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong>Use the search bar</strong> to filter tables by name
                  or domain
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <span>
                  <strong>Use the minimap</strong> (bottom right) for quick
                  navigation
                </span>
              </li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-6">
          <FeatureHighlights />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-6">
          <DatabaseStats statistics={statistics} />
        </TabsContent>
      </Tabs>

      {/* Tech Stack Section */}
      <div className="bg-gray-900 text-white rounded-2xl p-12 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Built with Modern Technology
        </h2>
        <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
          This database architecture is powered by industry-leading technologies
          for maximum performance, reliability, and scalability.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8">
          <div className="text-center">
            <div className="text-2xl font-bold">PostgreSQL</div>
            <div className="text-sm text-gray-400">Database</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">Prisma</div>
            <div className="text-sm text-gray-400">ORM</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">Next.js 15</div>
            <div className="text-sm text-gray-400">Framework</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">TypeScript</div>
            <div className="text-sm text-gray-400">Language</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">Vercel</div>
            <div className="text-sm text-gray-400">Hosting</div>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="text-center space-y-4 py-12">
        <h2 className="text-3xl font-bold text-gray-900">
          Ready to Build Something Amazing?
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          This architecture is production-ready and battle-tested. Contact us to
          learn more about how this platform can power your next venture.
        </p>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          Get in Touch
        </Button>
      </div>
    </div>
  );
}
